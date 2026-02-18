import { AppDataSource } from '../../../infrastructure/database/data-source';
import { Employee, EmployeeProject, ExperienceHistory } from '../entities';

export interface TimelineEvent {
  date: Date;
  type: 'project' | 'experience' | 'role';
  title: string;
  description?: string;
  category?: string;
  technologies?: string[];
  duration?: string;
  metadata?: Record<string, any>;
}

export class TimelineService {
  private employeeRepo = AppDataSource.getRepository(Employee);
  private employeeProjectRepo = AppDataSource.getRepository(EmployeeProject);
  private experienceRepo = AppDataSource.getRepository(ExperienceHistory);

  async getEmployeeTimeline(employeeId: string): Promise<TimelineEvent[]> {
    const [employee, projects, experiences] = await Promise.all([
      this.employeeRepo.findOne({ where: { id: employeeId } }),
      this.employeeProjectRepo.find({
        where: { employeeId },
        relations: ['project', 'category'],
        order: { startDate: 'ASC' },
      }),
      this.experienceRepo.find({
        where: { employeeId },
        relations: ['category'],
        order: { fromDate: 'ASC' },
      }),
    ]);

    if (!employee) {
      throw new Error('Employee not found');
    }

    const events: TimelineEvent[] = [];

    // Add experience entries
    for (const exp of experiences) {
      const duration = `${exp.years}y ${exp.months}m`;
      events.push({
        date: exp.fromDate,
        type: 'experience',
        title: `Experience in ${exp.category.name}`,
        description: `From ${exp.fromDate.toISOString().split('T')[0]} to ${exp.toDate ? exp.toDate.toISOString().split('T')[0] : 'Present'}`,
        category: exp.category.name,
        technologies: exp.technologiesUsed ? exp.technologiesUsed.split(',').map(t => t.trim()) : [],
        duration,
        metadata: {
          experienceId: exp.id,
          years: exp.years,
          months: exp.months,
        },
      });
    }

    // Add project entries
    for (const proj of projects) {
      const endDate = proj.endDate || new Date();
      const startDate = new Date(proj.startDate);
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
      const duration = `${Math.floor(durationDays / 30)}m ${durationDays % 30}d`;

      events.push({
        date: proj.startDate,
        type: 'project',
        title: proj.project.name,
        description: `Role: ${proj.role} | Category: ${proj.category.name}`,
        category: proj.category.name,
        technologies: proj.technologiesUsed ? proj.technologiesUsed.split(',').map(t => t.trim()) : [],
        duration,
        metadata: {
          projectId: proj.projectId,
          role: proj.role,
          client: proj.project.client,
        },
      });
    }

    // Sort by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    return events;
  }

  async getEmployeeTimelineGrouped(employeeId: string): Promise<{
    profile: Employee;
    timeline: TimelineEvent[];
    categoryBreakdown: Record<string, { years: number; months: number; projects: number }>;
  }> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['categories'],
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const timeline = await this.getEmployeeTimeline(employeeId);
    const [projects, experiences] = await Promise.all([
      this.employeeProjectRepo.find({
        where: { employeeId },
        relations: ['category'],
      }),
      this.experienceRepo.find({
        where: { employeeId },
        relations: ['category'],
      }),
    ]);

    // Calculate category breakdown
    const categoryBreakdown: Record<string, { years: number; months: number; projects: number }> = {};

    for (const exp of experiences) {
      const catName = exp.category.name;
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { years: 0, months: 0, projects: 0 };
      }
      categoryBreakdown[catName].years += exp.years;
      categoryBreakdown[catName].months += exp.months;
    }

    for (const proj of projects) {
      const catName = proj.category.name;
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { years: 0, months: 0, projects: 0 };
      }
      categoryBreakdown[catName].projects += 1;
    }

    // Normalize months
    for (const key in categoryBreakdown) {
      const totalMonths = categoryBreakdown[key].years * 12 + categoryBreakdown[key].months;
      categoryBreakdown[key].years = Math.floor(totalMonths / 12);
      categoryBreakdown[key].months = totalMonths % 12;
    }

    return {
      profile: employee,
      timeline,
      categoryBreakdown,
    };
  }
}


import { AppDataSource } from '../../../infrastructure/database/data-source';
import { Employee, EmployeeCategory, Project, EmployeeProject, AuditLog } from '../entities';
import { In } from 'typeorm';

export class AdminService {
  private employeeRepo = AppDataSource.getRepository(Employee);
  private categoryRepo = AppDataSource.getRepository(EmployeeCategory);
  private projectRepo = AppDataSource.getRepository(Project);
  private employeeProjectRepo = AppDataSource.getRepository(EmployeeProject);
  private auditRepo = AppDataSource.getRepository(AuditLog);

  async getDashboardStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    totalProjects: number;
    activeProjects: number;
    totalCategories: number;
  }> {
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalProjects,
      activeProjects,
      totalCategories,
    ] = await Promise.all([
      this.employeeRepo.count(),
      this.employeeRepo.count({ where: { status: 'Active' as any } }),
      this.employeeRepo.count({ where: { status: 'Inactive' as any } }),
      this.projectRepo.count(),
      this.projectRepo.count({ where: { active: true } }),
      this.categoryRepo.count({ where: { active: true } }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalProjects,
      activeProjects,
      totalCategories,
    };
  }

  async getEmployeesByCategory(categoryId: string): Promise<Employee[]> {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
      relations: ['employees', 'employees.categories'],
    });

    return category?.employees || [];
  }

  async getProjectEmployees(projectId: string): Promise<EmployeeProject[]> {
    return this.employeeProjectRepo.find({
      where: { projectId },
      relations: ['employee', 'category', 'project'],
      order: { startDate: 'ASC' },
    });
  }

  async getAuditLogs(filters: {
    employeeId?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const query = this.auditRepo.createQueryBuilder('audit');

    if (filters.employeeId) {
      query.andWhere('audit.employeeId = :employeeId', { employeeId: filters.employeeId });
    }

    if (filters.entityType) {
      query.andWhere('audit.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const [logs, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('audit.createdAt', 'DESC')
      .getManyAndCount();

    return { logs, total };
  }

  async exportEmployeesToCSV(filters: {
    categoryId?: string;
    status?: string;
  }): Promise<string> {
    const query = this.employeeRepo.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.categories', 'categories');

    if (filters.categoryId) {
      query.andWhere('categories.id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.status) {
      query.andWhere('employee.status = :status', { status: filters.status });
    }

    const employees = await query.getMany();

    const headers = ['Employee ID', 'Name', 'Email', 'Designation', 'Status', 'Total Experience (Years)', 'Categories', 'Date of Joining'];
    const rows = employees.map(emp => [
      emp.employeeId,
      emp.name,
      emp.email,
      emp.currentDesignation,
      emp.status,
      emp.totalExperienceYears.toString(),
      emp.categories.map(c => c.name).join('; '),
      emp.dateOfJoining.toISOString().split('T')[0],
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }
}


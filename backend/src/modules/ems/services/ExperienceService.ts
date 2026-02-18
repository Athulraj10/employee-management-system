import { AppDataSource } from '../../../infrastructure/database/data-source';
import { ExperienceHistory, EmployeeCategory, AuditLog, AuditAction, AuditEntityType } from '../entities';
import { calculateExperience } from '../utils/experience-calculator';
import { EmployeeService } from './EmployeeService';

export class ExperienceService {
  private experienceRepo = AppDataSource.getRepository(ExperienceHistory);
  private categoryRepo = AppDataSource.getRepository(EmployeeCategory);
  private auditRepo = AppDataSource.getRepository(AuditLog);
  private employeeService = new EmployeeService();

  async createExperience(data: {
    employeeId: string;
    categoryId: string;
    fromDate: Date;
    toDate?: Date;
    technologiesUsed?: string;
  }, changedBy: string): Promise<ExperienceHistory> {
    const category = await this.categoryRepo.findOne({ where: { id: data.categoryId } });
    if (!category) {
      throw new Error('Category not found');
    }

    const { years, months } = calculateExperience(
      data.fromDate,
      data.toDate || new Date()
    );

    const experience = this.experienceRepo.create({
      ...data,
      years,
      months,
    });

    const saved = await this.experienceRepo.save(experience);

    // Recalculate total experience
    await this.employeeService.recalculateTotalExperience(data.employeeId);

    await this.auditRepo.save({
      employeeId: data.employeeId,
      entityType: AuditEntityType.EXPERIENCE_HISTORY,
      entityId: saved.id,
      action: AuditAction.CREATE,
      newValue: JSON.stringify(saved),
      changedBy,
    });

    return this.experienceRepo.findOne({
      where: { id: saved.id },
      relations: ['category'],
    }) as Promise<ExperienceHistory>;
  }

  async updateExperience(
    id: string,
    data: Partial<{
      categoryId: string;
      fromDate: Date;
      toDate: Date | null;
      technologiesUsed: string;
    }>,
    changedBy: string
  ): Promise<ExperienceHistory> {
    const experience = await this.experienceRepo.findOne({ where: { id } });
    if (!experience) {
      throw new Error('Experience history not found');
    }

    const oldValue = JSON.stringify(experience);
    Object.assign(experience, data);

    // Recalculate years and months
    const { years, months } = calculateExperience(
      experience.fromDate,
      experience.toDate || new Date()
    );
    experience.years = years;
    experience.months = months;

    const saved = await this.experienceRepo.save(experience);

    // Recalculate total experience
    await this.employeeService.recalculateTotalExperience(experience.employeeId);

    await this.auditRepo.save({
      employeeId: experience.employeeId,
      entityType: AuditEntityType.EXPERIENCE_HISTORY,
      entityId: id,
      action: AuditAction.UPDATE,
      oldValue,
      newValue: JSON.stringify(saved),
      changedBy,
    });

    return this.experienceRepo.findOne({
      where: { id },
      relations: ['category'],
    }) as Promise<ExperienceHistory>;
  }

  async getExperienceByEmployee(employeeId: string): Promise<ExperienceHistory[]> {
    return this.experienceRepo.find({
      where: { employeeId },
      relations: ['category'],
      order: { fromDate: 'ASC' },
    });
  }

  async getExperienceByCategory(categoryId: string): Promise<ExperienceHistory[]> {
    return this.experienceRepo.find({
      where: { categoryId },
      relations: ['employee', 'category'],
      order: { fromDate: 'ASC' },
    });
  }

  async deleteExperience(id: string, changedBy: string): Promise<void> {
    const experience = await this.experienceRepo.findOne({ where: { id } });
    if (!experience) {
      throw new Error('Experience history not found');
    }

    const employeeId = experience.employeeId;
    const oldValue = JSON.stringify(experience);

    await this.experienceRepo.remove(experience);

    // Recalculate total experience
    await this.employeeService.recalculateTotalExperience(employeeId);

    await this.auditRepo.save({
      employeeId,
      entityType: AuditEntityType.EXPERIENCE_HISTORY,
      entityId: id,
      action: AuditAction.DELETE,
      oldValue,
      changedBy,
    });
  }
}


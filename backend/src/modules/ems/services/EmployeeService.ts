import { AppDataSource } from '../../../infrastructure/database/data-source';
import {
  Employee,
  EmploymentStatus,
  EmployeeCategory,
  ExperienceHistory,
  AuditLog,
  AuditAction,
  AuditEntityType,
} from '../entities';
import { In } from 'typeorm';
import { calculateExperience } from '../utils/experience-calculator';

export class EmployeeService {
  private employeeRepo = AppDataSource.getRepository(Employee);
  private categoryRepo = AppDataSource.getRepository(EmployeeCategory);
  private experienceRepo = AppDataSource.getRepository(ExperienceHistory);
  private auditRepo = AppDataSource.getRepository(AuditLog);

  async createEmployee(data: {
    name: string;
    email: string;
    employeeId: string;
    dateOfJoining: Date;
    currentDesignation: string;
    categoryIds?: string[];
  }, changedBy: string): Promise<Employee> {
    const employee = this.employeeRepo.create({
      name: data.name,
      email: data.email,
      employeeId: data.employeeId,
      dateOfJoining: data.dateOfJoining,
      currentDesignation: data.currentDesignation,
      status: EmploymentStatus.ACTIVE,
    });

    if (data.categoryIds && data.categoryIds.length > 0) {
      const categories = await this.categoryRepo.findBy({
        id: In(data.categoryIds),
      });
      employee.categories = categories;
    }

    const saved = await this.employeeRepo.save(employee);

    await this.recalculateTotalExperience(saved.id);

    await this.auditRepo.save({
      entityType: AuditEntityType.EMPLOYEE,
      entityId: saved.id,
      action: AuditAction.CREATE,
      newValue: JSON.stringify(saved),
      changedBy,
    });

    return this.getEmployeeById(saved.id) as Promise<Employee>;
  }

  async updateEmployee(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      employeeId: string;
      dateOfJoining: Date;
      currentDesignation: string;
      status: EmploymentStatus;
      categoryIds: string[];
    }>,
    changedBy: string
  ): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { id },
      relations: ['categories'],
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const oldValue = JSON.stringify(employee);

    if (data.categoryIds !== undefined) {
      const categories = await this.categoryRepo.findBy({
        id: In(data.categoryIds),
      });
      employee.categories = categories;
    }

    Object.assign(employee, {
      name: data.name,
      email: data.email,
      employeeId: data.employeeId,
      dateOfJoining: data.dateOfJoining,
      currentDesignation: data.currentDesignation,
      status: data.status,
    });

    const saved = await this.employeeRepo.save(employee);

    if (data.dateOfJoining) {
      await this.recalculateTotalExperience(saved.id);
    }

    await this.auditRepo.save({
      employeeId: id,
      entityType: AuditEntityType.EMPLOYEE,
      entityId: id,
      action: AuditAction.UPDATE,
      oldValue,
      newValue: JSON.stringify(saved),
      changedBy,
    });

    return this.getEmployeeById(saved.id) as Promise<Employee>;
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return this.employeeRepo.findOne({
      where: { id },
      relations: ['categories', 'skills', 'skills.skill', 'projects', 'projects.project', 'projects.category', 'experienceHistory', 'experienceHistory.category'],
    });
  }

  async getEmployees(filters: {
    categoryId?: string;
    status?: EmploymentStatus;
    minExperience?: number;
    search?: string;
    page?: number;
    limit?: number;
    includeProjects?: boolean;
  }): Promise<{ employees: Employee[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.employeeRepo.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.categories', 'categories')
      .leftJoinAndSelect('employee.skills', 'skills')
      .leftJoinAndSelect('skills.skill', 'skill');

    if (filters.includeProjects) {
      query.leftJoinAndSelect('employee.projects', 'projects')
        .leftJoinAndSelect('projects.project', 'project')
        .leftJoinAndSelect('projects.category', 'category');
    }

    if (filters.categoryId) {
      query.andWhere('categories.id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.status) {
      query.andWhere('employee.status = :status', { status: filters.status });
    }

    if (filters.minExperience) {
      query.andWhere('employee.totalExperienceYears >= :minExp', { minExp: filters.minExperience });
    }

    if (filters.search) {
      query.andWhere(
        '(employee.name ILIKE :search OR employee.email ILIKE :search OR employee.employeeId ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const [employees, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('employee.createdAt', 'DESC')
      .getManyAndCount();

    return { employees, total };
  }

  async deactivateEmployee(id: string, changedBy: string): Promise<Employee> {
    return this.updateEmployee(id, { status: EmploymentStatus.INACTIVE }, changedBy);
  }

  async activateEmployee(id: string, changedBy: string): Promise<Employee> {
    return this.updateEmployee(id, { status: EmploymentStatus.ACTIVE }, changedBy);
  }

  async recalculateTotalExperience(employeeId: string): Promise<void> {
    const employee = await this.employeeRepo.findOne({ where: { id: employeeId } });
    if (!employee) return;

    const histories = await this.experienceRepo.find({
      where: { employeeId },
    });

    let totalMonths = 0;

    if (histories.length === 0) {
      const { years, months } = calculateExperience(employee.dateOfJoining, new Date());
      totalMonths = years * 12 + months;  
    } else {
      for (const history of histories) {
        const { years, months } = calculateExperience(history.fromDate, history.toDate || new Date());
        history.years = years;
        history.months = months;
        totalMonths += years * 12 + months;
        await this.experienceRepo.save(history);
      }
    }

    const totalYears = totalMonths / 12;

    await this.employeeRepo.update(employeeId, {
      totalExperienceYears: parseFloat(totalYears.toFixed(2)),
    });
  }
}


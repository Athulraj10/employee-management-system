import { AppDataSource } from '../../../infrastructure/database/data-source';
import { Project, EmployeeProject, EmployeeCategory, AuditLog, AuditAction, AuditEntityType } from '../entities';
import { In } from 'typeorm';

export class ProjectService {
  private projectRepo = AppDataSource.getRepository(Project);
  private employeeProjectRepo = AppDataSource.getRepository(EmployeeProject);
  private categoryRepo = AppDataSource.getRepository(EmployeeCategory);
  private auditRepo = AppDataSource.getRepository(AuditLog);

  async createProject(data: {
    name: string;
    description?: string;
    client?: string;
    startDate: Date;
    endDate?: Date;
  }, changedBy: string): Promise<Project> {
    const project = this.projectRepo.create(data);
    const saved = await this.projectRepo.save(project);

    await this.auditRepo.save({
      entityType: AuditEntityType.PROJECT,
      entityId: saved.id,
      action: AuditAction.CREATE,
      newValue: JSON.stringify(saved),
      changedBy,
    });

    return saved;
  }

  async updateProject(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      client: string;
      startDate: Date;
      endDate: Date | null;
      active: boolean;
    }>,
    changedBy: string
  ): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) {
      throw new Error('Project not found');
    }

    const oldValue = JSON.stringify(project);
    Object.assign(project, data);
    const saved = await this.projectRepo.save(project);

    await this.auditRepo.save({
      entityType: AuditEntityType.PROJECT,
      entityId: id,
      action: AuditAction.UPDATE,
      oldValue,
      newValue: JSON.stringify(saved),
      changedBy,
    });

    return saved;
  }

  async deleteProject(id: string, changedBy: string, force: boolean = false): Promise<{ deleted: boolean; employeesAffected: number }> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['employeeProjects', 'employeeProjects.employee'],
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get active employee assignments
    const activeAssignments = project.employeeProjects.filter(
      (ep) => !ep.endDate || new Date(ep.endDate) >= new Date()
    );

    if (activeAssignments.length > 0 && !force) {
      return {
        deleted: false,
        employeesAffected: activeAssignments.length,
      };
    }

    // If force delete, end all active assignments first
    if (activeAssignments.length > 0 && force) {
      for (const assignment of activeAssignments) {
        assignment.endDate = new Date();
        await this.employeeProjectRepo.save(assignment);

        await this.auditRepo.save({
          employeeId: assignment.employeeId,
          entityType: AuditEntityType.EMPLOYEE_PROJECT,
          entityId: assignment.id,
          action: AuditAction.UPDATE,
          oldValue: JSON.stringify(assignment),
          newValue: JSON.stringify({ ...assignment, endDate: new Date() }),
          changedBy,
          notes: `Project ${project.name} deleted. Assignment ended.`,
        });
      }
    }

    const oldValue = JSON.stringify(project);
    await this.projectRepo.remove(project);

    await this.auditRepo.save({
      entityType: AuditEntityType.PROJECT,
      entityId: id,
      action: AuditAction.DELETE,
      oldValue,
      changedBy,
      notes: `Project ${project.name} deleted.`,
    });

    return {
      deleted: true,
      employeesAffected: activeAssignments.length,
    };
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.projectRepo.findOne({
      where: { id },
      relations: ['employeeProjects', 'employeeProjects.employee', 'employeeProjects.category'],
    });
  }

  async getProjects(filters: {
    active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ projects: Project[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.projectRepo.createQueryBuilder('project');

    if (filters.active !== undefined) {
      query.andWhere('project.active = :active', { active: filters.active });
    }

    if (filters.search) {
      query.andWhere(
        '(project.name ILIKE :search OR project.description ILIKE :search OR project.client ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const [projects, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('project.createdAt', 'DESC')
      .getManyAndCount();

    return { projects, total };
  }

  async assignEmployeeToProject(data: {
    employeeId: string;
    projectId: string;
    categoryId: string;
    role: string;
    technologiesUsed?: string;
    startDate: Date;
    endDate?: Date;
  }, changedBy: string): Promise<EmployeeProject> {
    // Verify category exists
    const category = await this.categoryRepo.findOne({ where: { id: data.categoryId } });
    if (!category) {
      throw new Error('Category not found');
    }

    const employeeProject = this.employeeProjectRepo.create(data);
    const saved = await this.employeeProjectRepo.save(employeeProject);

    await this.auditRepo.save({
      employeeId: data.employeeId,
      entityType: AuditEntityType.EMPLOYEE_PROJECT,
      entityId: saved.id,
      action: AuditAction.CREATE,
      newValue: JSON.stringify(saved),
      changedBy,
      notes: `Assigned to project: ${saved.projectId}`,
    });

    return this.employeeProjectRepo.findOne({
      where: { id: saved.id },
      relations: ['employee', 'project', 'category'],
    }) as Promise<EmployeeProject>;
  }

  async relocateEmployee(
    employeeProjectId: string,
    newProjectId: string,
    changedBy: string,
    notes?: string
  ): Promise<{ oldAssignment: EmployeeProject; newAssignment: EmployeeProject }> {
    // Get current assignment
    const currentAssignment = await this.employeeProjectRepo.findOne({
      where: { id: employeeProjectId },
      relations: ['employee', 'project', 'category'],
    });

    if (!currentAssignment) {
      throw new Error('Employee project assignment not found');
    }

    // End current assignment
    const oldValue = JSON.stringify(currentAssignment);
    currentAssignment.endDate = new Date();
    const endedAssignment = await this.employeeProjectRepo.save(currentAssignment);

    // Create new assignment
    const newAssignment = this.employeeProjectRepo.create({
      employeeId: currentAssignment.employeeId,
      projectId: newProjectId,
      categoryId: currentAssignment.categoryId,
      role: currentAssignment.role,
      technologiesUsed: currentAssignment.technologiesUsed,
      startDate: new Date(),
    });
    const savedNewAssignment = await this.employeeProjectRepo.save(newAssignment);

    // Audit log for ending old assignment
    await this.auditRepo.save({
      employeeId: currentAssignment.employeeId,
      entityType: AuditEntityType.EMPLOYEE_PROJECT,
      entityId: employeeProjectId,
      action: AuditAction.UPDATE,
      oldValue,
      newValue: JSON.stringify(endedAssignment),
      changedBy,
      notes: `Relocated from project: ${currentAssignment.projectId} to project: ${newProjectId}. ${notes || ''}`,
    });

    // Audit log for new assignment
    await this.auditRepo.save({
      employeeId: currentAssignment.employeeId,
      entityType: AuditEntityType.EMPLOYEE_PROJECT,
      entityId: savedNewAssignment.id,
      action: AuditAction.CREATE,
      newValue: JSON.stringify(savedNewAssignment),
      changedBy,
      notes: `Relocated from project: ${currentAssignment.projectId}. ${notes || ''}`,
    });

    return {
      oldAssignment: await this.employeeProjectRepo.findOne({
        where: { id: employeeProjectId },
        relations: ['employee', 'project', 'category'],
      }) as EmployeeProject,
      newAssignment: await this.employeeProjectRepo.findOne({
        where: { id: savedNewAssignment.id },
        relations: ['employee', 'project', 'category'],
      }) as EmployeeProject,
    };
  }

  async updateEmployeeProject(
    id: string,
    data: Partial<{
      role: string;
      categoryId: string;
      technologiesUsed: string;
      startDate: Date;
      endDate: Date | null;
      projectId: string; // Allow project change
    }>,
    changedBy: string
  ): Promise<EmployeeProject> {
    const employeeProject = await this.employeeProjectRepo.findOne({ where: { id } });
    if (!employeeProject) {
      throw new Error('Employee project assignment not found');
    }

    const oldValue = JSON.stringify(employeeProject);
    
    // If projectId is being changed, treat it as relocation
    if (data.projectId && data.projectId !== employeeProject.projectId) {
      return (await this.relocateEmployee(id, data.projectId, changedBy)).newAssignment;
    }

    Object.assign(employeeProject, data);
    const saved = await this.employeeProjectRepo.save(employeeProject);

    await this.auditRepo.save({
      employeeId: employeeProject.employeeId,
      entityType: AuditEntityType.EMPLOYEE_PROJECT,
      entityId: id,
      action: AuditAction.UPDATE,
      oldValue,
      newValue: JSON.stringify(saved),
      changedBy,
    });

    return this.employeeProjectRepo.findOne({
      where: { id },
      relations: ['employee', 'project', 'category'],
    }) as Promise<EmployeeProject>;
  }

  async getEmployeesByProject(projectId: string): Promise<EmployeeProject[]> {
    return this.employeeProjectRepo.find({
      where: { projectId },
      relations: ['employee', 'category'],
      order: { startDate: 'ASC' },
    });
  }

  async getProjectsByCategory(categoryId: string): Promise<Project[]> {
    const employeeProjects = await this.employeeProjectRepo.find({
      where: { categoryId },
      relations: ['project'],
    });

    const projectIds = [...new Set(employeeProjects.map(ep => ep.projectId))];
    return this.projectRepo.findBy({ id: In(projectIds) });
  }
}

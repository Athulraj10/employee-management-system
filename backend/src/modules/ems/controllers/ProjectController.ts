import { Request, Response } from 'express';
import { ProjectService } from '../services/ProjectService';

export class ProjectController {
  private projectService = new ProjectService();

  async createProject(req: Request, res: Response) {
    try {
      const changedBy = req.headers['x-user-id'] as string || req.headers['x-username'] as string || 'system';
      const project = await this.projectService.createProject(req.body, changedBy);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProjects(req: Request, res: Response) {
    try {
      const filters = {
        active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 100,
      };
      const result = await this.projectService.getProjects(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const changedBy = req.headers['x-user-id'] as string || req.headers['x-username'] as string || 'system';
      const project = await this.projectService.updateProject(id, req.body, changedBy);
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { force } = req.body;
      const changedBy = req.headers['x-user-id'] as string || req.headers['x-username'] as string || 'system';
      const result = await this.projectService.deleteProject(id, changedBy, force === true);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async assignEmployee(req: Request, res: Response) {
    try {
      const changedBy = req.headers['x-user-id'] as string || req.headers['x-username'] as string || 'system';
      const assignment = await this.projectService.assignEmployeeToProject(req.body, changedBy);
      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateEmployeeAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const changedBy = req.headers['x-user-id'] as string || req.headers['x-username'] as string || 'system';
      const assignment = await this.projectService.updateEmployeeProject(id, req.body, changedBy);
      res.json(assignment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async relocateEmployee(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newProjectId, notes } = req.body;
      const changedBy = req.headers['x-user-id'] as string || req.headers['x-username'] as string || 'system';
      const result = await this.projectService.relocateEmployee(id, newProjectId, changedBy, notes);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProjectEmployees(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const employees = await this.projectService.getEmployeesByProject(projectId);
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

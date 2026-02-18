import { Request, Response } from 'express';
import { EmployeeService } from '../services/EmployeeService';

export class EmployeeController {
  private employeeService = new EmployeeService();

  async createEmployee(req: Request, res: Response) {
    try {
      const changedBy = req.headers['x-user-id'] as string || 'system';
      const employee = await this.employeeService.createEmployee(req.body, changedBy);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getEmployee(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const employee = await this.employeeService.getEmployeeById(id);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEmployees(req: Request, res: Response) {
    try {
      const filters = {
        categoryId: req.query.categoryId as string,
        status: req.query.status as any,
        minExperience: req.query.minExperience ? Number(req.query.minExperience) : undefined,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        includeProjects: req.query.includeProjects === 'true',
      };
      const result = await this.employeeService.getEmployees(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateEmployee(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const changedBy = req.headers['x-user-id'] as string || 'system';
      const employee = await this.employeeService.updateEmployee(id, req.body, changedBy);
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deactivateEmployee(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const changedBy = req.headers['x-user-id'] as string || 'system';
      const employee = await this.employeeService.deactivateEmployee(id, changedBy);
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async activateEmployee(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const changedBy = req.headers['x-user-id'] as string || 'system';
      const employee = await this.employeeService.activateEmployee(id, changedBy);
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}


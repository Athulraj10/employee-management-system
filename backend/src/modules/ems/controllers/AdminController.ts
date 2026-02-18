import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';

export class AdminController {
  private adminService = new AdminService();

  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEmployeesByCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const employees = await this.adminService.getEmployeesByCategory(categoryId);
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProjectEmployees(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const employees = await this.adminService.getProjectEmployees(projectId);
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAuditLogs(req: Request, res: Response) {
    try {
      const filters = {
        employeeId: req.query.employeeId as string,
        entityType: req.query.entityType as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      };
      const result = await this.adminService.getAuditLogs(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async exportEmployees(req: Request, res: Response) {
    try {
      const filters = {
        categoryId: req.query.categoryId as string,
        status: req.query.status as string,
      };
      const csv = await this.adminService.exportEmployeesToCSV(filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}


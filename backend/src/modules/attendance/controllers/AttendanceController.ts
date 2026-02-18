import { Request, Response } from 'express';
import { AttendanceService } from '../services/AttendanceService';

export class AttendanceController {
  private attendanceService = new AttendanceService();

  async markAttendance(req: Request, res: Response) {
    try {
      const markedBy = req.headers['x-user-id'] as string || 'system';
      const attendance = await this.attendanceService.markAttendance({
        ...req.body,
        markedBy,
        isHalfDay: req.body.isHalfDay || false,
      });
      res.status(201).json(attendance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getEmployeeAttendance(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        type: req.query.type as any,
      };
      const attendance = await this.attendanceService.getAttendanceByEmployee(employeeId, filters);
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateAttendance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const markedBy = req.headers['x-user-id'] as string || 'system';
      const attendance = await this.attendanceService.updateAttendance(id, {
        ...req.body,
        markedBy,
      });
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAttendanceStats(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      const stats = await this.attendanceService.getAttendanceStats(employeeId, startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAttendanceHistory(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const days = req.query.days ? Number(req.query.days) : 15;
      const history = await this.attendanceService.getAttendanceHistory(employeeId, days);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllEmployeesAttendance(req: Request, res: Response) {
    try {
      const filters = {
        date: req.query.date ? new Date(req.query.date as string) : new Date(),
        projectId: req.query.projectId as string,
        categoryId: req.query.categoryId as string,
        type: req.query.type as any,
      };
      const result = await this.attendanceService.getAllEmployeesAttendance(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAttendanceByProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const attendance = await this.attendanceService.getAttendanceByProject(projectId, date);
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}


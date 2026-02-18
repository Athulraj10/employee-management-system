import { Request, Response } from 'express';
import { PerformanceAnalyticsService } from '../services/PerformanceAnalyticsService';

export class PerformanceAnalyticsController {
  private analyticsService = new PerformanceAnalyticsService();

  async getEmployeePerformanceOverview(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const overview = await this.analyticsService.getEmployeePerformanceOverview(employeeId);
      res.json(overview);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPerformanceTrend(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const months = req.query.months ? Number(req.query.months) : 6;
      const trend = await this.analyticsService.getPerformanceTrend(employeeId, months);
      res.json(trend);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCategoryWiseContribution(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const contribution = await this.analyticsService.getCategoryWiseContribution(employeeId);
      res.json(contribution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTimeSpentPerProject(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const timeSpent = await this.analyticsService.getTimeSpentPerProject(employeeId);
      res.json(timeSpent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSkillGrowthOverTime(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const skillGrowth = await this.analyticsService.getSkillGrowthOverTime(employeeId);
      res.json(skillGrowth);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAdminDashboardAnalytics(req: Request, res: Response) {
    try {
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        categoryId: req.query.categoryId as string,
      };
      const analytics = await this.analyticsService.getAdminDashboardAnalytics(filters);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}


import { Request, Response } from 'express';
import { PerformanceService } from '../services/PerformanceService';

export class PerformanceController {
  private performanceService = new PerformanceService();

  async createSnapshot(req: Request, res: Response) {
    try {
      const snapshot = await this.performanceService.createSnapshot(req.body);
      res.status(201).json(snapshot);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSnapshot(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const snapshot = await this.performanceService.getSnapshot(id);
      if (!snapshot) {
        return res.status(404).json({ error: 'Snapshot not found' });
      }
      res.json(snapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEmployeeSnapshots(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        projectId: req.query.projectId as string,
      };
      const snapshots = await this.performanceService.getSnapshotsByEmployee(employeeId, filters);
      res.json(snapshots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createMetric(req: Request, res: Response) {
    try {
      const metric = await this.performanceService.createMetric(req.body);
      res.status(201).json(metric);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getEmployeeMetrics(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        categoryId: req.query.categoryId as string,
        metricName: req.query.metricName as string,
      };
      const metrics = await this.performanceService.getMetricsByEmployee(employeeId, filters);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createOrUpdateSummary(req: Request, res: Response) {
    try {
      const summary = await this.performanceService.createOrUpdateSummary(req.body);
      res.json(summary);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const summaryDate = req.query.summaryDate
        ? new Date(req.query.summaryDate as string)
        : new Date();
      const summary = await this.performanceService.getSummary(employeeId, summaryDate);
      if (!summary) {
        return res.status(404).json({ error: 'Summary not found' });
      }
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEmployeeSummaries(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const summaries = await this.performanceService.getSummariesByEmployee(employeeId, filters);
      res.json(summaries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}


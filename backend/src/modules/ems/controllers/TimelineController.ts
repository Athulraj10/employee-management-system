import { Request, Response } from 'express';
import { TimelineService } from '../services/TimelineService';

export class TimelineController {
  private timelineService = new TimelineService();

  async getEmployeeTimeline(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const timeline = await this.timelineService.getEmployeeTimeline(employeeId);
      res.json(timeline);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEmployeeTimelineGrouped(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const result = await this.timelineService.getEmployeeTimelineGrouped(employeeId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}


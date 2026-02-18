import { Request, Response } from 'express';
import { ExperienceService } from '../services/ExperienceService';

export class ExperienceController {
  private experienceService = new ExperienceService();

  async createExperience(req: Request, res: Response) {
    try {
      const changedBy = req.headers['x-user-id'] as string || 'system';
      const experience = await this.experienceService.createExperience(req.body, changedBy);
      res.status(201).json(experience);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getEmployeeExperience(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const experiences = await this.experienceService.getExperienceByEmployee(employeeId);
      res.json(experiences);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateExperience(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const changedBy = req.headers['x-user-id'] as string || 'system';
      const experience = await this.experienceService.updateExperience(id, req.body, changedBy);
      res.json(experience);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteExperience(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const changedBy = req.headers['x-user-id'] as string || 'system';
      await this.experienceService.deleteExperience(id, changedBy);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}


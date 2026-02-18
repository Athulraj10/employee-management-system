import { Request, Response } from 'express';
import { PerformanceConfigService } from '../services/PerformanceConfigService';

export class PerformanceConfigController {
  private configService = new PerformanceConfigService();

  async getConfig(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const config = await this.configService.getConfig(key);
      if (!config) {
        return res.status(404).json({ error: 'Config not found' });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async setConfig(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const { value, description, category } = req.body;
      const config = await this.configService.setConfig(key, value, description, category);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllConfigs(req: Request, res: Response) {
    try {
      const category = req.query.category as string;
      const configs = await this.configService.getAllConfigs(category);
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteConfig(req: Request, res: Response) {
    try {
      const { key } = req.params;
      await this.configService.deleteConfig(key);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}


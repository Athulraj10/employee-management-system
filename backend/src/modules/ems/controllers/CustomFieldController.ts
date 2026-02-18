import { Request, Response } from 'express';
import { CustomFieldService } from '../services/CustomFieldService';

export class CustomFieldController {
  private customFieldService = new CustomFieldService();

  async addCustomField(req: Request, res: Response) {
    try {
      const field = await this.customFieldService.addCustomField(req.body);
      res.status(201).json(field);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCustomFields(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const fields = await this.customFieldService.getCustomFields(employeeId);
      res.json(fields);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCustomField(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const field = await this.customFieldService.updateCustomField(id, req.body);
      res.json(field);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCustomField(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.customFieldService.deleteCustomField(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}


import { Request, Response } from 'express';
import { AppDataSource } from '../../../infrastructure/database/data-source';
import { EmployeeCategory, CategoryType } from '../entities';

export class CategoryController {
  private categoryRepo = AppDataSource.getRepository(EmployeeCategory);

  async getCategories(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const where: any = {};
      if (!includeInactive) {
        where.active = true;
      }
      const categories = await this.categoryRepo.find({
        where,
        order: { name: 'ASC' },
      });
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      
      if (!name || !Object.values(CategoryType).includes(name)) {
        return res.status(400).json({ error: 'Invalid category name. Must be one of the predefined types.' });
      }

      const existing = await this.categoryRepo.findOne({ where: { name } });
      if (existing) {
        return res.status(400).json({ error: 'Category already exists' });
      }

      const category = this.categoryRepo.create({
        name,
        description: description || null,
        active: true,
      });

      const saved = await this.categoryRepo.save(category);
      res.status(201).json(saved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { description, active } = req.body;

      const category = await this.categoryRepo.findOne({ where: { id } });
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      if (description !== undefined) category.description = description;
      if (active !== undefined) category.active = active;

      const saved = await this.categoryRepo.save(category);
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await this.categoryRepo.findOne({ where: { id } });
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Soft delete by setting active to false
      category.active = false;
      await this.categoryRepo.save(category);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}


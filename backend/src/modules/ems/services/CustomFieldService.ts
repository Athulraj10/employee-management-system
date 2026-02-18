import { AppDataSource } from '../../../infrastructure/database/data-source';
import { EmployeeCustomField } from '../entities/EmployeeCustomField.entity';

export class CustomFieldService {
  private fieldRepo = AppDataSource.getRepository(EmployeeCustomField);

  async addCustomField(data: {
    employeeId: string;
    fieldKey: string;
    fieldLabel: string;
    fieldType: string;
    fieldValue?: string;
  }): Promise<EmployeeCustomField> {
    const existing = await this.fieldRepo.findOne({
      where: { employeeId: data.employeeId, fieldKey: data.fieldKey },
    });

    if (existing) {
      existing.fieldValue = data.fieldValue || null;
      return this.fieldRepo.save(existing);
    }

    const field = this.fieldRepo.create(data);
    return this.fieldRepo.save(field);
  }

  async getCustomFields(employeeId: string): Promise<EmployeeCustomField[]> {
    return this.fieldRepo.find({
      where: { employeeId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateCustomField(
    id: string,
    data: Partial<{ fieldLabel: string; fieldValue: string }>
  ): Promise<EmployeeCustomField> {
    const field = await this.fieldRepo.findOne({ where: { id } });
    if (!field) {
      throw new Error('Custom field not found');
    }

    Object.assign(field, data);
    return this.fieldRepo.save(field);
  }

  async deleteCustomField(id: string): Promise<void> {
    await this.fieldRepo.delete(id);
  }
}


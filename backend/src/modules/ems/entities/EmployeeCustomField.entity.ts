import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from './Employee.entity';

@Entity('employee_custom_fields')
@Index(['employeeId', 'fieldKey'], { unique: true })
export class EmployeeCustomField {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId!: string;

  @Column({ type: 'varchar', length: 255, name: 'field_key' })
  fieldKey!: string;

  @Column({ type: 'varchar', length: 255, name: 'field_label' })
  fieldLabel!: string;

  @Column({ type: 'varchar', length: 50, name: 'field_type' })
  fieldType!: string;

  @Column({ type: 'text', name: 'field_value', nullable: true })
  fieldValue!: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


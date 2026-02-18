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
import { EmployeeCategory } from './EmployeeCategory.entity';

@Entity('experience_history')
@Index(['employeeId', 'categoryId', 'fromDate'])
export class ExperienceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @Column({ type: 'date', name: 'from_date' })
  fromDate: Date;

  @Column({ type: 'date', name: 'to_date', nullable: true })
  toDate: Date | null;

  @Column({
    type: 'int',
    name: 'years',
    default: 0,
    comment: 'Auto-calculated years',
  })
  years: number;

  @Column({
    type: 'int',
    name: 'months',
    default: 0,
    comment: 'Auto-calculated months',
  })
  months: number;

  @Column({
    type: 'text',
    name: 'technologies_used',
    nullable: true,
    comment: 'Comma-separated list of technologies',
  })
  technologiesUsed: string | null;

  @ManyToOne(() => Employee, (employee) => employee.experienceHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => EmployeeCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: EmployeeCategory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


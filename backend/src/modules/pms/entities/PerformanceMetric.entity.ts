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
import { Employee } from '../../ems/entities/Employee.entity';
import { EmployeeCategory } from '../../ems/entities/EmployeeCategory.entity';

@Entity('performance_metrics')
@Index(['employeeId', 'metricDate'])
@Index(['categoryId'])
export class PerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId: string | null;

  @Column({ type: 'date', name: 'metric_date' })
  metricDate: Date;

  @Column({
    type: 'text',
    name: 'metric_name',
    comment: 'e.g., project_completion_count, skill_utilization',
  })
  metricName: string;

  @Column({
    type: 'text',
    name: 'metric_value',
    comment: 'Encrypted in prod, plain in dev',
  })
  metricValue: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'aggregation_period',
    nullable: true,
    comment: 'daily, monthly, quarterly, yearly',
  })
  aggregationPeriod: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => EmployeeCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: EmployeeCategory | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


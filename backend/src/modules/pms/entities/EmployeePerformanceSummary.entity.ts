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

@Entity('employee_performance_summaries')
@Index(['employeeId', 'summaryDate'], { unique: true })
@Index(['summaryDate'])
export class EmployeePerformanceSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'date', name: 'summary_date' })
  summaryDate: Date;

  @Column({
    type: 'text',
    name: 'overall_performance_score',
    nullable: true,
    comment: 'Encrypted in prod, plain in dev',
  })
  overallPerformanceScore: string | null;

  @Column({
    type: 'text',
    name: 'category_wise_contribution',
    nullable: true,
    comment: 'JSON string, encrypted in prod, plain in dev',
  })
  categoryWiseContribution: string | null;

  @Column({
    type: 'text',
    name: 'time_spent_per_project',
    nullable: true,
    comment: 'JSON string, encrypted in prod, plain in dev',
  })
  timeSpentPerProject: string | null;

  @Column({
    type: 'text',
    name: 'skill_growth_data',
    nullable: true,
    comment: 'JSON string, encrypted in prod, plain in dev',
  })
  skillGrowthData: string | null;

  @Column({
    type: 'text',
    name: 'performance_trend_data',
    nullable: true,
    comment: 'JSON string, encrypted in prod, plain in dev',
  })
  performanceTrendData: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'aggregation_period',
    default: 'monthly',
    comment: 'daily, monthly, quarterly, yearly',
  })
  aggregationPeriod: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


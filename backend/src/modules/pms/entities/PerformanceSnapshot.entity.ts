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
import { Project } from '../../ems/entities/Project.entity';

@Entity('performance_snapshots')
@Index(['employeeId', 'snapshotDate'])
@Index(['projectId'])
@Index(['snapshotDate'])
export class PerformanceSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'uuid', name: 'project_id', nullable: true })
  projectId: string | null;

  @Column({ type: 'date', name: 'snapshot_date' })
  snapshotDate: Date;

  @Column({
    type: 'text',
    name: 'project_completion_count',
    nullable: true,
    comment: 'Encrypted in prod, plain in dev',
  })
  projectCompletionCount: string | null;

  @Column({
    type: 'text',
    name: 'contribution_duration_days',
    nullable: true,
    comment: 'Encrypted in prod, plain in dev',
  })
  contributionDurationDays: string | null;

  @Column({
    type: 'text',
    name: 'skill_utilization_score',
    nullable: true,
    comment: 'Encrypted in prod, plain in dev',
  })
  skillUtilizationScore: string | null;

  @Column({
    type: 'text',
    name: 'productivity_score',
    nullable: true,
    comment: 'Encrypted in prod, plain in dev',
  })
  productivityScore: string | null;

  @Column({
    type: 'text',
    name: 'quality_score',
    nullable: true,
    comment: 'Encrypted in prod, plain in dev',
  })
  qualityScore: string | null;

  @Column({
    type: 'text',
    name: 'overall_performance_rating',
    nullable: true,
    comment: 'Encrypted in prod, plain in dev',
  })
  overallPerformanceRating: string | null;

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

  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project: Project | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


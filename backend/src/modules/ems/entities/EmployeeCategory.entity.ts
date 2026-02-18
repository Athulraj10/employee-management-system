import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { Employee } from './Employee.entity';

export enum CategoryType {
  FRONTEND = 'Frontend',
  BACKEND = 'Backend',
  FULL_STACK = 'Full Stack',
  MOBILE = 'Mobile',
  DEVOPS = 'DevOps',
  QA = 'QA',
  DATA_AI = 'Data / AI',
}

@Entity('employee_categories')
@Index(['name'], { unique: true })
export class EmployeeCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
    unique: true,
  })
  name!: CategoryType;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @ManyToMany(() => Employee, (employee) => employee.categories)
  employees!: Employee[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


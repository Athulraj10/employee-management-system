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
import { Project } from './Project.entity';
import { EmployeeCategory } from './EmployeeCategory.entity';

@Entity('employee_projects')
@Index(['employeeId', 'projectId', 'startDate'], { unique: true })
export class EmployeeProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @Column({ type: 'varchar', length: 255 })
  role: string;

  @Column({
    type: 'text',
    name: 'technologies_used',
    nullable: true,
    comment: 'Comma-separated list of technologies',
  })
  technologiesUsed: string | null;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate: Date | null;

  @ManyToOne(() => Employee, (employee) => employee.projects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Project, (project) => project.employeeProjects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => EmployeeCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: EmployeeCategory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


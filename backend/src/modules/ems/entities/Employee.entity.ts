import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
} from 'typeorm';
import { EmployeeCategory } from './EmployeeCategory.entity';
import { EmployeeSkill } from './EmployeeSkill.entity';
import { EmployeeProject } from './EmployeeProject.entity';
import { ExperienceHistory } from './ExperienceHistory.entity';
import { AuditLog } from './AuditLog.entity';

export enum EmploymentStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('employees')
@Index(['email'], { unique: true })
@Index(['employeeId'], { unique: true })
@Index(['status'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 50, name: 'employee_id' })
  employeeId!: string;

  @Column({ type: 'date', name: 'date_of_joining' })
  dateOfJoining!: Date;

  @Column({ type: 'varchar', length: 255, name: 'current_designation' })
  currentDesignation!: string;

  @Column({
    type: 'enum',
    enum: EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  status!: EmploymentStatus;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'total_experience_years',
    default: 0,
    comment: 'Auto-calculated total experience in years',
  })
  totalExperienceYears!: number;

  @ManyToMany(() => EmployeeCategory, (category) => category.employees)
  @JoinTable({
    name: 'employee_category_mappings',
    joinColumn: { name: 'employee_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories!: EmployeeCategory[];

  @OneToMany(() => EmployeeSkill, (skill) => skill.employee)
  skills!: EmployeeSkill[];

  @OneToMany(() => EmployeeProject, (project) => project.employee)
  projects!: EmployeeProject[];

  @OneToMany(() => ExperienceHistory, (history) => history.employee)
  experienceHistory!: ExperienceHistory[];

  @OneToMany(() => AuditLog, (log) => log.employee)
  auditLogs!: AuditLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


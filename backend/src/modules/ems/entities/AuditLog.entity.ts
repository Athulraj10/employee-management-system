import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from './Employee.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  DEACTIVATE = 'DEACTIVATE',
  ACTIVATE = 'ACTIVATE',
}

export enum AuditEntityType {
  EMPLOYEE = 'EMPLOYEE',
  PROJECT = 'PROJECT',
  EMPLOYEE_PROJECT = 'EMPLOYEE_PROJECT',
  EXPERIENCE_HISTORY = 'EXPERIENCE_HISTORY',
  SKILL = 'SKILL',
}

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['employeeId'])
@Index(['changedBy'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id', nullable: true })
  employeeId: string | null;

  @Column({
    type: 'enum',
    enum: AuditEntityType,
    name: 'entity_type',
  })
  entityType: AuditEntityType;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ type: 'text', name: 'old_value', nullable: true })
  oldValue: string | null;

  @Column({ type: 'text', name: 'new_value', nullable: true })
  newValue: string | null;

  @Column({ type: 'varchar', length: 255, name: 'changed_by' })
  changedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


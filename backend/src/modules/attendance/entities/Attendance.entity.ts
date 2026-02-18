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

export enum AttendanceType {
  ATTENDANCE = 'attendance',
  REMOTE = 'remote',
  LEAVE = 'leave',
  LONG_LEAVE = 'long_leave',
  TERMINATION = 'termination',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('attendances')
@Index(['employeeId', 'date', 'projectId'])
@Index(['date'])
@Index(['projectId'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({
    type: 'enum',
    enum: AttendanceType,
  })
  type!: AttendanceType;

  @Column({ type: 'time', name: 'check_in', nullable: true })
  checkIn!: string | null;

  @Column({ type: 'time', name: 'check_out', nullable: true })
  checkOut!: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'hours_worked', nullable: true })
  hoursWorked!: number | null;

  @Column({ type: 'boolean', name: 'is_half_day', default: false })
  isHalfDay!: boolean;

  @Column({
    type: 'enum',
    enum: LeaveStatus,
    nullable: true,
  })
  leaveStatus!: LeaveStatus | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', length: 255, name: 'marked_by', nullable: true })
  markedBy!: string | null;

  @Column({ type: 'uuid', name: 'project_id', nullable: true })
  projectId!: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


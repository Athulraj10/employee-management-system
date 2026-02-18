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
import { Skill } from './Skill.entity';

@Entity('employee_skills')
@Index(['employeeId', 'skillId'], { unique: true })
export class EmployeeSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'uuid', name: 'skill_id' })
  skillId: string;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Proficiency level (0-100)',
  })
  proficiency: number;

  @ManyToOne(() => Employee, (employee) => employee.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Skill, (skill) => skill.employeeSkills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


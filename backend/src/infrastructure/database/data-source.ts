import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {
  Employee,
  EmployeeCategory,
  Skill,
  EmployeeSkill,
  Project,
  EmployeeProject,
  ExperienceHistory,
  AuditLog,
  EmployeeCustomField,
} from '../../modules/ems/entities';
import {
  PerformanceSnapshot,
  PerformanceMetric,
  EmployeePerformanceSummary,
  PerformanceConfig,
  TimeSeriesIndex,
} from '../../modules/pms/entities';
import { User } from '../../modules/auth/entities/User.entity';
import { Attendance } from '../../modules/attendance/entities/Attendance.entity';
import { Ticket } from '../../modules/tickets/entities/Ticket.entity';

const isProd = process.env.APP_ENV === 'prod';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ems_pms',
  synchronize: !isProd,
  logging: process.env.TYPEORM_LOGGING === 'true',
    entities: [
      Employee,
      EmployeeCategory,
      Skill,
      EmployeeSkill,
      Project,
      EmployeeProject,
      ExperienceHistory,
      AuditLog,
      EmployeeCustomField,
      PerformanceSnapshot,
      PerformanceMetric,
      EmployeePerformanceSummary,
      PerformanceConfig,
      TimeSeriesIndex,
      User,
      Attendance,
      Ticket,
    ],
});

export async function initializeDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}



import 'reflect-metadata';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

import { AppDataSource, initializeDatabase } from '../infrastructure/database/data-source';
import { Employee } from '../modules/ems/entities/Employee.entity';
import { Project } from '../modules/ems/entities/Project.entity';
import { EmployeeProject } from '../modules/ems/entities/EmployeeProject.entity';
import { EmployeeCategory, CategoryType } from '../modules/ems/entities/EmployeeCategory.entity';
import { PerformanceSnapshot } from '../modules/pms/entities/PerformanceSnapshot.entity';
import { EmployeePerformanceSummary } from '../modules/pms/entities/EmployeePerformanceSummary.entity';
import { Attendance, AttendanceType } from '../modules/attendance/entities/Attendance.entity';
import { performanceCrypto } from '../common/security/performance-crypto';
import { getEnv } from '../common/config/env';

interface CSVRow {
  team: string;
  employeeName: string;
  score: number;
  monthlySummary: string;
  hrRemark: string;
}

function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const rows: CSVRow[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handling quoted fields with commas)
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());

    if (fields.length >= 5) {
      rows.push({
        team: fields[0].trim(),
        employeeName: fields[1].trim(),
        score: parseFloat(fields[2]) || 0,
        monthlySummary: fields[3].trim(),
        hrRemark: fields[4].trim(),
      });
    }
  }

  return rows;
}

async function importPerformanceData() {
  try {
    console.log('🚀 Starting December performance data import...');
    await initializeDatabase();

    const employeeRepo = AppDataSource.getRepository(Employee);
    const projectRepo = AppDataSource.getRepository(Project);
    const employeeProjectRepo = AppDataSource.getRepository(EmployeeProject);
    const categoryRepo = AppDataSource.getRepository(EmployeeCategory);
    const snapshotRepo = AppDataSource.getRepository(PerformanceSnapshot);
    const summaryRepo = AppDataSource.getRepository(EmployeePerformanceSummary);
    const attendanceRepo = AppDataSource.getRepository(Attendance);

    // Read CSV file
    const csvPath = path.join(__dirname, '../../Performance_Evaluation_Sprint_17 (December 1-31).csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvData = parseCSV(csvPath);
    console.log(`📊 Found ${csvData.length} records to import`);

    const isProd = getEnv().APP_ENV === 'prod';

    // Process each row
    for (const row of csvData) {
      if (!row.employeeName || !row.team) continue;

      console.log(`\n📝 Processing: ${row.employeeName} (${row.team})`);

      // Find or create employee
      let employee = await employeeRepo.findOne({
        where: { name: row.employeeName },
      });

      if (!employee) {
        // Create employee if not found
        const employeeId = `EMP${Date.now().toString().slice(-6)}`;
        employee = employeeRepo.create({
          name: row.employeeName,
          email: `${row.employeeName.toLowerCase().replace(/\s+/g, '.')}@gnx.com`,
          employeeId,
          dateOfJoining: new Date('2024-01-01'), // Default date
          currentDesignation: 'Developer',
          status: 'Active' as any,
        });
        employee = await employeeRepo.save(employee);
        console.log(`  ✓ Created employee: ${row.employeeName}`);
      }

      // Find or create project (team = project)
      let project = await projectRepo.findOne({
        where: { name: row.team },
      });

      if (!project) {
        project = projectRepo.create({
          name: row.team,
          description: `Project for ${row.team} team`,
          startDate: new Date('2024-01-01'),
          active: true,
        });
        project = await projectRepo.save(project);
        console.log(`  ✓ Created project: ${row.team}`);
      }

      // Assign employee to project if not already assigned
      const existingAssignment = await employeeProjectRepo.findOne({
        where: {
          employeeId: employee.id,
          projectId: project.id,
        },
      });

      if (!existingAssignment) {
        // Get a default category (Backend or Frontend based on team)
        const defaultCategory = await categoryRepo.findOne({
          where: { name: row.team.includes('Frontend') ? CategoryType.FRONTEND : CategoryType.BACKEND },
        }) || await categoryRepo.findOne({ where: { name: CategoryType.FULL_STACK } });

        if (defaultCategory) {
          const assignment = employeeProjectRepo.create({
            employeeId: employee.id,
            projectId: project.id,
            categoryId: defaultCategory.id,
            role: 'Developer',
            startDate: new Date('2024-12-01'),
          });
          await employeeProjectRepo.save(assignment);
          console.log(`  ✓ Assigned employee to project`);
        }
      }

      // Create attendance history for December (all present)
      const year = 2024;
      const month = 11; // December (0-indexed, so 11 = December)
      const daysInMonth = 31;
      let attendanceCreated = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const attendanceDate = new Date(year, month, day);
        const dateStr = attendanceDate.toISOString().split('T')[0];

        // Check if attendance already exists
        const existingAttendance = await attendanceRepo.findOne({
          where: {
            employeeId: employee.id,
            date: attendanceDate,
            projectId: project.id,
          },
        });

        if (!existingAttendance) {
          // Standard work hours: 9 AM to 6 PM
          const checkIn = '09:00:00';
          const checkOut = '18:00:00';
          const hoursWorked = 9;

          const attendance = attendanceRepo.create({
            employeeId: employee.id,
            projectId: project.id,
            date: attendanceDate,
            type: AttendanceType.ATTENDANCE,
            checkIn,
            checkOut,
            hoursWorked,
            isHalfDay: false,
            markedBy: 'system',
          });

          await attendanceRepo.save(attendance);
          attendanceCreated++;
        }
      }

      console.log(`  ✓ Created ${attendanceCreated} attendance records for Dec 1-31 (${daysInMonth - attendanceCreated} already existed)`);

      // Create performance snapshots for each day of December (1-31)
      const monthlyScore = row.score;

      let snapshotsCreated = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const snapshotDate = new Date(year, month, day);
        
        // Check if snapshot already exists
        const existingSnapshot = await snapshotRepo.findOne({
          where: {
            employeeId: employee.id,
            projectId: project.id,
            snapshotDate,
          },
        });

        if (!existingSnapshot) {
          const overallRating = isProd
            ? performanceCrypto.encrypt(monthlyScore.toString())
            : monthlyScore.toString();

          const snapshot = snapshotRepo.create({
            employeeId: employee.id,
            projectId: project.id,
            snapshotDate,
            overallPerformanceRating: overallRating,
            aggregationPeriod: 'daily',
          });

          await snapshotRepo.save(snapshot);
          snapshotsCreated++;
        }
      }

      console.log(`  ✓ Created ${snapshotsCreated} daily snapshots for Dec 1-31 (${daysInMonth - snapshotsCreated} already existed)`);

      // Create monthly summary for December 31
      const summaryDate = new Date(year, month, 31);
      const existingSummary = await summaryRepo.findOne({
        where: {
          employeeId: employee.id,
          summaryDate,
        },
      });

      if (!existingSummary) {
        const overallScore = isProd
          ? performanceCrypto.encrypt(row.score.toString())
          : row.score.toString();

        const trendData = {
          monthlySummary: row.monthlySummary,
          hrRemark: row.hrRemark,
          score: row.score,
          scoreOutOf10: row.score,
          month: 'December 2024',
          team: row.team,
          project: row.team, // Team = Project
        };

        const performanceTrendData = isProd
          ? performanceCrypto.encrypt(JSON.stringify(trendData))
          : JSON.stringify(trendData);

        const summary = summaryRepo.create({
          employeeId: employee.id,
          summaryDate,
          overallPerformanceScore: overallScore,
          aggregationPeriod: 'monthly',
          performanceTrendData: performanceTrendData,
        });

        await summaryRepo.save(summary);
        console.log(`  ✓ Created monthly summary`);
      }
    }

    console.log('\n✅ December performance data import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing performance data:', error);
    process.exit(1);
  }
}

importPerformanceData();


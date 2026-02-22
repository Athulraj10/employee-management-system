import { AppDataSource } from '../../../infrastructure/database/data-source';
import { Attendance, AttendanceType, LeaveStatus } from '../entities/Attendance.entity';
import { Employee } from '../../ems/entities/Employee.entity';
import { Project } from '../../ems/entities/Project.entity';
import { EmployeeCategory } from '../../ems/entities/EmployeeCategory.entity';
import { EmployeeProject } from '../../ems/entities/EmployeeProject.entity';

export class AttendanceService {
  private attendanceRepo = AppDataSource.getRepository(Attendance);
  private employeeRepo = AppDataSource.getRepository(Employee);

  async markAttendance(data: {
    employeeId: string;
    date: Date;
    type: AttendanceType;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
    markedBy?: string;
    isHalfDay?: boolean;
    projectId?: string | null;
  }): Promise<Attendance> {
    const whereClause: any = { 
      employeeId: data.employeeId, 
      date: data.date 
    };
    
    if (data.projectId) {
      whereClause.projectId = data.projectId;
    } else {
      whereClause.projectId = null;
    }

    const existing = await this.attendanceRepo.findOne({
      where: whereClause,
    });

    if (existing) {
      Object.assign(existing, {
        type: data.type,
        checkIn: data.checkIn !== undefined ? data.checkIn : existing.checkIn,
        checkOut: data.checkOut !== undefined ? data.checkOut : existing.checkOut,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        markedBy: data.markedBy,
        isHalfDay: data.isHalfDay !== undefined ? data.isHalfDay : existing.isHalfDay,
        projectId: data.projectId !== undefined ? data.projectId : existing.projectId,
      });

      if (data.checkIn && data.checkOut) {
        existing.hoursWorked = this.calculateHours(data.checkIn, data.checkOut);
      } else if (data.isHalfDay && existing.checkIn) {
        existing.hoursWorked = 4;
      }

      return this.attendanceRepo.save(existing);
    }

    const attendance = this.attendanceRepo.create({
      ...data,
      hoursWorked: data.checkIn && data.checkOut 
        ? this.calculateHours(data.checkIn, data.checkOut) 
        : data.isHalfDay ? 4 : null,
    });

    return this.attendanceRepo.save(attendance);
  }

  async getAttendanceByEmployee(
    employeeId: string,
    filters: { startDate?: Date; endDate?: Date; type?: AttendanceType }
  ): Promise<Attendance[]> {
    const query = this.attendanceRepo.createQueryBuilder('attendance')
      .where('attendance.employeeId = :employeeId', { employeeId });

    if (filters.startDate) {
      query.andWhere('attendance.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('attendance.date <= :endDate', { endDate: filters.endDate });
    }

    if (filters.type) {
      query.andWhere('attendance.type = :type', { type: filters.type });
    }

    return query.orderBy('attendance.date', 'DESC').getMany();
  }

  async getAttendanceStats(employeeId: string, startDate: Date, endDate: Date): Promise<{
    totalDays: number;
    attendance: number;
    remote: number;
    leave: number;
    longLeave: number;
    termination: number;
    totalHours: number;
  }> {
    const attendances = await this.attendanceRepo.find({
      where: { employeeId },
      order: { date: 'ASC' },
    });

    const filtered = attendances.filter(a => a.date >= startDate && a.date <= endDate);

    return {
      totalDays: filtered.length,
      attendance: filtered.filter(a => a.type === AttendanceType.ATTENDANCE).length,
      remote: filtered.filter(a => a.type === AttendanceType.REMOTE).length,
      leave: filtered.filter(a => a.type === AttendanceType.LEAVE).length,
      longLeave: filtered.filter(a => a.type === AttendanceType.LONG_LEAVE).length,
      termination: filtered.filter(a => a.type === AttendanceType.TERMINATION).length,
      totalHours: filtered.reduce((sum, a) => sum + (a.hoursWorked || 0), 0),
    };
  }

  async updateAttendance(
    id: string,
    data: Partial<{
      type: AttendanceType;
      checkIn: string;
      checkOut: string;
      notes: string;
      isHalfDay: boolean;
      markedBy: string;
      projectId: string | null;
    }>
  ): Promise<Attendance> {
    const attendance = await this.attendanceRepo.findOne({ where: { id } });
    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    Object.assign(attendance, data);

    if (data.checkIn && data.checkOut) {
      attendance.hoursWorked = this.calculateHours(data.checkIn, data.checkOut);
    } else if (data.isHalfDay) {
      attendance.hoursWorked = 4;
    }

    return this.attendanceRepo.save(attendance);
  }

  async getAttendanceHistory(
    employeeId: string,
    days: number = 15
  ): Promise<Attendance[]> {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.employeeId = :employeeId', { employeeId })
      .andWhere('attendance.date >= :startDate', { startDate })
      .andWhere('attendance.date <= :endDate', { endDate })
      .leftJoinAndSelect('attendance.employee', 'employee')
      .leftJoin('projects', 'project', 'project.id = attendance.projectId')
      .addSelect(['project.id', 'project.name'])
      .orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.updatedAt', 'DESC')
      .getMany();
  }

  async getAttendanceByProject(
    projectId: string,
    date?: Date
  ): Promise<Attendance[]> {
    const query = this.attendanceRepo.createQueryBuilder('attendance')
      .where('attendance.projectId = :projectId', { projectId });

    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      query.andWhere('DATE(attendance.date) = :date', { date: dateStr });
    }

    return query
      .leftJoinAndSelect('attendance.employee', 'employee')
      .orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.updatedAt', 'DESC')
      .getMany();
  }

  async getAttendanceByCategory(
    categoryId: string,
    date?: Date
  ): Promise<Attendance[]> {
    const query = this.attendanceRepo.createQueryBuilder('attendance')
      .leftJoin('employee_categories', 'ec', 'ec.employee_id = attendance.employee_id')
      .where('ec.category_id = :categoryId', { categoryId });

    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      query.andWhere('DATE(attendance.date) = :date', { date: dateStr });
    }

    return query
      .leftJoinAndSelect('attendance.employee', 'employee')
      .orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.updatedAt', 'DESC')
      .getMany();
  }

  async getAllEmployeesAttendance(
    filters: {
      date?: Date;
      projectId?: string;
      categoryId?: string;
      type?: AttendanceType;
    }
  ): Promise<Array<{ employee: Employee; attendance: Attendance | null; projects: any[] }>> {
    const employeeRepo = AppDataSource.getRepository(Employee);
    const employeeProjectRepo = AppDataSource.getRepository(EmployeeProject);

    let query = employeeRepo.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.categories', 'categories')
      .where('employee.status = :status', { status: 'Active' });

    if (filters.categoryId) {
      query.andWhere('categories.id = :categoryId', { categoryId: filters.categoryId });
    }

    const employees = await query.getMany();

    const targetDate = filters.date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    const result = await Promise.all(
      employees.map(async (employee) => {
        let attendance: Attendance | null = null;

        const attendanceQuery = this.attendanceRepo.createQueryBuilder('attendance')
          .where('attendance.employeeId = :employeeId', { employeeId: employee.id })
          .andWhere('DATE(attendance.date) = :date', { date: dateStr });

        if (filters.projectId) {
          attendanceQuery.andWhere('attendance.projectId = :projectId', { projectId: filters.projectId });
        }

        if (filters.type) {
          attendanceQuery.andWhere('attendance.type = :type', { type: filters.type });
        }

        attendance = await attendanceQuery.getOne();

        const projects = await employeeProjectRepo.find({
          where: { employeeId: employee.id },
          relations: ['project', 'category'],
          order: { startDate: 'DESC' },
        });

        return { employee, attendance, projects };
      })
    );

    if (filters.projectId) {
      return result.filter(r => 
        r.projects.some(p => p.projectId === filters.projectId)
      );
    }

    return result;
  }

  private calculateHours(checkIn: string, checkOut: string): number {
    const [inHours, inMinutes] = checkIn.split(':').map(Number);
    const [outHours, outMinutes] = checkOut.split(':').map(Number);
    const inTime = inHours * 60 + inMinutes;
    const outTime = outHours * 60 + outMinutes;
    const hours = Math.max(0, (outTime - inTime) / 60);
    return Math.round(hours * 100) / 100;
  }
}


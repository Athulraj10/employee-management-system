import { AppDataSource } from '../../../infrastructure/database/data-source';
import { Attendance, AttendanceType } from '../../attendance/entities/Attendance.entity';
import { Ticket, TicketStatus } from '../../tickets/entities/Ticket.entity';
import { Employee } from '../../ems/entities/Employee.entity';
import { performanceCrypto } from '../../../common/security/performance-crypto';
import { getEnv } from '../../../common/config/env';

export class PerformanceCalculationService {
  private attendanceRepo = AppDataSource.getRepository(Attendance);
  private ticketRepo = AppDataSource.getRepository(Ticket);
  private employeeRepo = AppDataSource.getRepository(Employee);

  async calculatePerformanceScore(employeeId: string, startDate: Date, endDate: Date): Promise<{
    overallScore: number;
    attendanceScore: number;
    productivityScore: number;
    ticketScore: number;
    details: Record<string, any>;
  }> {
    const [attendanceStats, tickets, employee] = await Promise.all([
      this.getAttendanceMetrics(employeeId, startDate, endDate),
      this.getTicketMetrics(employeeId, startDate, endDate),
      this.employeeRepo.findOne({ where: { id: employeeId } }),
    ]);

    const attendanceScore = this.calculateAttendanceScore(attendanceStats);

    const ticketScore = this.calculateTicketScore(tickets);

    const productivityScore = this.calculateProductivityScore(attendanceStats);

    const overallScore = (
      attendanceScore * 0.4 +
      ticketScore * 0.3 +
      productivityScore * 0.3
    );

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      attendanceScore: Math.round(attendanceScore * 100) / 100,
      productivityScore: Math.round(productivityScore * 100) / 100,
      ticketScore: Math.round(ticketScore * 100) / 100,
      details: {
        attendance: attendanceStats,
        tickets: tickets,
      },
    };
  }

  private async getAttendanceMetrics(employeeId: string, startDate: Date, endDate: Date) {
    const attendances = await this.attendanceRepo.find({
      where: { employeeId },
    });

    const filtered = attendances.filter(a => a.date >= startDate && a.date <= endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalDays,
      attendanceDays: filtered.filter(a => a.type === AttendanceType.ATTENDANCE).length,
      remoteDays: filtered.filter(a => a.type === AttendanceType.REMOTE).length,
      leaveDays: filtered.filter(a => a.type === AttendanceType.LEAVE).length,
      longLeaveDays: filtered.filter(a => a.type === AttendanceType.LONG_LEAVE).length,
      terminationDays: filtered.filter(a => a.type === AttendanceType.TERMINATION).length,
      totalHours: filtered.reduce((sum, a) => sum + (a.hoursWorked || 0), 0),
      presentDays: filtered.filter(a => 
        a.type === AttendanceType.ATTENDANCE || a.type === AttendanceType.REMOTE
      ).length,
    };
  }

  private async getTicketMetrics(employeeId: string, startDate: Date, endDate: Date) {
    const tickets = await this.ticketRepo.find({
      where: { employeeId },
    });

    const filtered = tickets.filter(t => t.createdAt >= startDate && t.createdAt <= endDate);

    return {
      total: filtered.length,
      open: filtered.filter(t => t.status === TicketStatus.OPEN).length,
      inProgress: filtered.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
      resolved: filtered.filter(t => t.status === TicketStatus.RESOLVED).length,
      closed: filtered.filter(t => t.status === TicketStatus.CLOSED).length,
      avgResolutionTime: this.calculateAvgResolutionTime(filtered),
    };
  }

  private calculateAttendanceScore(stats: any): number {
    if (stats.totalDays === 0) return 0;

    const attendanceRate = (stats.presentDays / stats.totalDays) * 100;
    const leavePenalty = (stats.leaveDays / stats.totalDays) * 10;
    const longLeavePenalty = (stats.longLeaveDays / stats.totalDays) * 20;
    const terminationPenalty = (stats.terminationDays / stats.totalDays) * 50;

    return Math.max(0, Math.min(100, attendanceRate - leavePenalty - longLeavePenalty - terminationPenalty));
  }

  private calculateTicketScore(tickets: any): number {
    if (tickets.total === 0) return 100;

    const resolutionRate = tickets.total > 0 ? (tickets.resolved + tickets.closed) / tickets.total * 100 : 0;
    const openPenalty = (tickets.open / tickets.total) * 20;

    return Math.max(0, Math.min(100, resolutionRate - openPenalty));
  }

  private calculateProductivityScore(stats: any): number {
    const expectedHours = stats.presentDays * 8;
    if (expectedHours === 0) return 0;

    const productivityRate = (stats.totalHours / expectedHours) * 100;
    return Math.max(0, Math.min(100, productivityRate));
  }

  private calculateAvgResolutionTime(tickets: any[]): number {
    const resolved = tickets.filter(t => t.resolvedAt && t.createdAt);
    if (resolved.length === 0) return 0;

    const totalDays = resolved.reduce((sum, t) => {
      const days = (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return totalDays / resolved.length;
  }
}


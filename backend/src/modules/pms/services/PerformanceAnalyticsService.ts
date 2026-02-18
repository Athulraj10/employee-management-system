import { AppDataSource } from '../../../infrastructure/database/data-source';
import { PerformanceSnapshot, PerformanceMetric, EmployeePerformanceSummary } from '../entities';
import { Employee } from '../../ems/entities/Employee.entity';
import { performanceCrypto } from '../../../common/security/performance-crypto';
import { getEnv } from '../../../common/config/env';

export class PerformanceAnalyticsService {
  private snapshotRepo = AppDataSource.getRepository(PerformanceSnapshot);
  private metricRepo = AppDataSource.getRepository(PerformanceMetric);
  private summaryRepo = AppDataSource.getRepository(EmployeePerformanceSummary);
  private employeeRepo = AppDataSource.getRepository(Employee);

  async getPerformanceTrend(
    employeeId: string,
    months: number = 6
  ): Promise<Array<{ date: string; score: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const snapshots = await this.snapshotRepo.find({
      where: { employeeId },
      order: { snapshotDate: 'ASC' },
    });

    const isProd = getEnv().APP_ENV === 'prod';

    return snapshots
      .filter(s => s.snapshotDate >= startDate && s.snapshotDate <= endDate)
      .map(s => ({
        date: s.snapshotDate.toISOString().split('T')[0],
        score: s.overallPerformanceRating
          ? parseFloat(isProd ? performanceCrypto.decrypt(s.overallPerformanceRating) : s.overallPerformanceRating)
          : 0,
      }));
  }

  async getCategoryWiseContribution(employeeId: string): Promise<Record<string, number>> {
    const summaries = await this.summaryRepo.find({
      where: { employeeId },
      order: { summaryDate: 'DESC' },
      take: 1,
    });

    if (summaries.length === 0) return {};

    const summary = summaries[0];
    const isProd = getEnv().APP_ENV === 'prod';

    if (!summary.categoryWiseContribution) return {};

    const decrypted = isProd
      ? performanceCrypto.decrypt(summary.categoryWiseContribution)
      : summary.categoryWiseContribution;

    return JSON.parse(decrypted);
  }

  async getTimeSpentPerProject(employeeId: string): Promise<Array<{ projectId: string; days: number }>> {
    const summaries = await this.summaryRepo.find({
      where: { employeeId },
      order: { summaryDate: 'DESC' },
      take: 1,
    });

    if (summaries.length === 0) return [];

    const summary = summaries[0];
    const isProd = getEnv().APP_ENV === 'prod';

    if (!summary.timeSpentPerProject) return [];

    const decrypted = isProd
      ? performanceCrypto.decrypt(summary.timeSpentPerProject)
      : summary.timeSpentPerProject;

    const data = JSON.parse(decrypted);
    return Object.entries(data).map(([projectId, days]) => ({
      projectId,
      days: typeof days === 'number' ? days : parseFloat(days as string),
    }));
  }

  async getSkillGrowthOverTime(employeeId: string): Promise<Record<string, Array<{ date: string; value: number }>>> {
    const metrics = await this.metricRepo.find({
      where: { employeeId },
      order: { metricDate: 'ASC' },
    });

    const isProd = getEnv().APP_ENV === 'prod';
    const skillData: Record<string, Array<{ date: string; value: number }>> = {};

    for (const metric of metrics) {
      if (metric.metricName.startsWith('skill_')) {
        const skillName = metric.metricName.replace('skill_', '');
        if (!skillData[skillName]) {
          skillData[skillName] = [];
        }

        const value = parseFloat(
          isProd ? performanceCrypto.decrypt(metric.metricValue) : metric.metricValue
        );

        skillData[skillName].push({
          date: metric.metricDate.toISOString().split('T')[0],
          value,
        });
      }
    }

    return skillData;
  }

  async getEmployeePerformanceOverview(employeeId: string): Promise<{
    overallScore: number;
    categoryBreakdown: Record<string, number>;
    projectTime: Array<{ projectId: string; days: number }>;
    skillGrowth: Record<string, Array<{ date: string; value: number }>>;
    trend: Array<{ date: string; score: number }>;
  }> {
    const [summary, trend, categoryBreakdown, projectTime, skillGrowth] = await Promise.all([
      this.summaryRepo.findOne({
        where: { employeeId },
        order: { summaryDate: 'DESC' },
      }),
      this.getPerformanceTrend(employeeId, 6),
      this.getCategoryWiseContribution(employeeId),
      this.getTimeSpentPerProject(employeeId),
      this.getSkillGrowthOverTime(employeeId),
    ]);

    const isProd = getEnv().APP_ENV === 'prod';
    const overallScore = summary?.overallPerformanceScore
      ? parseFloat(isProd ? performanceCrypto.decrypt(summary.overallPerformanceScore) : summary.overallPerformanceScore)
      : 0;

    return {
      overallScore,
      categoryBreakdown,
      projectTime,
      skillGrowth,
      trend,
    };
  }

  async getAdminDashboardAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
  }): Promise<{
    topPerformers: Array<{ employeeId: string; name: string; score: number }>;
    underutilized: Array<{ employeeId: string; name: string; score: number }>;
    categoryProductivity: Record<string, number>;
    teamTrend: Array<{ date: string; avgScore: number }>;
  }> {
    const query = this.summaryRepo.createQueryBuilder('summary')
      .leftJoinAndSelect('summary.employee', 'employee');

    if (filters.startDate) {
      query.andWhere('summary.summaryDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('summary.summaryDate <= :endDate', { endDate: filters.endDate });
    }

    const summaries = await query
      .orderBy('summary.summaryDate', 'DESC')
      .getMany();

    const isProd = getEnv().APP_ENV === 'prod';

    // Get latest summary per employee
    const employeeScores = new Map<string, { name: string; score: number }>();

    for (const summary of summaries) {
      if (!employeeScores.has(summary.employeeId)) {
        const score = summary.overallPerformanceScore
          ? parseFloat(isProd ? performanceCrypto.decrypt(summary.overallPerformanceScore) : summary.overallPerformanceScore)
          : 0;

        employeeScores.set(summary.employeeId, {
          name: summary.employee.name,
          score,
        });
      }
    }

    const scoresArray = Array.from(employeeScores.values());
    const topPerformers = scoresArray
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(s => ({ employeeId: '', name: s.name, score: s.score }));

    const underutilized = scoresArray
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)
      .map(s => ({ employeeId: '', name: s.name, score: s.score }));

    // Simplified category productivity (would need more complex logic in real implementation)
    const categoryProductivity: Record<string, number> = {};

    // Simplified team trend
    const teamTrend: Array<{ date: string; avgScore: number }> = [];

    return {
      topPerformers,
      underutilized,
      categoryProductivity,
      teamTrend,
    };
  }
}


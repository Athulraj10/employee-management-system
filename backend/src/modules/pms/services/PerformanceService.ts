import { AppDataSource } from '../../../infrastructure/database/data-source';
import { PerformanceSnapshot, PerformanceMetric, EmployeePerformanceSummary } from '../entities';
import { performanceCrypto } from '../../../common/security/performance-crypto';
import { getEnv } from '../../../common/config/env';
import { PerformanceCalculationService } from './PerformanceCalculationService';

export class PerformanceService {
  private snapshotRepo = AppDataSource.getRepository(PerformanceSnapshot);
  private metricRepo = AppDataSource.getRepository(PerformanceMetric);
  private summaryRepo = AppDataSource.getRepository(EmployeePerformanceSummary);
  private calculationService = new PerformanceCalculationService();

  async createSnapshot(data: {
    employeeId: string;
    projectId?: string;
    snapshotDate: Date;
    projectCompletionCount?: number;
    contributionDurationDays?: number;
    skillUtilizationScore?: number;
    productivityScore?: number;
    qualityScore?: number;
    overallPerformanceRating?: number;
    aggregationPeriod?: string;
  }): Promise<PerformanceSnapshot> {
    const isProd = getEnv().APP_ENV === 'prod';

    const snapshot = this.snapshotRepo.create({
      employeeId: data.employeeId,
      projectId: data.projectId,
      snapshotDate: data.snapshotDate,
      aggregationPeriod: data.aggregationPeriod || 'daily',
    });

    if (data.projectCompletionCount !== undefined) {
      snapshot.projectCompletionCount = isProd
        ? performanceCrypto.encrypt(data.projectCompletionCount.toString())
        : data.projectCompletionCount.toString();
    }

    if (data.contributionDurationDays !== undefined) {
      snapshot.contributionDurationDays = isProd
        ? performanceCrypto.encrypt(data.contributionDurationDays.toString())
        : data.contributionDurationDays.toString();
    }

    if (data.skillUtilizationScore !== undefined) {
      snapshot.skillUtilizationScore = isProd
        ? performanceCrypto.encrypt(data.skillUtilizationScore.toString())
        : data.skillUtilizationScore.toString();
    }

    if (data.productivityScore !== undefined) {
      snapshot.productivityScore = isProd
        ? performanceCrypto.encrypt(data.productivityScore.toString())
        : data.productivityScore.toString();
    }

    if (data.qualityScore !== undefined) {
      snapshot.qualityScore = isProd
        ? performanceCrypto.encrypt(data.qualityScore.toString())
        : data.qualityScore.toString();
    }

    if (data.overallPerformanceRating !== undefined) {
      snapshot.overallPerformanceRating = isProd
        ? performanceCrypto.encrypt(data.overallPerformanceRating.toString())
        : data.overallPerformanceRating.toString();
    }

    return this.snapshotRepo.save(snapshot);
  }

  async getSnapshot(id: string): Promise<PerformanceSnapshot | null> {
    const snapshot = await this.snapshotRepo.findOne({
      where: { id },
      relations: ['employee', 'project'],
    });

    if (!snapshot) return null;

    return this.decryptSnapshot(snapshot);
  }

  async getSnapshotsByEmployee(
    employeeId: string,
    filters: { startDate?: Date; endDate?: Date; projectId?: string }
  ): Promise<PerformanceSnapshot[]> {
    const query = this.snapshotRepo.createQueryBuilder('snapshot')
      .where('snapshot.employeeId = :employeeId', { employeeId })
      .leftJoinAndSelect('snapshot.project', 'project');

    if (filters.startDate) {
      query.andWhere('snapshot.snapshotDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('snapshot.snapshotDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.projectId) {
      query.andWhere('snapshot.projectId = :projectId', { projectId: filters.projectId });
    }

    const snapshots = await query
      .orderBy('snapshot.snapshotDate', 'DESC')
      .getMany();

    return snapshots.map(s => this.decryptSnapshot(s));
  }

  async createMetric(data: {
    employeeId: string;
    categoryId?: string;
    metricDate: Date;
    metricName: string;
    metricValue: number;
    aggregationPeriod?: string;
  }): Promise<PerformanceMetric> {
    const isProd = getEnv().APP_ENV === 'prod';
    const metric = this.metricRepo.create({
      employeeId: data.employeeId,
      categoryId: data.categoryId || undefined,
      metricDate: data.metricDate,
      metricName: data.metricName,
      aggregationPeriod: data.aggregationPeriod || 'daily',
      metricValue: isProd
        ? performanceCrypto.encrypt(data.metricValue.toString())
        : data.metricValue.toString(),
    });

    return this.metricRepo.save(metric) as unknown as Promise<PerformanceMetric>;
  }

  async getMetricsByEmployee(
    employeeId: string,
    filters: { startDate?: Date; endDate?: Date; categoryId?: string; metricName?: string }
  ): Promise<PerformanceMetric[]> {
    const query = this.metricRepo.createQueryBuilder('metric')
      .where('metric.employeeId = :employeeId', { employeeId })
      .leftJoinAndSelect('metric.category', 'category');

    if (filters.startDate) {
      query.andWhere('metric.metricDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('metric.metricDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.categoryId) {
      query.andWhere('metric.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.metricName) {
      query.andWhere('metric.metricName = :metricName', { metricName: filters.metricName });
    }

    const metrics = await query
      .orderBy('metric.metricDate', 'DESC')
      .getMany();

    return metrics.map(m => this.decryptMetric(m));
  }

  async createOrUpdateSummary(data: {
    employeeId: string;
    summaryDate: Date;
    overallPerformanceScore?: number;
    categoryWiseContribution?: Record<string, number>;
    timeSpentPerProject?: Record<string, number>;
    skillGrowthData?: Record<string, any>;
    performanceTrendData?: Record<string, any>;
    aggregationPeriod?: string;
    autoCalculate?: boolean;
  }): Promise<EmployeePerformanceSummary> {
    const isProd = getEnv().APP_ENV === 'prod';

    if (data.autoCalculate) {
      const startDate = new Date(data.summaryDate);
      startDate.setDate(1);
      const endDate = new Date(data.summaryDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);

      const calculated = await this.calculationService.calculatePerformanceScore(
        data.employeeId,
        startDate,
        endDate
      );

      data.overallPerformanceScore = calculated.overallScore;
      data.performanceTrendData = {
        attendanceScore: calculated.attendanceScore,
        productivityScore: calculated.productivityScore,
        ticketScore: calculated.ticketScore,
        details: calculated.details,
      };
    }

    let summary = await this.summaryRepo.findOne({
      where: {
        employeeId: data.employeeId,
        summaryDate: data.summaryDate,
      },
    });

    if (!summary) {
      summary = this.summaryRepo.create({
        employeeId: data.employeeId,
        summaryDate: data.summaryDate,
        aggregationPeriod: data.aggregationPeriod || 'monthly',
      });
    }

    if (data.overallPerformanceScore !== undefined) {
      summary.overallPerformanceScore = isProd
        ? performanceCrypto.encrypt(data.overallPerformanceScore.toString())
        : data.overallPerformanceScore.toString();
    }

    if (data.categoryWiseContribution) {
      summary.categoryWiseContribution = isProd
        ? performanceCrypto.encrypt(JSON.stringify(data.categoryWiseContribution))
        : JSON.stringify(data.categoryWiseContribution);
    }

    if (data.timeSpentPerProject) {
      summary.timeSpentPerProject = isProd
        ? performanceCrypto.encrypt(JSON.stringify(data.timeSpentPerProject))
        : JSON.stringify(data.timeSpentPerProject);
    }

    if (data.skillGrowthData) {
      summary.skillGrowthData = isProd
        ? performanceCrypto.encrypt(JSON.stringify(data.skillGrowthData))
        : JSON.stringify(data.skillGrowthData);
    }

    if (data.performanceTrendData) {
      summary.performanceTrendData = isProd
        ? performanceCrypto.encrypt(JSON.stringify(data.performanceTrendData))
        : JSON.stringify(data.performanceTrendData);
    }

    return this.summaryRepo.save(summary);
  }

  async getSummary(employeeId: string, summaryDate: Date): Promise<EmployeePerformanceSummary | null> {
    const summary = await this.summaryRepo.findOne({
      where: { employeeId, summaryDate },
      relations: ['employee'],
    });

    if (!summary) return null;

    return this.decryptSummary(summary);
  }

  async getSummariesByEmployee(
    employeeId: string,
    filters: { startDate?: Date; endDate?: Date }
  ): Promise<EmployeePerformanceSummary[]> {
    const query = this.summaryRepo.createQueryBuilder('summary')
      .where('summary.employeeId = :employeeId', { employeeId });

    if (filters.startDate) {
      query.andWhere('summary.summaryDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('summary.summaryDate <= :endDate', { endDate: filters.endDate });
    }

    const summaries = await query
      .orderBy('summary.summaryDate', 'DESC')
      .getMany();

    return summaries.map(s => this.decryptSummary(s));
  }

  private decryptSnapshot(snapshot: PerformanceSnapshot): PerformanceSnapshot {
    const isProd = getEnv().APP_ENV === 'prod';
    if (!isProd) return snapshot;

    const decrypted = { ...snapshot };
    if (snapshot.projectCompletionCount) {
      decrypted.projectCompletionCount = performanceCrypto.decrypt(snapshot.projectCompletionCount);
    }
    if (snapshot.contributionDurationDays) {
      decrypted.contributionDurationDays = performanceCrypto.decrypt(snapshot.contributionDurationDays);
    }
    if (snapshot.skillUtilizationScore) {
      decrypted.skillUtilizationScore = performanceCrypto.decrypt(snapshot.skillUtilizationScore);
    }
    if (snapshot.productivityScore) {
      decrypted.productivityScore = performanceCrypto.decrypt(snapshot.productivityScore);
    }
    if (snapshot.qualityScore) {
      decrypted.qualityScore = performanceCrypto.decrypt(snapshot.qualityScore);
    }
    if (snapshot.overallPerformanceRating) {
      decrypted.overallPerformanceRating = performanceCrypto.decrypt(snapshot.overallPerformanceRating);
    }
    return decrypted;
  }

  private decryptMetric(metric: PerformanceMetric): PerformanceMetric {
    const isProd = getEnv().APP_ENV === 'prod';
    if (!isProd) return metric;

    return {
      ...metric,
      metricValue: performanceCrypto.decrypt(metric.metricValue) as string,
    };
  }

  private decryptSummary(summary: EmployeePerformanceSummary): EmployeePerformanceSummary {
    const isProd = getEnv().APP_ENV === 'prod';
    if (!isProd) return summary;

    const decrypted = { ...summary };
    if (summary.overallPerformanceScore) {
      decrypted.overallPerformanceScore = performanceCrypto.decrypt(summary.overallPerformanceScore);
    }
    if (summary.categoryWiseContribution) {
      decrypted.categoryWiseContribution = performanceCrypto.decrypt(summary.categoryWiseContribution);
    }
    if (summary.timeSpentPerProject) {
      decrypted.timeSpentPerProject = performanceCrypto.decrypt(summary.timeSpentPerProject);
    }
    if (summary.skillGrowthData) {
      decrypted.skillGrowthData = performanceCrypto.decrypt(summary.skillGrowthData);
    }
    if (summary.performanceTrendData) {
      decrypted.performanceTrendData = performanceCrypto.decrypt(summary.performanceTrendData);
    }
    return decrypted;
  }
}


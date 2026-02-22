import { Router } from 'express';
import { PerformanceController } from './controllers/PerformanceController';
import { PerformanceAnalyticsController } from './controllers/PerformanceAnalyticsController';
import { PerformanceConfigController } from './controllers/PerformanceConfigController';

export function registerPmsRoutes() {
  const router = Router();
  const performanceController = new PerformanceController();
  const analyticsController = new PerformanceAnalyticsController();
  const configController = new PerformanceConfigController();

  router.post('/snapshots', (req, res) => performanceController.createSnapshot(req, res));
  router.get('/snapshots/:id', (req, res) => performanceController.getSnapshot(req, res));
  router.get('/employees/:employeeId/snapshots', (req, res) => performanceController.getEmployeeSnapshots(req, res));

  router.post('/metrics', (req, res) => performanceController.createMetric(req, res));
  router.get('/employees/:employeeId/metrics', (req, res) => performanceController.getEmployeeMetrics(req, res));

  router.post('/summaries', (req, res) => performanceController.createOrUpdateSummary(req, res));
  router.get('/employees/:employeeId/summaries', (req, res) => performanceController.getEmployeeSummaries(req, res));
  router.get('/employees/:employeeId/summary', (req, res) => performanceController.getSummary(req, res));

  router.get('/employees/:employeeId/overview', (req, res) => analyticsController.getEmployeePerformanceOverview(req, res));
  router.get('/employees/:employeeId/trend', (req, res) => analyticsController.getPerformanceTrend(req, res));
  router.get('/employees/:employeeId/category-contribution', (req, res) => analyticsController.getCategoryWiseContribution(req, res));
  router.get('/employees/:employeeId/project-time', (req, res) => analyticsController.getTimeSpentPerProject(req, res));
  router.get('/employees/:employeeId/skill-growth', (req, res) => analyticsController.getSkillGrowthOverTime(req, res));
  router.get('/admin/dashboard-analytics', (req, res) => analyticsController.getAdminDashboardAnalytics(req, res));

  router.get('/config', (req, res) => configController.getAllConfigs(req, res));
  router.get('/config/:key', (req, res) => configController.getConfig(req, res));
  router.put('/config/:key', (req, res) => configController.setConfig(req, res));
  router.delete('/config/:key', (req, res) => configController.deleteConfig(req, res));

  return router;
}



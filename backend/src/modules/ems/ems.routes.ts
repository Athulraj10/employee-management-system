import { Router } from 'express';
import { EmployeeController } from './controllers/EmployeeController';
import { ProjectController } from './controllers/ProjectController';
import { ExperienceController } from './controllers/ExperienceController';
import { TimelineController } from './controllers/TimelineController';
import { AdminController } from './controllers/AdminController';
import { CategoryController } from './controllers/CategoryController';
import { CustomFieldController } from './controllers/CustomFieldController';

export function registerEmsRoutes() {
  const router = Router();
  const employeeController = new EmployeeController();
  const projectController = new ProjectController();
  const experienceController = new ExperienceController();
  const timelineController = new TimelineController();
  const adminController = new AdminController();
  const categoryController = new CategoryController();
  const customFieldController = new CustomFieldController();

  router.post('/employees', (req, res) => employeeController.createEmployee(req, res));
  router.get('/employees', (req, res) => employeeController.getEmployees(req, res));
  router.get('/employees/:id', (req, res) => employeeController.getEmployee(req, res));
  router.put('/employees/:id', (req, res) => employeeController.updateEmployee(req, res));
  router.post('/employees/:id/deactivate', (req, res) => employeeController.deactivateEmployee(req, res));
  router.post('/employees/:id/activate', (req, res) => employeeController.activateEmployee(req, res));

  router.post('/projects', (req, res) => projectController.createProject(req, res));
  router.get('/projects', (req, res) => projectController.getProjects(req, res));
  router.get('/projects/:id', (req, res) => projectController.getProject(req, res));
  router.put('/projects/:id', (req, res) => projectController.updateProject(req, res));
  router.delete('/projects/:id', (req, res) => projectController.deleteProject(req, res));
  router.post('/projects/assign', (req, res) => projectController.assignEmployee(req, res));
  router.put('/projects/assignments/:id', (req, res) => projectController.updateEmployeeAssignment(req, res));
  router.post('/projects/assignments/:id/relocate', (req, res) => projectController.relocateEmployee(req, res));
  router.get('/projects/:projectId/employees', (req, res) => projectController.getProjectEmployees(req, res));

  router.post('/experience', (req, res) => experienceController.createExperience(req, res));
  router.get('/employees/:employeeId/experience', (req, res) => experienceController.getEmployeeExperience(req, res));
  router.put('/experience/:id', (req, res) => experienceController.updateExperience(req, res));
  router.delete('/experience/:id', (req, res) => experienceController.deleteExperience(req, res));

  router.get('/employees/:employeeId/timeline', (req, res) => timelineController.getEmployeeTimeline(req, res));
  router.get('/employees/:employeeId/timeline/grouped', (req, res) => timelineController.getEmployeeTimelineGrouped(req, res));

  router.get('/categories', (req, res) => categoryController.getCategories(req, res));
  router.post('/categories', (req, res) => categoryController.createCategory(req, res));
  router.put('/categories/:id', (req, res) => categoryController.updateCategory(req, res));
  router.delete('/categories/:id', (req, res) => categoryController.deleteCategory(req, res));

  router.post('/employees/:employeeId/custom-fields', (req, res) => customFieldController.addCustomField(req, res));
  router.get('/employees/:employeeId/custom-fields', (req, res) => customFieldController.getCustomFields(req, res));
  router.put('/custom-fields/:id', (req, res) => customFieldController.updateCustomField(req, res));
  router.delete('/custom-fields/:id', (req, res) => customFieldController.deleteCustomField(req, res));

  router.get('/admin/dashboard', (req, res) => adminController.getDashboardStats(req, res));
  router.get('/admin/categories/:categoryId/employees', (req, res) => adminController.getEmployeesByCategory(req, res));
  router.get('/admin/projects/:projectId/employees', (req, res) => adminController.getProjectEmployees(req, res));
  router.get('/admin/audit-logs', (req, res) => adminController.getAuditLogs(req, res));
  router.get('/admin/export/employees', (req, res) => adminController.exportEmployees(req, res));

  return router;
}



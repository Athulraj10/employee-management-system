import { Router } from 'express';
import { AttendanceController } from './controllers/AttendanceController';

export function registerAttendanceRoutes() {
  const router = Router();
  const attendanceController = new AttendanceController();

  router.post('/mark', (req, res) => attendanceController.markAttendance(req, res));
  router.put('/:id', (req, res) => attendanceController.updateAttendance(req, res));
  router.get('/employees/:employeeId', (req, res) => attendanceController.getEmployeeAttendance(req, res));
  router.get('/employees/:employeeId/history', (req, res) => attendanceController.getAttendanceHistory(req, res));
  router.get('/employees/:employeeId/stats', (req, res) => attendanceController.getAttendanceStats(req, res));
  router.get('/all', (req, res) => attendanceController.getAllEmployeesAttendance(req, res));
  router.get('/projects/:projectId', (req, res) => attendanceController.getAttendanceByProject(req, res));

  return router;
}


import { Router } from 'express';
import { TicketController } from './controllers/TicketController';

export function registerTicketRoutes() {
  const router = Router();
  const ticketController = new TicketController();

  router.post('/tickets', (req, res) => ticketController.createTicket(req, res));
  router.get('/tickets', (req, res) => ticketController.getAllTickets(req, res));
  router.get('/tickets/:id', (req, res) => ticketController.getEmployeeTickets(req, res));
  router.put('/tickets/:id', (req, res) => ticketController.updateTicket(req, res));
  router.get('/employees/:employeeId/tickets', (req, res) => ticketController.getEmployeeTickets(req, res));

  return router;
}


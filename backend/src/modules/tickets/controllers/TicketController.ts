import { Request, Response } from 'express';
import { TicketService } from '../services/TicketService';

export class TicketController {
  private ticketService = new TicketService();

  async createTicket(req: Request, res: Response) {
    try {
      const createdBy = req.headers['x-user-id'] as string || 'system';
      const ticket = await this.ticketService.createTicket({
        ...req.body,
        createdBy,
      });
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ticket = await this.ticketService.updateTicket(id, req.body);
      res.json(ticket);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getEmployeeTickets(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const tickets = await this.ticketService.getTicketsByEmployee(employeeId);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllTickets(req: Request, res: Response) {
    try {
      const filters = {
        status: req.query.status as any,
        priority: req.query.priority as any,
        assignedTo: req.query.assignedTo as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };
      const result = await this.ticketService.getAllTickets(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}


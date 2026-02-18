import { AppDataSource } from '../../../infrastructure/database/data-source';
import { Ticket, TicketStatus, TicketPriority } from '../entities/Ticket.entity';

export class TicketService {
  private ticketRepo = AppDataSource.getRepository(Ticket);

  async createTicket(data: {
    employeeId: string;
    title: string;
    description: string;
    priority?: TicketPriority;
    assignedTo?: string;
    createdBy: string;
  }): Promise<Ticket> {
    const ticket = this.ticketRepo.create({
      ...data,
      status: TicketStatus.OPEN,
      priority: data.priority || TicketPriority.MEDIUM,
    });

    return this.ticketRepo.save(ticket);
  }

  async updateTicket(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      status: TicketStatus;
      priority: TicketPriority;
      assignedTo: string;
      resolutionNotes: string;
    }>
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    Object.assign(ticket, data);

    if (data.status === TicketStatus.RESOLVED || data.status === TicketStatus.CLOSED) {
      ticket.resolvedAt = new Date();
    }

    return this.ticketRepo.save(ticket);
  }

  async getTicketsByEmployee(employeeId: string): Promise<Ticket[]> {
    return this.ticketRepo.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllTickets(filters: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: Ticket[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.ticketRepo.createQueryBuilder('ticket');

    if (filters.status) {
      query.andWhere('ticket.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      query.andWhere('ticket.priority = :priority', { priority: filters.priority });
    }

    if (filters.assignedTo) {
      query.andWhere('ticket.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }

    const [tickets, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('ticket.createdAt', 'DESC')
      .getManyAndCount();

    return { tickets, total };
  }
}


import { useState, useEffect } from 'react';
import { ticketApi, emsApi } from '../../services/api';
import '../../styles/shared-animations.css';
import './TicketManagement.css';

export default function TicketManagement() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    title: '',
    description: '',
    priority: 'medium',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadTickets();
    loadEmployees();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketApi.getAllTickets();
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await emsApi.getEmployees();
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await ticketApi.createTicket(formData);
      setFormData({ employeeId: '', title: '', description: '', priority: 'medium' });
      setIsFormOpen(false);
      loadTickets();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create ticket');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await ticketApi.updateTicket(id, { status });
      loadTickets();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#3498db';
      case 'in_progress': return '#f39c12';
      case 'resolved': return '#27ae60';
      case 'closed': return '#95a5a6';
      default: return '#7f8c8d';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#e74c3c';
      case 'high': return '#e67e22';
      case 'medium': return '#f39c12';
      case 'low': return '#3498db';
      default: return '#7f8c8d';
    }
  };

  return (
    <div className="ticket-management">
      <div className="ticket-header">
        <h1>Tickets</h1>
        <button 
          className={`create-ticket-btn toggle-button ${isFormOpen ? 'expanded' : ''}`}
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          {isFormOpen ? '▼ Hide Form' : '+ Create Ticket'}
        </button>
      </div>

      {/* Inline Create Ticket Form */}
      <div className={`form-expandable ${isFormOpen ? 'expanded' : 'collapsed'}`}>
        {formLoading && (
          <div className="dropdown-loader-overlay">
            <div className="loader-compact">
              <div className="loader_cube loader_cube--glowing"></div>
              <div className="loader_cube loader_cube--color"></div>
            </div>
          </div>
        )}
        <div className="inline-form-content">
            <div className="form-header">
              <h2>Create Ticket</h2>
              <button className="close-inline-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTicket} className="ticket-form">
              <div className="form-group">
                <label>Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setIsFormOpen(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
      </div>

      {loading ? (
        <div className="loading">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">No tickets found.</div>
      ) : (
        <div className="tickets-list">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-header-info">
                <h3>{ticket.title}</h3>
                <div className="ticket-badges">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(ticket.status) }}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                  >
                    {ticket.priority}
                  </span>
                </div>
              </div>
              <p className="ticket-description">{ticket.description}</p>
              <div className="ticket-meta">
                <span>Employee: {ticket.employeeId.slice(0, 8)}</span>
                <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="ticket-actions">
                <select
                  value={ticket.status}
                  onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                  className="status-select"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}


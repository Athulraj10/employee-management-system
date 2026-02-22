import { useState, useEffect } from 'react';
import { pmsApi, attendanceApi, ticketApi } from '../../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import './EmployeePerformanceDetailModal.css';

interface EmployeePerformanceDetailModalProps {
  employee: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeePerformanceDetailModal({
  employee,
  isOpen,
  onClose,
}: EmployeePerformanceDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [ticketsHistory, setTicketsHistory] = useState<any[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'tickets'>('overview');

  useEffect(() => {
    if (isOpen && employee) {
      loadEmployeeData();
    }
  }, [isOpen, employee]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPerformanceData(),
        loadAttendanceHistory(),
        loadTicketsHistory(),
        loadPerformanceTrend(),
      ]);
    } catch (error) {
      console.error('Failed to load employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    try {
      const response = await pmsApi.getEmployeePerformanceOverview(employee.id);
      setPerformanceData(response.data);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  };

  const loadAttendanceHistory = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await attendanceApi.getEmployeeAttendance(employee.id, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
      setAttendanceHistory(response.data || []);
    } catch (error) {
      console.error('Failed to load attendance history:', error);
    }
  };

  const loadTicketsHistory = async () => {
    try {
      const response = await ticketApi.getEmployeeTickets(employee.id);
      setTicketsHistory(response.data || []);
    } catch (error) {
      try {
        const altResponse = await ticketApi.getAllTickets();
        const allTickets = altResponse.data?.tickets || altResponse.data || [];
        setTicketsHistory(allTickets.filter((t: any) => t.employeeId === employee.id));
      } catch (err) {
        console.error('Failed to load tickets history:', err);
        setTicketsHistory([]);
      }
    }
  };

  const loadPerformanceTrend = async () => {
    try {
      const response = await pmsApi.getPerformanceTrend(employee.id, 6);
      setPerformanceTrend(response.data || []);
    } catch (error) {
      console.error('Failed to load performance trend:', error);
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    return time.substring(0, 5);
  };

  const getTicketStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'var(--ticket-status-open)',
      in_progress: 'var(--ticket-status-in-progress)',
      resolved: 'var(--ticket-status-resolved)',
      closed: '#95a5a6',
    };
    return colors[status] || '#7f8c8d';
  };

  const getTicketPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'var(--ticket-priority-low)',
      medium: 'var(--ticket-priority-medium)',
      high: 'var(--ticket-priority-high)',
      urgent: 'var(--ticket-priority-urgent)',
    };
    return colors[priority] || 'var(--ticket-priority-medium)';
  };

  const getAttendanceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      attendance: 'var(--attendance-type-attendance)',
      remote: 'var(--attendance-type-remote)',
      leave: 'var(--attendance-type-leave)',
      long_leave: 'var(--attendance-type-long-leave)',
      termination: 'var(--attendance-type-termination)',
    };
    return colors[type] || 'var(--attendance-type-attendance)';
  };

  if (!isOpen) return null;

  return (
    <div className="employee-detail-modal-overlay" onClick={onClose}>
      <div className="employee-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{employee.name}</h2>
            <p className="employee-subtitle">
              {employee.employeeId} • {employee.currentDesignation}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Performance Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance History
          </button>
          <button
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            Tickets History
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading">Loading data...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="overview-tab">
                  {performanceData && (
                    <div className="performance-summary">
                      <div className="summary-card">
                        <h3>Overall Performance Score</h3>
                        <div className="score-display">
                          <span className="score-value text-tertiary">{performanceData.overallScore?.toFixed(1) || '0.0'}</span>
                          <span className="score-max text-tertiary">/ 10</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {performanceTrend.length > 0 && (
                    <div className="chart-section">
                      <h3>Performance Trend (Last 6 Months)</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="score" stroke="#667eea" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {performanceData?.categoryBreakdown && Object.keys(performanceData.categoryBreakdown).length > 0 && (
                    <div className="chart-section">
                      <h3>Category-wise Contribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={Object.entries(performanceData.categoryBreakdown).map(([key, value]) => ({ name: key, value }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#667eea" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="attendance-tab">
                  <h3>Attendance History (Last 30 Days)</h3>
                  <div className="attendance-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Punch In</th>
                          <th>Punch Out</th>
                          <th>Hours</th>
                          <th>Project</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceHistory.length > 0 ? (
                          attendanceHistory.map((record: any) => (
                            <tr key={record.id}>
                              <td>{new Date(record.date).toLocaleDateString()}</td>
                              <td>
                                <span
                                  className="status-badge"
                                  style={{ backgroundColor: getAttendanceTypeColor(record.type) }}
                                >
                                  {record.type}
                                </span>
                              </td>
                              <td>{formatTime(record.checkIn)}</td>
                              <td>{formatTime(record.checkOut)}</td>
                              <td>{record.hoursWorked ? `${record.hoursWorked.toFixed(1)}h` : '--'}</td>
                              <td>{record.project?.name || 'N/A'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="no-data">No attendance records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'tickets' && (
                <div className="tickets-tab">
                  <h3>Tickets History</h3>
                  <div className="tickets-list">
                    {ticketsHistory.length > 0 ? (
                      ticketsHistory.map((ticket: any) => (
                        <div key={ticket.id} className="ticket-card">
                          <div className="ticket-header">
                            <h4>{ticket.title}</h4>
                            <div className="ticket-badges">
                              <span
                                className="status-badge"
                                style={{ backgroundColor: getTicketStatusColor(ticket.status) }}
                              >
                                {ticket.status}
                              </span>
                              <span
                                className="priority-badge"
                                style={{ backgroundColor: getTicketPriorityColor(ticket.priority) }}
                              >
                                {ticket.priority}
                              </span>
                            </div>
                          </div>
                          <p className="ticket-description">{ticket.description}</p>
                          <div className="ticket-footer">
                            <span className="ticket-date">
                              Created: {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                            {ticket.resolvedAt && (
                              <span className="ticket-date">
                                Resolved: {new Date(ticket.resolvedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {ticket.resolutionNotes && (
                            <div className="ticket-resolution">
                              <strong>Resolution:</strong> {ticket.resolutionNotes}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-data">No tickets found for this employee</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


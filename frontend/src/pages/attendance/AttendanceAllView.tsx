import { useState, useEffect } from 'react';
import { attendanceApi, emsApi } from '../../services/api';
import { useAppDispatch, useAttendanceViewState } from '../../store/AppStateContext';
import EditAttendanceModal from '../../components/attendance/EditAttendanceModal';
import { FaCheckCircle, FaTimesCircle, FaArrowLeft, FaEdit, FaHistory, FaClock } from 'react-icons/fa';
import { IoEnter, IoExit } from 'react-icons/io5';
import { MdWarning } from 'react-icons/md';
import './AttendanceAllView.css';

export default function AttendanceAllView() {
  const dispatch = useAppDispatch();
  const { selectedDate } = useAttendanceViewState();

  const [employeesData, setEmployeesData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    projectId: '',
    categoryId: '',
    type: '',
  });
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadProjects();
    loadCategories();
  }, [selectedDate, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await attendanceApi.getAllEmployeesAttendance({
        date: selectedDate,
        ...filters,
      });
      setEmployeesData(response.data || []);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await emsApi.getProjects();
      setProjects(response.data.projects || response.data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await emsApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const isLateCheckIn = (time: string) => {
    const [hours] = time.split(':').map(Number);
    return hours >= 11;
  };

  const handleQuickMark = async (employeeId: string, type: 'checkIn' | 'checkOut') => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    try {
      const employeeData = employeesData.find(ed => ed.employee?.id === employeeId || ed?.employee?.id === employeeId);
      if (!employeeData || !employeeData.employee) {
        console.error('Employee data not found for ID:', employeeId);
        return;
      }
      const existingAttendance = employeeData?.attendance;
      const activeProjects = employeeData?.projects || [];
      const primaryProject = activeProjects.find((p: any) => 
        !p.endDate || new Date(p.endDate) >= new Date()
      );

      const data: any = {
        employeeId,
        date: selectedDate,
        type: existingAttendance?.type || 'attendance',
        markedBy: 'admin',
        projectId: primaryProject?.projectId || primaryProject?.project?.id || null,
      };

      if (type === 'checkIn') {
        data.checkIn = currentTime;
        if (existingAttendance?.checkOut) {
          data.checkOut = existingAttendance.checkOut;
        }
        if (isLateCheckIn(currentTime)) {
          data.isHalfDay = true;
        }
      } else {
        data.checkOut = currentTime;
        if (existingAttendance?.checkIn) {
          data.checkIn = existingAttendance.checkIn;
        } else {
          data.checkIn = '09:00';
        }
      }

      if (existingAttendance) {
        await attendanceApi.updateAttendance(existingAttendance.id, data);
      } else {
        await attendanceApi.markAttendance(data);
      }

      loadData();
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (e) {
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const loadAttendanceHistory = async (employeeId: string) => {
    try {
      const response = await attendanceApi.getEmployeeHistory(employeeId, 15);
      const history = response.data || [];
      setAttendanceHistory(history);
    } catch (error) {
      console.error('Failed to load history:', error);
      setAttendanceHistory([]);
    }
  };

  const openDetailModal = async (employeeData: any) => {
    setSelectedEmployee(employeeData);
    await loadAttendanceHistory(employeeData.employee.id);
    setIsDetailModalOpen(true);
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'Not set';
    return time;
  };

  const formatHoursWorked = (hours: unknown) => {
    if (hours === null || hours === undefined) return null;
    const num =
      typeof hours === 'number'
        ? hours
        : typeof hours === 'string'
        ? parseFloat(hours)
        : NaN;
    if (Number.isNaN(num)) return null;
    return num.toFixed(1);
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

  const groupedHistory = attendanceHistory.reduce((acc: any, record: any) => {
    const date = new Date(record.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {});

  return (
    <div className="attendance-all-view">
      <div className="attendance-header">
        <div>
          <h1>Attendance Management - All Employees</h1>
          <button className="back-btn" onClick={() => window.history.back()}>
            <FaArrowLeft /> Back
          </button>
        </div>
        <div className="header-controls">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => dispatch({ type: 'attendance/setDate', payload: e.target.value })}
            className="date-input"
          />
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Project</label>
          <select
            value={filters.projectId}
            onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
            className="filter-select"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Category</label>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="attendance">Attendance</option>
            <option value="remote">Remote</option>
            <option value="leave">Leave</option>
            <option value="long_leave">Long Leave</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading attendance data...</div>
      ) : (
        <div className="employees-attendance-grid">
          {employeesData.map((employeeData) => {
            const { employee, attendance, projects: empProjects } = employeeData;
            const activeProjects = empProjects.filter((p: any) => 
              !p.endDate || new Date(p.endDate) >= new Date()
            );

            return (
              <div key={employee?.id || employeeData?.employee?.id} className="employee-attendance-card">
                <div className="card-header">
                  <div className="employee-info">
                    <h3>{employee?.name || employeeData?.employee?.name || 'Unknown'}</h3>
                    <p className="employee-id">{employee?.employeeId || employeeData?.employee?.employeeId || 'N/A'}</p>
                    <p className="designation">{employee?.currentDesignation || employeeData?.employee?.currentDesignation || 'N/A'}</p>
                  </div>
                  <div className="attendance-indicators">
                    <div className={`status-icon checkin-indicator ${attendance?.checkIn ? 'active' : 'inactive'}`} title={attendance?.checkIn ? `Checked in at ${attendance.checkIn}` : 'Not checked in'}>
                      {attendance?.checkIn ? <FaCheckCircle /> : <FaTimesCircle />}
                    </div>
                    <div className={`status-icon checkout-indicator ${attendance?.checkOut ? 'active' : 'inactive'}`} title={attendance?.checkOut ? `Checked out at ${attendance.checkOut}` : 'Not checked out'}>
                      {attendance?.checkOut ? <FaCheckCircle /> : <FaTimesCircle />}
                    </div>
                  </div>
                </div>

                {activeProjects.length > 0 && (
                  <div className="projects-list">
                    <span className="projects-label">Projects:</span>
                    {activeProjects.map((p: any) => (
                      <span key={p.id} className="project-tag">
                        {p.project.name} ({p.category.name})
                      </span>
                    ))}
                  </div>
                )}

                <div className="attendance-status">
                  {attendance ? (
                    <div className="status-details">
                      <div className="time-info-row">
                        <div className="time-entry">
                          <span className="time-label">In:</span>
                          <span className={`time-value ${attendance.checkIn ? 'marked' : ''}`}>
                            {formatTime(attendance.checkIn)}
                          </span>
                        </div>
                        <div className="time-entry">
                          <span className="time-label">Out:</span>
                          <span className={`time-value ${attendance.checkOut ? 'marked' : ''}`}>
                            {formatTime(attendance.checkOut)}
                          </span>
                        </div>
                      </div>
                      <div className="status-row">
                        <div className="status-badge" style={{ backgroundColor: getAttendanceTypeColor(attendance.type) }}>
                          {attendance.type}
                        </div>
                        {attendance.isHalfDay && (
                          <span className="half-day-badge warning">
                            <MdWarning /> Half Day
                          </span>
                        )}
                        {formatHoursWorked(attendance.hoursWorked) && (
                          <div className="hours-worked">
                            {formatHoursWorked(attendance.hoursWorked)}h
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="no-attendance">Not marked</div>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    className="icon-only-btn checkin-btn"
                    onClick={() => handleQuickMark(employee?.id || employeeData?.employee?.id, 'checkIn')}
                    disabled={loading || !!attendance?.checkIn}
                    title={attendance?.checkIn ? "Check-in already marked for today. Available tomorrow." : "Mark check-in"}
                  >
                    <IoEnter />
                  </button>
                  <button
                    className="icon-only-btn checkout-btn"
                    onClick={() => handleQuickMark(employee?.id || employeeData?.employee?.id, 'checkOut')}
                    disabled={loading || !!attendance?.checkOut}
                    title={attendance?.checkOut ? "Check-out already marked for today. Available tomorrow." : "Mark check-out"}
                  >
                    <IoExit />
                  </button>
                  <button
                    className="icon-only-btn edit-btn"
                    onClick={() => {
                      setSelectedEmployee(employeeData);
                      setIsEditModalOpen(true);
                    }}
                    title="Edit attendance"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="icon-only-btn history-btn"
                    onClick={() => openDetailModal(employeeData)}
                    title="View history"
                  >
                    <FaHistory />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isDetailModalOpen && selectedEmployee && (
        <div className="detail-modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEmployee.employee.name} - Attendance Details</h2>
              <button className="close-btn" onClick={() => setIsDetailModalOpen(false)}>×</button>
            </div>

            <div className="modal-content">
              <div className="current-attendance-section">
                <h3>Today's Attendance</h3>
                {selectedEmployee.attendance ? (
                  <div className="attendance-detail-card">
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{selectedEmployee.attendance.type}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Check-In:</span>
                      <span className="detail-value">{formatTime(selectedEmployee.attendance.checkIn)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Check-Out:</span>
                      <span className="detail-value">{formatTime(selectedEmployee.attendance.checkOut)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Hours Worked:</span>
                      <span className="detail-value">{selectedEmployee.attendance.hoursWorked || 0}h</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Half Day:</span>
                      <span className="detail-value">{selectedEmployee.attendance.isHalfDay ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">
                        {new Date(selectedEmployee.attendance.updatedAt).toLocaleString()}
                        <span className="update-indicator"> (No need to recheck)</span>
                      </span>
                    </div>
                    {selectedEmployee.attendance.notes && (
                      <div className="detail-row">
                        <span className="detail-label">Notes:</span>
                        <span className="detail-value">{selectedEmployee.attendance.notes}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No attendance marked for today</p>
                )}
              </div>

              <div className="history-section">
                <h3>Last 15 Days History (Grouped by Date & Project)</h3>
                <div className="history-grouped">
                  {Object.entries(groupedHistory).map(([date, records]: [string, any]) => {
                    const projectGroups = records.reduce((acc: any, record: any) => {
                      const projectKey = record.project?.name || 'No Project';
                      if (!acc[projectKey]) {
                        acc[projectKey] = [];
                      }
                      acc[projectKey].push(record);
                      return acc;
                    }, {});

                    return (
                      <div key={date} className="history-date-group">
                        <h4 className="history-date">{date}</h4>
                        {Object.entries(projectGroups).map(([projectName, projectRecords]: [string, any]) => (
                          <div key={projectName} className="project-group">
                            <h5 className="project-group-title">📁 {projectName}</h5>
                            {projectRecords.map((record: any) => (
                              <div key={record.id} className="history-record">
                                <div className="history-type" style={{ backgroundColor: getAttendanceTypeColor(record.type) }}>
                                  {record.type}
                                </div>
                                <div className="history-details">
                                  <span>In: {formatTime(record.checkIn)}</span>
                                  <span>Out: {formatTime(record.checkOut)}</span>
                                  {record.hoursWorked && <span>{record.hoursWorked.toFixed(1)}h</span>}
                                  {record.isHalfDay && <span className="half-day">Half Day</span>}
                                </div>
                                <div className="history-updated">
                                  <span>Last Updated: {new Date(record.updatedAt).toLocaleString()}</span>
                                  <span className="update-indicator">✓ Verified</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {attendanceHistory.length === 0 && (
                    <p className="no-history">No attendance history found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedEmployee && (
        <EditAttendanceModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            loadData();
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
          }}
          employeeData={selectedEmployee}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}


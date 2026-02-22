import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceApi, emsApi } from '../../services/api';
import { FaCheckCircle, FaTimesCircle, FaFolder, FaArrowLeft, FaEye, FaClock } from 'react-icons/fa';
import { IoEnter, IoExit } from 'react-icons/io5';
import { MdWarning } from 'react-icons/md';
import './AttendanceManagement.css';
import { useAppDispatch, useAttendanceViewState } from '../../store/AppStateContext';

export default function AttendanceManagement() {
  const dispatch = useAppDispatch();
  const { selectedDate } = useAttendanceViewState();

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState<Record<string, boolean>>({});
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'projects' | 'employees'>('projects');
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    checkedOut: 0,
    notMarked: 0,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadEmployeesForProject(selectedProject);
    } else {
      setEmployees([]);
      setAttendanceData({});
    }
  }, [selectedProject, selectedDate]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await emsApi.getProjects();
      const projectsList = response.data.projects || response.data || [];
      
      const projectsWithCounts = await Promise.all(
        projectsList.map(async (project: any) => {
          try {
            const employeesResponse = await emsApi.getEmployees({ includeProjects: true });
            const allEmployees = employeesResponse.data?.employees || employeesResponse.data || [];
            const count = allEmployees.filter((emp: any) =>
              emp.projects?.some((p: any) => 
                (p.projectId === project.id || p.project?.id === project.id) &&
                (!p.endDate || new Date(p.endDate) >= new Date())
              )
            ).length;
            return { ...project, employeeCount: count };
          } catch (error) {
            return { ...project, employeeCount: 0 };
          }
        })
      );
      
      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeesForProject = async (projectId: string) => {
    try {
      setLoading(true);
      const response = await emsApi.getEmployees({ includeProjects: true });
      let employeesList = response.data?.employees || response.data || [];
      
      employeesList = employeesList.filter((emp: any) =>
        emp.projects?.some((p: any) => 
          (p.projectId === projectId || p.project?.id === projectId) &&
          (!p.endDate || new Date(p.endDate) >= new Date())
        )
      );
      
      setEmployees(employeesList);
      await loadAttendanceForAll(employeesList);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForAll = async (employeesList: any[]) => {
    const attendanceMap: Record<string, any> = {};
    
    await Promise.all(
      employeesList.map(async (employee) => {
        try {
          const response = await attendanceApi.getEmployeeAttendance(employee.id, {
            startDate: selectedDate,
            endDate: selectedDate,
          });
          if (response.data && response.data.length > 0) {
            attendanceMap[employee.id] = response.data[0];
          }
        } catch (error) {
        }
      })
    );
    
    setAttendanceData(attendanceMap);
    
    const total = employeesList.length;
    const checkedIn = Object.values(attendanceMap).filter((a: any) => a.checkIn).length;
    const checkedOut = Object.values(attendanceMap).filter((a: any) => a.checkOut).length;
    const notMarked = total - checkedIn;
    
    setStats({ total, checkedIn, checkedOut, notMarked });
  };

  const playSuccessSound = () => {
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
    } catch (error) {
    }
  };

  const isLateCheckIn = (time: string) => {
    const [hours] = time.split(':').map(Number);
    return hours >= 11;
  };

  const handleQuickMark = async (employeeId: string, type: 'checkIn' | 'checkOut') => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setLoading(true);
    setMessage('');
    setIsAnimating((prev) => ({ ...prev, [employeeId]: true }));

    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      const existingAttendance = attendanceData[employeeId];

      const data: any = {
        employeeId,
        date: selectedDate,
        type: existingAttendance?.type || 'attendance',
        markedBy: 'admin',
        projectId: selectedProject,
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

      playSuccessSound();
      const lateWarning = type === 'checkIn' && isLateCheckIn(currentTime) ? ' (⚠️ Half Day)' : '';
      setMessage(`✓ ${type === 'checkIn' ? 'Check-in' : 'Check-out'} marked for ${employee.name} at ${currentTime}${lateWarning}!`);
      
      const response = await attendanceApi.getEmployeeAttendance(employeeId, {
        startDate: selectedDate,
        endDate: selectedDate,
      });
      if (response.data && response.data.length > 0) {
        setAttendanceData((prev) => ({ ...prev, [employeeId]: response.data[0] }));
      } else {
        setAttendanceData((prev) => {
          const newData = { ...prev };
          delete newData[employeeId];
          return newData;
        });
      }

      setTimeout(() => {
        setIsAnimating((prev) => {
          const newState = { ...prev };
          delete newState[employeeId];
          return newState;
        });
        setMessage('');
      }, 2000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || `Failed to mark ${type}`);
      setIsAnimating((prev) => {
        const newState = { ...prev };
        delete newState[employeeId];
        return newState;
      });
    } finally {
      setLoading(false);
    }
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

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId);
    setViewMode('employees');
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setViewMode('projects');
    setEmployees([]);
    setAttendanceData({});
  };

  return (
    <div className="attendance-management">
      <div className="attendance-page-header">
        <div>
          <h1>Attendance Management</h1>
          {selectedProject && (
            <button className="back-btn" onClick={handleBackToProjects}>
              <FaArrowLeft /> Back to Projects
            </button>
          )}
        </div>
        <Link to="/attendance/all" className="view-all-btn">
          <FaEye /> View All Employees
        </Link>
      </div>

      <div className="attendance-filters">
        <div className="filter-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => dispatch({ type: 'attendance/setDate', payload: e.target.value })}
            className="date-input"
          />
        </div>
        
        {viewMode === 'employees' && stats.total > 0 && (
          <div className="stats-summary">
            <div className="stat-box total">
              <span className="stat-label">Total</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-box checked-in">
              <span className="stat-label">Checked In</span>
              <span className="stat-value">{stats.checkedIn}</span>
            </div>
            <div className="stat-box checked-out">
              <span className="stat-label">Checked Out</span>
              <span className="stat-value">{stats.checkedOut}</span>
            </div>
            <div className="stat-box not-marked">
              <span className="stat-label">Not Marked</span>
              <span className="stat-value">{stats.notMarked}</span>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className={`message ${message.includes('✓') ? 'success' : 'error'} pulse`}>
          {message}
        </div>
      )}

      {viewMode === 'projects' ? (
        <div className="projects-view">
          <h2 className="text-tertiary">Select a Project</h2>
          {loading ? (
            <div className="loading">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <p className="text-tertiary">No projects found.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => {
                const employeeCount = project.employeeCount || 0;
                return (
                  <div
                    key={project.id}
                    className="project-card"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="project-icon text-tertiary"><FaFolder /></div>
                    <h3 className="text-tertiary">{project.name}</h3>
                    <p className="project-description text-tertiary">{project.description || 'No description'}</p>
                    <div className="project-footer">
                      <span className="employee-count text-tertiary">{employeeCount} Employees</span>
                      <span className="click-hint text-tertiary">Click to view</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="employees-view">
          {loading && employees.length === 0 ? (
            <div className="loading">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="empty-state">
              <p>No employees found in this project.</p>
            </div>
          ) : (
            <div className="employees-attendance-grid">
              {employees.map((employee) => {
                const attendance = attendanceData[employee.id];
                const activeProjects = employee.projects?.filter((p: any) => 
                  !p.endDate || new Date(p.endDate) >= new Date()
                ) || [];
                const isAnimatingEmployee = isAnimating[employee.id];

                return (
                  <div 
                    key={employee.id} 
                    className={`employee-attendance-card ${isAnimatingEmployee ? 'animating' : ''}`}
                  >
                    <div className="card-header">
                      <div className="employee-info">
                        <h3>{employee.name}</h3>
                        <p className="employee-id">{employee.employeeId}</p>
                        <p className="designation">{employee.currentDesignation}</p>
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
                            {p.project?.name || 'Project'} ({p.category?.name || 'Category'})
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
                        className={`quick-mark-btn checkin ${isAnimatingEmployee ? 'animating' : ''}`}
                        onClick={() => handleQuickMark(employee.id, 'checkIn')}
                        disabled={loading || !!attendance?.checkIn}
                        title={attendance?.checkIn ? 'Check-in already marked for today. Available tomorrow.' : 'Mark check-in with current time'}
                      >
                        <IoEnter className="btn-icon" />
                        <span className="text-tertiary">Check-In</span>
                      </button>
                      <button
                        className={`quick-mark-btn checkout ${isAnimatingEmployee ? 'animating' : ''}`}
                        onClick={() => handleQuickMark(employee.id, 'checkOut')}
                        disabled={loading || !!attendance?.checkOut}
                        title={attendance?.checkOut ? "Check-out already marked for today. Available tomorrow." : "Mark check-out with current time"}
                      >
                        <IoExit className="btn-icon" />
                        <span className="text-tertiary">Check-Out</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

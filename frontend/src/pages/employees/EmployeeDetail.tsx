import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { emsApi, pmsApi } from '../../services/api';
import EditEmployeeModal from '../../components/employees/EditEmployeeModal';
import CustomFieldsManager from '../../components/projects/CustomFieldsManager';
import './EmployeeDetail.css';

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'timeline' | 'performance'>('profile');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadEmployeeData();
    }
  }, [id]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const [employeeRes, timelineRes, performanceRes] = await Promise.all([
        emsApi.getEmployee(id!),
        emsApi.getEmployeeTimelineGrouped(id!),
        pmsApi.getEmployeePerformanceOverview(id!),
      ]);
      setEmployee(employeeRes.data);
      setTimeline(timelineRes.data);
      setPerformance(performanceRes.data);
    } catch (error) {
      console.error('Failed to load employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading employee details...</div>;
  }

  if (!employee) {
    return <div className="error">Employee not found</div>;
  }

  return (
    <div className="employee-detail">
      <div className="employee-header">
        <div>
          <h1>{employee.name}</h1>
          <p className="employee-id">{employee.employeeId}</p>
          <p className="designation">{employee.currentDesignation}</p>
        </div>
        <div className="header-actions">
          <span className={`status ${employee.status.toLowerCase()}`}>{employee.status}</span>
          <button className="edit-button" onClick={() => setIsEditModalOpen(true)}>
            Edit Employee
          </button>
        </div>
      </div>

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          loadEmployeeData();
          setIsEditModalOpen(false);
        }}
        employee={employee}
      />

      <div className="tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'timeline' ? 'active' : ''}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
        <button
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
      </div>

      <CustomFieldsManager employeeId={id!} />

      <div className="tab-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="info-grid">
              <div className="info-item">
                <label>Email</label>
                <p>{employee.email}</p>
              </div>
              <div className="info-item">
                <label>Date of Joining</label>
                <p>{new Date(employee.dateOfJoining).toLocaleDateString()}</p>
              </div>
              <div className="info-item">
                <label>Total Experience</label>
                <p>{employee.totalExperienceYears ? Number(employee.totalExperienceYears).toFixed(1) : 0} years</p>
              </div>
              <div className="info-item">
                <label>Categories</label>
                <p>{employee.categories?.map((c: any) => c.name).join(', ') || 'None'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && timeline && (
          <div className="timeline-section">
            <div className="category-breakdown">
              <h3>Category Breakdown</h3>
              {Object.entries(timeline.categoryBreakdown || {}).map(([cat, data]: [string, any]) => (
                <div key={cat} className="category-item">
                  <span>{cat}</span>
                  <span>{data.years}y {data.months}m | {data.projects} projects</span>
                </div>
              ))}
            </div>
            <div className="timeline-events">
              <h3>Timeline</h3>
              {timeline.timeline?.map((event: any, idx: number) => (
                <div key={idx} className="timeline-event">
                  <div className="event-date">{new Date(event.date).toLocaleDateString()}</div>
                  <div className="event-content">
                    <h4>{event.title}</h4>
                    <p>{event.description}</p>
                    {event.technologies && event.technologies.length > 0 && (
                      <div className="technologies">
                        {event.technologies.map((tech: string, i: number) => (
                          <span key={i} className="tech-tag">{tech}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'performance' && performance && (
          <div className="performance-section">
            <div className="performance-overview">
              <h3 className="text-tertiary">Overall Performance Score</h3>
              <p className="score-value text-tertiary">{performance.overallScore?.toFixed(1) || 'N/A'}</p>
            </div>
            <div className="performance-metrics">
              <div className="metric-card">
                <h4>Category Contribution</h4>
                {Object.entries(performance.categoryBreakdown || {}).map(([cat, score]: [string, any]) => (
                  <div key={cat} className="metric-item">
                    <span className="text-tertiary">{cat}</span>
                    <span>{typeof score === 'number' ? score.toFixed(1) : score}</span>
                  </div>
                ))}
              </div>
              <div className="metric-card">
                <h4>Time Spent per Project</h4>
                {performance.projectTime?.map((item: any) => (
                  <div key={item.projectId} className="metric-item">
                    <span>Project {item.projectId.slice(0, 8)}</span>
                    <span>{item.days} days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


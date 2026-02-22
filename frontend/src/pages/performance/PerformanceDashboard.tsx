import { useEffect, useState } from 'react';
import { pmsApi, emsApi, attendanceApi, ticketApi } from '../../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import '../../styles/shared-animations.css';
import './PerformanceDashboard.css';

export default function PerformanceDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [employeeDetailData, setEmployeeDetailData] = useState<Record<string, any>>({});
  const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState<Record<string, boolean>>({});
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [projectWiseData, setProjectWiseData] = useState<Record<string, any[]>>({});
  const [sprintFormat, setSprintFormat] = useState<boolean>(false);
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'overall' | 'well'>('all');
  const [yearlyData, setYearlyData] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, [performanceFilter]);

  useEffect(() => {
    if (selectedProject) {
      loadEmployeesForProject(selectedProject);
    } else {
      setEmployees([]);
    }
  }, [selectedProject, performanceFilter]);

  useEffect(() => {
    if (performanceFilter === 'overall' || performanceFilter === 'well') {
      loadYearlyPerformance();
    } else {
      setYearlyData([]);
    }
  }, [performanceFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProjects(),
        loadTopPerformers(),
        loadTimeBasedData(),
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadYearlyPerformance = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const lastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
      
      const employeesResponse = await emsApi.getEmployees({ includeProjects: true });
      const allEmployees = employeesResponse.data?.employees || employeesResponse.data || [];
      
      const yearlyPerformance = await Promise.all(
        allEmployees.map(async (employee: any) => {
          try {
            const summariesResponse = await pmsApi.getEmployeeSummaries(employee.id, {
              startDate: lastYear.toISOString().split('T')[0],
              endDate: endOfLastYear.toISOString().split('T')[0],
            });
            
            const summaries = summariesResponse.data || [];
            if (summaries.length === 0) return null;
            
            const scores = summaries
              .map((s: any) => parseFloat(s.overallPerformanceScore?.toString() || '0'))
              .filter((score: number) => score > 0);
            
            if (scores.length === 0) return null;
            
            const avgScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
            
            if (performanceFilter === 'well' && avgScore < 6) {
              return null;
            }
            
            return {
              ...employee,
              avgYearlyScore: avgScore,
              monthlyScores: summaries.map((s: any) => ({
                date: s.summaryDate,
                score: parseFloat(s.overallPerformanceScore?.toString() || '0'),
                trendData: s.performanceTrendData,
              })),
            };
          } catch (error) {
            return null;
          }
        })
      );
      
      setYearlyData(yearlyPerformance.filter((e: any) => e !== null));
    } catch (error) {
      console.error('Failed to load yearly performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await emsApi.getProjects();
      const projectsList = response.data.projects || response.data || [];
      
      const projectsWithStats = await Promise.all(
        projectsList.map(async (project: any) => {
          try {
            const employeesResponse = await emsApi.getEmployees({ includeProjects: true });
            const allEmployees = employeesResponse.data?.employees || employeesResponse.data || [];
            const projectEmployees = allEmployees.filter((emp: any) =>
              emp.projects?.some((p: any) => 
                (p.projectId === project.id || p.project?.id === project.id) &&
                (!p.endDate || new Date(p.endDate) >= new Date())
              )
            );

            let avgScore = 0;
            if (projectEmployees.length > 0) {
              const scores = await Promise.all(
                projectEmployees.map(async (emp: any) => {
                  try {
                    const summariesResponse = await pmsApi.getEmployeeSummaries(emp.id);
                    const summaries = summariesResponse.data || [];
                    if (summaries.length > 0) {
                      return parseFloat(summaries[0].overallPerformanceScore?.toString() || '0');
                    }
                    return 0;
                  } catch {
                    return 0;
                  }
                })
              );
              avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            }

            return {
              ...project,
              employeeCount: projectEmployees.length,
              avgPerformance: avgScore,
            };
          } catch (error) {
            return { ...project, employeeCount: 0, avgPerformance: 0 };
          }
        })
      );
      
      setProjects(projectsWithStats);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadTopPerformers = async () => {
    try {
      const response = await pmsApi.getAdminDashboardAnalytics();
      const topPerformersList = response.data?.topPerformers || [];
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const employeesResponse = await emsApi.getEmployees({ includeProjects: true });
      const allEmployees = employeesResponse.data?.employees || employeesResponse.data || [];
      
      const performersWithDetails = await Promise.all(
        topPerformersList.slice(0, 10).map(async (performer: any) => {
          const employee = allEmployees.find((e: any) => e.name === performer.name);
          if (employee) {
            try {
              const summariesResponse = await pmsApi.getEmployeeSummaries(employee.id);
              const summaries = summariesResponse.data || [];
              const currentMonthSummary = summaries.find((s: any) => {
                const summaryDate = new Date(s.summaryDate);
                return summaryDate.getMonth() === currentMonth && summaryDate.getFullYear() === currentYear;
              });
              
              return {
                ...performer,
                employeeId: employee.id,
                score: currentMonthSummary?.overallPerformanceScore 
                  ? parseFloat(currentMonthSummary.overallPerformanceScore.toString())
                  : performer.score,
              };
            } catch {
              return performer;
            }
          }
          return performer;
        })
      );
      
      setTopPerformers(performersWithDetails);
    } catch (error) {
      console.error('Failed to load top performers:', error);
    }
  };

  const loadTimeBasedData = async () => {
    try {
      const employeesResponse = await emsApi.getEmployees({ includeProjects: true });
      const allEmployees = employeesResponse.data?.employees || employeesResponse.data || [];
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const projectWiseAttendance: Record<string, any[]> = {};
      
      await Promise.all(
        allEmployees.map(async (employee: any) => {
          const activeProjects = employee.projects?.filter((p: any) => 
            !p.endDate || new Date(p.endDate) >= new Date()
          ) || [];
          
          for (const project of activeProjects) {
            const projectId = project.projectId || project.project?.id;
            if (!projectId) continue;
            
            if (!projectWiseAttendance[projectId]) {
              projectWiseAttendance[projectId] = [];
            }
            
            try {
              const attendanceResponse = await attendanceApi.getEmployeeAttendance(employee.id, {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
              });
              
              const attendanceRecords = attendanceResponse.data || [];
              attendanceRecords.forEach((record: any) => {
                if (record.projectId === projectId || record.project?.id === projectId) {
                  projectWiseAttendance[projectId].push({
                    date: record.date,
                    hours: record.hoursWorked || 0,
                    employee: employee.name,
                  });
                }
              });
            } catch (error) {
            }
          }
        })
      );
      
      const aggregatedData: Record<string, any[]> = {};
      Object.keys(projectWiseAttendance).forEach(projectId => {
        const project = projects.find(p => p.id === projectId);
        const projectName = project?.name || 'Unknown';
        
        const dailyTotals: Record<string, number> = {};
        projectWiseAttendance[projectId].forEach((record: any) => {
          const dateKey = new Date(record.date).toISOString().split('T')[0];
          dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + record.hours;
        });
        
        aggregatedData[projectName] = Object.entries(dailyTotals).map(([date, hours]) => ({
          date,
          hours: Number(hours),
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });
      
      setProjectWiseData(aggregatedData);
    } catch (error) {
      console.error('Failed to load time-based data:', error);
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

      const employeesWithPerformance = await Promise.all(
        employeesList.map(async (employee: any) => {
          try {
            let score = 0;
            try {
              const summariesResponse = await pmsApi.getEmployeeSummaries(employee.id);
              const summaries = summariesResponse.data || [];
              if (summaries.length > 0) {
                const latest = summaries[0];
                score = latest.overallPerformanceScore
                  ? parseFloat(latest.overallPerformanceScore.toString())
                  : 0;
              } else {
                const snapshotsResponse = await pmsApi.getEmployeeSnapshots(employee.id);
                const snapshots = snapshotsResponse.data || [];
                if (snapshots.length > 0) {
                  const latest = snapshots[0];
                  score = latest.overallPerformanceRating
                    ? parseFloat(latest.overallPerformanceRating.toString())
                    : 0;
                }
              }
            } catch (err) {
              score = 0;
            }

            return {
              ...employee,
              performanceScore: score,
            };
          } catch (error) {
            return {
              ...employee,
              performanceScore: 0,
            };
          }
        })
      );

      setEmployees(employeesWithPerformance);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = async (projectId: string) => {
    if (selectedProject === projectId) {
      setSelectedProject(null);
      setEmployees([]);
    } else {
      setSelectedProject(projectId);
      await loadEmployeesForProject(projectId);
    }
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setEmployees([]);
  };

  const getPerformanceColor = (score: number): string => {  
    if (score >= 8) return 'var(--performance-excellent)';
    if (score >= 7) return 'var(--performance-good)';
    if (score >= 6) return 'var(--performance-average)';
    if (score >= 5) return 'var(--performance-below)';
    return 'var(--performance-poor)';
  };

  const getPerformanceLabel = (score: number): string => {
    if (score >= 7) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 5) return 'Average';
    if (score >= 4) return 'Below Average';
    return 'Poor';
  };

  const toggleEmployeeDetail = async (employee: any) => {
    if (expandedEmployeeId === employee.id) {
      setExpandedEmployeeId(null);
      setLoadingEmployeeDetails({ ...loadingEmployeeDetails, [employee.id]: false });
    } else {
      setExpandedEmployeeId(employee.id);
      if (!employeeDetailData[employee.id]) {
        setLoadingEmployeeDetails({ ...loadingEmployeeDetails, [employee.id]: true });
        await loadEmployeeDetailData(employee);
        setLoadingEmployeeDetails({ ...loadingEmployeeDetails, [employee.id]: false });
      }
    }
  };

  const loadEmployeeDetailData = async (employee: any) => {
    try {
      const [performanceResponse, attendanceResponse, ticketsResponse, trendResponse] = await Promise.all([
        pmsApi.getEmployeePerformanceOverview(employee.id).catch(() => ({ data: null })),
        attendanceApi.getEmployeeAttendance(employee.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        }).catch(() => ({ data: [] })),
        ticketApi.getEmployeeTickets(employee.id).catch(() => ({ data: [] })),
        pmsApi.getPerformanceTrend(employee.id, 6).catch(() => ({ data: [] })),
      ]);

      setEmployeeDetailData({
        ...employeeDetailData,
        [employee.id]: {
          performance: performanceResponse.data,
          attendance: attendanceResponse.data || [],
          tickets: ticketsResponse.data || [],
          trend: trendResponse.data || [],
        },
      });
    } catch (error) {
      console.error('Failed to load employee detail data:', error);
    }
  };

  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <h1>Performance Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Sprint Format:
            </label>
            <button
              onClick={() => setSprintFormat(!sprintFormat)}
              style={{
                padding: '0.5rem 1rem',
                background: sprintFormat ? 'var(--primary-color)' : 'var(--bg-secondary)',
                color: sprintFormat ? 'var(--text-white)' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              {sprintFormat ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              View:
            </label>
            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value as 'all' | 'overall' | 'well')}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              <option value="all">All Performance</option>
              <option value="overall">Overall (Last Year)</option>
              <option value="well">Well Performance (Last Year, ≥6)</option>
            </select>
          </div>

          {selectedProject && (
            <button className="back-btn" onClick={handleBackToProjects}>
              ← Back to Projects
            </button>
          )}
        </div>
      </div>

      {(performanceFilter === 'overall' || performanceFilter === 'well') && (
        <div className="charts-section">
          <div className="chart-card">
            <h2>
              {performanceFilter === 'overall' ? 'Overall Performance - Last Year' : 'Well Performance - Last Year (Score ≥ 6)'} {/* TODO: Translate */}
             
            </h2>
            {loading ? (
              <div className="loading-container">
                <div className="loader-compact">
                  <div className="loader_cube loader_cube--glowing"></div>
                  <div className="loader_cube loader_cube--color"></div>
                </div>
              </div>
            ) : yearlyData.length > 0 ? (
              <div className="yearly-performance-grid">
                {yearlyData.map((employee: any, index: number) => (
                      <div
                        key={employee.id}
                    className="yearly-performance-card"
                        style={{
                      borderLeftColor: getPerformanceColor(employee.avgYearlyScore),
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    <div className="yearly-card-header">
                      <h3>{employee.name}</h3>
                      <span className="yearly-performance-badge" style={{ backgroundColor: getPerformanceColor(employee.avgYearlyScore) }}>
                            {getPerformanceLabel(employee.avgYearlyScore)}
                          </span>
                        </div>
                    <p className="yearly-employee-info">
                      {employee.employeeId} - {employee.currentDesignation}
                    </p>
                    <div className="yearly-score-display">
                      <span className="yearly-score-value">{employee.avgYearlyScore.toFixed(1)}</span>
                      <span className="yearly-score-label">/10</span>
                    </div>
                    <div className="yearly-data-count">
                          {employee.monthlyScores.length} months of data
                        </div>
                      </div>
                    ))}
                  </div>
            ) : (
              <div className="empty-state">No yearly performance data available.</div>
            )}
          </div>
        </div>
      )}

      {performanceFilter === 'all' ? (
        <>
          {topPerformers.length > 0 && (
            <div className="charts-section">
              <div className="chart-card">
                <h2>Top Performers - This Month</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topPerformers.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip
                      formatter={(value: any) => [`${value.toFixed(1)}/10`, 'Score']}
                    />
                    <Legend />
                    <Bar dataKey="score" fill="var(--chart-color-1)">
                      {topPerformers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {Object.keys(projectWiseData).length > 0 && (
            <div className="charts-section">
              <div className="chart-card">
                <h2>Time Spent by Project (Last 30 Days)</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {Object.entries(projectWiseData).map(([projectName, data], index) => {
                      const colors = ['var(--chart-color-1)', 'var(--chart-color-2)', 'var(--chart-color-3)', 'var(--chart-color-4)', 'var(--chart-color-5)', 'var(--chart-color-6)'];
                      return (
                        <Line
                          key={projectName}
                          type="monotone"
                          dataKey="hours"
                          data={data}
                          name={projectName}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!sprintFormat && (
            <div className="projects-tab-view">
              <h1>Projects</h1>
              {loading ? (
                <div className="loading">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="empty-state">No projects found.</div>
              ) : (
                <>
                  <div className="projects-tabs-container">
                    <div className="projects-tabs-scroll">
                      {projects.map((project) => {
                        const avgScore = project.avgPerformance || 0;
                        const color = getPerformanceColor(avgScore);
                        const isSelected = selectedProject === project.id;
                        
                        return (
                          <div
                            key={project.id}
                            className={`project-tab ${isSelected ? 'active' : ''}`}
                            onClick={() => handleProjectClick(project.id)}
                            style={{ borderBottomColor: isSelected ? color : 'transparent' }}
                          >
                            <div className="project-tab-name">{project.name}</div>
                            <div className="project-tab-badge" style={{ backgroundColor: color }}>
                              {avgScore.toFixed(1)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedProject && (() => {
                    const project = projects.find(p => p.id === selectedProject);
                    if (!project) return null;
                    
                    const avgScore = project.avgPerformance || 0;
                    const color = getPerformanceColor(avgScore);
                    
                    return (
                      <div className="project-details-container" key={selectedProject}>
                        <div className="project-details-card">
                          <div className="project-details-header">
                            <div className="project-details-info">
                              <h2>{project.name}</h2>
                              <p className="project-details-description">
                                {project.description || 'No description available'}
                              </p>
                            </div>
                            <div className="project-details-stats">
                              <div className="stat-box">
                                <span className="stat-label">Employees</span>
                                <span className="stat-value">{project.employeeCount || 0}</span>
                              </div>
                              <div className="stat-box">
                                <span className="stat-label">Avg Performance</span>
                                <span className="stat-value" style={{ color }}>{avgScore.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="project-employees-section">
                            <h3>Team Members</h3>
                            {loading ? (
                              <div className="loading-container">
                                <div className="loader-compact">
                                  <div className="loader_cube loader_cube--glowing"></div>
                                  <div className="loader_cube loader_cube--color"></div>
                                </div>
                              </div>
                            ) : employees.length === 0 ? (
                              <div className="empty-state">
                                <p>No employees found in this project.</p>
                              </div>
                            ) : (
                              <div className={`employees-performance-grid employees-grid-expand ${expandedEmployeeId ? 'has-expanded' : ''}`}>
                                {employees.map((employee) => {
                                  const isExpanded = expandedEmployeeId === employee.id;
                                  const detailData = employeeDetailData[employee.id];
                                  
                                  return (
                                    <div key={employee.id} className="employee-card-wrapper">
                                      <div
                                        className={`employee-performance-card ${
                                          isExpanded ? 'expanded' : expandedEmployeeId ? 'collapsed' : ''
                                        }`}
                                        onClick={() => toggleEmployeeDetail(employee)}
                                      >
                                        <div className="employee-info">
                                          <h4>{employee.name}</h4>
                                          <p className="employee-id">{employee.employeeId}</p>
                                          <p className="designation">{employee.currentDesignation}</p>
                                        </div>
                                        <div className="performance-score">
                                          <span className="score-value">{employee.performanceScore?.toFixed(1) || '0.0'}</span>
                                          <span className="score-label">/10</span>
                                        </div>
                                        <div className={`expand-indicator ${isExpanded ? 'rotated' : ''}`}>
                                          {isExpanded ? '▼' : '▶'}
                                        </div>
                                      </div>
                                      
                                      {/* Expandable detail section */}
                                      {isExpanded && (
                                        <div className="employee-detail-expanded employee-detail-slide">
                                          {loadingEmployeeDetails[employee.id] || !detailData ? (
                                            <div className="loading-container">
                                              <div className="loader-compact">
                                                <div className="loader_cube loader_cube--glowing"></div>
                                                <div className="loader_cube loader_cube--color"></div>
                                              </div>
                                            </div>
                                          ) : (
                                            <EmployeeDetailContent detailData={detailData} />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
          
          {/* Sprint Format Projects View */}
          {sprintFormat && (
            <div className="projects-grid-section">
              <h2>Projects - Sprint View</h2>
              {loading ? (
                <div className="loading">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="empty-state">No projects found.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                  {projects.map((project) => {
                    const avgScore = project.avgPerformance || 0;
                    const color = getPerformanceColor(avgScore);

                    return (
                      <div
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        style={{
                          padding: '1rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          borderLeft: `4px solid ${color}`,
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{project.name}</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {project.employeeCount || 0} employees
                          </span>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: color,
                            color: 'var(--text-white)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                          }}>
                            {avgScore.toFixed(1)}/10
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      ) : null}

    </div>
  );
}

function EmployeeDetailContent({ detailData }: { detailData: any }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'tickets'>('overview');

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    return time.substring(0, 5);
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

  return (
    <div className="employee-detail-content">
      <div className="detail-tabs">
        <button
          className={`detail-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Performance Overview
        </button>
        <button
          className={`detail-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance History
        </button>
        <button
          className={`detail-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          Tickets History
        </button>
      </div>

      <div className="detail-tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {detailData.performance && (
              <div className="performance-summary">
                <div className="summary-card">
                  <h3 className="text-primary">Overall Performance Score</h3>
                  <div className="score-display">
                    <span className="score-value">{detailData.performance.overallScore?.toFixed(1) || '0.0'}</span>
                    <span className="score-max">/ 10</span>
                  </div>
                </div>
              </div>
            )}

            {detailData.trend && detailData.trend.length > 0 && (
              <div className="chart-section">
                <h3>Performance Trend (Last 6 Months)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={detailData.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="var(--chart-color-1)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {detailData.performance?.categoryBreakdown && Object.keys(detailData.performance.categoryBreakdown).length > 0 && (
              <div className="chart-section">
                <h3>Category-wise Contribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(detailData.performance.categoryBreakdown).map(([key, value]) => ({ name: key, value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--chart-color-1)" />
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
                  {detailData.attendance && detailData.attendance.length > 0 ? (
                    detailData.attendance.map((record: any) => {
                      const hours = formatHoursWorked(record.hoursWorked);
                      return (
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
                          <td>{hours ? `${hours}h` : '--'}</td>
                          <td>{record.project?.name || 'N/A'}</td>
                        </tr>
                      );
                    })
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
              {detailData.tickets && detailData.tickets.length > 0 ? (
                detailData.tickets.map((ticket: any) => (
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
      </div>
    </div>
  );
}

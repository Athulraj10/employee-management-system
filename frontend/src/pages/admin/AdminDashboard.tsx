import { useEffect, useState } from 'react';
import { emsApi, pmsApi, attendanceApi } from '../../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart } from 'recharts';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeBasedData, setTimeBasedData] = useState<any[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadTimeBasedCharts();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Use Promise.all for parallel data fetching
      const [statsRes, analyticsRes] = await Promise.all([
        emsApi.getDashboardStats(),
        pmsApi.getAdminDashboardAnalytics(),
      ]);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeBasedCharts = async () => {
    try {
      // Get last 30 days data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Load employees for attendance data
      const employeesResponse = await emsApi.getEmployees({ includeProjects: true });
      const allEmployees = employeesResponse.data?.employees || employeesResponse.data || [];

      // Aggregate attendance data by date
      const attendanceByDate: Record<string, { date: string; present: number; remote: number; leave: number; total: number }> = {};
      
      // Aggregate performance data by date
      const performanceByDate: Record<string, { date: string; avgScore: number; count: number }> = {};

      await Promise.all(
        allEmployees.map(async (employee: any) => {
          try {
            // Get attendance data
            const attendanceResponse = await attendanceApi.getEmployeeAttendance(employee.id, {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            });
            
            const attendanceRecords = attendanceResponse.data || [];
            attendanceRecords.forEach((record: any) => {
              const dateStr = new Date(record.date).toISOString().split('T')[0];
              if (!attendanceByDate[dateStr]) {
                attendanceByDate[dateStr] = { date: dateStr, present: 0, remote: 0, leave: 0, total: 0 };
              }
              
              if (record.type === 'attendance') {
                attendanceByDate[dateStr].present++;
              } else if (record.type === 'remote') {
                attendanceByDate[dateStr].remote++;
              } else if (record.type === 'leave' || record.type === 'long_leave') {
                attendanceByDate[dateStr].leave++;
              }
              attendanceByDate[dateStr].total++;
            });

            // Get performance data
            const performanceResponse = await pmsApi.getEmployeeSnapshots(employee.id, {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            });
            
            const performanceRecords = performanceResponse.data || [];
            performanceRecords.forEach((record: any) => {
              const dateStr = new Date(record.snapshotDate).toISOString().split('T')[0];
              if (!performanceByDate[dateStr]) {
                performanceByDate[dateStr] = { date: dateStr, avgScore: 0, count: 0 };
              }
              
              const score = parseFloat(record.overallPerformanceRating || 0);
              performanceByDate[dateStr].avgScore += score;
              performanceByDate[dateStr].count++;
            });
          } catch (error) {
            // Ignore errors for individual employees
          }
        })
      );

      // Convert to arrays and calculate averages
      const attendanceArray = Object.values(attendanceByDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          present: item.present,
          remote: item.remote,
          leave: item.leave,
          total: item.total,
        }));

      const performanceArray = Object.values(performanceByDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          avgScore: item.count > 0 ? (item.avgScore / item.count).toFixed(1) : 0,
        }));

      setAttendanceTrend(attendanceArray);
      setPerformanceTrend(performanceArray);

      // Combined time-based data
      const combinedData = attendanceArray.map((att, idx) => ({
        date: att.date,
        attendance: att.total,
        performance: performanceArray[idx]?.avgScore || 0,
      }));
      setTimeBasedData(combinedData);
    } catch (error) {
      console.error('Failed to load time-based charts:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <p className="stat-value">{stats?.totalEmployees || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Employees</h3>
          <p className="stat-value">{stats?.activeEmployees || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Projects</h3>
          <p className="stat-value">{stats?.totalProjects || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Projects</h3>
          <p className="stat-value">{stats?.activeProjects || 0}</p>
        </div>
      </div>

      {/* Time-based Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h2>Attendance Trend (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="present" stackId="1" stroke="var(--chart-color-2)" fill="var(--chart-color-2)" name="Present" />
              <Area type="monotone" dataKey="remote" stackId="1" stroke="var(--chart-color-5)" fill="var(--chart-color-5)" name="Remote" />
              <Area type="monotone" dataKey="leave" stackId="1" stroke="var(--chart-color-1)" fill="var(--chart-color-1)" name="Leave" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Performance Trend (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgScore" stroke="var(--chart-color-1)" strokeWidth={2} name="Average Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Attendance vs Performance (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={timeBasedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="attendance" fill="var(--chart-color-2)" name="Attendance Count" />
              <Line yAxisId="right" type="monotone" dataKey="performance" stroke="var(--chart-color-1)" strokeWidth={2} name="Performance Score" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>Top Performers</h2>
          <div className="performers-list">
            {analytics?.topPerformers?.length > 0 ? (
              analytics.topPerformers.map((performer: any, idx: number) => (
                <div key={idx} className="performer-item">
                  <span>{performer.name}</span>
                  <span className="score">{performer.score.toFixed(1)}</span>
                </div>
              ))
            ) : (
              <p>No performance data available</p>
            )}
          </div>
        </div>

        <div className="section">
          <h2>Underutilized Employees</h2>
          <div className="performers-list">
            {analytics?.underutilized?.length > 0 ? (
              analytics.underutilized.map((emp: any, idx: number) => (
                <div key={idx} className="performer-item">
                  <span>{emp.name}</span>
                  <span className="score">{emp.score.toFixed(1)}</span>
                </div>
              ))
            ) : (
              <p>No performance data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

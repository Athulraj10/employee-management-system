import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeDetail from './pages/employees/EmployeeDetail';
import ProjectList from './pages/projects/ProjectList';
import PerformanceDashboard from './pages/performance/PerformanceDashboard';
import AttendanceManagement from './pages/attendance/AttendanceManagement';
import AttendanceAllView from './pages/attendance/AttendanceAllView';
import TicketManagement from './pages/tickets/TicketManagement';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/employees" element={<EmployeeList />} />
                <Route path="/employees/:id" element={<EmployeeDetail />} />
                <Route path="/projects" element={<ProjectList />} />
                <Route path="/performance" element={<PerformanceDashboard />} />
                <Route path="/attendance" element={<AttendanceManagement />} />
                <Route path="/attendance/all" element={<AttendanceAllView />} />
                <Route path="/tickets" element={<TicketManagement />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;


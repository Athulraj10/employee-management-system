import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-title">EMS/PMS</h1>
          <div className="nav-links">
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Dashboard
            </Link>
            <Link to="/employees" className={location.pathname.startsWith('/employees') ? 'active' : ''}>
              Employees
            </Link>
            <Link to="/projects" className={isActive('/projects') ? 'active' : ''}>
              Projects
            </Link>
            <Link to="/performance" className={isActive('/performance') ? 'active' : ''}>
              Performance
            </Link>
            <Link to="/attendance" className={isActive('/attendance') ? 'active' : ''}>
              Attendance
            </Link>
            <Link to="/tickets" className={isActive('/tickets') ? 'active' : ''}>
              Tickets
            </Link>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}


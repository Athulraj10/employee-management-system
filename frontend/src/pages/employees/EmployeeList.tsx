import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { emsApi } from '../../services/api';
import { FaArrowLeft } from 'react-icons/fa';
import '../../styles/shared-animations.css';
import './EmployeeList.css';

export default function EmployeeList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    dateOfJoining: '',
    currentDesignation: '',
    categoryIds: [] as string[],
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (isAddFormOpen) {
      loadCategories();
    }
  }, [isAddFormOpen]);

  useEffect(() => {
    if (selectedProject) {
      loadEmployeesForProject(selectedProject);
    } else {
      setEmployees([]);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await emsApi.getProjects();
      const projectsList = response.data.projects || response.data || [];
      
      // Load employee count for each project
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
      
      // Filter employees by project
      employeesList = employeesList.filter((emp: any) =>
        emp.projects?.some((p: any) => 
          (p.projectId === projectId || p.project?.id === projectId) &&
          (!p.endDate || new Date(p.endDate) >= new Date())
        )
      );
      
      setEmployees(employeesList);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = async (projectId: string) => {
    if (selectedProject === projectId) {
      // If clicking the same project, collapse it
      setSelectedProject(null);
      setEmployees([]);
    } else {
      // Load employees for the selected project and show below
      setSelectedProject(projectId);
      await loadEmployeesForProject(projectId);
    }
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setEmployees([]);
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/employees/${employeeId}`);
  };

  const loadCategories = async () => {
    try {
      const response = await emsApi.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name || formData.name.trim() === '') errors.name = 'Name is required';
    if (!formData.email || formData.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.employeeId || formData.employeeId.trim() === '') errors.employeeId = 'Employee ID is required';
    if (!formData.dateOfJoining) errors.dateOfJoining = 'Date of joining is required';
    if (!formData.currentDesignation || formData.currentDesignation.trim() === '') {
      errors.currentDesignation = 'Current designation is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      await emsApi.createEmployee({
        ...formData,
        dateOfJoining: formData.dateOfJoining ? new Date(formData.dateOfJoining) : null,
        categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
      });
      setFormData({
        name: '',
        email: '',
        employeeId: '',
        dateOfJoining: '',
        currentDesignation: '',
        categoryIds: [],
      });
      setValidationErrors({});
      setIsAddFormOpen(false);
      loadProjects();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create employee');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  return (
    <div className="employee-list-page">
      <div className="page-header">
        <div>
          <h1>Employee Management</h1>
          {selectedProject ? (
            <button className="back-btn" onClick={handleBackToProjects}>
              <FaArrowLeft /> Back to Projects
            </button>
          ) : (
            <button className="back-btn" onClick={() => window.history.back()}>
              <FaArrowLeft /> Back
            </button>
          )}
        </div>
        <button 
          className={`add-btn toggle-button ${isAddFormOpen ? 'expanded' : ''}`}
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
        >
          {isAddFormOpen ? '▼ Hide Form' : '+ Add Employee'}
        </button>
      </div>

      <div className="projects-view">
        <h2 className="text-tertiary">Select a Project</h2>
        {loading && !selectedProject ? (
          <div className="loading">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects found. Create a project first.</p>
          </div>
        ) : (
          <>
            {/* Projects Grid - hide selected project, shrink others */}
            <div className={`projects-grid ${selectedProject ? 'project-selected' : ''}`}>
              {projects
                .filter((project) => project.id !== selectedProject)
                .map((project) => (
                  <div
                    key={project.id}
                    className="project-card project-card-small"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="project-icon">📁</div>
                    <h3 className="text-tertiary">{project.name}</h3>
                    <p className="project-description text-tertiary">{project.description || 'No description'}</p>
                    <div className="project-footer text-tertiary">
                      <span className="employee-count text-tertiary">{project.employeeCount || 0} Employees</span>
                      <span className="click-hint">Click to view →</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Employees Grid - show when project is selected */}
            {selectedProject && (
              <div className="employees-grid-expanded">
                {loading ? (
                  <div className="loading">Loading employees...</div>
                ) : employees.length === 0 ? (
                  <div className="empty-state">
                    <p>No employees found in this project.</p>
                    <button className="back-btn" onClick={handleBackToProjects} style={{ marginTop: '1rem' }}>
                      ← Back to Projects
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="employees-header">
                      <h2>
                        {projects.find((p) => p.id === selectedProject)?.name || 'Project'} - Employees
                      </h2>
                      <button className="back-btn" onClick={handleBackToProjects}>
                        ← Back to Projects
                      </button>
                    </div>
                    <div className="employees-grid">
                      {employees.map((employee) => (
                        <div
                          key={employee.id}
                          className="employee-card employee-card-animated"
                          onClick={() => handleEmployeeClick(employee.id)}
                        >
                          <div className="employee-avatar">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="employee-info">
                            <h3>{employee.name}</h3>
                            <p className="employee-id">{employee.employeeId}</p>
                            <p className="designation">{employee.currentDesignation}</p>
                            <p className="email">{employee.email}</p>
                            <div className={`status-badge ${employee.status?.toLowerCase() || 'active'}`}>
                              {employee.status || 'Active'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Inline Add Employee Form */}
      <div className={`form-expandable ${isAddFormOpen ? 'expanded' : 'collapsed'}`}>
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
              <h2>Add New Employee</h2>
              <button className="close-inline-btn" onClick={() => setIsAddFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddEmployeeSubmit} className="employee-form">
              {formError && <div className="error-message">{formError}</div>}

              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' });
                  }}
                  className={validationErrors.name ? 'error-input' : ''}
                />
                {validationErrors.name && <span className="field-error">{validationErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                  }}
                  className={validationErrors.email ? 'error-input' : ''}
                />
                {validationErrors.email && <span className="field-error">{validationErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="employeeId">Employee ID *</label>
                <input
                  type="text"
                  id="employeeId"
                  required
                  value={formData.employeeId}
                  onChange={(e) => {
                    setFormData({ ...formData, employeeId: e.target.value });
                    if (validationErrors.employeeId) setValidationErrors({ ...validationErrors, employeeId: '' });
                  }}
                  className={validationErrors.employeeId ? 'error-input' : ''}
                />
                {validationErrors.employeeId && <span className="field-error">{validationErrors.employeeId}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="dateOfJoining">Date of Joining *</label>
                <input
                  type="date"
                  id="dateOfJoining"
                  required
                  value={formData.dateOfJoining}
                  onChange={(e) => {
                    setFormData({ ...formData, dateOfJoining: e.target.value });
                    if (validationErrors.dateOfJoining) setValidationErrors({ ...validationErrors, dateOfJoining: '' });
                  }}
                  className={validationErrors.dateOfJoining ? 'error-input' : ''}
                />
                {validationErrors.dateOfJoining && <span className="field-error">{validationErrors.dateOfJoining}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="currentDesignation">Current Designation *</label>
                <input
                  type="text"
                  id="currentDesignation"
                  required
                  value={formData.currentDesignation}
                  onChange={(e) => {
                    setFormData({ ...formData, currentDesignation: e.target.value });
                    if (validationErrors.currentDesignation) setValidationErrors({ ...validationErrors, currentDesignation: '' });
                  }}
                  className={validationErrors.currentDesignation ? 'error-input' : ''}
                />
                {validationErrors.currentDesignation && <span className="field-error">{validationErrors.currentDesignation}</span>}
              </div>

              <div className="form-group">
                <label>Categories</label>
                {categories.length === 0 ? (
                  <div className="no-categories-message">
                    <p>No categories available. Please add categories first.</p>
                  </div>
                ) : (
                  <div className="categories-checkboxes">
                    {categories.map((category) => (
                      <label key={category.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(category.id)}
                          onChange={() => handleCategoryChange(category.id)}
                        />
                        <span>{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsAddFormOpen(false)} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="submit-button">
                  {formLoading ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
      </div>
    </div>
  );
}

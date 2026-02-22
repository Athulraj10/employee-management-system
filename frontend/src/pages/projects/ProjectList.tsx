import { useState, useEffect } from 'react';
import { emsApi } from '../../services/api';
import { FaArrowLeft } from 'react-icons/fa';
import EditProjectModal from '../../components/projects/EditProjectModal';
import EmployeeRelocationModal from '../../components/employees/EmployeeRelocationModal';
import DeleteProjectModal from '../../components/projects/DeleteProjectModal';
import './ProjectList.css';

export default function ProjectList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRelocationModalOpen, setIsRelocationModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToRelocate, setEmployeeToRelocate] = useState<any>(null);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);

  useEffect(() => {
    loadProjects();
  }, []);

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

  const handleEditProject = (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleRelocateEmployee = (employeeProject: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmployeeToRelocate(employeeProject);
    setIsRelocationModalOpen(true);
  };

  const handleDeleteProject = (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const playClickSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 600;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
    }
  };

  return (
    <div className="project-list-page">
      <div className="page-header">
        <div>
          <h1>Project Management</h1>
          <button className="back-btn" onClick={() => window.history.back()}>
            <FaArrowLeft /> Back
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects found.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => {
                playClickSound();
                setSelectedProject(project);
              }}
            >
              <div className="project-card-header">
                <div className="project-icon">📁</div>
                <div className="project-actions">
                  <button
                    className="edit-project-btn"
                    onClick={(e) => handleEditProject(project, e)}
                    title="Edit Project"
                  >
                    ✏️
                  </button>
                  <button
                    className="delete-project-btn"
                    onClick={(e) => handleDeleteProject(project, e)}
                    title="Delete Project"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <h3 className="text-tertiary">{project.name}</h3>
              <p className="text-tertiary">{project.description || 'No description'}</p>
              {project.client && (
                <p className="project-client text-secondary">Client: {project.client}</p>
              )}
              <div className="project-footer">
                <span className="employee-count ">{project.employeeCount || 0} Employees</span>
                <span className={`status-badge ${project.active ? 'active' : 'inactive'}`}>
                  {project.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="project-detail-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="project-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProject.name}</h2>
              <button className="close-btn" onClick={() => setSelectedProject(null)}>×</button>
            </div>
            <ProjectEmployeesView
              project={selectedProject}
              onRelocateEmployee={handleRelocateEmployee}
              onClose={() => setSelectedProject(null)}
            />
          </div>
        </div>
      )}

      {isEditModalOpen && selectedProject && (
        <EditProjectModal
          project={selectedProject}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProject(null);
            loadProjects();
          }}
        />
      )}

      {isRelocationModalOpen && employeeToRelocate && (
        <EmployeeRelocationModal
          employeeProject={employeeToRelocate}
          currentProject={selectedProject}
          isOpen={isRelocationModalOpen}
          onClose={() => {
            setIsRelocationModalOpen(false);
            setEmployeeToRelocate(null);
            loadProjects();
            if (selectedProject) {
              emsApi.getProject(selectedProject.id).then((response) => {
                setSelectedProject(response.data);
              });
            }
          }}
        />
      )}

      {isDeleteModalOpen && projectToDelete && (
        <DeleteProjectModal
          project={projectToDelete}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
          }}
          onSuccess={() => {
            loadProjects();
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}

function ProjectEmployeesView({ project, onRelocateEmployee, onClose }: any) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, [project.id]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await emsApi.getEmployees({ includeProjects: true });
      let employeesList = response.data?.employees || response.data || [];
      
      employeesList = employeesList.filter((emp: any) =>
        emp.projects?.some((p: any) => 
          (p.projectId === project.id || p.project?.id === project.id) &&
          (!p.endDate || new Date(p.endDate) >= new Date())
        )
      );

      const employeesWithAssignments = await Promise.all(
        employeesList.map(async (emp: any) => {
          const assignment = emp.projects.find((p: any) => 
            (p.projectId === project.id || p.project?.id === project.id) &&
            (!p.endDate || new Date(p.endDate) >= new Date())
          );
          return { ...emp, assignment };
        })
      );

      setEmployees(employeesWithAssignments);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-employees-view">
      <div className="project-info">
        <p><strong>Description:</strong> {project.description || 'N/A'}</p>
        <p><strong>Client:</strong> {project.client || 'N/A'}</p>
        <p><strong>Status:</strong> <span className={`status-badge ${project.active ? 'active' : 'inactive'}`}>{project.active ? 'Active' : 'Inactive'}</span></p>
      </div>

      <h3>Employees in this Project</h3>
      {loading ? (
        <div className="loading">Loading employees...</div>
      ) : employees.length === 0 ? (
        <div className="empty-state">No employees assigned to this project.</div>
      ) : (
        <div className="employees-list">
          {employees.map((employee) => (
            <div key={employee.id} className="employee-item">
              <div className="employee-details">
                <h4>{employee.name}</h4>
                <p>{employee.employeeId} • {employee.currentDesignation}</p>
                {employee.assignment && (
                  <div className="assignment-info">
                    <span className="role-badge">{employee.assignment.role}</span>
                    <span className="category-badge">{employee.assignment.category?.name || 'N/A'}</span>
                  </div>
                )}
              </div>
              <button
                className="relocate-btn"
                onClick={(e) => onRelocateEmployee(employee.assignment, e)}
                title="Relocate Employee"
              >
                🔄 Relocate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

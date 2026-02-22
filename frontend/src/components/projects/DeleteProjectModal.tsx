import { useState, useEffect } from 'react';
import { emsApi } from '../../services/api';
import './DeleteProjectModal.css';

interface DeleteProjectModalProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteProjectModal({ project, isOpen, onClose, onSuccess }: DeleteProjectModalProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [relocationMap, setRelocationMap] = useState<Record<string, string>>({});
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && project) {
      loadEmployees();
      loadAvailableProjects();
    }
  }, [isOpen, project]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await emsApi.getEmployees({ includeProjects: true });
      const allEmployees = response.data?.employees || response.data || [];
      
      const projectEmployees = allEmployees.filter((emp: any) =>
        emp.projects?.some((p: any) => 
          (p.projectId === project.id || p.project?.id === project.id) &&
          (!p.endDate || new Date(p.endDate) >= new Date())
        )
      );

      setEmployees(projectEmployees);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProjects = async () => {
    try {
      const response = await emsApi.getProjects();
      const projectsList = response.data.projects || response.data || [];
      setAvailableProjects(projectsList.filter((p: any) => p.id !== project.id));
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleRelocationChange = (employeeId: string, newProjectId: string) => {
    setRelocationMap({ ...relocationMap, [employeeId]: newProjectId });
  };

  const playWarningSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 400;
      oscillator.type = 'sawtooth';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
    }
  };

  const handleDelete = async () => {
    if (employees.length > 0 && Object.keys(relocationMap).length !== employees.length) {
      setError('Please assign all employees to new projects before deleting.');
      playWarningSound();
      return;
    }

    setError('');
    setDeleting(true);

    try {
      if (employees.length > 0) {
        await Promise.all(
          employees.map(async (employee) => {
            const assignment = employee.projects.find((p: any) => 
              (p.projectId === project.id || p.project?.id === project.id) &&
              (!p.endDate || new Date(p.endDate) >= new Date())
            );
            
            if (assignment && relocationMap[employee.id]) {
              await emsApi.relocateEmployee(assignment.id, {
                newProjectId: relocationMap[employee.id],
                notes: `Relocated due to project deletion: ${project.name}`,
              });
            }
          })
        );
      }

      await emsApi.deleteProject(project.id, true);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="delete-project-modal-overlay" onClick={onClose}>
      <div className="delete-project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete Project</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="warning-section">
            <div className="warning-icon">⚠️</div>
            <h3>Warning: This action cannot be undone!</h3>
            <p>You are about to delete <strong>{project.name}</strong></p>
          </div>

          {employees.length > 0 && (
            <div className="employees-section">
              <h4>Employees in this project ({employees.length})</h4>
              <p className="info-text">Please reassign all employees to other projects before deleting.</p>
              
              <div className="employees-relocation-list">
                {employees.map((employee) => {
                
                  return (
                    <div key={employee.id} className="employee-relocation-item">
                      <div className="employee-info">
                        <strong>{employee.name}</strong>
                        <span>{employee.employeeId}</span>
                      </div>
                      <select
                        value={relocationMap[employee.id] || ''}
                        onChange={(e) => handleRelocationChange(employee.id, e.target.value)}
                        className="relocation-select"
                        required
                      >
                        <option value="">Select Project</option>
                        {availableProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={deleting}>
              Cancel
            </button>
            <button
              type="button"
              className="delete-btn"
              onClick={handleDelete}
              disabled={deleting || (employees.length > 0 && Object.keys(relocationMap).length !== employees.length)}
            >
              {deleting ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


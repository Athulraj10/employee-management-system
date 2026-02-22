import { useState, useEffect } from 'react';
import { emsApi } from '../../services/api';
import './EmployeeRelocationModal.css';

interface EmployeeRelocationModalProps {
  employeeProject: any;
  currentProject: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeRelocationModal({
  employeeProject,
  currentProject,
  isOpen,
  onClose,
}: EmployeeRelocationModalProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      const response = await emsApi.getProjects();
      const projectsList = response.data.projects || response.data || [];
      setProjects(projectsList.filter((p: any) => p.id !== currentProject.id));
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
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

  const handleDragStart = (projectId: string) => {
    setDraggedProject(projectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetProjectId: string) => {
    if (draggedProject && draggedProject === targetProjectId) {
      setSelectedProjectId(targetProjectId);
      playClickSound();
    }
    setDraggedProject(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a target project');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await emsApi.relocateEmployee(employeeProject.id, {
        newProjectId: selectedProjectId,
        notes: notes.trim() || undefined,
      });
      playSuccessSound();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to relocate employee');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employeeProject) return null;

  const employee = employeeProject.employee || {};

  return (
    <div className="relocation-modal-overlay" onClick={onClose}>
      <div className="relocation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Relocate Employee</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="employee-info-section">
            <h3>{employee.name}</h3>
            <p>{employee.employeeId} • {employee.currentDesignation}</p>
            <div className="current-project-info">
              <strong>Current Project:</strong> {currentProject.name}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Target Project *</label>
              <div className="projects-drag-drop-grid">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`project-drop-zone ${selectedProjectId === project.id ? 'selected' : ''} ${draggedProject === project.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(project.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(project.id)}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      playClickSound();
                    }}
                  >
                    <div className="project-icon">📁</div>
                    <h4>{project.name}</h4>
                    <p className="project-desc">{project.description || 'No description'}</p>
                    {selectedProjectId === project.id && (
                      <div className="selected-indicator">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Relocation Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about this relocation..."
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="submit-btn" disabled={loading || !selectedProjectId}>
                {loading ? 'Relocating...' : 'Relocate Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


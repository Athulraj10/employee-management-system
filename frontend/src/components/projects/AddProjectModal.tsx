import { useState, useEffect } from 'react';
import { emsApi } from '../../services/api';
import './AddProjectModal.css';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProjectModal({ isOpen, onClose, onSuccess }: AddProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        client: '',
        startDate: '',
        endDate: '',
      });
      setError('');
      setValidationErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Project name is required.';
    if (!formData.startDate) errors.startDate = 'Start date is required.';
    if (formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End date must be after start date.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError('');
    setLoading(true);

    try {
      await emsApi.createProject({
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Project</h2>
          <button className="close-button" onClick={onClose} type="button">×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="project-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">Project Name *</label>
              <input
                type="text"
                id="name"
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
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="client">Client</label>
              <input
                type="text"
                id="client"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                  if (validationErrors.startDate) setValidationErrors({ ...validationErrors, startDate: '' });
                }}
                className={validationErrors.startDate ? 'error-input' : ''}
              />
              {validationErrors.startDate && <span className="field-error">{validationErrors.startDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date (Optional)</label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value });
                  if (validationErrors.endDate) setValidationErrors({ ...validationErrors, endDate: '' });
                }}
                className={validationErrors.endDate ? 'error-input' : ''}
              />
              {validationErrors.endDate && <span className="field-error">{validationErrors.endDate}</span>}
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


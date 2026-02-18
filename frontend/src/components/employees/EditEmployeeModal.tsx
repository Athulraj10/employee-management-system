import { useState, useEffect } from 'react';
import { emsApi } from '../../services/api';
import './AddEmployeeModal.css';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: any;
}

export default function EditEmployeeModal({ isOpen, onClose, onSuccess, employee }: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    dateOfJoining: '',
    currentDesignation: '',
    status: 'Active',
    categoryIds: [] as string[],
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && employee) {
      loadCategories();
      // Populate form with employee data
      const dateOfJoining = employee.dateOfJoining 
        ? new Date(employee.dateOfJoining).toISOString().split('T')[0]
        : '';
      
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        employeeId: employee.employeeId || '',
        dateOfJoining: dateOfJoining,
        currentDesignation: employee.currentDesignation || '',
        status: employee.status || 'Active',
        categoryIds: employee.categories?.map((c: any) => c.id) || [],
      });
    }
  }, [isOpen, employee]);

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

    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Name is required';
    }

    if (!formData.email || formData.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.employeeId || formData.employeeId.trim() === '') {
      errors.employeeId = 'Employee ID is required';
    }

    if (!formData.dateOfJoining) {
      errors.dateOfJoining = 'Date of joining is required';
    }

    if (!formData.currentDesignation || formData.currentDesignation.trim() === '') {
      errors.currentDesignation = 'Current designation is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await emsApi.updateEmployee(employee.id, {
        ...formData,
        dateOfJoining: formData.dateOfJoining ? new Date(formData.dateOfJoining) : null,
        categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update employee');
    } finally {
      setLoading(false);
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

  if (!isOpen || !employee) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Employee</h2>
          <button className="close-button" onClick={onClose} type="button">×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="employee-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="edit-name">Name *</label>
              <input
                type="text"
                id="edit-name"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (validationErrors.name) {
                    setValidationErrors({ ...validationErrors, name: '' });
                  }
                }}
                className={validationErrors.name ? 'error-input' : ''}
              />
              {validationErrors.name && <span className="field-error">{validationErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-email">Email *</label>
              <input
                type="email"
                id="edit-email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (validationErrors.email) {
                    setValidationErrors({ ...validationErrors, email: '' });
                  }
                }}
                className={validationErrors.email ? 'error-input' : ''}
              />
              {validationErrors.email && <span className="field-error">{validationErrors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-employeeId">Employee ID *</label>
              <input
                type="text"
                id="edit-employeeId"
                required
                value={formData.employeeId}
                onChange={(e) => {
                  setFormData({ ...formData, employeeId: e.target.value });
                  if (validationErrors.employeeId) {
                    setValidationErrors({ ...validationErrors, employeeId: '' });
                  }
                }}
                className={validationErrors.employeeId ? 'error-input' : ''}
              />
              {validationErrors.employeeId && <span className="field-error">{validationErrors.employeeId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-dateOfJoining">Date of Joining *</label>
              <input
                type="date"
                id="edit-dateOfJoining"
                required
                value={formData.dateOfJoining}
                onChange={(e) => {
                  setFormData({ ...formData, dateOfJoining: e.target.value });
                  if (validationErrors.dateOfJoining) {
                    setValidationErrors({ ...validationErrors, dateOfJoining: '' });
                  }
                }}
                className={validationErrors.dateOfJoining ? 'error-input' : ''}
              />
              {validationErrors.dateOfJoining && <span className="field-error">{validationErrors.dateOfJoining}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-designation">Current Designation *</label>
              <input
                type="text"
                id="edit-designation"
                required
                value={formData.currentDesignation}
                onChange={(e) => {
                  setFormData({ ...formData, currentDesignation: e.target.value });
                  if (validationErrors.currentDesignation) {
                    setValidationErrors({ ...validationErrors, currentDesignation: '' });
                  }
                }}
                className={validationErrors.currentDesignation ? 'error-input' : ''}
              />
              {validationErrors.currentDesignation && <span className="field-error">{validationErrors.currentDesignation}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-status">Status *</label>
              <select
                id="edit-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
              <button type="button" onClick={onClose} className="cancel-button">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? 'Updating...' : 'Update Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


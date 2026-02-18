import { useState, useEffect } from 'react';
import { customFieldApi } from '../../services/api';
import './CustomFieldsManager.css';

interface CustomFieldsManagerProps {
  employeeId: string;
  onUpdate?: () => void;
}

export default function CustomFieldsManager({ employeeId, onUpdate }: CustomFieldsManagerProps) {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fieldKey: '',
    fieldLabel: '',
    fieldType: 'text',
    fieldValue: '',
  });

  useEffect(() => {
    loadFields();
  }, [employeeId]);

  const loadFields = async () => {
    try {
      setLoading(true);
      const response = await customFieldApi.getCustomFields(employeeId);
      setFields(response.data);
    } catch (error) {
      console.error('Failed to load custom fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async () => {
    try {
      await customFieldApi.addCustomField(employeeId, formData);
      setFormData({ fieldKey: '', fieldLabel: '', fieldType: 'text', fieldValue: '' });
      setIsAddModalOpen(false);
      loadFields();
      onUpdate?.();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add field');
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;
    try {
      await customFieldApi.deleteCustomField(id);
      loadFields();
      onUpdate?.();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete field');
    }
  };

  return (
    <div className="custom-fields-manager">
      <div className="fields-header">
        <h3>Custom Fields</h3>
        <button className="add-field-btn" onClick={() => setIsAddModalOpen(true)}>
          + Add Field
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading fields...</div>
      ) : fields.length === 0 ? (
        <p className="empty-message">No custom fields. Add one to get started.</p>
      ) : (
        <div className="fields-list">
          {fields.map((field) => (
            <div key={field.id} className="field-item">
              <div className="field-info">
                <span className="field-label">{field.fieldLabel}</span>
                <span className="field-value">{field.fieldValue || 'Not set'}</span>
              </div>
              <button
                className="delete-field-btn"
                onClick={() => handleDeleteField(field.id)}
                title="Delete Field"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {isAddModalOpen && (
        <div className="field-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="field-modal" onClick={(e) => e.stopPropagation()}>
            <div className="field-modal-header">
              <h4>Add Custom Field</h4>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>
            <div className="field-modal-body">
              <div className="form-group">
                <label>Field Key *</label>
                <input
                  type="text"
                  value={formData.fieldKey}
                  onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value })}
                  placeholder="e.g., phone_number"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Field Label *</label>
                <input
                  type="text"
                  value={formData.fieldLabel}
                  onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                  placeholder="e.g., Phone Number"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Field Type *</label>
                <select
                  value={formData.fieldType}
                  onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                  className="form-select"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="form-group">
                <label>Field Value</label>
                <input
                  type={formData.fieldType === 'date' ? 'date' : formData.fieldType === 'number' ? 'number' : 'text'}
                  value={formData.fieldValue}
                  onChange={(e) => setFormData({ ...formData, fieldValue: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="submit-btn"
                  onClick={handleAddField}
                  disabled={!formData.fieldKey || !formData.fieldLabel}
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


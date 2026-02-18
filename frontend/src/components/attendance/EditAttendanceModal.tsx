import { useState, useEffect } from 'react';
import { attendanceApi } from '../../services/api';
import './EditAttendanceModal.css';

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeData: any;
  selectedDate: string;
}

export default function EditAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  employeeData,
  selectedDate,
}: EditAttendanceModalProps) {
  const [formData, setFormData] = useState({
    type: 'attendance',
    checkIn: '',
    checkOut: '',
    isHalfDay: false,
    notes: '',
    projectId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && employeeData) {
      const attendance = employeeData.attendance;
      if (attendance) {
        setFormData({
          type: attendance.type || 'attendance',
          checkIn: attendance.checkIn || '',
          checkOut: attendance.checkOut || '',
          isHalfDay: attendance.isHalfDay || false,
          notes: attendance.notes || '',
          projectId: attendance.projectId || '',
        });
      } else {
        const primaryProject = employeeData.projects?.find((p: any) => 
          !p.endDate || new Date(p.endDate) >= new Date()
        );
        setFormData({
          type: 'attendance',
          checkIn: '',
          checkOut: '',
          isHalfDay: false,
          notes: '',
          projectId: primaryProject?.projectId || '',
        });
      }
      setError('');
    }
  }, [isOpen, employeeData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (employeeData.attendance) {
        await attendanceApi.updateAttendance(employeeData.attendance.id, {
          ...formData,
          date: selectedDate,
        });
      } else {
        await attendanceApi.markAttendance({
          employeeId: employeeData.employee.id,
          date: selectedDate,
          ...formData,
          markedBy: 'admin',
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employeeData) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Attendance - {employeeData.employee.name}</h2>
          <button className="close-button" onClick={onClose} type="button">×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="attendance-edit-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="type">Attendance Type *</label>
              <select
                id="type"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="attendance">Attendance</option>
                <option value="remote">Remote</option>
                <option value="leave">Leave</option>
                <option value="long_leave">Long Leave</option>
                <option value="termination">Termination</option>
              </select>
            </div>

            {(formData.type === 'attendance' || formData.type === 'remote') && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="checkIn">Check In Time</label>
                    <input
                      type="time"
                      id="checkIn"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkOut">Check Out Time</label>
                    <input
                      type="time"
                      id="checkOut"
                      value={formData.checkOut}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isHalfDay}
                      onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                    />
                    <span>Half Day Leave</span>
                  </label>
                </div>
              </>
            )}

            {formData.type === 'leave' && (
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isHalfDay}
                    onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                  />
                  <span>Half Day Leave</span>
                </label>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="project">Project (Optional)</label>
              <select
                id="project"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">No Project</option>
                {employeeData.projects?.map((p: any) => (
                  <option key={p.id} value={p.projectId}>
                    {p.project.name} ({p.category.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Optional notes"
              />
            </div>

            {employeeData.attendance && (
              <div className="last-updated-info">
                <p>Last Updated: {new Date(employeeData.attendance.updatedAt).toLocaleString()}</p>
                <p className="update-hint">(No need to recheck if already updated)</p>
              </div>
            )}

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? 'Updating...' : employeeData.attendance ? 'Update Attendance' : 'Mark Attendance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


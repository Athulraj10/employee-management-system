import { useState, useEffect } from 'react';
import { emsApi } from '../../services/api';
import './CategoryManagement.css';

interface CategoryManagementProps {
  onCategoryChange?: () => void;
}

export default function CategoryManagement({ onCategoryChange }: CategoryManagementProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await emsApi.getCategories(true);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      await emsApi.createCategory(formData);
      setFormData({ name: '', description: '' });
      setIsAddModalOpen(false);
      loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    try {
      await emsApi.updateCategory(editingCategory.id, formData);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this category?')) return;
    try {
      await emsApi.deleteCategory(id);
      loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete category');
    }
  };

  const openEditModal = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setIsAddModalOpen(true);
  };

  const categoryTypes = [
    'Frontend',
    'Backend',
    'Full Stack',
    'Mobile',
    'DevOps',
    'QA',
    'Data / AI',
  ];

  return (
    <div className="category-management">
      <div className="category-header">
        <h3>Categories</h3>
        <button className="add-category-btn" onClick={() => {
          setIsAddModalOpen(true);
          setEditingCategory(null);
          setFormData({ name: '', description: '' });
        }}>
          + Add Category
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading categories...</div>
      ) : (
        <div className="categories-list">
          {categories.length === 0 ? (
            <p className="empty-message">No categories found. Add one to get started.</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className={`category-item ${!category.active ? 'inactive' : ''}`}>
                <div className="category-info">
                  <span className="category-name">{category.name}</span>
                  {category.description && (
                    <span className="category-description">{category.description}</span>
                  )}
                  {!category.active && <span className="inactive-badge">Inactive</span>}
                </div>
                <div className="category-actions">
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(category)}
                    title="Edit Category"
                  >
                    ✏️
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteCategory(category.id)}
                    title="Deactivate Category"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isAddModalOpen && (
        <div className="category-modal-overlay" onClick={() => {
          setIsAddModalOpen(false);
          setEditingCategory(null);
          setFormData({ name: '', description: '' });
        }}>
          <div className="category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="category-modal-header">
              <h4>{editingCategory ? 'Edit Category' : 'Add Category'}</h4>
              <button className="close-btn" onClick={() => {
                setIsAddModalOpen(false);
                setEditingCategory(null);
                setFormData({ name: '', description: '' });
              }}>×</button>
            </div>
            <div className="category-modal-body">
              <div className="form-group">
                <label>Category Name *</label>
                {editingCategory ? (
                  <input
                    type="text"
                    value={formData.name}
                    disabled
                    className="form-input"
                  />
                ) : (
                  <select
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Select a category type</option>
                    {categoryTypes
                      .filter(type => !categories.some(c => c.name === type && c.active))
                      .map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                  rows={3}
                  placeholder="Optional description for this category"
                />
              </div>
              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCategory(null);
                    setFormData({ name: '', description: '' });
                  }}
                >
                  Cancel
                </button>
                <button
                  className="submit-btn"
                  onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                  disabled={!formData.name}
                >
                  {editingCategory ? 'Update' : 'Add'} Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


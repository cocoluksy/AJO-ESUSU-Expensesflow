import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Alert, Spinner } from '../components/common/FormElements';
import DashboardLayout from '../components/DashboardLayout';
import { useExpense } from '../contexts/ExpenseContext';
import { FolderPlus, PencilLine, Sparkles, Trash2 } from 'lucide-react';

const CategoriesPage = () => {
  const {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  } = useExpense();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#0ea5e9',
    icon: '📁'
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    }

    return errors;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSubmitError('');
      setSubmitSuccess('');

      if (editingId) {
        await updateCategory(editingId, formData);
        setSubmitSuccess('Category updated successfully');
      } else {
        await createCategory(formData);
        setSubmitSuccess('Category created successfully');
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      setSubmitError(err.message || 'Failed to save category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#0ea5e9',
      icon: '📁'
    });
    setValidationErrors({});
    setEditingId(null);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#0ea5e9',
      icon: category.icon || '📁'
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? Associated expenses will be unlinked.')) {
      try {
        await deleteCategory(id);
        setSubmitSuccess('Category deleted successfully');
      } catch (err) {
        setSubmitError(err.message || 'Failed to delete category');
      }
    }
  };

  const iconOptions = ['📁', '💰', '🏠', '🚗', '🍔', '🏥', '📚', '🎮', '🛍️', '✈️', '💼', '⚡'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Organization</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Expense Categories</h1>
          </div>
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
          >
            <FolderPlus size={16} />
            {showForm ? 'Cancel' : 'Add Category'}
          </Button>
        </div>

        {submitError && <Alert type="danger" message={submitError} />}
        {submitSuccess && <Alert type="success" message={submitSuccess} />}
        {error && <Alert type="danger" message={error} />}

        {showForm && (
          <Card title={editingId ? 'Edit Category' : 'Add New Category'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Category Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                error={validationErrors.name}
                placeholder="e.g., Office Supplies"
                required
              />

              <Input
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Describe this category"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleFormChange}
                      className="h-11 w-20 cursor-pointer rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={handleFormChange}
                      name="color"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-700 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => handleFormChange({ target: { name: 'icon', value: icon } })}
                        className={`rounded-xl border-2 p-2 text-2xl transition-all ${
                          formData.icon === icon
                            ? 'border-violet-500 bg-violet-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="primary">
                  {editingId ? 'Update Category' : 'Add Category'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white/80 shadow-soft">
            <Spinner size="lg" />
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map(category => (
              <Card key={category.id} className="relative border-0 bg-gradient-to-br from-white to-slate-50">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-sm" style={{ backgroundColor: `${category.color || '#0ea5e9'}20` }}>
                    {category.icon || '📁'}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(category)}>
                      <PencilLine size={14} />
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(category.id)}>
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{category.name}</h3>
                  {category.description && (
                    <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-3 py-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: category.color || '#0ea5e9' }} />
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{category.color}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Sparkles size={28} />
              </div>
              <p className="text-slate-500">No categories yet. Create one to get started!</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CategoriesPage;

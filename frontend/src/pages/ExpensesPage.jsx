import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Alert, Spinner, Badge } from '../components/common/FormElements';
import DashboardLayout from '../components/DashboardLayout';
import { useExpense } from '../contexts/ExpenseContext';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { formatNaira } from '../utils/currency';
import { ArrowUpRight, Plus, Search, Trash2, PencilLine, Wallet2 } from 'lucide-react';

const ExpensesPage = () => {
  const {
    expenses,
    categories,
    loading,
    error,
    fetchExpenses,
    fetchCategories,
    createExpense,
    updateExpense,
    deleteExpense
  } = useExpense();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    payment_method: 'cash',
    tags: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [fetchExpenses, fetchCategories]);

  const validateForm = () => {
    const errors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category_id) {
      errors.category_id = 'Category is required';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
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
        await updateExpense(editingId, formData);
        setSubmitSuccess('Expense updated successfully');
      } else {
        await createExpense(formData);
        setSubmitSuccess('Expense added successfully');
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      setSubmitError(err.message || 'Failed to save expense');
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      payment_method: 'cash',
      tags: ''
    });
    setValidationErrors({});
    setEditingId(null);
  };

  const handleEdit = (expense) => {
    setFormData({
      amount: expense.amount,
      category_id: expense.category_id,
      date: expense.date,
      description: expense.description || '',
      payment_method: expense.payment_method || 'cash',
      tags: expense.tags || ''
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        setSubmitSuccess('Expense deleted successfully');
      } catch (err) {
        setSubmitError(err.message || 'Failed to delete expense');
      }
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    if (filterCategory && exp.category_id !== parseInt(filterCategory)) return false;
    if (filterDate && exp.date !== filterDate) return false;
    return true;
  });
const now = new Date();
  const currentMonth = now.getMonth();
  const halfYearStart = currentMonth < 6 ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), 6, 1);
  const halfYearEnd = currentMonth < 6 ? new Date(now.getFullYear(), 5, 30, 23, 59, 59) : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  const periodRanges = {
    daily: { start: startOfDay(now), end: endOfDay(now) },
    weekly: { start: startOfWeek(now), end: endOfWeek(now) },
    monthly: { start: startOfMonth(now), end: endOfMonth(now) },
    quarterly: { start: startOfQuarter(now), end: endOfQuarter(now) },
    halfYearly: { start: halfYearStart, end: halfYearEnd },
    yearly: { start: startOfYear(now), end: endOfYear(now) }
  };

  const periodTotals = Object.entries(periodRanges).reduce((totals, [period, range]) => {
    totals[period] = expenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.date);
      if (isWithinInterval(expenseDate, range)) {
        return sum + parseFloat(expense.amount || 0);
      }
      return sum;
    }, 0);
    return totals;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Transactions</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Expenses</h1>
          </div>
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
          >
            <Plus size={16} />
            {showForm ? 'Cancel' : 'Add Expense'}
          </Button>
        </div>

        {submitError && <Alert type="danger" message={submitError} />}
        {submitSuccess && <Alert type="success" message={submitSuccess} />}
        {error && <Alert type="danger" message={error} />}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 bg-gradient-to-br from-sky-500/15 via-sky-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total spend</p>
                <p className="mt-3 text-3xl font-bold text-sky-700">
                  {formatNaira(filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0))}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                <Wallet2 size={20} />
              </div>
            </div>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500/15 via-emerald-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Entries</p>
                <p className="mt-3 text-3xl font-bold text-emerald-700">{filteredExpenses.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <ArrowUpRight size={20} />
              </div>
            </div>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-violet-500/15 via-violet-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Categories</p>
                <p className="mt-3 text-3xl font-bold text-violet-700">{new Set(filteredExpenses.map(e => e.category_id)).size}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                <Search size={20} />
              </div>
            </div>
          </Card>
       </div>

        <Card title="Spending by period">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Daily</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{formatNaira(periodTotals.daily)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Weekly</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{formatNaira(periodTotals.weekly)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Monthly</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{formatNaira(periodTotals.monthly)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Quarterly</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{formatNaira(periodTotals.quarterly)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Half-Yearly</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{formatNaira(periodTotals.halfYearly)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Yearly</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{formatNaira(periodTotals.yearly)}</p>
            </div>
          </div>
        </Card>

        {showForm && (
          <Card title={editingId ? 'Edit Expense' : 'Add New Expense'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  label="Amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  error={validationErrors.amount}
                  required
                />

                <Select
                  label="Category"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleFormChange}
                  options={categories.map(cat => ({
                    value: cat.id,
                    label: cat.name
                  }))}
                  error={validationErrors.category_id}
                  required
                />

                <Input
                  type="date"
                  label="Date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  error={validationErrors.date}
                  required
                />

                <Select
                  label="Payment Method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleFormChange}
                  options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'credit', label: 'Credit Card' },
                    { value: 'debit', label: 'Debit Card' },
                    { value: 'bank', label: 'Bank Transfer' },
                    { value: 'check', label: 'Check' }
                  ]}
                />
              </div>

              <Input
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="What was this expense for?"
              />

              <Input
                label="Tags (comma separated)"
                name="tags"
                value={formData.tags}
                onChange={handleFormChange}
                placeholder="e.g., office, supplies, travel"
              />

              <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="primary">
                  {editingId ? 'Update Expense' : 'Add Expense'}
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

        <Card title="Filters">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Filter by Category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({
                  value: cat.id,
                  label: cat.name
                }))
              ]}
            />

            <Input
              type="date"
              label="Filter by Date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </Card>

        <Card title={`Expenses (${filteredExpenses.length})`}>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-sm text-slate-500">
                    <th className="px-4 py-2 font-semibold">Date</th>
                    <th className="px-4 py-2 font-semibold">Description</th>
                    <th className="px-4 py-2 font-semibold">Category</th>
                    <th className="px-4 py-2 font-semibold">Method</th>
                    <th className="px-4 py-2 text-right font-semibold">Amount</th>
                    <th className="px-4 py-2 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(expense => (
                    <tr key={expense.id} className="rounded-2xl bg-slate-50 text-sm shadow-sm">
                      <td className="rounded-l-2xl px-4 py-4 text-slate-700">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{expense.description || 'N/A'}</div>
                        {expense.tags && <div className="mt-1 text-xs text-slate-500">{expense.tags}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="primary" size="sm">{expense.category_name}</Badge>
                      </td>
                      <td className="px-4 py-4 capitalize text-slate-600">{expense.payment_method || 'N/A'}</td>
                      <td className="px-4 py-4 text-right font-bold text-slate-900">
                        {formatNaira(expense.amount)}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(expense)}>
                            <PencilLine size={14} />
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(expense.id)}>
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-slate-500">No expenses found</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExpensesPage;

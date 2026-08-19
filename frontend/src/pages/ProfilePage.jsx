import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Alert, Spinner } from '../components/common/FormElements';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { BadgeCheck, BellRing, ShieldCheck, Sparkles } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile, loading, error } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        business_name: user.business_name || ''
      });
    }
  }, [user]);

  const validateForm = () => {
    const errors = {};

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    }

    return errors;
  };

  const handleChange = (e) => {
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

      await updateProfile(formData);
      setSubmitSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setSubmitError(err.message || 'Failed to update profile');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Profile</h1>
        </div>

        {submitError && <Alert type="danger" message={submitError} />}
        {submitSuccess && <Alert type="success" message={submitSuccess} />}
        {error && <Alert type="danger" message={error} />}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card title="Profile Information">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={validationErrors.first_name}
                  required
                />

                <Input
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={validationErrors.last_name}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-100"
                />

                <Input
                  label="Business Name (Optional)"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                />

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? <Spinner size="sm" /> : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 p-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-xl font-bold text-white shadow-glow">
                    {user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || ''}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">Member</p>
                    <h3 className="mt-1 text-2xl font-bold text-slate-900">
                      {user?.first_name} {user?.last_name}
                    </h3>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <label className="text-sm font-medium text-slate-500">Email Address</label>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{user?.email}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <label className="text-sm font-medium text-slate-500">Business Name</label>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{user?.business_name || 'Personal account'}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-500">Member Since</label>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card title="Security">
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-900">Protected</h4>
                    <p className="mt-1 text-sm text-emerald-800">
                      Your expense data is stored with secure best practices and industry-standard controls.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                  <p className="font-semibold">Last login</p>
                  <p className="mt-1">{user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </Card>

            <Card title="Preferences">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                      <BellRing size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Email Notifications</p>
                      <p className="text-sm text-slate-600">Expense updates and reminders</p>
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5 rounded" />
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Weekly Summary</p>
                      <p className="text-sm text-slate-600">Insight reports every week</p>
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5 rounded" />
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <BadgeCheck size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Budget Alerts</p>
                      <p className="text-sm text-slate-600">When spending gets close to limit</p>
                    </div>
                  </div>
                  <input type="checkbox" className="h-5 w-5 rounded" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;

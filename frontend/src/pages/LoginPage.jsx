import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button, Alert, Spinner } from '../components/common/FormElements';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
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
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.25),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_30%)]" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-lg font-bold text-white">
                F
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">AJO-ESUSU</p>
                <p className="text-xl font-semibold">ExpensesFlow</p>
              </div>
            </div>

            <div className="mt-auto space-y-8">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-sky-100">
                  <Sparkles size={14} />
                  Built for modern businesses
                </div>
                <h1 className="max-w-sm text-4xl font-bold leading-tight text-white">
                  Make smarter spending decisions every day.
                </h1>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-3 text-sky-200">
                    <BarChart3 size={18} />
                    <span className="text-sm font-semibold">Real-time visibility</span>
                  </div>
                  <p className="text-sm text-slate-300">Track budgets, cash flow, and category spend with a clean summary view.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-3 text-emerald-200">
                    <ShieldCheck size={18} />
                    <span className="text-sm font-semibold">Secure and compliant</span>
                  </div>
                  <p className="text-sm text-slate-300">Your account activity and expense data stay protected with trusted workflows.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-50 p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Welcome back</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
            </div>

            {submitError && <Alert type="danger" message={submitError} className="mb-4" />}
            {error && <Alert type="danger" message={error} className="mb-4" />}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                type="email"
                label="Email address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={validationErrors.email}
                required
                disabled={loading}
                placeholder="name@company.com"
              />

              <Input
                type="password"
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={validationErrors.password}
                required
                disabled={loading}
                placeholder="Enter your password"
              />

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : <>Continue <ArrowRight size={18} /></>}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-sky-600 transition-colors hover:text-sky-700">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

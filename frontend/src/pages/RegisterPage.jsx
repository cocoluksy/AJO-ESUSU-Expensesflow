import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button, Alert, Spinner } from '../components/common/FormElements';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    business_name: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[@$!%*#?&]/.test(pwd)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength) => {
    if (strength === 0) return null;
    if (strength <= 1) return { label: 'Weak', color: 'text-rose-600', bg: 'bg-rose-100', bar: 'bg-rose-500' };
    if (strength <= 2) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-100', bar: 'bg-amber-500' };
    if (strength <= 3) return { label: 'Good', color: 'text-sky-600', bg: 'bg-sky-100', bar: 'bg-sky-500' };
    return { label: 'Strong', color: 'text-emerald-600', bg: 'bg-emerald-100', bar: 'bg-emerald-500' };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);
  const strengthLabel = getPasswordStrengthLabel(passwordStrength);

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.first_name) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/.test(formData.password)) {
      errors.password = 'Password must contain letters, numbers, and special characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Only clear validation errors for password-related fields
    if (['password', 'confirmPassword', 'email'].includes(name) && validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSubmitError('');
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      // Handle different types of errors with specific messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.message.includes('ECONNREFUSED') || err.message.includes('net::ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Cannot connect to server. Please check that the backend server is running.';
      } else if (err.message.includes('email')) {
        errorMessage = err.message;
      } else if (err.message.includes('password')) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setSubmitError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-soft lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-slate-950 p-8 text-white lg:p-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-sky-100">
            <Sparkles size={14} />
            Start tracking smarter
          </div>

          <h1 className="max-w-sm text-4xl font-bold leading-tight text-white">
            Build better spending habits from day one.
          </h1>

          <div className="mt-8 space-y-4">
            {[
              'Track every expense in one clean dashboard',
              'Organize transactions by category and payment method',
              'Generate reports that help you plan ahead'
            ].map(item => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                  <CheckCircle2 size={16} />
                </div>
                <p className="text-sm text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-50 p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Get started</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Create your account</h2>
            </div>

            {submitError && <Alert type="danger" message={submitError} className="mb-4" />}
            {error && <Alert type="danger" message={error} className="mb-4" />}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  type="text"
                  label="First name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={attemptedSubmit ? validationErrors.first_name : ''}
                  required
                  disabled={loading}
                  placeholder="Jane"
                />

                <Input
                  type="text"
                  label="Last name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={attemptedSubmit ? validationErrors.last_name : ''}
                  required
                  disabled={loading}
                  placeholder="Doe"
                />
              </div>

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
                type="text"
                label="Business name (optional)"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                disabled={loading}
                placeholder="Your company or brand"
              />

              {/* Password Field with Visibility Toggle */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                  <span className="ml-1 text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    disabled={loading}
                    className={`
                      w-full rounded-xl border bg-slate-50 px-3.5 py-3 pr-12 text-slate-900 shadow-sm transition-all duration-200
                      placeholder:text-slate-400
                      focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100
                      disabled:cursor-not-allowed disabled:bg-slate-100
                      ${validationErrors.password ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Password Requirements & Strength */}
                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Minimum length: 8 characters</span>
                    {strengthLabel && (
                      <span className={`font-semibold ${strengthLabel.color}`}>
                        {strengthLabel.label}
                      </span>
                    )}
                  </div>
                  {formData.password && (
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            i < passwordStrength ? strengthLabel?.bar : 'bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-600">
                    ✓ Must contain letters, numbers, and special characters (@$!%*#?&)
                  </p>
                </div>
                
                {validationErrors.password && (
                  <p className="text-sm font-medium text-rose-600">{validationErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field with Visibility Toggle */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Confirm password
                  <span className="ml-1 text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    disabled={loading}
                    className={`
                      w-full rounded-xl border bg-slate-50 px-3.5 py-3 pr-12 text-slate-900 shadow-sm transition-all duration-200
                      placeholder:text-slate-400
                      focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100
                      disabled:cursor-not-allowed disabled:bg-slate-100
                      ${validationErrors.confirmPassword ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-sm font-medium text-rose-600">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : <>Create account <ArrowRight size={18} /></>}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-sky-600 transition-colors hover:text-sky-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

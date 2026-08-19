import React from 'react';

export const Button = ({
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-0 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-sky-600 via-cyan-600 to-indigo-600 text-white shadow-glow hover:-translate-y-0.5 hover:shadow-xl focus:ring-sky-200 disabled:bg-slate-300',
    secondary: 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 focus:ring-slate-200 disabled:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200 disabled:bg-slate-300',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200 disabled:bg-slate-300',
    ghost: 'bg-white/80 text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-200'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({
  type = 'text',
  label = '',
  error = '',
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full rounded-xl border bg-slate-50 px-3.5 py-3 text-slate-900 shadow-sm transition-all duration-200
          placeholder:text-slate-400
          focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100
          disabled:cursor-not-allowed disabled:bg-slate-100
          ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
};

export const Select = ({
  label = '',
  error = '',
  required = false,
  options = [],
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <select
        className={`
          w-full rounded-xl border bg-slate-50 px-3.5 py-3 text-slate-900 shadow-sm transition-all duration-200
          focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100
          disabled:cursor-not-allowed disabled:bg-slate-100
          ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}
          ${className}
        `}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
};

export const Textarea = ({
  label = '',
  error = '',
  required = false,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          w-full rounded-xl border bg-slate-50 px-3.5 py-3 text-slate-900 shadow-sm transition-all duration-200
          focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100
          disabled:cursor-not-allowed disabled:bg-slate-100
          ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
};

export const Card = ({
  title = '',
  children,
  className = '',
  headerClassName = ''
}) => {
  return (
    <div className={`rounded-2xl border border-indigo-100/90 bg-white/90 shadow-soft backdrop-blur-sm ${className}`}>
      {title && (
        <div className={`border-b border-slate-200 px-6 py-4 ${headerClassName}`}>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export const Alert = ({
  type = 'info',
  message = '',
  onClose = null
}) => {
  const styles = {
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-rose-200 bg-rose-50 text-rose-800'
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[type]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        {onClose && (
          <button onClick={onClose} className="rounded-full p-1 text-current hover:bg-black/5" aria-label="Dismiss alert">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} animate-spin rounded-full border-4 border-slate-200 border-t-sky-600`} />
    </div>
  );
};

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md'
}) => {
  const variants = {
    primary: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200',
    success: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    warning: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
    danger: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
    gray: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-xs'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

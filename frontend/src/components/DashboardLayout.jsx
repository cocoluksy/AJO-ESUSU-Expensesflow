import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Tag,
  UserCircle,
  Coins,
  Landmark,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/FormElements';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/expenses', label: 'Expenses', icon: CreditCard },
    { path: '/categories', label: 'Categories', icon: Tag },
    { path: '/wallet', label: 'Wallet', icon: Landmark },
    { path: '/contributions', label: 'Contributions', icon: Coins },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCircle }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-violet-50 to-rose-50 text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-violet-500/30 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-slate-100 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">AJO-ESUSU</p>
            <h1 className="mt-1 text-2xl font-bold text-white">ExpensesFlow</h1>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-5 rounded-2xl border border-fuchsia-400/40 bg-gradient-to-br from-sky-500/25 to-fuchsia-500/20 p-4 shadow-lg shadow-fuchsia-950/20">
            <p className="text-xs uppercase tracking-[0.18em] text-sky-200">Workspace</p>
            <p className="mt-2 text-lg font-semibold text-white">{user?.business_name || 'Personal Account'}</p>
          </div>

          <nav className="space-y-2" aria-label="Sidebar navigation">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white shadow-glow'
                      : 'text-slate-300 hover:bg-violet-500/25 hover:text-white'
                  }`}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 group-hover:bg-white/10">
                    <Icon size={18} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

      </aside>

      <div className="min-h-screen md:ml-72">
        <header className="sticky top-0 z-30 border-b border-violet-200 bg-white/85 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Overview</p>
                <h2 className="text-xl font-bold text-slate-900">{location.pathname.replace('/', '').charAt(0).toUpperCase() + location.pathname.replace('/', '').slice(1) || 'Dashboard'}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-white to-violet-50 px-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white">
                {user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || ''}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              </div>
              <Button variant="danger" size="sm" className="shrink-0" onClick={handleLogout} aria-label="Log out">
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="animate-fade-in p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

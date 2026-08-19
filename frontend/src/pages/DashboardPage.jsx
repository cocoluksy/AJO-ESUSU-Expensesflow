import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Badge } from '../components/common/FormElements';
import DashboardLayout from '../components/DashboardLayout';
import { useExpense } from '../contexts/ExpenseContext';
import { reportAPI } from '../services/api';
import { ArrowUpRight, Wallet, TrendingUp, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { formatNaira } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { expenses, fetchExpenses, fetchCategories } = useExpense();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    categoryBreakdown: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        await Promise.all([fetchExpenses(), fetchCategories()]);

        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const response = await reportAPI.getCategoryBreakdown({
          start_date: startDate,
          end_date: endDate
        });

        const totalAmount = parseFloat(response.data.total) || 0;
        const breakdown = response.data.data || [];
        const transactionCount = breakdown.reduce((sum, cat) => sum + cat.expense_count, 0);

        setSummary({
          totalExpenses: totalAmount,
          totalTransactions: transactionCount,
          avgTransaction: transactionCount > 0 ? (totalAmount / transactionCount).toFixed(2) : 0,
          categoryBreakdown: breakdown.slice(0, 5)
        });
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchExpenses, fetchCategories]);

  const recentExpenses = expenses.slice(0, 5);

  const statCards = [
    {
      label: 'Total Expenses',
      value: formatNaira(summary.totalExpenses),
      note: 'This month',
      tone: 'from-sky-500/15 via-sky-50 to-white',
      accent: 'text-sky-700',
      icon: Wallet
    },
    {
      label: 'Transactions',
      value: summary.totalTransactions,
      note: 'Logged in selected period',
      tone: 'from-emerald-500/15 via-emerald-50 to-white',
      accent: 'text-emerald-700',
      icon: CreditCard
    },
    {
      label: 'Average',
      value: formatNaira(summary.avgTransaction),
      note: 'Per transaction',
      tone: 'from-amber-500/15 via-amber-50 to-white',
      accent: 'text-amber-700',
      icon: TrendingUp
    },
    {
      label: 'Categories',
      value: summary.categoryBreakdown.length,
      note: 'Active spending segments',
      tone: 'from-violet-500/15 via-violet-50 to-white',
      accent: 'text-violet-700',
      icon: ArrowUpRight
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="rounded-3xl border border-fuchsia-200 bg-gradient-to-r from-cyan-100 via-violet-100 to-rose-100 px-6 py-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-700">Your finance space</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-indigo-950">Hi {user?.first_name || 'there'}!</h1>
            <p className="mt-1 text-sm font-medium text-indigo-700">Here is a bright overview of your money activity today.</p>
          </div>
        </div>

        {error && <Alert type="danger" message={error} />}

        {loading ? (
          <div className="flex h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white/80 shadow-soft">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map(({ label, value, note, tone, accent, icon: Icon }) => (
                <Card key={label} className={`border-0 bg-gradient-to-br ${tone}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{label}</p>
                      <p className={`mt-3 text-3xl font-bold ${accent}`}>{value}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-slate-700 shadow-sm">
                      <Icon size={18} />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">{note}</p>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Card title="Top spending categories">
                {summary.categoryBreakdown.length > 0 ? (
                  <div className="space-y-5">
                    {summary.categoryBreakdown.map((category, index) => (
                      <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color || '#64748b' }} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">{category.name}</p>
                              <p className="text-sm text-slate-500">{category.expense_count} transactions</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">{formatNaira(category.total_amount)}</p>
                            <Badge variant="gray" size="sm">{category.percentage}%</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-slate-500">No expenses yet</p>
                )}
              </Card>

              <Card title="Recent expenses">
                {recentExpenses.length > 0 ? (
                  <div className="space-y-3">
                    {recentExpenses.map(expense => (
                      <div key={expense.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{expense.description || 'Expense'}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                            <span>•</span>
                            <Badge variant="primary" size="sm">{expense.category_name}</Badge>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-bold text-slate-900">-{formatNaira(expense.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-slate-500">No expenses yet</p>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;

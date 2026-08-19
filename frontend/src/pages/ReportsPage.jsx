import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Alert, Spinner, Badge } from '../components/common/FormElements';
import DashboardLayout from '../components/DashboardLayout';
import { contributionAPI, reportAPI } from '../services/api';
import { Download, TrendingUp, Wallet, BarChart3, Users } from 'lucide-react';
import { formatNaira } from '../utils/currency';

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [report, setReport] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groupSummary, setGroupSummary] = useState(null);
  const [publicGroups, setPublicGroups] = useState([]);
  const [contributionAlerts, setContributionAlerts] = useState([]);
  const [personalSavings, setPersonalSavings] = useState(null);
  const [groupMessage, setGroupMessage] = useState('');

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');

      const [financialRes, categoryRes, monthlyRes, groupsRes, publicGroupsRes, notificationsRes, savingsRes] = await Promise.all([
        reportAPI.getFinancialReport({ start_date: startDate, end_date: endDate }),
        reportAPI.getCategoryBreakdown({ start_date: startDate, end_date: endDate }),
        reportAPI.getMonthlySummary(),
        contributionAPI.getMyGroups(),
        contributionAPI.getPublicGroups(),
        contributionAPI.notifications(),
        contributionAPI.getPersonalSavings()
      ]);

      setReport(financialRes.data.report);
      setCategoryBreakdown(categoryRes.data.data || []);
      setMonthlyData(monthlyRes.data.data || []);
      setGroups(groupsRes.data.data || []);
      setPublicGroups(publicGroupsRes.data.data || []);
      setContributionAlerts((notificationsRes.data.data || []).filter(item => item.type === 'contribution'));
      setPersonalSavings(savingsRes.data.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleGenerateReport = () => {
    loadReport();
  };

  const loadGroupSummary = async (groupId) => {
    setSelectedGroup(groupId);
    if (!groupId) { setGroupSummary(null); return; }
    try {
      const response = await contributionAPI.summary(groupId);
      setGroupSummary(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the group contribution summary');
    }
  };

  const manageGroupMembership = async (groupId, isMember) => {
    try {
      if (isMember) await contributionAPI.exitGroup(groupId);
      else await contributionAPI.joinGroup(groupId);
      setGroupMessage(isMember ? 'You have exited the group contribution.' : 'You have joined the public group contribution.');
      await loadReport();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update group membership');
    }
  };

  const metricCards = report
    ? [
        { label: 'Total Expenses', value: formatNaira(report.summary.total_expenses), accent: 'text-sky-700', tone: 'from-sky-500/15 via-sky-50 to-white', icon: Wallet },
        { label: 'Transactions', value: report.summary.total_transactions, accent: 'text-emerald-700', tone: 'from-emerald-500/15 via-emerald-50 to-white', icon: BarChart3 },
        { label: 'Average', value: formatNaira(report.summary.average_transaction), accent: 'text-amber-700', tone: 'from-amber-500/15 via-amber-50 to-white', icon: TrendingUp },
        { label: 'Highest', value: formatNaira(report.summary.max_transaction), accent: 'text-violet-700', tone: 'from-violet-500/15 via-violet-50 to-white', icon: Download }
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Insights</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Financial Reports</h1>
        </div>

        {error && <Alert type="danger" message={error} />}
        {groupMessage && <Alert type="success" message={groupMessage} onClose={() => setGroupMessage('')} />}

        <Card title="Report Period">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button variant="primary" onClick={handleGenerateReport} disabled={loading}>
              {loading ? 'Loading...' : 'Generate Report'}
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="flex h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white/80 shadow-soft">
            <Spinner size="lg" />
          </div>
        ) : report ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map(({ label, value, accent, tone, icon: Icon }) => (
                <Card key={label} className={`border-0 bg-gradient-to-br ${tone}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">{label}</p>
                      <p className={`mt-3 text-3xl font-bold ${accent}`}>{value}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                      <Icon size={20} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card title="Spending by Category">
                {report.categories && report.categories.length > 0 ? (
                  <div className="space-y-4">
                    {report.categories.map((category, index) => (
                      <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-slate-900">{category.name}</h4>
                            <p className="text-sm text-slate-500">{category.count} transactions</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">{formatNaira(category.amount)}</p>
                            <Badge variant="primary" size="sm">{category.percentage}%</Badge>
                          </div>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-slate-500">No expense categories</p>
                )}
              </Card>

              <Card title="Payment Methods">
                {report.payment_methods && report.payment_methods.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[320px]">
                      <thead>
                        <tr className="text-left text-sm text-slate-500">
                          <th className="px-4 py-2 font-semibold">Method</th>
                          <th className="px-4 py-2 text-center font-semibold">Count</th>
                          <th className="px-4 py-2 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.payment_methods.map((method, index) => (
                          <tr key={index} className="border-t border-slate-200 text-sm">
                            <td className="px-4 py-3 capitalize text-slate-700">{method.method}</td>
                            <td className="px-4 py-3 text-center text-slate-600">{method.count}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatNaira(method.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-8 text-center text-slate-500">No payment method data</p>
                )}
              </Card>
            </div>

            <Card title="Monthly Summary">
              {monthlyData && monthlyData.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {monthlyData.map((month, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="mb-3 text-lg font-semibold text-slate-900">{month.month_name}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total</span>
                          <span className="font-semibold text-slate-900">{formatNaira(month.total_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Transactions</span>
                          <span className="font-semibold text-slate-900">{month.transaction_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Average</span>
                          <span className="font-semibold text-slate-900">
                            {formatNaira(month.transaction_count > 0 ? month.total_amount / month.transaction_count : 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-amber-600">
                          <span>Highest</span>
                          <span className="font-semibold">{formatNaira(month.max_amount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-slate-500">No monthly data available</p>
              )}
            </Card>

            <Card title="Group Contribution Summary">
              <div className="mb-5 max-w-md">
                <label className="mb-2 block text-sm font-medium text-slate-700">Choose one of your groups</label>
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900" value={selectedGroup} onChange={e => loadGroupSummary(e.target.value)}>
                  <option value="">Select a group</option>
                  {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              </div>
              {groupSummary ? <>
                <div className="mb-4 flex flex-wrap gap-3"><Badge variant="success">{groupSummary.totalMembers} members</Badge><Badge variant="primary">Total raised: {formatNaira(groupSummary.totalRaised)}</Badge></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[520px]"><thead><tr className="border-b text-left text-sm text-slate-500"><th className="px-3 py-2">Member</th><th className="px-3 py-2 text-center">Contributions</th><th className="px-3 py-2 text-right">Amount contributed</th><th className="px-3 py-2 text-right">Last contribution</th></tr></thead><tbody>{groupSummary.contributions.map(member => <tr key={member.id} className="border-b border-slate-100 text-sm"><td className="px-3 py-3 font-semibold text-slate-800"><Users className="mr-2 inline text-sky-600" size={15} />{member.first_name} {member.last_name}</td><td className="px-3 py-3 text-center">{member.contribution_count}</td><td className="px-3 py-3 text-right font-bold">{formatNaira(member.total_contributed)}</td><td className="px-3 py-3 text-right text-slate-500">{member.last_contribution_date ? new Date(member.last_contribution_date).toLocaleDateString() : '—'}</td></tr>)}</tbody></table></div>
              </> : <p className="py-5 text-slate-500">Select a group to clearly see each member’s cash contribution.</p>}
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card title="Contribution flash messages">
                {contributionAlerts.length ? <div className="space-y-3">{contributionAlerts.slice(0, 5).map(alert => <Alert key={alert.id} type="info" message={alert.message} />)}</div> : <p className="text-slate-500">No member contribution alerts yet.</p>}
              </Card>
              <Card title="Individual personal savings">
                <div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-slate-500">Saved</p><p className="mt-1 text-xl font-bold text-emerald-700">{formatNaira(personalSavings?.total_saved)}</p></div><div><p className="text-sm text-slate-500">Goal</p><p className="mt-1 text-xl font-bold text-sky-700">{formatNaira(personalSavings?.savings_goal)}</p></div></div>
                {personalSavings?.description && <p className="mt-4 text-sm text-slate-600">{personalSavings.description}</p>}
              </Card>
            </div>

            <Card title="Public group contributions">
              <p className="mb-4 text-sm text-slate-500">Join or exit a public group, and view its savings target and contribution expectation.</p>
              {publicGroups.length ? <div className="grid gap-3 md:grid-cols-2">{publicGroups.map(group => { const isMember = groups.some(item => item.id === group.id); return <div key={group.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{group.name}</p><p className="mt-1 text-sm text-slate-500">Target: {formatNaira(group.target_amount)}</p><p className="mt-1 text-sm text-slate-500">Expectation: {group.savings_expectation || 'Not specified'}</p></div><Button size="sm" variant={isMember ? 'danger' : 'primary'} onClick={() => manageGroupMembership(group.id, isMember)}>{isMember ? 'Exit group' : 'Join group'}</Button></div></div>; })}</div> : <p className="text-slate-500">No public group contributions are available.</p>}
            </Card>

            <div className="flex justify-start">
              <Button
                variant="primary"
                onClick={() => {
                  const element = document.createElement('a');
                  const file = new Blob([
                    JSON.stringify(report, null, 2)
                  ], { type: 'application/json' });
                  element.href = URL.createObjectURL(file);
                  element.download = `expense-report-${startDate}-to-${endDate}.json`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
              >
                <Download size={16} />
                Export as JSON
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <p className="py-8 text-center text-slate-500">No data available. Click "Generate Report" to start.</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;

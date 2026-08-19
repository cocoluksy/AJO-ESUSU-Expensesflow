import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Plus, Banknote, CalendarDays, Activity } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Alert, Button, Card, Input, Select, Spinner } from '../components/common/FormElements';
import { contributionAPI, walletAPI } from '../services/api';
import { formatNaira } from '../utils/currency';

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [monitor, setMonitor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [contributionTracking, setContributionTracking] = useState({ totalAmount: 0, totalContributions: 0, contributions: [] });
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [method, setMethod] = useState('bank transfer');
  const [schedule, setSchedule] = useState({ payoutDate: '', amount: '', frequency: 'monthly' });

  const load = async () => {
    try {
      setLoading(true);
      const [walletRes, monitorRes, scheduleRes, trackingRes] = await Promise.all([walletAPI.get(), walletAPI.monitor(), walletAPI.getSchedules(), contributionAPI.track()]);
      setWallet(walletRes.data.data); setMonitor(monitorRes.data.data); setSchedules(scheduleRes.data.data || []); setContributionTracking(trackingRes.data.data || {});
    } catch (err) { setError(err.response?.data?.message || 'Unable to load your wallet.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const submit = async (event, action) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      if (action === 'add') await walletAPI.addMoney({ amount: addAmount, description: 'Wallet top up' });
      if (action === 'cash') await walletAPI.cashOut({ amount: cashAmount, payoutMethod: method });
      if (action === 'schedule') await walletAPI.createSchedule(schedule);
      setMessage(action === 'cash' ? 'Cash-out request completed.' : action === 'schedule' ? 'Payout schedule saved.' : 'Money added to wallet.');
      setAddAmount(''); setCashAmount(''); setSchedule({ payoutDate: '', amount: '', frequency: 'monthly' }); await load();
    } catch (err) { setError(err.response?.data?.message || 'The request could not be completed.'); }
  };
  const money = formatNaira;
  return <DashboardLayout><div className="space-y-6">
    <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Money centre</p><h1 className="mt-2 text-3xl font-bold">Wallet & payouts</h1></div>
    {message && <Alert type="success" message={message} onClose={() => setMessage('')} />}{error && <Alert type="danger" message={error} onClose={() => setError('')} />}
    {loading ? <div className="py-24"><Spinner size="lg" /></div> : <>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><Card className="border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white"><div className="flex items-start justify-between"><div><p className="text-sm text-sky-100">Available wallet balance</p><div className="mt-4 flex items-center gap-3"><p className="text-4xl font-bold">{visible ? money(wallet?.balance) : '••••••••'}</p><button className="rounded-xl bg-white/10 p-2 hover:bg-white/20" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide balance' : 'Show balance'}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div><p className="mt-4 text-sm text-slate-300">Your balance is hidden until you select the eye icon.</p></div><Activity className="text-sky-300" size={30} /></div></Card>
      <Card title="Monitor balances"><div className="space-y-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Total added</span><strong>{money(monitor?.total_deposits)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Total cashed out</span><strong>{money(monitor?.total_withdrawals)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Transactions</span><strong>{monitor?.total_transactions || 0}</strong></div></div></Card></div>
      <div className="grid gap-6 xl:grid-cols-3"><Card title="Add money"><form className="space-y-4" onSubmit={(e) => submit(e, 'add')}><Input label="Amount" type="number" min="1" step="0.01" value={addAmount} onChange={e => setAddAmount(e.target.value)} required /><Button type="submit" className="w-full"><Plus size={17} /> Add money</Button></form></Card><Card title="Cash out"><form className="space-y-4" onSubmit={(e) => submit(e, 'cash')}><Input label="Amount" type="number" min="1" step="0.01" value={cashAmount} onChange={e => setCashAmount(e.target.value)} required /><Select label="Payout method" value={method} onChange={e => setMethod(e.target.value)} options={[{ value: 'bank transfer', label: 'Bank transfer' }, { value: 'mobile money', label: 'Mobile money' }]} /><Button type="submit" variant="secondary" className="w-full"><Banknote size={17} /> Cash out</Button></form></Card><Card title="Manage payout schedule"><form className="space-y-4" onSubmit={(e) => submit(e, 'schedule')}><Input label="Payout date" type="date" value={schedule.payoutDate} onChange={e => setSchedule({ ...schedule, payoutDate: e.target.value })} required /><Input label="Amount" type="number" min="1" step="0.01" value={schedule.amount} onChange={e => setSchedule({ ...schedule, amount: e.target.value })} required /><Select label="Frequency" value={schedule.frequency} onChange={e => setSchedule({ ...schedule, frequency: e.target.value })} options={[{ value: 'once', label: 'Once' }, { value: 'monthly', label: 'Monthly' }, { value: 'weekly', label: 'Weekly' }]} /><Button type="submit" className="w-full"><CalendarDays size={17} /> Save schedule</Button></form></Card></div>
      <Card title="Upcoming payout schedules">{schedules.length ? <div className="space-y-3">{schedules.map(item => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-semibold">{new Date(item.payout_date).toLocaleDateString()}</p><p className="text-sm text-slate-500 capitalize">{item.frequency} · {item.status}</p></div><strong>{money(item.amount)}</strong></div>)}</div> : <p className="text-slate-500">No payout schedules yet.</p>}</Card>
      <Card title="Track contributions"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm text-slate-600">Total contributed</p><p className="mt-2 text-2xl font-bold text-emerald-700">{money(contributionTracking.totalAmount)}</p></div><div className="rounded-xl bg-sky-50 p-4"><p className="text-sm text-slate-600">Contributions made</p><p className="mt-2 text-2xl font-bold text-sky-700">{contributionTracking.totalContributions || 0}</p></div></div>{contributionTracking.contributions?.length > 0 && <div className="mt-4 space-y-2">{contributionTracking.contributions.slice(0, 3).map(item => <div key={item.id} className="flex justify-between text-sm"><span className="text-slate-600">{item.group_name}</span><strong>{money(item.amount)}</strong></div>)}</div>}</Card>
    </>}</div></DashboardLayout>;
};
export default WalletPage;

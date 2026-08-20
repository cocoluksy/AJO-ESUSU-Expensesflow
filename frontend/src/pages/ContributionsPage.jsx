import React, { useEffect, useState } from 'react';
import { Bell, CalendarClock, Coins, DoorOpen, Plus, RotateCcw, Save, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Alert, Badge, Button, Card, Input, Select, Spinner, Textarea } from '../components/common/FormElements';
import { contributionAPI } from '../services/api';
import { formatNaira } from '../utils/currency';

const formatDate = (value) => {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
};

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
].map(m => ({ value: m, label: m }));

const ContributionsPage = () => {
  const [publicGroups, setPublicGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [tracking, setTracking] = useState({ totalAmount: 0, totalContributions: 0, contributions: [] });
  const [notifications, setNotifications] = useState([]);
  const [savingsHistory, setSavingsHistory] = useState([]);
  const [savingsGrandTotal, setSavingsGrandTotal] = useState(0);

  const [group, setGroup] = useState({ name: '', description: '', targetAmount: '', savingsExpectation: '' });
  const [contribution, setContribution] = useState({ groupId: '', memberId: '', amount: '', month: '', description: '' });
  const [savingsEntry, setSavingsEntry] = useState({ amount: '', description: '', entryDate: '' });

  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [groupSummary, setGroupSummary] = useState(null);
  const [guestForm, setGuestForm] = useState({ name: '', address: '' });
  const [payoutDateInputs, setPayoutDateInputs] = useState({});
  const [contributionGroupMembers, setContributionGroupMembers] = useState([]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [pub, mine, track, notes, history] = await Promise.all([
        contributionAPI.getPublicGroups(),
        contributionAPI.getMyGroups(),
        contributionAPI.track(),
        contributionAPI.notifications(),
        contributionAPI.getSavingsHistory()
      ]);
      setPublicGroups(pub.data.data || []);
      setMyGroups(mine.data.data || []);
      setTracking(track.data.data || {});
      setNotifications(notes.data.data || []);
      setSavingsHistory(history.data.data || []);
      setSavingsGrandTotal(history.data.grandTotal || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load contribution data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // When the user picks a group in the contribution form, load that group's member list for the name dropdown
  useEffect(() => {
    const fetchMembers = async () => {
      if (!contribution.groupId) {
        setContributionGroupMembers([]);
        return;
      }
      try {
        const res = await contributionAPI.summary(contribution.groupId);
        setContributionGroupMembers(res.data.contributions || []);
      } catch (err) {
        setContributionGroupMembers([]);
      }
    };
    fetchMembers();
  }, [contribution.groupId]);

  const action = async (event, type, id) => {
    event?.preventDefault();
    setError('');
    try {
      if (type === 'exit') await contributionAPI.exitGroup(id);
      if (type === 'group') await contributionAPI.createGroup({ ...group, groupType: 'public' });
      if (type === 'contribution') await contributionAPI.addContribution(contribution);
      if (type === 'savings') await contributionAPI.addSavingsEntry(savingsEntry);
      if (type === 'requestJoin') await contributionAPI.requestToJoin(id);

      setMessage(
        type === 'exit' ? 'You have exited the group.' :
        type === 'contribution' ? 'Cash contribution recorded and added to their total.' :
        type === 'group' ? 'Group created successfully.' :
        type === 'requestJoin' ? 'The group admin has been notified.' :
        'Savings entry recorded.'
      );

      setGroup({ name: '', description: '', targetAmount: '', savingsExpectation: '' });
      setContribution({ groupId: '', memberId: '', amount: '', month: '', description: '' });
      setSavingsEntry({ amount: '', description: '', entryDate: '' });

      await load();
      if (expandedGroupId) await loadGroupSummary(expandedGroupId);
    } catch (err) {
      setError(err.response?.data?.message || 'The request could not be completed.');
    }
  };

  const loadGroupSummary = async (groupId) => {
    try {
      setError('');
      const res = await contributionAPI.summary(groupId);
      setGroupSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load group details.');
    }
  };

  const toggleGroup = async (groupId) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
      setGroupSummary(null);
      return;
    }
    setExpandedGroupId(groupId);
    await loadGroupSummary(groupId);
  };

  const handleAddGuest = async (e, groupId) => {
    e.preventDefault();
    setError('');
    try {
      await contributionAPI.addGuestMember(groupId, guestForm);
      setMessage('Member added to the group.');
      setGuestForm({ name: '', address: '' });
      await loadGroupSummary(groupId);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add member.');
    }
  };

  const handleRemoveMember = async (groupId, memberId) => {
    setError('');
    try {
      await contributionAPI.removeMember(groupId, memberId);
      setMessage('Member removed from the group.');
      await loadGroupSummary(groupId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove member.');
    }
  };

  const handleReaddMember = async (groupId, memberId) => {
    setError('');
    try {
      await contributionAPI.readdMember(groupId, memberId);
      setMessage('Member re-added to the group.');
      await loadGroupSummary(groupId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not re-add member.');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group permanently? This cannot be undone.')) return;
    setError('');
    try {
      await contributionAPI.deleteGroup(groupId);
      setMessage('Group deleted successfully.');
      setExpandedGroupId(null);
      setGroupSummary(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete group.');
    }
  };

  const handleSetPayoutDate = async (e, groupId, memberId) => {
    e.preventDefault();
    setError('');
    const payoutDate = payoutDateInputs[memberId];
    try {
      await contributionAPI.setPayoutDate(groupId, memberId, { payoutDate });
      setMessage('Payout date updated.');
      await loadGroupSummary(groupId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update payout date.');
    }
  };

  const currency = formatNaira;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-emerald-600">Shared savings</p>
          <h1 className="mt-2 text-3xl font-bold">Group contributions</h1>
        </div>

        {message && <Alert type="success" message={message} onClose={() => setMessage('')} />}
        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        {loading ? (
          <div className="py-24"><Spinner size="lg" /></div>
        ) : (
          <>
            {notifications.filter(n => n.type === 'contribution').slice(0, 2).map(note => (
              <Alert key={note.id} type="info" message={`Cash contribution: ${note.message}`} />
            ))}
            {notifications.filter(n => n.type === 'join_request').slice(0, 2).map(note => (
              <Alert key={note.id} type="info" message={`Join request: ${note.message}`} />
            ))}

            <div className="grid gap-6 xl:grid-cols-2">
              <Card title="Save individually (not in a group)">
                <form onSubmit={e => action(e, 'savings')} className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm text-slate-600">Grand total saved</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">{currency(savingsGrandTotal)}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Amount" type="number" min="0" step="0.01" value={savingsEntry.amount} onChange={e => setSavingsEntry({ ...savingsEntry, amount: e.target.value })} required />
                    <Input label="Date saved" type="date" value={savingsEntry.entryDate} onChange={e => setSavingsEntry({ ...savingsEntry, entryDate: e.target.value })} />
                  </div>
                  <Textarea label="Note" rows={2} value={savingsEntry.description} onChange={e => setSavingsEntry({ ...savingsEntry, description: e.target.value })} />
                  <Button type="submit"><Save size={17} /> Record savings</Button>
                </form>
                <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
                  {savingsHistory.length ? savingsHistory.map(entry => (
                    <div key={entry.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span>{formatDate(entry.entry_date)} {entry.description ? `- ${entry.description}` : ''}</span>
                      <strong>{currency(entry.amount)}</strong>
                    </div>
                  )) : <p className="text-sm text-slate-500">No personal savings recorded yet.</p>}
                </div>
              </Card>

              <Card title="Contribution tracker">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm text-slate-600">Total contributed</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">{currency(tracking.totalAmount)}</p>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-4">
                    <p className="text-sm text-slate-600">Contributions made</p>
                    <p className="mt-2 text-2xl font-bold text-sky-700">{tracking.totalContributions || 0}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {tracking.contributions?.slice(0, 5).map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.group_name} - {formatDate(item.contribution_date)}</span>
                      <strong>{currency(item.amount)}</strong>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card title="Browse public groups">
                <div className="space-y-3">
                  {publicGroups.map(item => {
                    const member = myGroups.some(groupItem => groupItem.id === item.id);
                    return (
                      <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{item.savings_expectation || item.description || 'Shared group savings'}</p>
                            <p className="mt-2 text-xs text-slate-500"><Users className="mr-1 inline" size={13} />{item.member_count} members - Goal {currency(item.target_amount)}</p>
                          </div>
                          {member ? (
                            <Button variant="danger" size="sm" onClick={() => action(null, 'exit', item.id)}><DoorOpen size={15} /> Exit</Button>
                          ) : (
                            <Button size="sm" variant="secondary" onClick={() => action(null, 'requestJoin', item.id)}>
                              <Bell size={14} /> Ask the group admin to add you
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!publicGroups.length && <p className="text-slate-500">No public groups yet. Create one below.</p>}
                </div>
              </Card>

              <Card title="Create public contribution group">
                <form className="space-y-3" onSubmit={e => action(e, 'group')}>
                  <Input label="Group name" value={group.name} onChange={e => setGroup({ ...group, name: e.target.value })} required />
                  <Textarea label="Description" rows={2} value={group.description} onChange={e => setGroup({ ...group, description: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Group savings goal" type="number" min="0" value={group.targetAmount} onChange={e => setGroup({ ...group, targetAmount: e.target.value })} />
                    <Input label="Savings expectation" placeholder="e.g. monthly" value={group.savingsExpectation} onChange={e => setGroup({ ...group, savingsExpectation: e.target.value })} />
                  </div>
                  <Button type="submit"><Plus size={17} /> Create group</Button>
                </form>
              </Card>
            </div>

            <Card title="Make a cash contribution">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={e => action(e, 'contribution')}>
                <Select
                  label="Your group"
                  value={contribution.groupId}
                  onChange={e => setContribution({ ...contribution, groupId: e.target.value, memberId: '' })}
                  options={myGroups.map(item => ({ value: item.id, label: item.name }))}
                  required
                />
                <Select
                  label="Member's name"
                  value={contribution.memberId}
                  onChange={e => setContribution({ ...contribution, memberId: e.target.value })}
                  options={contributionGroupMembers.map(m => ({ value: m.member_id, label: `${m.first_name} ${m.last_name || ''}`.trim() }))}
                  required
                />
                <Input label="Amount paid" type="number" min="1" step="0.01" value={contribution.amount} onChange={e => setContribution({ ...contribution, amount: e.target.value })} required />
                <Select
                  label="Month payment is for"
                  value={contribution.month}
                  onChange={e => setContribution({ ...contribution, month: e.target.value })}
                  options={MONTH_OPTIONS}
                />
                <div className="md:col-span-2">
                  <Input label="Brief note" value={contribution.description} onChange={e => setContribution({ ...contribution, description: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit"><Coins size={17} /> Contribute</Button>
                </div>
              </form>
            </Card>

            <Card title="Your groups">
              <div className="space-y-4">
                {myGroups.length === 0 && <p className="text-slate-500">You haven't joined or created any groups yet.</p>}
                {myGroups.map(item => {
                  const isAdmin = item.role === 'admin';
                  const isExpanded = expandedGroupId === item.id;
                  return (
                    <div key={item.id} className="rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-semibold">{item.name} {isAdmin && <Badge variant="primary" size="sm"><ShieldCheck size={12} className="mr-1 inline" />Admin</Badge>}</p>
                          <p className="mt-1 text-xs text-slate-500">Group balance: {currency(item.group_balance)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toggleGroup(item.id)}>
                            {isExpanded ? 'Hide details' : 'View / manage'}
                          </Button>
                          {isAdmin && (
                            <Button size="sm" variant="danger" onClick={() => handleDeleteGroup(item.id)}>
                              <Trash2 size={14} /> Delete
                            </Button>
                          )}
                        </div>
                      </div>

                      {isExpanded && groupSummary && (
                        <div className="space-y-4 border-t border-slate-200 p-4">
                          <div className="rounded-xl bg-emerald-50 p-4">
                            <p className="text-sm text-slate-600">Grand total raised by this group</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-700">{currency(groupSummary.totalRaised)}</p>
                          </div>

                          <div className="space-y-2">
                            {groupSummary.contributions.map(member => (
                              <div key={member.member_id} className="rounded-xl border border-slate-200 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="font-medium">
                                      {member.first_name} {member.last_name || ''}
                                      {member.is_guest && <Badge size="sm" variant="secondary" className="ml-2">Guest</Badge>}
                                    </p>
                                    {member.is_guest && member.guest_address && (
                                      <p className="text-xs text-slate-500">{member.guest_address}</p>
                                    )}
                                    <p className="mt-1 text-xs text-slate-500">
                                      Total contributed so far: <strong>{currency(member.total_contributed)}</strong>
                                      {' - '}Last contribution: {formatDate(member.last_contribution_date)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      <CalendarClock size={12} className="mr-1 inline" />
                                      Payout date: {formatDate(member.payout_date)}
                                      {member.payout_received && <Badge size="sm" variant="success" className="ml-2">Received</Badge>}
                                    </p>
                                  </div>

                                  {isAdmin && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <form onSubmit={e => handleSetPayoutDate(e, item.id, member.member_id)} className="flex items-center gap-2">
                                        <input
                                          type="date"
                                          className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                                          value={payoutDateInputs[member.member_id] || ''}
                                          onChange={e => setPayoutDateInputs({ ...payoutDateInputs, [member.member_id]: e.target.value })}
                                        />
                                        <Button type="submit" size="sm" variant="secondary">Set date</Button>
                                      </form>
                                      <Button size="sm" variant="danger" onClick={() => handleRemoveMember(item.id, member.member_id)}>
                                        <Trash2 size={14} /> Remove
                                      </Button>
                                      <Button size="sm" variant="secondary" onClick={() => handleReaddMember(item.id, member.member_id)}>
                                        <RotateCcw size={14} /> Re-add
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {isAdmin && (
                            <form onSubmit={e => handleAddGuest(e, item.id)} className="space-y-3 rounded-xl bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-700"><UserPlus size={15} className="mr-1 inline" />Add a member (name and address only)</p>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Input label="Full name" value={guestForm.name} onChange={e => setGuestForm({ ...guestForm, name: e.target.value })} required />
                                <Input label="Address" value={guestForm.address} onChange={e => setGuestForm({ ...guestForm, address: e.target.value })} />
                              </div>
                              <Button type="submit" size="sm"><UserPlus size={15} /> Add member</Button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ContributionsPage;
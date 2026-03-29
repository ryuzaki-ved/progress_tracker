import React, { useEffect, useMemo, useState } from 'react';

import { Card } from '../components/ui/Card';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, Trash2, Users, Download, X, ChevronRight, Info, Activity, Coins, Database } from 'lucide-react';
import { useAuth, User } from '../hooks/useAuth';


interface UserWithLeaderboard extends User {
    show_in_leaderboard?: number;
}

type AdminUserDetails = {
    user: {
        id: number;
        username: string;
        role: string;
        show_in_leaderboard: number;
        cash_balance: number | null;
    };
    stats: {
        stockCount: number;
        archivedStockCount: number;
        holdingsCount: number;
        optionHoldingsCount: number;
        taskCounts: {
            pending: number;
            completed: number;
            overdue: number;
            skipped: number;
            cancelled: number;
            total: number;
        };
        notesCount: number;
        journalCount: number;
        reviewsCount: number;
        alertsUnreadCount: number;
        achievementsUnlockedCount: number;
        achievementsTotalCount: number;
        transactionsCount: number;
        optionTransactionsCount: number;
    };
    activity: {
        lastStockActivityAt: string | null;
        lastIndexUpdateAt: string | null;
        lastNoteUpdateAt: string | null;
        lastJournalUpdateAt: string | null;
    };
    lists: {
        topStocks: Array<{
            id: number;
            name: string;
            category: string | null;
            current_score: number;
            created_at: string | null;
            last_activity_at: string | null;
            is_archived: number;
        }>;
        recentTasks: Array<{
            id: number;
            title: string;
            status: string;
            priority: string;
            points: number;
            due_date: string | null;
            completed_at: string | null;
            created_at: string | null;
            stock_name: string;
        }>;
        recentNotes: Array<{
            id: number;
            title: string;
            category: string;
            is_pinned: number;
            is_archived: number;
            created_at: string;
            updated_at: string;
        }>;
        recentTransactions: Array<{
            id: number;
            type: string;
            quantity: number;
            price: number;
            brokerage_fee: number;
            timestamp: string;
            stock_name: string;
        }>;
        latestIndexRow: null | {
            date: string;
            open: number;
            high: number;
            low: number;
            close: number;
            daily_change: number;
            change_percent: number;
            commentary: string | null;
            created_at: string;
        };
        streaks: Array<{
            type: string;
            current_streak: number;
            longest_streak: number;
            last_activity_date: string | null;
            is_active: number;
            updated_at: string | null;
        }>;
        recentAlerts: Array<{
            id: number;
            type: string;
            title: string;
            message: string;
            severity: string;
            is_read: number;
            is_dismissed: number;
            created_at: string;
        }>;
    };
};

const formatWhen = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
};

const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; tone?: 'violet' | 'emerald' | 'amber' | 'red' | 'gray' }> = ({ icon, label, value, tone = 'gray' }) => {
    const toneClass =
        tone === 'violet'
            ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
            : tone === 'emerald'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : tone === 'amber'
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            : tone === 'red'
            ? 'bg-red-500/15 border-red-500/30 text-red-300'
            : 'bg-gray-800/60 border-gray-700 text-gray-200';

    return (
        <div className={`rounded-xl border p-3 ${toneClass}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="opacity-90">{icon}</div>
                    <div className="text-xs uppercase tracking-wide opacity-80 truncate">{label}</div>
                </div>
                <div className="text-sm font-semibold text-white">{value}</div>
            </div>
        </div>
    );
};

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode }> = ({ title, subtitle, children, right }) => {
    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{title}</div>
                    {subtitle ? <div className="text-xs text-gray-400">{subtitle}</div> : null}
                </div>
                {right}
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">{children}</div>
        </div>
    );
};

const UserDetailsDrawer: React.FC<{
    open: boolean;
    onClose: () => void;
    details: AdminUserDetails | null;
    loading: boolean;
    error: string | null;
}> = ({ open, onClose, details, loading, error }) => {
    const username = details?.user?.username;
    const headerSubtitle = useMemo(() => {
        if (loading) return 'Loading full dossier…';
        if (error) return 'Failed to load user details';
        return 'Full profile, stats, and recent activity';
    }, [loading, error]);

    return (
        <AnimatePresence>
            {open ? (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.aside
                        className="fixed right-0 top-0 bottom-0 w-full sm:max-w-xl z-50 border-l border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 shadow-2xl"
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 40, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="User details"
                    >
                        <div className="h-full flex flex-col">
                            <div className="p-5 border-b border-gray-800">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 bg-violet-500/15 rounded-xl flex items-center justify-center border border-violet-500/30">
                                                <Info className="w-5 h-5 text-violet-300" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-lg font-bold text-white truncate">{username ? `${username}` : 'User Details'}</div>
                                                <div className="text-xs text-gray-400">{headerSubtitle}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg transition-colors hover:bg-white/5 text-gray-300"
                                        title="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                {loading ? (
                                    <div className="space-y-3">
                                        <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
                                        <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
                                        <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
                                    </div>
                                ) : error ? (
                                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                                        {error}
                                    </div>
                                ) : details ? (
                                    <>
                                        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="px-2 py-1 text-xs font-semibold rounded-md bg-gray-800 text-gray-200 border border-gray-700">
                                                    ID: {details.user.id}
                                                </span>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-md ${details.user.role === 'admin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'}`}>
                                                    {details.user.role.toUpperCase()}
                                                </span>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-md ${details.user.show_in_leaderboard ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                                                    Public Comparison: {details.user.show_in_leaderboard ? 'Visible' : 'Hidden'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                <StatPill icon={<Database className="w-4 h-4" />} label="Stocks" value={details.stats.stockCount} tone="violet" />
                                                <StatPill icon={<Database className="w-4 h-4" />} label="Archived" value={details.stats.archivedStockCount} tone="gray" />
                                                <StatPill icon={<Activity className="w-4 h-4" />} label="Tasks total" value={details.stats.taskCounts.total} tone="amber" />
                                                <StatPill icon={<Activity className="w-4 h-4" />} label="Completed" value={details.stats.taskCounts.completed} tone="emerald" />
                                                <StatPill icon={<Coins className="w-4 h-4" />} label="Cash" value={details.user.cash_balance ?? '—'} tone="emerald" />
                                                <StatPill icon={<Activity className="w-4 h-4" />} label="Alerts (unread)" value={details.stats.alertsUnreadCount} tone={details.stats.alertsUnreadCount ? 'red' : 'gray'} />
                                            </div>

                                            <div className="grid grid-cols-1 gap-2 mt-4 text-xs text-gray-400">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>Last stock activity</div>
                                                    <div className="text-gray-200">{formatWhen(details.activity.lastStockActivityAt)}</div>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>Last index update</div>
                                                    <div className="text-gray-200">{formatWhen(details.activity.lastIndexUpdateAt)}</div>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>Last notes update</div>
                                                    <div className="text-gray-200">{formatWhen(details.activity.lastNoteUpdateAt)}</div>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>Last journal update</div>
                                                    <div className="text-gray-200">{formatWhen(details.activity.lastJournalUpdateAt)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <Section
                                            title="Top stocks"
                                            subtitle="Highest scoring (and not archived first)"
                                            right={<div className="text-xs text-gray-500">{details.lists.topStocks.length} shown</div>}
                                        >
                                            {details.lists.topStocks.length ? (
                                                <div className="space-y-2">
                                                    {details.lists.topStocks.map((s) => (
                                                        <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-black/20 px-3 py-2">
                                                            <div className="min-w-0">
                                                                <div className="text-sm text-white truncate">{s.name}</div>
                                                                <div className="text-xs text-gray-500 truncate">
                                                                    {s.category || 'Uncategorized'} • {s.is_archived ? 'Archived' : 'Active'}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm font-semibold text-violet-200">{Math.round(s.current_score)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500">No stocks found.</div>
                                            )}
                                        </Section>

                                        <Section title="Recent tasks" subtitle="Most recently updated/created across all stocks">
                                            {details.lists.recentTasks.length ? (
                                                <div className="space-y-2">
                                                    {details.lists.recentTasks.map((t) => (
                                                        <div key={t.id} className="rounded-lg border border-gray-800 bg-black/20 p-3">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <div className="text-sm text-white truncate">{t.title}</div>
                                                                    <div className="text-xs text-gray-500 truncate">{t.stock_name}</div>
                                                                </div>
                                                                <div className="text-xs text-gray-300">{t.status}</div>
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                                <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">Priority: {t.priority}</span>
                                                                <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">Points: {t.points}</span>
                                                                {t.due_date ? (
                                                                    <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">Due: {t.due_date}</span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500">No tasks found.</div>
                                            )}
                                        </Section>

                                        <Section title="Notes" subtitle="Pinned first, then most recently updated">
                                            {details.lists.recentNotes.length ? (
                                                <div className="space-y-2">
                                                    {details.lists.recentNotes.map((n) => (
                                                        <div key={n.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-black/20 px-3 py-2">
                                                            <div className="min-w-0">
                                                                <div className="text-sm text-white truncate">{n.title}</div>
                                                                <div className="text-xs text-gray-500 truncate">
                                                                    {n.category} • Updated {formatWhen(n.updated_at)}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[11px]">
                                                                {n.is_pinned ? <span className="px-2 py-1 rounded-md bg-amber-500/15 text-amber-200 border border-amber-500/30">Pinned</span> : null}
                                                                {n.is_archived ? <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">Archived</span> : null}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500">No notes found.</div>
                                            )}
                                        </Section>

                                        <Section title="Recent transactions" subtitle="Last 12 stock transactions">
                                            {details.lists.recentTransactions.length ? (
                                                <div className="space-y-2">
                                                    {details.lists.recentTransactions.map((tx) => (
                                                        <div key={tx.id} className="rounded-lg border border-gray-800 bg-black/20 px-3 py-2">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <div className="text-sm text-white truncate">
                                                                        {tx.type.toUpperCase()} • {tx.stock_name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 truncate">{formatWhen(tx.timestamp)}</div>
                                                                </div>
                                                                <div className="text-xs text-gray-300">
                                                                    {tx.quantity} @ {tx.price}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500">No transactions found.</div>
                                            )}
                                        </Section>
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-500">Select a user to view details.</div>
                                )}
                            </div>
                        </div>
                    </motion.aside>
                </>
            ) : null}
        </AnimatePresence>
    );
};

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState<UserWithLeaderboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [selectedUserDetails, setSelectedUserDetails] = useState<AdminUserDetails | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}` }
            });
            const result = await response.json();
            if (result.data) setAllUsers(result.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [user]);

    const handleDeleteUser = async (userId: number) => {
        if (userId === user?.id) {
            alert("You cannot delete your own admin account.");
            return;
        }
        const confirmed = window.confirm('Are you sure you want to permanently delete this user and all their data?');
        if (confirmed) {
            try {
                await fetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}` }
                });
                await fetchUsers();
            } catch (err) {
                console.error('Failed to delete user:', err);
                alert('Failed to delete user data');
            }
        }
    };

    const handleExportUser = async (userToExport: UserWithLeaderboard) => {
        try {
            const response = await fetch(`/api/data/export?userId=${userToExport.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}` }
            });
            const result = await response.json();
            if (result.error) throw new Error(result.error);
            
            const exportData = result.data;
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lifestock-backup-${userToExport.username}-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export user data');
        }
    };

    const handleToggleLeaderboard = async (userId: number, currentStatus: number) => {
        try {
            await fetch(`/api/admin/users/${userId}/leaderboard`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ show_in_leaderboard: !currentStatus })
            });
            await fetchUsers();
        } catch (err) {
            console.error('Failed to toggle visibility:', err);
        }
    };

    const openUserDetails = async (userId: number) => {
        setSelectedUserId(userId);
        setDetailsOpen(true);
        setDetailsLoading(true);
        setDetailsError(null);
        setSelectedUserDetails(null);
        try {
            const response = await fetch(`/api/admin/users/${userId}/details`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}` }
            });
            const result = await response.json();
            if (!response.ok || result.error) {
                throw new Error(result.error || 'Failed to load details');
            }
            setSelectedUserDetails(result.data as AdminUserDetails);
        } catch (err: any) {
            setDetailsError(err?.message || 'Failed to load details');
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setDetailsOpen(false);
        setDetailsError(null);
    };

    if (user?.role !== 'admin') {
        return (
            <div className="p-6 text-center text-gray-500">
                You do not have permission to view this page.
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/50 shadow-neon-sm">
                    <Shield className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white text-glow font-display">System Administration</h1>
                    <p className="text-gray-400">Manage all registered users and system data</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <Users className="w-8 h-8 text-violet-400 mb-2" />
                    <p className="text-sm text-gray-400">Total Users</p>
                    <p className="text-3xl font-bold text-white">{allUsers.length}</p>
                </Card>
            </div>

            <Card>
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">User Directory</h2>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-700 text-gray-400">
                                        <th className="py-3 px-4 font-medium">ID</th>
                                        <th className="py-3 px-4 font-medium">Username / Email</th>
                                        <th className="py-3 px-4 font-medium">Role</th>
                                        <th className="py-3 px-4 font-medium text-center">Public Comparison</th>
                                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map((u) => (
                                        <tr
                                            key={u.id}
                                            className={`border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer ${selectedUserId === u.id && detailsOpen ? 'bg-white/5' : ''}`}
                                            onClick={() => openUserDetails(u.id)}
                                        >
                                            <td className="py-4 px-4 text-gray-300">{u.id}</td>
                                            <td className="py-4 px-4 font-medium text-white">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="truncate">{u.username}</div>
                                                    <div className="flex items-center text-xs text-gray-400">
                                                        <span className="hidden sm:inline">Details</span>
                                                        <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-md ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-violet-500/20 text-violet-400'}`}>
                                                    {u.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleLeaderboard(u.id, u.show_in_leaderboard || 0);
                                                    }}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                        u.show_in_leaderboard ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-neon-sm' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {u.show_in_leaderboard ? 'Visible' : 'Hidden'}
                                                </button>
                                            </td>
                                            <td className="py-4 px-4 text-right flex justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleExportUser(u);
                                                    }}
                                                    className="p-2 rounded-lg transition-colors hover:bg-emerald-500/20 text-emerald-400 mr-2"
                                                    title="Export User Data"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteUser(u.id);
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${u.id === user.id ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-600' : 'hover:bg-red-500/20 text-red-400'}`}
                                                    disabled={u.id === user.id}
                                                    title={u.id === user.id ? "Cannot delete self" : "Delete user and all data"}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {allUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">No users found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>

            <UserDetailsDrawer
                open={detailsOpen}
                onClose={closeDetails}
                details={selectedUserDetails}
                loading={detailsLoading}
                error={detailsError}
            />
        </div>
    );
};


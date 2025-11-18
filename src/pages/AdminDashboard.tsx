import React, { useEffect, useState } from 'react';

import { Card } from '../components/ui/Card';
import { Shield, Trash2, Users, Download } from 'lucide-react';
import { useAuth, User } from '../hooks/useAuth';


interface UserWithLeaderboard extends User {
    show_in_leaderboard?: number;
}

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState<UserWithLeaderboard[]>([]);
    const [loading, setLoading] = useState(true);

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
                                        <tr key={u.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4 text-gray-300">{u.id}</td>
                                            <td className="py-4 px-4 font-medium text-white">{u.username}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-md ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-violet-500/20 text-violet-400'}`}>
                                                    {u.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => handleToggleLeaderboard(u.id, u.show_in_leaderboard || 0)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                        u.show_in_leaderboard ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-neon-sm' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {u.show_in_leaderboard ? 'Visible' : 'Hidden'}
                                                </button>
                                            </td>
                                            <td className="py-4 px-4 text-right flex justify-end">
                                                <button
                                                    onClick={() => handleExportUser(u)}
                                                    className="p-2 rounded-lg transition-colors hover:bg-emerald-500/20 text-emerald-400 mr-2"
                                                    title="Export User Data"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
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
                                            <td colSpan={4} className="py-8 text-center text-gray-500">No users found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};


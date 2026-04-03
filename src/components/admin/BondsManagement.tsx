import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface BondsStats {
  totalBonds: number;
  pendingBonds: number;
  activeBonds: number;
  completedBonds: number;
  bothWon: number;
  bothFailed: number;
  creatorWon: number;
  challengerWon: number;
  calculatedDeposited: number;
  storedDeposited: number;
  totalMoneyInBonds: number;
}

interface Bond {
  id: number;
  creator_username: string;
  challenger_username: string;
  creator_amount: number;
  challenger_amount: number;
  status: string;
  winner: string;
  created_at: string;
}

export const BondsManagement: React.FC = () => {
  const [stats, setStats] = useState<BondsStats | null>(null);
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('lifestock_token');

  useEffect(() => {
    fetchStats();
    fetchBonds();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/bonds/statistics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setStats(result.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load bonds statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchBonds = async () => {
    try {
      const response = await fetch('/api/admin/bonds/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setBonds(result.data || []);
    } catch (err) {
      console.error('Failed to fetch bonds:', err);
    }
  };

  const handleUpdateDeposited = async () => {
    if (!newAmount || isNaN(Number(newAmount))) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch('/api/admin/bonds/deposited-pool/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: Number(newAmount) })
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      setNewAmount('');
      setError(null);
      await fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleResetDeposited = async () => {
    if (!window.confirm('Are you sure you want to reset the deposited pool to 0?')) return;

    try {
      setUpdating(true);
      console.log('Calling reset endpoint...');
      
      const response = await fetch('/api/admin/bonds/deposited-pool/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${result.error || 'Unknown error'}`);
      }
      
      setError(null);
      console.log('Reset successful, refetching stats...');
      
      // Refetch immediately, then again after delay
      await fetchStats();
      
      // Also refetch after 100ms to ensure database is synced
      setTimeout(() => {
        fetchStats();
      }, 100);
      
      setUpdating(false);
    } catch (err: any) {
      console.error('Reset error:', err);
      setError(err.message || 'Failed to reset pool');
      setUpdating(false);
    }
  };

  const handleDeleteBond = async (bondId: number) => {
    if (!window.confirm('Are you sure you want to delete this bond? This action cannot be undone.')) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/bonds/${bondId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      setError(null);
      setTimeout(() => {
        fetchBonds();
        fetchStats();
        setUpdating(false);
      }, 300);
    } catch (err: any) {
      setError(err.message);
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Bonds Management</h2>

      {/* Stats Grid */}
      {stats && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 border border-blue-500/50 bg-blue-500/10">
              <div className="text-xs text-gray-400">Total Bonds</div>
              <div className="text-2xl font-bold text-blue-400">{stats.totalBonds}</div>
            </Card>
            <Card className="p-4 border border-amber-500/50 bg-amber-500/10">
              <div className="text-xs text-gray-400">Pending</div>
              <div className="text-2xl font-bold text-amber-400">{stats.pendingBonds}</div>
            </Card>
            <Card className="p-4 border border-purple-500/50 bg-purple-500/10">
              <div className="text-xs text-gray-400">Active</div>
              <div className="text-2xl font-bold text-purple-400">{stats.activeBonds}</div>
            </Card>
            <Card className="p-4 border border-green-500/50 bg-green-500/10">
              <div className="text-xs text-gray-400">Completed</div>
              <div className="text-2xl font-bold text-green-400">{stats.completedBonds}</div>
            </Card>
          </div>

          {/* Outcome Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 border border-cyan-500/50 bg-cyan-500/10">
              <div className="text-xs text-gray-400">Both Won</div>
              <div className="text-2xl font-bold text-cyan-400">{stats.bothWon}</div>
            </Card>
            <Card className="p-4 border border-orange-500/50 bg-orange-500/10">
              <div className="text-xs text-gray-400">Both Failed</div>
              <div className="text-2xl font-bold text-orange-400">{stats.bothFailed}</div>
            </Card>
            <Card className="p-4 border border-yellow-500/50 bg-yellow-500/10">
              <div className="text-xs text-gray-400">Creator Won</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.creatorWon}</div>
            </Card>
            <Card className="p-4 border border-rose-500/50 bg-rose-500/10">
              <div className="text-xs text-gray-400">Challenger Won</div>
              <div className="text-2xl font-bold text-rose-400">{stats.challengerWon}</div>
            </Card>
          </div>

          {/* Money Stats */}
          <Card className="p-6 border border-purple-500/50 bg-purple-500/10">
            <h3 className="text-lg font-semibold text-white mb-4">💰 Deposited Pool Management</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Total Money in Active Bonds</div>
                  <div className="text-3xl font-bold text-purple-300">{stats.totalMoneyInBonds} pts</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Calculated Deposited (from failed bonds)</div>
                  <div className="text-3xl font-bold text-orange-300">{stats.calculatedDeposited} pts</div>
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">Current Stored Deposited Amount</div>
                  <div className="text-4xl font-bold text-green-400">{stats.storedDeposited} pts</div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="Enter new amount..."
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                      disabled={updating}
                    />
                    <Button
                      onClick={handleUpdateDeposited}
                      disabled={updating}
                      variant="primary"
                      className="text-sm"
                    >
                      Update
                    </Button>
                  </div>

                  <Button
                    onClick={handleResetDeposited}
                    disabled={updating}
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to 0
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bonds Table */}
      {bonds.length > 0 && (
        <Card className="p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">All Bonds ({bonds.length})</h3>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-4 py-3 text-left text-gray-300">Creator</th>
                  <th className="px-4 py-3 text-left text-gray-300">Challenger</th>
                  <th className="px-4 py-3 text-center text-gray-300">Stakes</th>
                  <th className="px-4 py-3 text-center text-gray-300">Status</th>
                  <th className="px-4 py-3 text-center text-gray-300">Winner</th>
                  <th className="px-4 py-3 text-left text-gray-300">Date</th>
                  <th className="px-4 py-3 text-center text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bonds.map(bond => (
                  <tr key={bond.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-gray-300">{bond.creator_username}</td>
                    <td className="px-4 py-3 text-gray-300">{bond.challenger_username}</td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {bond.creator_amount} + {bond.challenger_amount || '?'} pts
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        bond.status === 'pending_acceptance' ? 'bg-amber-500/20 text-amber-300' :
                        bond.status === 'active' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-purple-500/20 text-purple-300'
                      }`}>
                        {bond.status === 'pending_acceptance' ? 'Pending' :
                         bond.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        bond.winner === 'both' ? 'bg-green-500/20 text-green-300' :
                        bond.winner === 'none' ? 'bg-orange-500/20 text-orange-300' :
                        bond.winner === 'creator' ? 'bg-yellow-500/20 text-yellow-300' :
                        bond.winner === 'challenger' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {bond.winner || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(bond.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteBond(bond.id)}
                        disabled={updating}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition disabled:opacity-50"
                        title="Delete bond"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

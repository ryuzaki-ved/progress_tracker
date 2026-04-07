import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trophy, AlertCircle, CheckCircle, Clock, X, User, DollarSign } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useBonds, type Bond } from '../hooks/useBonds';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';

interface User {
  id: number;
  username: string;
}

export const PerformanceBonds: React.FC = () => {
  const { bonds, loading, createBond, acceptBond, completeBond, forfeitBond } = useBonds();
  const { user } = useAuth();
  const { tasks } = useTasks();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [creatorTaskId, setCreatorTaskId] = useState<number | null>(null);
  const [challengerId, setChallengerId] = useState<number | null>(null);
  const [creatorAmount, setCreatorAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  // For acceptance
  const [acceptingBondId, setAcceptingBondId] = useState<number | null>(null);
  const [challengerTaskId, setChallengerTaskId] = useState<number | null>(null);
  const [challengerAmount, setChallengerAmount] = useState('');

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available tasks - filter out completed ones
  const availableTasks = useMemo(() => {
    return (tasks || []).filter(task => task.status === 'pending' || task.status === 'overdue').map(task => ({
      id: task.id,
      title: task.title,
      stockName: task.stock?.name || 'Unknown'
    }));
  }, [tasks]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/bonds/available-users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('lifestock_token')}` }
      });
      const result = await response.json();
      if (result.data) setAvailableUsers(result.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleCreateClick = async () => {
    if (!showCreateForm) {
      await fetchAvailableUsers();
    }
    setShowCreateForm(!showCreateForm);
    setError(null);
  };

  const handleCreateBond = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!creatorTaskId || !challengerId || !creatorAmount || !dueDate || !dueTime) {
      setError('Please fill all fields');
      return;
    }

    const amount = parseInt(creatorAmount);
    if (amount <= 0 || amount > 100) {
      setError('Amount must be between 1 and 100');
      return;
    }

    setLoadingSubmit(true);
    try {
      const due = new Date(`${dueDate}T${dueTime}`);
      await createBond(challengerId, creatorTaskId, amount, due.toISOString());
      setCreatorTaskId(null);
      setChallengerId(null);
      setCreatorAmount('');
      setDueDate('');
      setDueTime('');
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleAcceptBond = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBond || !challengerTaskId || !challengerAmount) {
      setError('Please fill all fields');
      return;
    }

    const amount = parseInt(challengerAmount);
    if (amount <= 0 || amount > 100) {
      setError('Amount must be between 1 and 100');
      return;
    }

    setLoadingSubmit(true);
    try {
      await acceptBond(selectedBond.id, challengerTaskId, amount);
      setAcceptingBondId(null);
      setChallengerTaskId(null);
      setChallengerAmount('');
      setSelectedBond(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCompleteBond = async (bondId: number) => {
    try {
      await completeBond(bondId);
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
  };

  const handleForfeitBond = async (bondId: number) => {
    if (window.confirm('Are you sure you want to forfeit this bond?')) {
      try {
        await forfeitBond(bondId);
      } catch (err) {
        console.error('Failed to forfeit:', err);
      }
    }
  };

  const getPendingBonds = () => bonds.filter(b => b.status === 'pending_acceptance' && b.challenger_id === user?.id);
  const getPendingChallengesBySelf = () => bonds.filter(b => b.status === 'pending_acceptance' && b.creator_id === user?.id);
  const getActiveBonds = () => bonds.filter(b => b.status === 'active');
  const getCompletedBonds = () => bonds.filter(b => b.status === 'completed');

  const formatDueDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getBondStatus = (bond: Bond) => {
    if (bond.status === 'pending_acceptance') return 'Pending';
    if (bond.status === 'active') return 'Active';
    if (bond.status === 'completed') {
      if (bond.winner === 'both') return 'Completed (Both)';
      if (bond.winner === 'creator') return 'Creator Won';
      if (bond.winner === 'challenger') return 'Challenger Won';
      return 'Failed';
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate financial stats
  const statsData = bonds.reduce((acc, bond) => {
    const isCreator = bond.creator_id === user?.id;
    const userStake = isCreator ? bond.creator_amount : bond.challenger_amount;
    const theirStake = isCreator ? bond.challenger_amount : bond.creator_amount;
    
    // Global total deposited (sum of both creator and challenger amounts)
    acc.globalDeposited += (bond.creator_amount || 0) + (bond.challenger_amount || 0);
    
    // User's personal stats
    if (bond.status === 'completed') {
      if (bond.winner === 'both') {
        acc.userReturned += userStake || 0;
      } else if (bond.winner === 'creator') {
        if (isCreator) {
          acc.userWon += (userStake || 0) + (theirStake || 0);
        } else {
          acc.userLost += userStake || 0;
        }
      } else if (bond.winner === 'challenger') {
        if (isCreator) {
          acc.userLost += userStake || 0;
        } else {
          acc.userWon += (userStake || 0) + (theirStake || 0);
        }
      } else if (bond.winner === 'none') {
        acc.userForfeited += userStake || 0;
      }
    }
    
    return acc;
  }, { globalDeposited: 0, userWon: 0, userLost: 0, userForfeited: 0, userReturned: 0 });

  const userNetBalance = statsData.userWon - statsData.userLost - statsData.userForfeited + statsData.userReturned;

  return (
    <div className="space-y-6">
      {/* Global Total Deposited */}
      <Card className="p-6 border border-purple-500/50 bg-purple-500/10">
        <h3 className="text-sm text-gray-400 font-semibold mb-2">💰 Total Money in Bonds (All Users)</h3>
        <div className="text-4xl font-bold text-purple-300">{statsData.globalDeposited} pts</div>
        <p className="text-xs text-gray-500 mt-2">Combined stakes from all active and completed bonds</p>
      </Card>

      {/* Your Personal Financial Stats */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Your Bond Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4 border border-yellow-500/50 bg-yellow-500/10">
            <div className="text-xs text-gray-400 font-semibold">Won</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">+{statsData.userWon} pts</div>
          </Card>
          <Card className="p-4 border border-red-500/50 bg-red-500/10">
            <div className="text-xs text-gray-400 font-semibold">Lost</div>
            <div className="text-2xl font-bold text-red-400 mt-1">-{statsData.userLost} pts</div>
          </Card>
          <Card className="p-4 border border-orange-500/50 bg-orange-500/10">
            <div className="text-xs text-gray-400 font-semibold">Forfeited</div>
            <div className="text-2xl font-bold text-orange-400 mt-1">-{statsData.userForfeited} pts</div>
          </Card>
          <Card className="p-4 border border-green-500/50 bg-green-500/10">
            <div className="text-xs text-gray-400 font-semibold">Returned</div>
            <div className="text-2xl font-bold text-green-400 mt-1">+{statsData.userReturned} pts</div>
          </Card>
          <Card className={`p-4 border-2 ${userNetBalance >= 0 ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
            <div className="text-xs text-gray-400 font-semibold">Net Balance</div>
            <div className={`text-2xl font-bold mt-1 ${userNetBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {userNetBalance >= 0 ? '+' : ''}{userNetBalance} pts
            </div>
          </Card>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Performance Bonds</h1>
          <p className="text-gray-400">Challenge other users with bonded performance tasks</p>
        </div>
        <Button
          onClick={handleCreateClick}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Bond
        </Button>
      </motion.div>

      {/* Create Bond Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-6 border border-primary/20 bg-primary/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Create New Bond</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateBond} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Opponent</label>
                    <select
                      value={challengerId || ''}
                      onChange={(e) => setChallengerId(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg bg-surface border border-white/10 text-white focus:border-primary/50 focus:outline-none"
                      required
                    >
                      <option value="">Select opponent...</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Your Task</label>
                    <select
                      value={creatorTaskId || ''}
                      onChange={(e) => setCreatorTaskId(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg bg-surface border border-white/10 text-white focus:border-primary/50 focus:outline-none"
                      required
                    >
                      <option value="">Select task...</option>
                      {availableTasks.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Amount (max 100)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={creatorAmount}
                      onChange={(e) => setCreatorAmount(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-surface border border-white/10 text-white focus:border-primary/50 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-surface border border-white/10 text-white focus:border-primary/50 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-surface border border-white/10 text-white focus:border-primary/50 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loadingSubmit}
                  >
                    {loadingSubmit ? 'Creating...' : 'Create Bond'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateForm(false)}
                    disabled={loadingSubmit}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Bonds for Challenger */}
      {getPendingBonds().length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Pending Challenges</h2>
          {getPendingBonds().map(bond => (
            <div key={bond.id}>
              <Card
                className="p-4 border border-amber-500/50 bg-amber-500/10 cursor-pointer hover:bg-amber-500/20 transition"
                onClick={() => {
                  if (acceptingBondId !== bond.id) {
                    setAcceptingBondId(bond.id);
                    setSelectedBond(bond);
                  } else {
                    setAcceptingBondId(null);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">🏆 New Bond Challenge!</h3>
                    <p className="text-sm text-gray-300 mt-1">
                      {acceptingBondId === bond.id ? 'Fill in your details to accept' : 'Click to accept this challenge'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-amber-300 font-bold rounded-lg bg-amber-500/20 px-3 py-2 border border-amber-500/50">
                      {bond.creator_amount} Points
                    </div>
                  </div>
                </div>
              </Card>

              {acceptingBondId === bond.id && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-4 bg-amber-950/30 border border-amber-500/30 rounded-lg space-y-3"
                >
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">Accept Challenge</h4>
                    <form onSubmit={handleAcceptBond} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Your Task</label>
                          <select
                            value={challengerTaskId || ''}
                            onChange={(e) => setChallengerTaskId(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-gray-900 border border-amber-500/50 text-white focus:border-amber-400 focus:outline-none"
                            required
                          >
                            <option value="">Select task...</option>
                            {availableTasks.map(t => (
                              <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Amount (max 100)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={challengerAmount}
                            onChange={(e) => setChallengerAmount(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-gray-900 border border-amber-500/50 text-white focus:border-amber-400 focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loadingSubmit}
                          className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition"
                        >
                          {loadingSubmit ? 'Accepting...' : '✓ Accept Challenge'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAcceptingBondId(null);
                            setChallengerTaskId(null);
                            setChallengerAmount('');
                            setError(null);
                          }}
                          disabled={loadingSubmit}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pending Challenges Created by Self */}
      {getPendingChallengesBySelf().length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Your Challenges Awaiting Response</h2>
          {getPendingChallengesBySelf().map(bond => (
            <Card key={bond.id} className="p-4 border border-purple-500/50 bg-purple-500/10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">Challenge Sent</h3>
                  <p className="text-sm text-gray-300">Waiting for opponent to accept...</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-purple-300 font-bold">{bond.creator_amount} Points</div>
                  <p className="text-xs text-gray-400">Your stake</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Active Bonds */}
      {getActiveBonds().length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Active Bonds</h2>
          {getActiveBonds().map(bond => {
            const isCreator = bond.creator_id === user?.id;
            const userCompleted = isCreator ? bond.creator_completed : bond.challenger_completed;
            const otherCompleted = isCreator ? bond.challenger_completed : bond.creator_completed;
            const timeRemaining = new Date(bond.due_date) > new Date();

            return (
              <Card key={bond.id} className="p-4 border border-blue-500/50 bg-blue-500/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-white">Due: {formatDueDate(bond.due_date)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Creator:</span>{' '}
                        <span className={userCompleted && isCreator ? 'text-green-400' : 'text-gray-300'}>
                          {bond.creator_amount} score {isCreator && userCompleted && '✓'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Challenger:</span>{' '}
                        <span className={userCompleted && !isCreator ? 'text-green-400' : 'text-gray-300'}>
                          {bond.challenger_amount} score {!isCreator && userCompleted && '✓'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {true && (
                    <div className="flex gap-2 flex-shrink-0">
                      {!userCompleted && (
                        <button
                          onClick={() => handleCompleteBond(bond.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                        >
                          Complete
                        </button>
                      )}
                      {userCompleted && (
                        <button
                          onClick={() => handleForfeitBond(bond.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                        >
                          Forfeit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Bonds */}
      {getCompletedBonds().length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Completed</h2>
          {getCompletedBonds().map(bond => {
            const isCreator = bond.creator_id === user?.id;
            
            // Calculate financial outcome
            let userOutcome = 0;
            let outcomeLabel = '';
            let outcomeColor = '';
            
            if (bond.winner === 'both') {
              userOutcome = 0; // Money returned
              outcomeLabel = 'Returned';
              outcomeColor = 'text-green-400';
            } else if (bond.winner === 'creator') {
              if (isCreator) {
                userOutcome = (bond.creator_amount || 0) + (bond.challenger_amount || 0);
                outcomeLabel = 'Won';
                outcomeColor = 'text-yellow-400';
              } else {
                userOutcome = -(bond.challenger_amount || 0);
                outcomeLabel = 'Lost';
                outcomeColor = 'text-red-400';
              }
            } else if (bond.winner === 'challenger') {
              if (isCreator) {
                userOutcome = -(bond.creator_amount || 0);
                outcomeLabel = 'Lost';
                outcomeColor = 'text-red-400';
              } else {
                userOutcome = (bond.creator_amount || 0) + (bond.challenger_amount || 0);
                outcomeLabel = 'Won';
                outcomeColor = 'text-yellow-400';
              }
            } else if (bond.winner === 'none') {
              userOutcome = -(isCreator ? bond.creator_amount : bond.challenger_amount);
              outcomeLabel = 'Lost';
              outcomeColor = 'text-red-400';
            }

            return (
              <Card key={bond.id} className="p-4 border border-gray-700">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {bond.winner === 'both' ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="font-semibold text-green-400">Both Completed ✓</span>
                        </>
                      ) : bond.winner === 'creator' ? (
                        <>
                          <Trophy className="w-5 h-5 text-yellow-400" />
                          <span className="font-semibold text-yellow-400">Creator Won 🏆</span>
                        </>
                      ) : bond.winner === 'challenger' ? (
                        <>
                          <Trophy className="w-5 h-5 text-yellow-400" />
                          <span className="font-semibold text-yellow-400">Challenger Won 🏆</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <span className="font-semibold text-red-400">Both Failed ✗</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">Completed: {formatDueDate(bond.completed_at || '')}</p>
                    <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                      <div>
                        <span className="text-gray-400">Creator Stake:</span>{' '}
                        <span className="text-gray-300 font-semibold">{bond.creator_amount} pts</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Challenger Stake:</span>{' '}
                        <span className="text-gray-300 font-semibold">{bond.challenger_amount} pts</span>
                      </div>
                    </div>
                    {bond.winner === 'both' && (
                      <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-300">
                        ✓ Both returned: {bond.creator_amount} + {bond.challenger_amount} = {(bond.creator_amount || 0) + (bond.challenger_amount || 0)} pts
                      </div>
                    )}
                    {bond.winner === 'none' && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                        ✗ Both forfeited: {bond.creator_amount} + {bond.challenger_amount} = {(bond.creator_amount || 0) + (bond.challenger_amount || 0)} pts lost
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-bold text-lg mb-1 ${outcomeColor}`}>
                      {userOutcome > 0 ? '+' : ''}{userOutcome} pts
                    </div>
                    <div className={`text-xs font-semibold ${outcomeColor}`}>
                      {outcomeLabel}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bonds Tracking Table */}
      {bonds.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">All Bonds Summary</h2>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">Opponent</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">Your Task</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">Their Task</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-semibold">Your Stake</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-semibold">Their Stake</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right text-gray-300 font-semibold">Your Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bonds.map((bond) => {
                  const isCreator = bond.creator_id === user?.id;
                  const opponentId = isCreator ? bond.challenger_id : bond.creator_id;
                  const userTaskId = isCreator ? bond.creator_task_id : bond.challenger_task_id;
                  const theirTaskId = isCreator ? bond.challenger_task_id : bond.creator_task_id;
                  const userStake = isCreator ? bond.creator_amount : bond.challenger_amount;
                  const theirStake = isCreator ? bond.challenger_amount : bond.creator_amount;
                  
                  // Get task names from tasks hook
                  const userTask = tasks?.find(t => t.id === userTaskId);
                  const theirTask = tasks?.find(t => t.id === theirTaskId);
                  
                  // Calculate outcome for completed bonds
                  let outcomeText = '—';
                  let outcomeColor = 'text-gray-400';
                  
                  if (bond.status === 'completed') {
                    if (bond.winner === 'both') {
                      outcomeText = '0 (Returned)';
                      outcomeColor = 'text-green-400';
                    } else if (bond.winner === 'creator') {
                      if (isCreator) {
                        outcomeText = `+${(userStake || 0) + (theirStake || 0)}`;
                        outcomeColor = 'text-yellow-400';
                      } else {
                        outcomeText = `-${userStake || 0}`;
                        outcomeColor = 'text-red-400';
                      }
                    } else if (bond.winner === 'challenger') {
                      if (isCreator) {
                        outcomeText = `-${userStake || 0}`;
                        outcomeColor = 'text-red-400';
                      } else {
                        outcomeText = `+${(userStake || 0) + (theirStake || 0)}`;
                        outcomeColor = 'text-yellow-400';
                      }
                    } else if (bond.winner === 'none') {
                      outcomeText = `-${userStake || 0}`;
                      outcomeColor = 'text-red-400';
                    }
                  }
                  
                  const statusColors: Record<string, string> = {
                    'pending_acceptance': 'bg-amber-500/20 text-amber-300',
                    'active': 'bg-blue-500/20 text-blue-300',
                    'completed': 'bg-purple-500/20 text-purple-300'
                  };
                  
                  return (
                    <tr key={bond.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-gray-200">User #{opponentId}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{new Date(bond.created_at).toLocaleDateString()} {new Date(bond.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-gray-300 truncate max-w-xs">{userTask?.title || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-300 truncate max-w-xs">{theirTask?.title || 'Pending...'}</td>
                      <td className="px-4 py-3 text-center text-gray-300 font-semibold">{userStake} pts</td>
                      <td className="px-4 py-3 text-center text-gray-300 font-semibold">{theirStake || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[bond.status]}`}>
                          {bond.status === 'pending_acceptance' ? 'Pending' : bond.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${outcomeColor}`}>
                        {outcomeText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bonds.length === 0 && (
        <Card className="p-12 text-center border border-white/10">
          <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No Bonds Yet</h3>
          <p className="text-gray-400 mb-6">Create or accept performance bonds to compete with other users</p>
          <Button onClick={handleCreateClick} variant="primary" className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Create First Bond
          </Button>
        </Card>
      )}
    </div>
  );
};

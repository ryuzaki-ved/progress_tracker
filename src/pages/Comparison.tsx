import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, TrendingDown, Crown, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';

export const Comparison: React.FC = () => {
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [usersStats, setUsersStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                // Public endpoint, but pass token if it exists just in case
                const params: RequestInit = {};
                const token = localStorage.getItem('lifestock_token');
                if (token) {
                    params.headers = { 'Authorization': `Bearer ${token}` };
                }

                const response = await fetch('/api/leaderboard', params);
                const result = await response.json();
                
                if (result.data) {
                    setHistoryData(result.data.history);
                    setUsersStats(result.data.users);
                }
            } catch (err) {
                console.error('Failed to load leaderboard', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Leaderboard...</p>
                </div>
            </div>
        );
    }

    // Generate distinct colors for multiple distinct lines natively
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

    // Identify all user keys currently playing inside the history stack
    const activeUserKeys = new Set<string>();
    (historyData || []).forEach(day => {
        Object.keys(day).forEach(key => {
            if (key !== 'date') activeUserKeys.add(key);
        });
    });

    return (
        <div className="p-6 space-y-6 relative z-0">
            <div className="flex items-center space-x-3 mb-6 p-6 glass-panel rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5"></div>
                <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center border border-violet-500/50 shadow-neon-sm relative z-10">
                    <Users className="w-6 h-6 text-violet-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-display">Global Leaderboard</h1>
                    <p className="text-gray-500">Compare life index performances across public members</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 
                    LEADERBOARD RANKING METRICS
                */}
                <div className="lg:col-span-1 space-y-4 rounded-[20px] max-h-[800px] overflow-y-auto pr-2">
                    {usersStats.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            No public users.
                        </div>
                    ) : (
                        usersStats.map((user, idx) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className={`glass-card p-6 relative overflow-hidden ${idx === 0 ? 'border-yellow-500/50 bg-surface/50' : ''}`}>
                                    {idx === 0 && (
                                        <div className="absolute top-0 right-0 p-3 opacity-20 text-yellow-500 z-0">
                                            <Crown className="w-24 h-24 -translate-y-6 translate-x-6"/>
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between z-10 relative">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${idx === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                                    {idx + 1}
                                                </span>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {user.username}
                                                </h3>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                                                {user.currentScore.toFixed(0)} <span className="text-xs text-gray-500 font-normal tracking-wide uppercase">Index</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`flex items-center justify-end font-semibold ${user.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {user.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1"/> : <TrendingDown className="w-4 h-4 mr-1"/>}
                                                {Math.abs(user.change).toFixed(0)}
                                            </div>
                                            <div className={`text-xs ${user.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {user.changePercent >= 0 ? '+' : ''}{user.changePercent.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* 
                    GLOBAL LINE GRAPH
                */}
                <div className="lg:col-span-3">
                    <div className="h-[600px] glass-panel rounded-3xl flex flex-col pt-8 pb-4 px-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                    <Activity className="w-5 h-5 mr-2 text-violet-500"/>
                                    Live Comparisons
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Cross-analyzing daily closes side-by-side.</p>
                            </div>
                        </div>

                        {!historyData || historyData.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                Not enough historical data to generate the comparison graph yet. Ensure at least one user is made public in the Admin Panel.
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#6B7280" 
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return `${d.getMonth()+1}/${d.getDate()}`;
                                            }}
                                            minTickGap={30}
                                        />
                                        <YAxis 
                                            stroke="#6B7280" 
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            domain={['auto', 'auto']}
                                            tickFormatter={(v) => v.toFixed(0)}
                                            width={60}
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                            itemStyle={{ color: '#E5E7EB' }}
                                            formatter={(value: any) => [Number(value).toFixed(2), '']}
                                            labelFormatter={(l) => new Date(l).toLocaleDateString()}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        
                                        {Array.from(activeUserKeys).map((username, index) => (
                                            <Line 
                                                key={username}
                                                type="monotone" 
                                                dataKey={username} 
                                                name={username}
                                                stroke={COLORS[index % COLORS.length]} 
                                                strokeWidth={3}
                                                dot={{ r: 3, strokeWidth: 2, fill: '#1F2937' }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


import express from 'express';
import db from './db.js';

const router = express.Router();

// GET /api/leaderboard
// Public endpoint to retrieve the global index comparison structure for users approved by the admin.
router.get('/', (req, res) => {
    try {
        // Find visible users
        const visibleUsers = db.prepare('SELECT id, username FROM users WHERE show_in_leaderboard = 1').all() as { id: number, username: string }[];
        
        if (!visibleUsers.length) {
            return res.json({ data: { history: [], users: [] }, error: null });
        }
        
        const userIds = visibleUsers.map(u => u.id);
        const placeholders = userIds.map(() => '?').join(',');
        
        // Fetch index_history for those users
        // Since we want to compare daily closes seamlessly we need their history
        const histories = db.prepare(`SELECT user_id, date, close as daily_score FROM index_history WHERE user_id IN (${placeholders}) ORDER BY date ASC`).all(...userIds) as { user_id: number, date: string, daily_score: number }[];
        
        // Structure the payload for `Recharts` consumption:
        // We usually group by `date` for Recharts.
        // A data point will look like: { date: '2023-11-20', 'User A': 12000, 'User B': 11500 }
        
        const dataMap = new Map<string, any>();
        
        histories.forEach(h => {
            if (!dataMap.has(h.date)) {
                dataMap.set(h.date, { date: h.date });
            }
            const dateObj = dataMap.get(h.date);
            const user = visibleUsers.find(u => u.id === h.user_id);
            if (user) {
                dateObj[user.username] = h.daily_score;
            }
        });

        // Convert Map back to array and sort by date chronologically
        const aggregatedHistory = Array.from(dataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Also figure out the `latest` score for the stat tiles
        const userStats = visibleUsers.map(user => {
            const userHistory = histories.filter(h => h.user_id === user.id);
            const latest = userHistory.length > 0 ? userHistory[userHistory.length - 1].daily_score : 10000;
            const previous = userHistory.length > 1 ? userHistory[userHistory.length - 2].daily_score : 10000;
            const change = latest - previous;
            const percent = ((change) / previous) * 100;
            
            return {
                id: user.id,
                username: user.username,
                currentScore: latest,
                change: change,
                changePercent: percent
            };
        });

        res.json({ data: {
            history: aggregatedHistory,
            users: userStats.sort((a, b) => b.currentScore - a.currentScore) // Leaderboard sorting
        }, error: null });
    } catch (err: any) {
        console.error('Leaderboard Fetch Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

export default router;

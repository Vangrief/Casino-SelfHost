import { Router, type Router as RouterType } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getPlayerStats, getLeaderboard } from '../services/stats.service.js';

const router: RouterType = Router();

router.use(authMiddleware);

router.get('/me', async (req, res, next) => {
  try {
    const stats = await getPlayerStats(req.user!.userId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get('/leaderboard', async (req, res, next) => {
  try {
    const orderBy = (req.query.orderBy as string) || 'net_profit';
    const stats = await getLeaderboard(orderBy as 'net_profit' | 'total_wins' | 'total_games');
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;

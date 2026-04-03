import { Router, type Router as RouterType } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router: RouterType = Router();

router.use(authMiddleware);

// Game history for a player
router.get('/history', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const offset = (page - 1) * pageSize;

    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) FROM game_participants WHERE user_id = $1',
      [userId],
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT gp.*, gs.game_type, gs.status, gs.config, gs.started_at, gs.ended_at
       FROM game_participants gp
       JOIN game_sessions gs ON gs.id = gp.game_id
       WHERE gp.user_id = $1
       ORDER BY gp.joined_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset],
    );

    res.json({ data: result.rows, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

export default router;

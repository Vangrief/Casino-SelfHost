import { Router, type Router as RouterType } from 'express';
import { transactionQuerySchema } from '@casino/shared';
import { getBalance, getTransactions } from '../services/wallet.service.js';
import { authMiddleware } from '../middleware/auth.js';

const router: RouterType = Router();

router.use(authMiddleware);

router.get('/balance', async (req, res, next) => {
  try {
    const balance = await getBalance(req.user!.userId);
    res.json({ balance });
  } catch (err) {
    next(err);
  }
});

router.get('/transactions', async (req, res, next) => {
  try {
    const parsed = transactionQuerySchema.parse(req.query);
    const result = await getTransactions(
      req.user!.userId,
      parsed.page,
      parsed.pageSize,
      parsed.type,
      parsed.gameType,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

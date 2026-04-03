import { Router, type Router as RouterType } from 'express';
import { registerSchema, loginSchema } from '@casino/shared';
import { registerUser, loginUser, getUserById } from '../services/user.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

const router: RouterType = Router();

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const result = await registerUser(parsed.data.username, parsed.data.displayName, parsed.data.password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const result = await loginUser(parsed.data.username, parsed.data.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await getUserById(req.user!.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;

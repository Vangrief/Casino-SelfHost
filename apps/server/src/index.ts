import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { env } from './config/env.js';
import { pool } from './config/database.js';
import { redis } from './config/redis.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import statsRoutes from './routes/stats.js';
import lobbyRoutes from './routes/lobby.js';
import { setupSocketIO } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/games', lobbyRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', message: String(err) });
  }
});

// Error handler
app.use(errorHandler);

// Socket.IO
setupSocketIO(httpServer);

// Start server
httpServer.listen(env.PORT, () => {
  console.log(`Casino server running on port ${env.PORT}`);
});

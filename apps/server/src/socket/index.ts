import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthPayload } from '../middleware/auth.js';
import { setupLobbyNamespace } from './lobby.handler.js';
import { setupBlackjackNamespace } from './blackjack.handler.js';
import { setupPokerNamespace } from './poker.handler.js';

export function setupSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  // JWT auth middleware for all namespaces
  const authMiddleware = (socket: { handshake: { auth: { token?: string } }; data: { user?: AuthPayload } }, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  };

  // Apply auth to all namespaces
  io.of('/lobby').use(authMiddleware);
  io.of('/blackjack').use(authMiddleware);
  io.of('/poker').use(authMiddleware);

  // Setup namespace handlers
  setupLobbyNamespace(io);
  setupBlackjackNamespace(io);
  setupPokerNamespace(io);

  console.log('Socket.IO initialized');
  return io;
}

import { z } from 'zod';

// --- Auth ---

export const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  displayName: z.string().min(1).max(64),
  password: z.string().min(6).max(128),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// --- Lobby Events ---

export const createTableSchema = z.object({
  gameType: z.enum(['blackjack', 'poker']),
  name: z.string().min(1).max(64),
  config: z.record(z.unknown()),
});

export const joinTableSchema = z.object({
  tableId: z.string().uuid(),
});

export const leaveTableSchema = z.object({
  tableId: z.string().uuid(),
});

export const lobbyChatSchema = z.object({
  message: z.string().min(1).max(500),
});

// --- Blackjack Events ---

export const bjPlaceBetSchema = z.object({
  amount: z.number().int().positive(),
});

export const bjInsuranceSchema = z.object({
  accept: z.boolean(),
});

// --- Poker Events ---

export const pokerRaiseSchema = z.object({
  amount: z.number().int().positive(),
});

// --- Wallet ---

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().optional(),
  gameType: z.string().optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;

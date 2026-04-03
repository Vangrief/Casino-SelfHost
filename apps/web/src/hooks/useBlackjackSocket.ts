import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';
import type { BlackjackClientState } from '@casino/shared';

export function useBlackjackSocket(tableId: string) {
  const token = useAuthStore((s) => s.token);
  const updateBalance = useAuthStore((s) => s.updateBalance);
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<BlackjackClientState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payoutResult, setPayoutResult] = useState<{
    winners: { playerId: string; amount: number }[];
    payouts: { playerId: string; amount: number }[];
  } | null>(null);

  useEffect(() => {
    const socket = io('/blackjack', {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('bj:join_table', { tableId });
    });

    socket.on('game:state_update', (state: BlackjackClientState) => {
      setGameState(state);
      setError(null);
    });

    socket.on('game:error', (err: { code: string; message: string }) => {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    });

    socket.on('wallet:balance_update', (data: { balance: number }) => {
      updateBalance(data.balance);
    });

    socket.on('game:hand_result', (result: {
      winners: { playerId: string; amount: number }[];
      payouts: { playerId: string; amount: number }[];
    }) => {
      setPayoutResult(result);
      setTimeout(() => setPayoutResult(null), 5000);
    });

    return () => {
      socket.emit('bj:leave_table');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tableId, token, updateBalance]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { gameState, error, payoutResult, emit };
}

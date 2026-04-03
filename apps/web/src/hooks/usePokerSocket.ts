import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';
import type { PokerClientState } from '@casino/shared';

export function usePokerSocket(tableId: string, buyIn: number) {
  const token = useAuthStore((s) => s.token);
  const updateBalance = useAuthStore((s) => s.updateBalance);
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<PokerClientState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payoutResult, setPayoutResult] = useState<{
    winners: { playerId: string; amount: number }[];
    payouts: { playerId: string; amount: number }[];
    hands?: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    const socket = io('/poker', {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('poker:join_table', { tableId, buyIn });
    });

    socket.on('game:state_update', (state: PokerClientState) => {
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
      hands?: Record<string, string>;
    }) => {
      setPayoutResult(result);
      setTimeout(() => setPayoutResult(null), 5000);
    });

    return () => {
      socket.emit('poker:leave_table');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tableId, buyIn, token, updateBalance]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { gameState, error, payoutResult, emit };
}

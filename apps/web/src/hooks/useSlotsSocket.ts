import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SlotsClientState } from '@casino/shared';
import { useAuthStore } from '../stores/auth.store';

export function useSlotsSocket() {
  const token = useAuthStore((s) => s.token);
  const updateBalance = useAuthStore((s) => s.updateBalance);
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SlotsClientState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io('/slots', {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to slots');
    });

    socket.on('game:state_update', (newState: SlotsClientState) => {
      setState(newState);
      if (newState.phase === 'slots:result') {
        setIsSpinning(false);
      }
    });

    socket.on('game:phase_change', (data: { newPhase: string }) => {
      if (data.newPhase === 'slots:spinning') {
        setIsSpinning(true);
      } else if (data.newPhase === 'slots:result') {
        setIsSpinning(false);
      }
    });

    socket.on('wallet:balance_update', (data: { balance: number }) => {
      updateBalance(data.balance);
    });

    socket.on('game:error', (data: { code: string; message: string }) => {
      setError(data.message);
      setIsSpinning(false);
      setTimeout(() => setError(null), 3000);
    });

    socket.on('connect_error', (err) => {
      console.error('[Slots] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, updateBalance]);

  const spin = useCallback((bet: number) => {
    if (socketRef.current && !isSpinning) {
      setError(null);
      setIsSpinning(true);
      socketRef.current.emit('slots:spin', { bet });
    }
  }, [isSpinning]);

  return { state, error, isSpinning, spin };
}

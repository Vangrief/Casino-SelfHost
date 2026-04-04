import type { Server } from 'socket.io';
import type { AuthPayload } from '../middleware/auth.js';
import { SlotMachine } from '../games/slots/slot-machine.js';
import { slotsSpinSchema } from '@casino/shared';
import { debit, credit, getBalance } from '../services/wallet.service.js';

// One slot machine instance per player (slots are single-player)
const playerMachines = new Map<string, SlotMachine>();

function getMachine(userId: string): SlotMachine {
  let machine = playerMachines.get(userId);
  if (!machine) {
    machine = new SlotMachine();
    playerMachines.set(userId, machine);
  }
  return machine;
}

export function setupSlotsNamespace(io: Server): void {
  const nsp = io.of('/slots');

  nsp.on('connection', (socket) => {
    const user = socket.data.user as AuthPayload;
    console.log(`[slots] ${user.username} connected`);

    const machine = getMachine(user.id);

    // Send initial state
    socket.emit('game:state_update', machine.getClientState());

    socket.on('slots:spin', async (data: unknown) => {
      const parsed = slotsSpinSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('game:error', {
          code: 'INVALID_BET',
          message: parsed.error.issues.map((i) => i.message).join(', '),
        });
        return;
      }

      const { bet } = parsed.data;

      // Validate bet range
      if (bet < 10 || bet > 5000) {
        socket.emit('game:error', {
          code: 'INVALID_BET',
          message: 'Einsatz muss zwischen 10 und 5.000 liegen',
        });
        return;
      }

      // Debit the bet from wallet
      try {
        await debit(user.id, bet, 'loss', 'slots', undefined, `Slots Einsatz: ${bet}`);
      } catch {
        socket.emit('game:error', {
          code: 'INSUFFICIENT_FUNDS',
          message: 'Nicht genug Chips',
        });
        return;
      }

      // Update balance after debit
      try {
        const balance = await getBalance(user.id);
        socket.emit('wallet:balance_update', { balance });
      } catch {
        // non-critical
      }

      // Spin
      const result = machine.spin(bet);

      // Send spinning state first
      socket.emit('game:phase_change', { newPhase: 'slots:spinning' });

      // After a short delay, send result
      setTimeout(async () => {
        // Credit winnings
        if (result.totalWin > 0) {
          try {
            await credit(user.id, result.totalWin, 'win', 'slots', undefined, `Slots Gewinn: ${result.totalWin}`);
          } catch (err) {
            console.error('[slots] Error crediting win:', err);
          }
        }

        // Update balance
        try {
          const balance = await getBalance(user.id);
          socket.emit('wallet:balance_update', { balance });
        } catch {
          // non-critical
        }

        socket.emit('game:state_update', machine.getClientState());
        socket.emit('game:phase_change', { newPhase: 'slots:result' });

        // Auto-reset to idle after showing result
        setTimeout(() => {
          machine.setIdle();
        }, 3000);
      }, 200); // small server-side delay, client handles visual spin
    });

    socket.on('disconnect', () => {
      console.log(`[slots] ${user.username} disconnected`);
      // Keep machine state for reconnect
    });
  });
}

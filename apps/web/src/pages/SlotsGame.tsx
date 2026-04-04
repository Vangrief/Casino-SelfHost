import { useNavigate } from 'react-router-dom';
import { useSlotsSocket } from '../hooks/useSlotsSocket';
import { SlotMachine } from '../components/slots/SlotMachine';

export default function SlotsGame() {
  const navigate = useNavigate();
  const { state, error, isSpinning, spin } = useSlotsSocket();

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          &larr; Zur Lobby
        </button>
        <h1 className="text-lg font-bold text-casino-gold">Slot Machine</h1>
        <div />
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm text-center mb-4">
          {error}
        </div>
      )}

      {state ? (
        <SlotMachine
          state={state}
          isSpinning={isSpinning}
          onSpin={spin}
        />
      ) : (
        <div className="text-center text-gray-400 mt-20">Verbinde mit Slot Machine...</div>
      )}
    </div>
  );
}

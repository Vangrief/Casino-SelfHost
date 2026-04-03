interface ActionButtonsProps {
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  canSplit: boolean;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
}

export function ActionButtons({
  canHit, canStand, canDouble, canSplit,
  onHit, onStand, onDouble, onSplit,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={onHit}
        disabled={!canHit}
        className="px-6 py-2.5 rounded-lg font-semibold bg-green-700 text-white hover:bg-green-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Hit
      </button>
      <button
        onClick={onStand}
        disabled={!canStand}
        className="px-6 py-2.5 rounded-lg font-semibold bg-casino-red text-white hover:bg-casino-red-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Stand
      </button>
      <button
        onClick={onDouble}
        disabled={!canDouble}
        className="px-6 py-2.5 rounded-lg font-semibold bg-casino-gold text-black hover:bg-casino-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Double
      </button>
      <button
        onClick={onSplit}
        disabled={!canSplit}
        className="px-6 py-2.5 rounded-lg font-semibold bg-purple-700 text-white hover:bg-purple-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Split
      </button>
    </div>
  );
}

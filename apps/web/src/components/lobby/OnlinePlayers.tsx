interface OnlinePlayersProps {
  players: { id: string; username: string; displayName: string }[];
}

export function OnlinePlayers({ players }: OnlinePlayersProps) {
  return (
    <div className="bg-casino-surface border border-casino-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-casino-border">
        <h2 className="font-semibold text-casino-gold">Online ({players.length})</h2>
      </div>
      <div className="p-4 space-y-2">
        {players.length === 0 && <p className="text-gray-500 text-sm">Verbinde...</p>}
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-300">{p.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

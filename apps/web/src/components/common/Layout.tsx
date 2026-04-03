import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { disconnectLobby } from '../../lib/socket';

export function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectLobby();
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-casino-surface border-b border-casino-border px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-casino-gold">
          Casino
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            <div className="text-casino-gold font-semibold">
              {user.balance.toLocaleString()} Chips
            </div>
            <div className="text-gray-300">{user.displayName}</div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

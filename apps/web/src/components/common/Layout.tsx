import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { disconnectLobby } from '../../lib/socket';

export function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    disconnectLobby();
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Lobby' },
    { path: '/slots', label: 'Slots' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/profile', label: 'Profil' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-casino-surface border-b border-casino-border px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/" className="text-xl md:text-2xl font-bold text-casino-gold">
              Casino
            </Link>

            <nav className="hidden sm:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-casino-gold/15 text-casino-gold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {user && (
            <div className="flex items-center gap-3 md:gap-6">
              <div className="text-casino-gold font-semibold text-sm md:text-base">
                {user.balance.toLocaleString()} Chips
              </div>
              <div className="hidden md:block text-gray-300 text-sm">{user.displayName}</div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile nav */}
        <nav className="flex sm:hidden gap-1 mt-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                location.pathname === item.path
                  ? 'bg-casino-gold/15 text-casino-gold'
                  : 'text-gray-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}

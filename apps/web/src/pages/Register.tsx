import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import type { AuthResponse } from '@casino/shared';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post<AuthResponse>('/auth/register', {
        username,
        displayName,
        password,
      });
      setAuth(res.token, res.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-casino-bg">
      <div className="w-full max-w-md bg-casino-surface border border-casino-border rounded-xl p-8">
        <h1 className="text-3xl font-bold text-casino-gold text-center mb-8">Account erstellen</h1>

        {error && (
          <div className="bg-casino-red/20 border border-casino-red text-casino-red-light rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-casino-bg border border-casino-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-casino-gold transition-colors"
              required
              minLength={3}
              maxLength={32}
              pattern="^[a-zA-Z0-9_]+$"
              title="Nur Buchstaben, Zahlen und Unterstriche"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Anzeigename</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-casino-bg border border-casino-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-casino-gold transition-colors"
              required
              maxLength={64}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-casino-bg border border-casino-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-casino-gold transition-colors"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-casino-gold text-black font-semibold py-2 rounded-lg hover:bg-casino-gold-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Erstelle Account...' : 'Registrieren'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Schon einen Account?{' '}
          <Link to="/login" className="text-casino-gold hover:text-casino-gold-light">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

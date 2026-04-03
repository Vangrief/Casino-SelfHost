import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { LobbyPage } from './pages/Lobby';
import { BlackjackGamePage } from './pages/BlackjackGame';
import { PokerGamePage } from './pages/PokerGame';
import { LeaderboardPage } from './pages/Leaderboard';
import { ProfilePage } from './pages/Profile';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/common/Layout';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedLayout><LobbyPage /></ProtectedLayout>} />
      <Route path="/blackjack/:tableId" element={<ProtectedLayout><BlackjackGamePage /></ProtectedLayout>} />
      <Route path="/poker/:tableId" element={<ProtectedLayout><PokerGamePage /></ProtectedLayout>} />
      <Route path="/leaderboard" element={<ProtectedLayout><LeaderboardPage /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

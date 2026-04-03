import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { LobbyPage } from './pages/Lobby';
import { BlackjackGamePage } from './pages/BlackjackGame';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/common/Layout';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <LobbyPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/blackjack/:tableId"
        element={
          <ProtectedRoute>
            <Layout>
              <BlackjackGamePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

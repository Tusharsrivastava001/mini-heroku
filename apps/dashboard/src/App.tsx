import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User } from './types/index.js';
import { api, getToken, setToken } from './api/client.js';
import { Navbar } from './components/Navbar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ProjectDetailPage } from './pages/ProjectDetailPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RefreshCw } from 'lucide-react';

const queryClient = new QueryClient();

// GitHub OAuth Callback redirect handler
const AuthCallback: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      api.getCurrentUser()
        .then((res) => {
          onLogin(res.user);
          navigate('/');
        })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 gap-2">
      <RefreshCw className="h-5 w-5 animate-spin text-cyan-500" />
      <span>Authenticating with GitHub...</span>
    </div>
  );
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api.getCurrentUser()
        .then((res) => setUser(res.user))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-500 gap-2 font-mono text-xs">
        <RefreshCw className="h-4 w-4 animate-spin text-cyan-500" />
        <span>Initializing DeployForge Console...</span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
          <Navbar user={user} onLogout={() => setUser(null)} />
          <main className="flex-1">
            <Routes>
              <Route
                path="/login"
                element={user ? <Navigate to="/" /> : <LoginPage onLoginSuccess={setUser} />}
              />
              <Route
                path="/auth/callback"
                element={<AuthCallback onLogin={setUser} />}
              />
              <Route
                path="/"
                element={user ? <DashboardPage /> : <Navigate to="/login" />}
              />
              <Route
                path="/projects/:id"
                element={user ? <ProjectDetailPage /> : <Navigate to="/login" />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

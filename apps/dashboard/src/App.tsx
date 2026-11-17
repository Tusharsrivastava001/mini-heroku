import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User } from './types/index.js';
import { api, getToken, setToken, clearToken } from './api/client.js';
import { Layout } from './components/Layout.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ProjectDetailPage } from './pages/ProjectDetailPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { CreateProjectWizard } from './components/CreateProjectWizard.js';
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
      api
        .getCurrentUser()
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
    <div className="min-h-screen bg-[#080B12] flex items-center justify-center text-slate-400 gap-2 font-mono text-xs">
      <RefreshCw className="h-4 w-4 animate-spin text-violet-400" />
      <span>Authenticating session with GitHub OAuth...</span>
    </div>
  );
};

// Authenticated Shell wrapper
const AuthenticatedShell: React.FC<{
  user: User;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('overview');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const location = useLocation();

  // Parse view from URL query if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    if (viewParam) {
      setActiveView(viewParam);
    } else if (location.pathname === '/') {
      setActiveView('overview');
    }
  }, [location]);

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      onOpenNewProject={() => setIsWizardOpen(true)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      activeView={activeView}
      onSelectView={setActiveView}
    >
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              searchQuery={searchQuery}
              activeView={activeView}
              onSelectView={setActiveView}
              isCreateModalOpen={isWizardOpen}
              setIsCreateModalOpen={setIsWizardOpen}
            />
          }
        />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CreateProjectWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreated={() => {
          setActiveView('projects');
        }}
      />
    </Layout>
  );
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api
        .getCurrentUser()
        .then((res) => setUser(res.user))
        .catch(() => {
          clearToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    clearToken();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B12] flex items-center justify-center text-slate-500 gap-2 font-mono text-xs">
        <RefreshCw className="h-4 w-4 animate-spin text-violet-400" />
        <span>Initializing DeployForge Console...</span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={setUser} />}
          />
          <Route path="/auth/callback" element={<AuthCallback onLogin={setUser} />} />
          <Route
            path="/*"
            element={user ? <AuthenticatedShell user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

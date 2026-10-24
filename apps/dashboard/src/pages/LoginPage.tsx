import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { User } from '../types/index.js';
import { Zap, Github, Terminal, Shield, Cpu, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDevLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await api.devLogin('platform-engineer');
      onLoginSuccess(user);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">DeployForge</h1>
          <p className="text-xs text-slate-400 mt-1">
            Production self-service cloud platform on Kubernetes
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-3 relative">
          {/* Quick Dev Login */}
          <button
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all group"
          >
            <Zap className="h-4 w-4" />
            <span>{loading ? 'Authenticating...' : 'Instant Dev Login (1-Click)'}</span>
            <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* GitHub OAuth Login */}
          <button
            onClick={handleGitHubLogin}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center gap-2 transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>Sign in with GitHub OAuth</span>
          </button>
        </div>

        {/* Feature pillars */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center">
            <Terminal className="h-4 w-4 text-cyan-400 mb-1" />
            <span className="text-[10px] text-slate-400">Live SSE Logs</span>
          </div>
          <div className="flex flex-col items-center">
            <Shield className="h-4 w-4 text-indigo-400 mb-1" />
            <span className="text-[10px] text-slate-400">NetworkPolicy</span>
          </div>
          <div className="flex flex-col items-center">
            <Cpu className="h-4 w-4 text-emerald-400 mb-1" />
            <span className="text-[10px] text-slate-400">HPA Autoscaling</span>
          </div>
        </div>
      </div>
    </div>
  );
};

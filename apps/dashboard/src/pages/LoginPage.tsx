import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { User } from '../types/index.js';
import { Zap, Github, Terminal, Shield, Cpu, ArrowRight, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-[#080B12] text-[#F8FAFC] flex flex-col justify-between relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed -top-48 left-1/2 -translate-x-1/2 w-[650px] h-[450px] bg-gradient-to-b from-violet-600/20 via-cyan-500/10 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed -bottom-48 right-10 w-[500px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Top Simple Nav */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/25">
            <div className="h-full w-full bg-[#080B12] rounded-[11px] flex items-center justify-center">
              <Zap className="h-4 w-4 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white">DeployForge</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            v2.4.0 Engine
          </span>
        </div>
      </div>

      {/* Main Centered Login Box */}
      <div className="relative z-10 max-w-md w-full mx-auto px-6 py-12">
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 border border-violet-500/20 text-violet-400 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen PaaS Platform</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Sign in to DeployForge</h1>
            <p className="text-xs text-slate-400 mt-2">
              Continuous deployment, automated containerization, and zero-downtime rollouts.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs mb-6">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* 1-Click Dev Login Button */}
            <button
              onClick={handleDevLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Terminal className="h-4 w-4" />
              <span>{loading ? 'Authenticating...' : 'Instant Dev Login (1-Click)'}</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </button>

            {/* GitHub OAuth Button */}
            <button
              onClick={handleGitHubLogin}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-[#111827] hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Github className="h-4 w-4" />
              <span>Sign in with GitHub</span>
            </button>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-3 mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span>AES-256 Secrets</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Cpu className="h-3.5 w-3.5 text-violet-400" />
              <span>K8s HPA Scaling</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-slate-600 font-mono">
        DeployForge Engine · Autonomous Container Infrastructure
      </div>
    </div>
  );
};

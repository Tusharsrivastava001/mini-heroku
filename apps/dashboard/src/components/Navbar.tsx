import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types/index.js';
import { api } from '../api/client.js';
import { Zap, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.logout();
    onLogout();
    navigate('/login');
  };

  return (
    <header className="border-b border-border bg-[#0b1120]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                DeployForge
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-semibold -mt-1">
                Platform Console
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800 text-sm">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium transition-colors"
            >
              Projects
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium transition-colors flex items-center gap-1.5"
            >
              Docs <ExternalLink className="h-3 w-3" />
            </a>
          </nav>
        </div>

        {/* Right Status & Profile */}
        <div className="flex items-center gap-4">
          {/* Health Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            K8s Ingress: <span className="text-slate-200">Traefik</span>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
                <img
                  src={user.avatarUrl || 'https://avatars.githubusercontent.com/u/1024025?v=4'}
                  alt={user.username}
                  className="h-8 w-8 rounded-full border border-cyan-500/30 object-cover"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200">{user.username}</span>
                  <span className="text-[10px] text-cyan-400 flex items-center gap-0.5">
                    <ShieldCheck className="h-2.5 w-2.5" /> {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-medium px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

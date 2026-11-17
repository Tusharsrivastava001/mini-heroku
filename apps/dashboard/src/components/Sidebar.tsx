import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Workspace } from '../types/index.js';
import {
  Layers,
  LayoutDashboard,
  Rocket,
  History,
  Server,
  Activity,
  Terminal,
  Key,
  Settings,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
  activeView?: string;
  onSelectView?: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  activeView = 'overview',
  onSelectView,
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const workspaces: Workspace[] = [
    { id: 'ws-personal', name: 'Personal Workspace', slug: 'personal', plan: 'Hobby', clusterRegion: 'localtest.me (k3s)' },
    { id: 'ws-production', name: 'Production Cluster', slug: 'production', plan: 'Enterprise', clusterRegion: 'aws-us-east-1' },
    { id: 'ws-staging', name: 'Staging Environment', slug: 'staging', plan: 'Pro', clusterRegion: 'k3s-staging' },
  ];
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace>(workspaces[0]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/' },
    { id: 'projects', label: 'Projects', icon: Layers, path: '/?view=projects' },
    { id: 'deployments', label: 'Deployments', icon: Rocket, path: '/?view=deployments' },
    { id: 'builds', label: 'Build History', icon: History, path: '/?view=builds' },
    { id: 'infrastructure', label: 'Infrastructure', icon: Server, path: '/?view=infrastructure' },
    { id: 'monitoring', label: 'Monitoring', icon: Activity, path: '/?view=monitoring' },
    { id: 'logs', label: 'Logs', icon: Terminal, path: '/?view=logs' },
    { id: 'env-vars', label: 'Environment Vars', icon: Key, path: '/?view=env-vars' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/?view=settings' },
  ];

  const handleNavClick = (itemId: string) => {
    if (onSelectView) {
      onSelectView(itemId);
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out flex flex-col justify-between border-r border-slate-800/80 bg-[#0C1019] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Brand */}
      <div className="flex flex-col">
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/60">
          <Link to="/" className="flex items-center gap-3 overflow-hidden group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/25 shrink-0 transition-transform group-hover:scale-105">
              <div className="h-full w-full bg-[#080B12] rounded-[11px] flex items-center justify-center">
                <Zap className="h-4.5 w-4.5 text-cyan-400 fill-cyan-400/20" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  DeployForge
                  <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
                    PaaS
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 truncate">Ship faster. Scale smarter.</span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Workspace Switcher */}
        {!isCollapsed ? (
          <div className="px-3 pt-3 relative">
            <button
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="w-full p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="h-7 w-7 rounded-lg bg-violet-950/60 border border-violet-700/40 flex items-center justify-center font-bold text-xs text-violet-300 font-mono">
                  {selectedWorkspace.name[0]}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                    {selectedWorkspace.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    {selectedWorkspace.clusterRegion}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Dropdown menu */}
            {workspaceOpen && (
              <div className="absolute top-full left-3 right-3 mt-1.5 p-1 rounded-xl bg-[#111827] border border-slate-800 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Switch Workspace
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setSelectedWorkspace(ws);
                      setWorkspaceOpen(false);
                    }}
                    className="w-full p-2 rounded-lg text-left text-xs flex items-center justify-between hover:bg-slate-800/60 text-slate-200 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-white">{ws.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{ws.clusterRegion}</div>
                    </div>
                    {selectedWorkspace.id === ws.id && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 flex justify-center">
            <div
              title={selectedWorkspace.name}
              className="h-8 w-8 rounded-lg bg-violet-950/60 border border-violet-700/40 flex items-center justify-center font-bold text-xs text-violet-300 font-mono cursor-pointer"
            >
              {selectedWorkspace.name[0]}
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              activeView === item.id ||
              (item.id === 'overview' && activeView === 'overview' && location.pathname === '/');

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isItemActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-cyan-500/10 text-white border border-violet-500/30 shadow-sm shadow-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isItemActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-800/60 space-y-2">
        {/* System Status Pill */}
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Cluster Healthy</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">99.98%</span>
          </div>
        ) : (
          <div className="flex justify-center py-1" title="Cluster Healthy (99.98%)">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}

        {/* Secondary Links */}
        <div className="space-y-0.5">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            title={isCollapsed ? 'Documentation' : undefined}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            {!isCollapsed && <span>Documentation</span>}
          </a>
          <button
            onClick={() => alert('DeployForge Enterprise Support: Contact support@deployforge.local or consult docs/runbook.md')}
            title={isCollapsed ? 'Help & Support' : undefined}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            {!isCollapsed && <span>Help & Support</span>}
          </button>
        </div>

        {/* User Profile & Logout */}
        {user && (
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <img
                src={user.avatarUrl || 'https://avatars.githubusercontent.com/u/1024025?v=4'}
                alt={user.username}
                className="h-8 w-8 rounded-full border border-violet-500/30 object-cover shrink-0"
              />
              {!isCollapsed && (
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 truncate">{user.username}</div>
                  <div className="text-[10px] text-violet-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {user.role}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};


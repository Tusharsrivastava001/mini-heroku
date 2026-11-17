import React, { useState, useEffect } from 'react';
import { User, NotificationItem } from '../types/index.js';
import {
  Search,
  Bell,
  Plus,
  ShieldCheck,
  LogOut,
  Sparkles,
  Command,
  Check,
  Menu,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onOpenNewProject: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenNewProject,
  searchQuery,
  onSearchChange,
  onToggleMobileSidebar,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Sample real notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Deployment Live',
      message: 'Node API Microservice successfully deployed to k3s cluster.',
      type: 'success',
      timestamp: '2m ago',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'HPA Triggered',
      message: 'Cluster autoscaler allocated 2 additional replicas for ingress.',
      type: 'info',
      timestamp: '25m ago',
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Security Policy Active',
      message: 'Default-deny NetworkPolicy enforced for all user workloads.',
      type: 'info',
      timestamp: '2h ago',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-[#0C1019]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Greeting */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {getGreeting()}, <span className="text-slate-100 font-semibold">{user?.username || 'Engineer'}</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-950/60 text-violet-300 border border-violet-800/40">
              <Sparkles className="h-2.5 w-2.5 text-violet-400" />
              Pro PaaS
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            cluster: <span className="text-cyan-400">localtest.me</span> • ingress: <span className="text-slate-300">Traefik TLS</span>
          </span>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-md mx-2 relative hidden md:block">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search projects, deployments, resources..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 rounded-xl pl-9 pr-12 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all font-sans"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
            <Command className="h-2.5 w-2.5" /> K
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notifications"
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-[#0C1019] animate-pulse"></span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-violet-500/20 text-violet-300">
                      {unreadCount} new
                    </span>
                  )}
                </span>
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs transition-colors ${n.read ? 'bg-slate-900/40 text-slate-400' : 'bg-violet-950/20 border border-violet-800/30 text-slate-200'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <img
                src={user.avatarUrl || 'https://avatars.githubusercontent.com/u/1024025?v=4'}
                alt={user.username}
                className="h-8 w-8 rounded-full border border-violet-500/40 object-cover"
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2.5 border-b border-slate-800">
                  <div className="text-xs font-semibold text-white">{user.username}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{user.email || 'developer@deployforge.local'}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/15 text-violet-300">
                    <ShieldCheck className="h-2.5 w-2.5" /> Role: {user.role}
                  </div>
                </div>

                <div className="pt-1.5 space-y-0.5 text-xs">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <span>GitHub Profile</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <span>Sign Out</span>
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary Action Button: New Project */}
        <button
          onClick={onOpenNewProject}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-lg shadow-violet-500/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Project</span>
        </button>
      </div>
    </header>
  );
};

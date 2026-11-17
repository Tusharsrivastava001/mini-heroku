import React, { useState } from 'react';
import { User } from '../types/index.js';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  onOpenNewProject: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeView?: string;
  onSelectView?: (view: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  onOpenNewProject,
  searchQuery,
  onSearchChange,
  activeView = 'overview',
  onSelectView,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080B12] text-[#F8FAFC] flex relative overflow-x-hidden">
      {/* Soft Ambient Background Lighting (Linear/Vercel style) */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Desktop Collapsible Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          user={user}
          onLogout={onLogout}
          activeView={activeView}
          onSelectView={onSelectView}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 h-full z-10">
            <Sidebar
              user={user}
              onLogout={onLogout}
              activeView={activeView}
              onSelectView={(v) => {
                if (onSelectView) onSelectView(v);
                setMobileSidebarOpen(false);
              }}
              isCollapsed={false}
              onToggleCollapse={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header
          user={user}
          onLogout={onLogout}
          onOpenNewProject={onOpenNewProject}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};


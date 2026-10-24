import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types/index.js';
import { api } from '../api/client.js';
import { ProjectCard } from '../components/ProjectCard.js';
import { CreateProjectModal } from '../components/CreateProjectModal.js';
import { Plus, Server, Layers, Cpu, ShieldCheck, RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.listProjects();
      setProjects(res.projects);
    } catch {
      // handled by auth interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 4000); // 4s polling for live deployment status updates
    return () => clearInterval(interval);
  }, []);

  const liveProjectsCount = projects.filter(
    (p) => p.deployments?.[0]?.status === 'LIVE'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Your Projects</h1>
          <p className="text-xs text-slate-400 mt-1">
            Self-service Kubernetes workloads deployed on DeployForge platform.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all shrink-0 hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" /> New Deployment
        </button>
      </div>

      {/* Cluster Overview Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Layers className="h-4 w-4 text-cyan-400" /> Total Projects
          </div>
          <div className="text-2xl font-bold text-white font-mono">{projects.length}</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Server className="h-4 w-4 text-emerald-400" /> Active Workloads
          </div>
          <div className="text-2xl font-bold text-white font-mono">{liveProjectsCount}</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Cpu className="h-4 w-4 text-indigo-400" /> Ingress Gateway
          </div>
          <div className="text-sm font-semibold text-slate-200 mt-1">Traefik + TLS</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <ShieldCheck className="h-4 w-4 text-amber-400" /> Multi-Tenancy
          </div>
          <div className="text-sm font-semibold text-slate-200 mt-1">NetworkPolicy Enforced</div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-24 flex items-center justify-center text-slate-500 gap-2">
          <RefreshCw className="h-5 w-5 animate-spin text-cyan-500" />
          <span className="text-sm">Loading applications...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center max-w-xl mx-auto space-y-4">
          <div className="h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No applications deployed yet</h3>
          <p className="text-xs text-slate-400">
            Deploy your first microservice or static site to create an isolated Kubernetes namespace, build the container, and get a live HTTPS URL.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black inline-flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" /> Deploy Your First App
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(projectId) => {
          fetchProjects();
          navigate(`/projects/${projectId}`);
        }}
      />
    </div>
  );
};

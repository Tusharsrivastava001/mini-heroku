import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Project, Deployment, ProjectMetricPoint } from '../types/index.js';
import { api } from '../api/client.js';
import { LogTerminal } from '../components/LogTerminal.js';
import { DeploymentsList } from '../components/DeploymentsList.js';
import { MetricsChart } from '../components/MetricsChart.js';
import { EnvVarsManager } from '../components/EnvVarsManager.js';
import {
  Globe,
  GitBranch,
  Play,
  Cpu,
  Key,
  Settings,
  Terminal,
  Activity,
  Trash2,
  ExternalLink,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetricPoint[]>([]);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deployments' | 'metrics' | 'env' | 'settings'>('deployments');
  const [loading, setLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);

  // Settings form state
  const [port, setPort] = useState(3000);
  const [replicasMin, setReplicasMin] = useState(1);
  const [replicasMax, setReplicasMax] = useState(3);
  const [targetCpuPercent, setTargetCpuPercent] = useState(80);
  const [branch, setBranch] = useState('main');

  const fetchProjectData = async () => {
    if (!id) return;
    try {
      const [projRes, depRes, metRes] = await Promise.all([
        api.getProject(id),
        api.listDeployments(id),
        api.getProjectMetrics(id).catch(() => ({ metrics: [] })),
      ]);

      setProject(projRes.project);
      setDeployments(depRes.deployments);
      setMetrics(metRes.metrics);

      setPort(projRes.project.port);
      setReplicasMin(projRes.project.replicasMin);
      setReplicasMax(projRes.project.replicasMax);
      setTargetCpuPercent(projRes.project.targetCpuPercent);
      setBranch(projRes.project.branch);

      // Select latest deployment if none selected
      if (!selectedDeploymentId && depRes.deployments.length > 0) {
        setSelectedDeploymentId(depRes.deployments[0].id);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
    const interval = setInterval(fetchProjectData, 3000); // Poll status updates
    return () => clearInterval(interval);
  }, [id]);

  const handleTriggerDeploy = async () => {
    if (!id || !project) return;
    setIsDeploying(true);
    try {
      const { deployment } = await api.triggerDeploy(id, {
        branch: project.branch,
        commitMessage: 'Manual redeploy from console',
      });
      setSelectedDeploymentId(deployment.id);
      setActiveTab('deployments');
      fetchProjectData();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.updateProject(id, {
        port: Number(port),
        replicasMin: Number(replicasMin),
        replicasMax: Number(replicasMax),
        targetCpuPercent: Number(targetCpuPercent),
        branch,
      });
      alert('Settings updated successfully!');
      fetchProjectData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDeleteProject = async () => {
    if (!id || !project) return;
    if (!confirm(`Are you sure you want to permanently delete '${project.name}' and all associated Kubernetes resources?`)) {
      return;
    }
    await api.deleteProject(id);
    navigate('/');
  };

  if (loading || !project) {
    return (
      <div className="py-24 flex items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-cyan-500" />
        <span className="text-sm">Loading project...</span>
      </div>
    );
  }

  const latestDeployment = deployments[0];
  const liveUrl = latestDeployment?.liveUrl;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors font-medium"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to Projects
        </Link>
      </div>

      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
              {project.slug}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <GitBranch className="h-3 w-3 text-cyan-400" />
              {project.repoUrl.replace('https://github.com/', '')} ({project.branch})
            </a>
            <span>•</span>
            <span>Port {project.port}</span>
            <span>•</span>
            <span>HPA: {project.replicasMin}-{project.replicasMax} pods</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-2 transition-all"
            >
              <Globe className="h-4 w-4" /> Visit App <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          )}

          <button
            onClick={handleTriggerDeploy}
            disabled={isDeploying}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {isDeploying ? 'Deploying...' : 'Redeploy'}
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px text-xs font-medium">
        <button
          onClick={() => setActiveTab('deployments')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 border-b-2 font-semibold ${
            activeTab === 'deployments'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="h-4 w-4" /> Deployments & Logs
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 border-b-2 font-semibold ${
            activeTab === 'metrics'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="h-4 w-4" /> Observability & Metrics
        </button>

        <button
          onClick={() => setActiveTab('env')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 border-b-2 font-semibold ${
            activeTab === 'env'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="h-4 w-4" /> Environment Secrets
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 border-b-2 font-semibold ${
            activeTab === 'settings'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="h-4 w-4" /> Settings & Scaling
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'deployments' && (
        <div className="space-y-6">
          {/* Live Terminal */}
          {selectedDeploymentId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Live Build Output Stream
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  Target: {latestDeployment?.imageTag || 'container'}
                </span>
              </div>
              <LogTerminal deploymentId={selectedDeploymentId} isLive={true} />
            </div>
          )}

          {/* Deployments History List */}
          <DeploymentsList
            deployments={deployments}
            selectedDeploymentId={selectedDeploymentId}
            onSelectDeployment={(depId) => setSelectedDeploymentId(depId)}
            onRollbackTriggered={() => fetchProjectData()}
          />
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <MetricsChart metrics={metrics} targetCpuPercent={project.targetCpuPercent} />
        </div>
      )}

      {activeTab === 'env' && (
        <EnvVarsManager
          projectId={project.id}
          initialEnvVars={project.envVars || []}
          onUpdated={() => fetchProjectData()}
        />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <form onSubmit={handleSaveSettings} className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              Autoscaling & Container Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Git Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Container Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Min Replicas</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={replicasMin}
                  onChange={(e) => setReplicasMin(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Max Replicas</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={replicasMax}
                  onChange={(e) => setReplicasMax(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target CPU %</label>
                <input
                  type="number"
                  min="20"
                  max="95"
                  value={targetCpuPercent}
                  onChange={(e) => setTargetCpuPercent(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black transition-colors"
            >
              Save Configuration
            </button>
          </form>

          {/* Danger Zone */}
          <div className="glass-panel rounded-xl p-6 border border-rose-950/60 bg-rose-950/10 space-y-3">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Danger Zone
            </h3>
            <p className="text-xs text-slate-400">
              Permanently delete this project. This immediately removes all Kubernetes Deployments, Services, Secrets, Ingresses, and HPA resources in its namespace.
            </p>
            <button
              type="button"
              onClick={handleDeleteProject}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
            >
              Delete Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

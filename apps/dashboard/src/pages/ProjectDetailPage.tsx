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
  Key,
  Settings,
  Terminal,
  Activity,
  Trash2,
  ExternalLink,
  ChevronLeft,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

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
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
    const interval = setInterval(fetchProjectData, 4000);
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchProjectData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDeleteProject = async () => {
    if (!id || !project) return;
    if (
      !confirm(
        `Are you sure you want to permanently delete '${project.name}' and all associated Kubernetes resources?`
      )
    ) {
      return;
    }
    await api.deleteProject(id);
    navigate('/');
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loading || !project) {
    return (
      <div className="py-24 flex items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-cyan-500" />
        <span className="text-sm font-mono">Loading microservice console...</span>
      </div>
    );
  }

  const latestDeployment = deployments[0];
  const liveUrl = latestDeployment?.liveUrl || `http://${project.slug}.localtest.me`;

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link to="/" className="hover:text-white flex items-center gap-1 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
          Projects
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-bold">{project.name}</span>
      </div>

      {/* Top Banner Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${latestDeployment?.status === 'LIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : latestDeployment?.status === 'BUILDING'
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
            >
              {latestDeployment?.status || 'QUEUED'}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">{project.description || project.repoUrl}</p>

          {/* Links & metadata pills */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {/* Live production URL */}
            <div className="flex items-center gap-1.5 bg-cyan-950/30 border border-cyan-800/40 rounded-xl px-3 py-1">
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {liveUrl}
              </a>
              <button
                onClick={() => handleCopyUrl(liveUrl)}
                title="Copy URL"
                className="ml-1 text-slate-400 hover:text-white transition-colors"
              >
                {copiedUrl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>

            {/* Git repo link */}
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 transition-colors"
            >
              <GitBranch className="h-3.5 w-3.5 text-slate-400" />
              <span>{project.branch}</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Deploy Trigger Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleTriggerDeploy}
            disabled={isDeploying}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2 shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {isDeploying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Triggering Kaniko Build...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Deploy Latest Commit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('deployments')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'deployments'
              ? 'border-violet-500 text-white bg-violet-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span>Deployments & Logs</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
            {deployments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'metrics'
              ? 'border-violet-500 text-white bg-violet-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <Activity className="h-4 w-4 text-violet-400" />
          <span>Metrics & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('env')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'env'
              ? 'border-violet-500 text-white bg-violet-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <Key className="h-4 w-4 text-emerald-400" />
          <span>Environment Secrets</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
            {project.envVars?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'settings'
              ? 'border-violet-500 text-white bg-violet-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <Settings className="h-4 w-4 text-amber-400" />
          <span>Settings & Autoscaling</span>
        </button>
      </div>

      {/* TAB CONTENT: DEPLOYMENTS & LIVE STREAMING LOGS */}
      {activeTab === 'deployments' && (
        <div className="space-y-6">
          {selectedDeploymentId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                  Live Container Build & Deployment Stream
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  Target: {selectedDeploymentId.substring(0, 8)}
                </span>
              </div>
              <LogTerminal
                deploymentId={selectedDeploymentId}
                isLive={deployments.find((d) => d.id === selectedDeploymentId)?.status === 'BUILDING'}
              />
            </div>
          )}

          <DeploymentsList
            deployments={deployments}
            selectedDeploymentId={selectedDeploymentId}
            onSelectDeployment={(depId) => setSelectedDeploymentId(depId)}
            onRollbackTriggered={fetchProjectData}
          />
        </div>
      )}

      {/* TAB CONTENT: METRICS */}
      {activeTab === 'metrics' && (
        <MetricsChart metrics={metrics} targetCpuPercent={project.targetCpuPercent} />
      )}

      {/* TAB CONTENT: ENVIRONMENT SECRETS */}
      {activeTab === 'env' && (
        <EnvVarsManager
          projectId={project.id}
          initialEnvVars={project.envVars || []}
          onUpdated={fetchProjectData}
        />
      )}

      {/* TAB CONTENT: SETTINGS & DANGER ZONE */}
      {activeTab === 'settings' && (
        <div className="space-y-8 max-w-4xl">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="h-4 w-4" />
              <span>Project settings and autoscaling policies updated successfully.</span>
            </div>
          )}

          {/* Autoscaling & Port Config */}
          <form onSubmit={handleSaveSettings} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-violet-400" />
                Application Runtime & Autoscaling
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure container port exposure, replica boundaries, and CPU scale targets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Application Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Min Replicas</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={replicasMin}
                  onChange={(e) => setReplicasMin(Number(e.target.value))}
                  className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Replicas</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={replicasMax}
                  onChange={(e) => setReplicasMax(Number(e.target.value))}
                  className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Autoscaling CPU Target Threshold (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="95"
                  value={targetCpuPercent}
                  onChange={(e) => setTargetCpuPercent(Number(e.target.value))}
                  className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Kubernetes HorizontalPodAutoscaler (HPA) will scale out when avg CPU exceeds this value.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20 transition-all hover:scale-[1.02]"
              >
                Save Configuration
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="rounded-2xl p-6 border border-rose-900/40 bg-rose-950/10 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-sm font-bold">Danger Zone</h3>
            </div>
            <p className="text-xs text-slate-400">
              Permanently delete this microservice, tear down its Kubernetes deployments, services, ingress routes, and purge its build log history. This action cannot be undone.
            </p>
            <button
              onClick={handleDeleteProject}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Microservice</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

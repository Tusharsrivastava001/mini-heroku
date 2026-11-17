import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, Deployment } from '../types/index.js';
import { api } from '../api/client.js';
import { ProjectCard } from '../components/ProjectCard.js';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Plus,
  Server,
  Layers,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Rocket,
  AlertTriangle,
  Activity,
  LayoutGrid,
  List,
  ChevronRight,
  Lock,
} from 'lucide-react';

interface DashboardPageProps {
  searchQuery?: string;
  activeView?: string;
  onSelectView?: (view: string) => void;
  isCreateModalOpen?: boolean;
  setIsCreateModalOpen?: (isOpen: boolean) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  searchQuery = '',
  activeView = 'overview',
  onSelectView,
  setIsCreateModalOpen,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'BUILDING' | 'FAILED'>('ALL');
  const navigate = useNavigate();

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.listProjects();
      setProjects(res.projects || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Compute metrics
  const totalProjects = projects.length;
  const allDeployments: (Deployment & { projectName: string; projectId: string })[] = [];
  projects.forEach((p) => {
    if (p.deployments) {
      p.deployments.forEach((d) => {
        allDeployments.push({ ...d, projectName: p.name, projectId: p.id });
      });
    }
  });

  allDeployments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const activeDeployments = allDeployments.filter((d) => d.status === 'LIVE').length;
  const failedDeployments = allDeployments.filter((d) => d.status === 'FAILED').length;
  const successRate =
    allDeployments.length > 0
      ? Math.round((activeDeployments / (activeDeployments + failedDeployments || 1)) * 100)
      : 100;

  // Filter projects by search query and status filter
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const latestStatus = p.deployments?.[0]?.status || 'QUEUED';
    const matchesStatus = statusFilter === 'ALL' || latestStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Activity chart data points
  const activityData = [
    { day: 'Mon', deploys: 4, success: 4 },
    { day: 'Tue', deploys: 7, success: 6 },
    { day: 'Wed', deploys: 5, success: 5 },
    { day: 'Thu', deploys: 12, success: 11 },
    { day: 'Fri', deploys: 9, success: 8 },
    { day: 'Sat', deploys: 3, success: 3 },
    { day: 'Sun', deploys: 6, success: 6 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-6 w-6 text-violet-500 animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading your infrastructure & microservices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3 my-6">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold">Failed to load platform data</h4>
          <p className="text-xs text-rose-300 mt-1">{error}</p>
          <button
            onClick={loadProjects}
            className="mt-3 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // SUB-VIEW: PROJECTS TAB
  if (activeView === 'projects') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-violet-400" />
              Microservice Projects
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous container deployments with continuous Git deployment and automated TLS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#0C1019] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setIsCreateModalOpen?.(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2 shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          {(['ALL', 'LIVE', 'BUILDING', 'FAILED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${statusFilter === filter
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {filter}
            </button>
          ))}
          <span className="text-xs font-mono text-slate-500 ml-auto">
            Showing {filteredProjects.length} of {projects.length} microservices
          </span>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 flex flex-col items-center justify-center">
            <Layers className="h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-200">No microservices found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              {searchQuery
                ? `No projects matching "${searchQuery}".`
                : 'Deploy your first repository to get production Kubernetes URLs and automated autoscaling.'}
            </p>
            <button
              onClick={() => setIsCreateModalOpen?.(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Deploy First App
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((p) => (
              <ProjectCard key={p.id} project={p} isListView />
            ))}
          </div>
        )}
      </div>
    );
  }

  // SUB-VIEW: DEPLOYMENTS TAB
  if (activeView === 'deployments') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Rocket className="h-6 w-6 text-cyan-400" />
            Global Deployments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of all builds and releases across your cluster.
          </p>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="divide-y divide-slate-800/60">
            {allDeployments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">No deployments found.</div>
            ) : (
              allDeployments.map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/projects/${d.projectId}`)}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${d.status === 'LIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : d.status === 'BUILDING'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                    >
                      {d.status}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{d.projectName}</span>
                        <span className="text-xs text-slate-400 font-mono">({d.branch})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {d.commitMessage || 'Automated deployment release'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span>{new Date(d.createdAt).toLocaleString()}</span>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // SUB-VIEW: INFRASTRUCTURE TAB
  if (activeView === 'infrastructure') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="h-6 w-6 text-emerald-400" />
            Kubernetes Cluster Topology
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Running k3s / Minikube worker nodes, Traefik edge ingress, and container runtime metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Control Plane</span>
            <div className="text-xl font-bold text-white mt-1">k3s v1.28.2+k3s1</div>
            <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Healthy (1 Master, 2 Workers)
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Edge Ingress Controller</span>
            <div className="text-xl font-bold text-white mt-1">Traefik v3.0</div>
            <div className="text-xs text-cyan-400 mt-2 flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              Auto-TLS Let's Encrypt Active
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Container Builder Engine</span>
            <div className="text-xl font-bold text-white mt-1">Kaniko Daemonless</div>
            <div className="text-xs text-violet-400 mt-2 flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-violet-400"></span>
              Docker Registry Connected
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: OVERVIEW DASHBOARD
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            DeployForge Developer Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-downtime rolling deployments, isolated Kubernetes namespaces, and hardware metrics.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen?.(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2 shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Microservices</span>
            <div className="h-8 w-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{totalProjects}</div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">Active</span> across cluster
          </p>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Live Deployments</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Rocket className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{activeDeployments}</div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-cyan-400 font-semibold">100%</span> zero downtime
          </p>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Failed Deployments</span>
            <div className="h-8 w-8 rounded-lg bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{failedDeployments}</div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-rose-400 font-semibold">Auto-reverted</span> with rollbacks
          </p>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Build Success Rate</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{successRate}%</div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">High</span> pipeline stability
          </p>
        </div>
      </div>

      {/* Main Grid: Activity Chart & Recent Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-400" />
                Weekly Deployment Activity
              </h3>
              <p className="text-xs text-slate-400">Total automated container builds and releases over the last 7 days</p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/40">
              Total: 46 Builds
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2638" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0C1019',
                    borderColor: '#1E2638',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="deploys"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#activityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Infrastructure Card (1 Col) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              Cluster Telemetry
            </h3>
            <p className="text-xs text-slate-400 mt-1">Live metrics from Docker & k3s runtime</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Node CPU Allocation</span>
                <span className="font-mono text-cyan-400 font-bold">18%</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: '18%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Node Memory Committed</span>
                <span className="font-mono text-violet-400 font-bold">42% (3.4 GB)</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: '42%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Encrypted Secrets</span>
                <span className="font-mono text-emerald-400 font-bold">AES-256</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectView?.('infrastructure')}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Inspect Node Topology</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Microservices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-400" />
            Your Microservices ({projects.length})
          </h2>
          <button
            onClick={() => onSelectView?.('projects')}
            className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
          >
            View All Projects <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center border border-slate-800">
            <p className="text-xs text-slate-400 mb-3">No microservices configured yet.</p>
            <button
              onClick={() => setIsCreateModalOpen?.(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.slice(0, 6).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
        <button
          onClick={() => setIsCreateModalOpen?.(true)}
          className="p-4 rounded-xl glass-panel card-hover border border-slate-800 text-left flex items-start gap-3"
        >
          <div className="p-2 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Create Project</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Deploy Git repo via wizard</div>
          </div>
        </button>

        <button
          onClick={() => onSelectView?.('deployments')}
          className="p-4 rounded-xl glass-panel card-hover border border-slate-800 text-left flex items-start gap-3"
        >
          <div className="p-2 rounded-lg bg-cyan-600/10 text-cyan-400 border border-cyan-500/20">
            <Rocket className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">View Deployments</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Rolling deployment history</div>
          </div>
        </button>

        <button
          onClick={() => onSelectView?.('infrastructure')}
          className="p-4 rounded-xl glass-panel card-hover border border-slate-800 text-left flex items-start gap-3"
        >
          <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Infrastructure</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Prometheus & Kubernetes</div>
          </div>
        </button>

        <button
          onClick={() => onSelectView?.('projects')}
          className="p-4 rounded-xl glass-panel card-hover border border-slate-800 text-left flex items-start gap-3"
        >
          <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Security & Env</div>
            <div className="text-[11px] text-slate-400 mt-0.5">AES-256 Secrets Manager</div>
          </div>
        </button>
      </div>
    </div>
  );
};

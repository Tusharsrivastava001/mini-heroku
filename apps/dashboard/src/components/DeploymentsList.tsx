import React from 'react';
import { Deployment } from '../types/index.js';
import { api } from '../api/client.js';
import { RotateCcw, Terminal, GitCommit, GitBranch, AlertCircle } from 'lucide-react';

interface DeploymentsListProps {
  deployments: Deployment[];
  selectedDeploymentId: string | null;
  onSelectDeployment: (id: string) => void;
  onRollbackTriggered: () => void;
}

export const DeploymentsList: React.FC<DeploymentsListProps> = ({
  deployments,
  selectedDeploymentId,
  onSelectDeployment,
  onRollbackTriggered,
}) => {
    const handleRollback = async (e: React.MouseEvent, deploymentId: string) => {
      e.stopPropagation();
      if (!confirm('Are you sure you want to perform a zero-downtime rollback to this deployment?')) return;
      try {
        await api.triggerRollback(deploymentId);
        onRollbackTriggered();
      } catch (err) {
        alert((err as Error).message);
      }
    };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'LIVE':
                      return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE
                      </span>
                      );
                      case 'BUILDING':
                      return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                        BUILDING
                      </span>
                      );
                      case 'DEPLOYING':
                      return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                        DEPLOYING
                      </span>
                      );
                      case 'FAILED':
                      return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <AlertCircle className="h-3 w-3" />
                        FAILED
                      </span>
                      );
                      case 'ROLLED_BACK':
                      return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <RotateCcw className="h-3 w-3" />
                        ROLLED BACK
                      </span>
                      );
                      default:
                      return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        QUEUED
                      </span>
                      );
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
                      return (
                      d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit' }) +
                      ' on ' +
                      d.toLocaleDateString([], {month: 'short', day: 'numeric' })
                      );
    } catch {
      return dateStr;
    }
  };

                            return (
                            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
                              <div className="px-5 py-4 border-b border-slate-800 bg-[#0C1019] flex items-center justify-between">
                                <div>
                                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    Deployment History
                                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                                      Zero-Downtime Rollback
                                    </span>
                                  </h3>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Click any deployment to inspect build logs or revert
                                  </p>
                                </div>
                                <span className="text-xs text-slate-400 font-mono">{deployments.length} releases</span>
                              </div>

                                          <div className="divide-y divide-slate-800/60">
                                            {deployments.length === 0 ? (
                                              <div className="py-16 text-center text-xs text-slate-500">
                                                No deployments recorded yet. Trigger your first deployment above.
                                              </div>
                                            ) : (
                                              deployments.map((d, index) => {
                                                const isSelected = selectedDeploymentId === d.id;
                                                const canRollback = !!(d.imageTag);
                                                const isLatest = index === 0;

            return (
                                                      <div
                                                        key={d.id}
                                                        onClick={() => onSelectDeployment(d.id)}
                                                            className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer transition-all ${isSelected
                                                                ? 'bg-violet-950/20 border-l-2 border-violet-400'
                                                                : 'hover:bg-slate-900/50'
                                                              }`}
              >
                                                            {/* Left Details */}
                                                            <div className="flex items-start gap-3.5 min-w-0">
                                                              <div className="pt-0.5 shrink-0">{getStatusPill(d.status)}</div>

                                                                              <div className="flex flex-col min-w-0">
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                  <span className="text-xs font-bold text-slate-100 truncate">
                                                                                    {d.commitMessage || (isLatest ? 'Latest Production Release' : 'Manual Triggered Build')}
                                                                                  </span>
                                                                                  {isLatest && (
                                                                                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/20">
                                                                                      Current
                                                                                    </span>
                                                                                  )}
                                                                                  {d.rollbackOf && (
                                                                                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 flex items-center gap-1">
                                                                                      <RotateCcw className="h-2.5 w-2.5" /> Rollback
                                                                                    </span>
                                                                                  )}
                                                                                </div>

                                                                                    <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-400 flex-wrap">
                                                                                      <span className="flex items-center gap-1 text-slate-300">
                                                                                        <GitBranch className="h-3 w-3 text-cyan-400" />
                                                                                        {d.branch}
                                                                                      </span>
                                                                                      {d.commitHash && (
                                                                                        <span className="flex items-center gap-1 text-slate-400">
                                                                                          <GitCommit className="h-3 w-3 text-slate-500" />
                                                                                          {d.commitHash.substring(0, 7)}
                                                                                        </span>
                                                                                      )}
                                                                                        <span className="flex items-center gap-1 text-slate-400">
                                                                                          {formatTimestamp(d.createdAt)}
                                                                                        </span>
                                                                                        {d.imageTag && (
                                                                                            <span className="text-[10px] text-slate-500 truncate max-w-xs">
                                                                                              img: {d.imageTag}
                                                                                            </span>
                      )}
                                                                                          </div>

                    {d.errorMessage && (
                                                                                          <p className="text-[11px] text-rose-400 font-mono mt-1 bg-rose-950/20 px-2 py-0.5 rounded border border-rose-900/30">
                                                                                            Error: {d.errorMessage}
                                                                                          </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectDeployment(d.id); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                                                                      isSelected
                                                                                        ? 'bg-violet-600 text-white'
                                                                                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                                                                                    }`}
                  >
                                                                                    <Terminal className="h-3.5 w-3.5" />
                                                                                    <span>Logs</span>
                                                                                  </button>

                                                                                    { canRollback && !isLatest && (
                                                                                      <button
                                                                                        onClick={(e) => handleRollback(e, d.id)}
                                                                                        title="Rollback to this image"
                                                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
                                                                                      >
                                                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                                                        <span>Rollback</span>
                                                                                      </button>
                                                                                    )}
                                                                                </div>
                                                                              </div>
                                                                              );
          })
        )}
                                                                            </div>
                                                                          </div>
                                                                        );
};

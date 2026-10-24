import React from 'react';
import { Deployment } from '../types/index.js';
import { api } from '../api/client.js';
import { RotateCcw, Terminal, GitCommit, GitBranch, Clock } from 'lucide-react';

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
  const handleRollback = async (deploymentId: string) => {
    if (!confirm('Are you sure you want to rollback to this previous deployment?')) return;
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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            LIVE
          </span>
        );
      case 'BUILDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            BUILDING
          </span>
        );
      case 'DEPLOYING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            DEPLOYING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400">
            QUEUED
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200">Deployment History & Lineage</h3>
        <span className="text-xs text-slate-400 font-mono">{deployments.length} deployments</span>
      </div>

      <div className="divide-y divide-slate-800/80">
        {deployments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No deployments recorded yet.
          </div>
        ) : (
          deployments.map((d) => {
            const isSelected = selectedDeploymentId === d.id;
            const canRollback = d.status === 'LIVE' || d.imageTag;

            return (
              <div
                key={d.id}
                className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  isSelected ? 'bg-cyan-950/20 border-l-2 border-cyan-400' : 'hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">{getStatusPill(d.status)}</div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">
                        {d.commitMessage || 'Manual release'}
                      </span>
                      {d.rollbackOf && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Rollback
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                      <span className="flex items-center gap-1 text-slate-400">
                        <GitBranch className="h-3 w-3" /> {d.branch}
                      </span>
                      {d.commitHash && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <GitCommit className="h-3 w-3" /> {d.commitHash.substring(0, 7)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3 w-3" /> {new Date(d.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {d.errorMessage && (
                      <p className="text-[11px] text-rose-400 font-mono mt-1 bg-rose-950/20 px-2 py-0.5 rounded border border-rose-900/30">
                        Error: {d.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onSelectDeployment(d.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-cyan-500 text-black font-semibold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Terminal className="h-3 w-3" /> View Logs
                  </button>

                  {canRollback && (
                    <button
                      onClick={() => handleRollback(d.id)}
                      title="Rollback to this image"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" /> Rollback
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

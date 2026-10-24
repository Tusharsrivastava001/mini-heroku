import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types/index.js';
import { GitBranch, Globe, Cpu, ArrowUpRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const latestDeployment = project.deployments?.[0];
  const status = latestDeployment?.status || 'QUEUED';

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </span>
        );
      case 'BUILDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            BUILDING
          </span>
        );
      case 'DEPLOYING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            DEPLOYING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            QUEUED
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 hover:border-cyan-500/40 transition-all duration-200 group flex flex-col justify-between shadow-lg shadow-black/20">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <Link
              to={`/projects/${project.id}`}
              className="text-lg font-bold text-slate-100 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              {project.name}
              <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
            </Link>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{project.slug}</p>
          </div>
          {getStatusBadge(status)}
        </div>

        <p className="text-xs text-slate-300 line-clamp-2 mb-4">
          {project.description || 'No description provided.'}
        </p>

        {/* Live URL */}
        {latestDeployment?.liveUrl && (
          <a
            href={latestDeployment.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 rounded-lg px-2.5 py-1.5 mb-4 truncate transition-colors"
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{latestDeployment.liveUrl}</span>
          </a>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono text-slate-300">
            <GitBranch className="h-3 w-3 text-slate-400" />
            {project.branch}
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <Cpu className="h-3 w-3 text-slate-500" />
            {project.replicasMin}-{project.replicasMax} pods
          </span>
        </div>

        <Link
          to={`/projects/${project.id}`}
          className="text-xs text-slate-300 hover:text-cyan-400 font-medium transition-colors"
        >
          Manage →
        </Link>
      </div>
    </div>
  );
};

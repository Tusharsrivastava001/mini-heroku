import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types/index.js';
import {
  GitBranch,
  Globe,
  Cpu,
  ArrowUpRight,
  Copy,
  Check,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onDeployTriggered?: (projectId: string) => void;
  isListView?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isListView = false,
}) => {
  const [copied, setCopied] = useState(false);
  const latestDeployment = project.deployments?.[0];
  const status = latestDeployment?.status || 'QUEUED';

  const handleCopyUrl = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFrameworkBadge = (repoUrl: string, name: string) => {
    const combined = (repoUrl + ' ' + name).toLowerCase();
    if (combined.includes('express') || combined.includes('node')) {
      return { name: 'Node.js', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    }
    if (combined.includes('flask') || combined.includes('python') || combined.includes('django')) {
      return { name: 'Python', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    }
    if (combined.includes('next') || combined.includes('react')) {
      return { name: 'Next.js', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
    }
    if (combined.includes('go') || combined.includes('fiber')) {
      return { name: 'Golang', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    }
    return { name: 'Container', color: 'text-slate-400 bg-slate-800/60 border-slate-700/60' };
  };

  const framework = getFrameworkBadge(project.repoUrl, project.name);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </span>
        );
      case 'BUILDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            BUILDING
          </span>
        );
      case 'DEPLOYING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/30 shadow-sm shadow-violet-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"></span>
            DEPLOYING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            FAILED
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

  const liveUrl = latestDeployment?.liveUrl || `http://${project.slug}.localtest.me`;

  // LIST VIEW LAYOUT
  if (isListView) {
    return (
      <div className="glass-panel card-hover rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800/80">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5 text-violet-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/projects/${project.id}`}
                className="text-sm font-bold text-white hover:text-cyan-400 transition-colors truncate"
              >
                {project.name}
              </Link>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${framework.color}`}>
                {framework.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md">{project.description || project.repoUrl}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-slate-300">
            <GitBranch className="h-3.5 w-3.5 text-slate-400" />
            {project.branch}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <Cpu className="h-3.5 w-3.5 text-slate-400" />
            {project.replicasMin}-{project.replicasMax} pods
          </div>

          <div>{getStatusBadge(status)}</div>

          <Link
            to={`/projects/${project.id}`}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // GRID VIEW CARD LAYOUT
  return (
    <div className="glass-panel card-hover rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between relative group overflow-hidden">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="truncate">
            <div className="flex items-center gap-2">
              <Link
                to={`/projects/${project.id}`}
                className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5 truncate"
              >
                <span className="truncate">{project.name}</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 shrink-0" />
              </Link>
            </div>
            <span className="text-[11px] font-mono text-slate-400 block mt-0.5 truncate">{project.slug}</span>
          </div>

          <div className="shrink-0">{getStatusBadge(status)}</div>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {project.description || 'Self-service microservice deployed on DeployForge platform.'}
        </p>

        {/* Live URL Pill with 1-Click Copy */}
        <div className="flex items-center gap-1.5 mb-4">
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-800/40 rounded-xl px-3 py-1.5 truncate transition-colors"
          >
            <Globe className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <span className="truncate">{liveUrl}</span>
          </a>

          <button
            onClick={(e) => handleCopyUrl(e, liveUrl)}
            title="Copy Production URL"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Card Footer Details */}
      <div className="pt-3.5 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3 truncate">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${framework.color}`}>
            {framework.name}
          </span>
          <span className="flex items-center gap-1 font-mono text-slate-300 truncate">
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
          className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition-colors shrink-0"
        >
          Console <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

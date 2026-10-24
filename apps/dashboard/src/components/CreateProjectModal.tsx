import React, { useState } from 'react';
import { api } from '../api/client.js';
import { X, Sparkles, Plus, Trash2, GitBranch, Server, Cpu } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('https://github.com/expressjs/express');
  const [branch, setBranch] = useState('main');
  const [port, setPort] = useState(3000);
  const [replicasMin, setReplicasMin] = useState(1);
  const [replicasMax, setReplicasMax] = useState(3);
  const [targetCpuPercent, setTargetCpuPercent] = useState(80);
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: 'NODE_ENV', value: 'production' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
    );
  };

  const applyPreset = (presetType: 'node' | 'python' | 'static') => {
    if (presetType === 'node') {
      setName('Node API Microservice');
      setSlug('node-api');
      setDescription('High throughput Node.js Express microservice on Kubernetes');
      setRepoUrl('https://github.com/expressjs/express');
      setPort(3000);
      setReplicasMin(1);
      setReplicasMax(3);
      setTargetCpuPercent(80);
      setEnvVars([
        { key: 'NODE_ENV', value: 'production' },
        { key: 'PORT', value: '3000' },
      ]);
    } else if (presetType === 'python') {
      setName('Flask Analytics Service');
      setSlug('flask-service');
      setDescription('Python Flask API running with Gunicorn workers');
      setRepoUrl('https://github.com/pallets/flask');
      setPort(5000);
      setReplicasMin(1);
      setReplicasMax(4);
      setTargetCpuPercent(75);
      setEnvVars([
        { key: 'FLASK_ENV', value: 'production' },
        { key: 'WORKERS', value: '2' },
      ]);
    } else if (presetType === 'static') {
      setName('Modern Static Landing');
      setSlug('static-site');
      setDescription('Ultra-fast static web app served through Nginx Alpine');
      setRepoUrl('https://github.com/tailwindlabs/tailwindcss');
      setPort(80);
      setReplicasMin(1);
      setReplicasMax(2);
      setTargetCpuPercent(85);
      setEnvVars([]);
    }
  };

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...envVars];
    updated[index][field] = field === 'key' ? val.toUpperCase() : val;
    setEnvVars(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const envRecord: Record<string, string> = {};
      envVars.forEach((ev) => {
        if (ev.key.trim()) envRecord[ev.key.trim()] = ev.value;
      });

      const { project } = await api.createProject({
        name,
        slug: slug || undefined,
        description,
        repoUrl,
        branch,
        port: Number(port),
        replicasMin: Number(replicasMin),
        replicasMax: Number(replicasMax),
        targetCpuPercent: Number(targetCpuPercent),
        envVars: envRecord,
      });

      await api.triggerDeploy(project.id, {
        branch,
        commitMessage: 'Initial project release deployment',
      });

      onCreated(project.id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Create & Deploy Project</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Connect your repository. DeployForge will auto-build a container, provision an isolated namespace, and route live HTTPS traffic.
        </p>

        {/* Quick Presets */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Quick Start Presets
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('node')}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/60 text-slate-200 transition-all text-left"
            >
              🚀 Node.js Express
            </button>
            <button
              type="button"
              onClick={() => applyPreset('python')}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 text-slate-200 transition-all text-left"
            >
              🐍 Python Flask
            </button>
            <button
              type="button"
              onClick={() => applyPreset('static')}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 text-slate-200 transition-all text-left"
            >
              ⚡ Static HTML Site
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. My Express API"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subdomain Slug *</label>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 focus-within:border-cyan-500">
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="my-express-api"
                  className="bg-transparent text-slate-100 focus:outline-none w-full font-mono text-xs"
                />
                <span className="text-slate-600 text-xs">.localtest.me</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Repository URL (Git / HTTPS) *</label>
            <input
              type="text"
              required
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/org/repo"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <GitBranch className="h-3 w-3 text-slate-400" /> Branch
              </label>
              <input
                type="text"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Server className="h-3 w-3 text-slate-400" /> Container Port
              </label>
              <input
                type="number"
                required
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Cpu className="h-3 w-3 text-slate-400" /> Max Pods (HPA)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={replicasMax}
                onChange={(e) => setReplicasMax(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Environment Variables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Environment Variables
              </label>
              <button
                type="button"
                onClick={handleAddEnvVar}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Add Variable
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {envVars.map((ev, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="KEY"
                    value={ev.key}
                    onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="VALUE"
                    value={ev.value}
                    onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEnvVar(index)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Deploying...' : 'Deploy Project 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

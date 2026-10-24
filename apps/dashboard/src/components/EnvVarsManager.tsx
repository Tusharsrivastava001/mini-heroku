import React, { useState } from 'react';
import { EnvironmentVariable } from '../types/index.js';
import { api } from '../api/client.js';
import { Lock, Eye, EyeOff, Plus, Trash2, Key } from 'lucide-react';

interface EnvVarsManagerProps {
  projectId: string;
  initialEnvVars: EnvironmentVariable[];
  onUpdated: () => void;
}

export const EnvVarsManager: React.FC<EnvVarsManagerProps> = ({ projectId, initialEnvVars, onUpdated }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isSecret] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleValues, setVisibleValues] = useState<Record<string, boolean>>({});

  const toggleVisibility = (key: string) => {
    setVisibleValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    setIsSubmitting(true);
    try {
      await api.setEnvVar(projectId, newKey.trim().toUpperCase(), newValue, isSecret);
      setNewKey('');
      setNewValue('');
      onUpdated();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete environment variable ${key}?`)) return;
    await api.deleteEnvVar(projectId, key);
    onUpdated();
  };

  return (
    <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Key className="h-4 w-4 text-cyan-400" />
            Environment Secrets & Variables
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Encrypted with AES-256-GCM in PostgreSQL and mounted into pods as Kubernetes Secrets.
          </p>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <input
          type="text"
          placeholder="VARIABLE_NAME"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value.toUpperCase())}
          className="w-full sm:w-1/3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
          required
        />
        <input
          type="text"
          placeholder="Secret value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="w-full sm:w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center gap-1.5 transition-colors shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </form>

      {/* List */}
      <div className="divide-y divide-slate-800/60 border border-slate-800/80 rounded-lg overflow-hidden bg-slate-950/40">
        {initialEnvVars.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No environment variables configured yet.
          </div>
        ) : (
          initialEnvVars.map((ev) => (
            <div key={ev.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3 font-mono">
                <Lock className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                <span className="font-semibold text-slate-200">{ev.key}</span>
                <span className="text-slate-600 font-sans">=</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {visibleValues[ev.key] ? '•••••••• (Encrypted in DB)' : '••••••••••••••••'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleVisibility(ev.key)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Toggle mask"
                >
                  {visibleValues[ev.key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ev.key)}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete variable"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

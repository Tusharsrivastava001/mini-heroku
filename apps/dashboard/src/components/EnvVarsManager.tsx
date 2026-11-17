import React, { useState } from 'react';
import { EnvironmentVariable } from '../types/index.js';
import { api } from '../api/client.js';
import {
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Key,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';

interface EnvVarsManagerProps {
  projectId: string;
  initialEnvVars: EnvironmentVariable[];
  onUpdated: () => void;
}

export const EnvVarsManager: React.FC<EnvVarsManagerProps> = ({
  projectId,
  initialEnvVars,
  onUpdated,
}) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleValues, setVisibleValues] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const toggleVisibility = (key: string) => {
    setVisibleValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    setIsSubmitting(true);
    try {
      await api.setEnvVar(projectId, newKey.trim().toUpperCase(), newValue, true);
      setNewKey('');
      setNewValue('');
      setSuccessToast(`Secret ${newKey.trim().toUpperCase()} encrypted and saved.`);
      setTimeout(() => setSuccessToast(null), 3000);
      onUpdated();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete environment variable ${key}?`)) return;
    try {
      await api.deleteEnvVar(projectId, key);
      setSuccessToast(`Secret ${key} deleted.`);
      setTimeout(() => setSuccessToast(null), 3000);
      onUpdated();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/30 to-indigo-950/20 border border-violet-800/30 flex items-start gap-3.5">
        <div className="h-9 w-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            Kubernetes Secret Injection & AES-256-GCM Encryption
          </h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
            All environment variables are encrypted at rest with hardware-accelerated AES-256-GCM. During pod scheduling, DeployForge generates isolated Kubernetes Secrets mounted into container env specs.
          </p>
        </div>
      </div>

      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Add New Variable Form */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <Plus className="h-4 w-4 text-cyan-400" />
          Add Environment Secret
        </h4>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="VARIABLE_NAME (e.g. DATABASE_URL)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toUpperCase())}
              className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              required
            />
          </div>
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Secret value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Add Secret'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Variables Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-[#0C1019] flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-cyan-400" />
            Configured Variables ({initialEnvVars.length})
          </h4>
          <span className="text-[10px] font-mono text-slate-500">Auto-synchronized with K8s Secrets</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {initialEnvVars.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No environment variables configured yet for this project.
            </div>
          ) : (
            initialEnvVars.map((ev) => {
              const isRevealed = visibleValues[ev.key];

              return (
                <div
                  key={ev.id}
                  className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3 font-mono min-w-0">
                    <Lock className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    <span className="font-bold text-slate-100 truncate">{ev.key}</span>
                    <span className="text-slate-600">=</span>
                    <span className="text-slate-400 font-mono text-[11px] truncate">
                      {isRevealed ? '•••••••• (Encrypted in PostgreSQL)' : '••••••••••••••••'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleCopyKey(ev.key)}
                      title="Copy Key Name"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      {copiedKey === ev.key ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => toggleVisibility(ev.key)}
                      title={isRevealed ? 'Hide Value' : 'Reveal Value'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                    >
                      {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      onClick={() => handleDelete(ev.key)}
                      title="Delete Secret"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

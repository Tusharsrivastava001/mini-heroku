import React, { useState } from 'react';
import { api } from '../api/client.js';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  GitBranch,
  Server,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  Github,
  Sliders,
  Key,
  Terminal,
} from 'lucide-react';

interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

export const CreateProjectWizard: React.FC<CreateProjectWizardProps> = ({ isOpen, onClose, onCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Form State
  const [name, setName] = useState('My Microservice');
  const [slug, setSlug] = useState('my-microservice');
  const [description, setDescription] = useState('Cloud-native workload deployed on DeployForge platform');
  const [repoUrl, setRepoUrl] = useState('https://github.com/expressjs/express');
  const [branch, setBranch] = useState('main');
  const [rootDirectory, setRootDirectory] = useState('/');
  const [buildCommand, setBuildCommand] = useState('npm run build');
  const [runCommand, setRunCommand] = useState('npm start');
  const [port, setPort] = useState(3000);
  const [replicasMin, setReplicasMin] = useState(1);
  const [replicasMax, setReplicasMax] = useState(3);
  const [targetCpuPercent, setTargetCpuPercent] = useState(80);
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: 'NODE_ENV', value: 'production' },
    { key: 'PORT', value: '3000' },
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
        .substring(0, 40)
    );
  };

  const applyPreset = (presetType: 'node' | 'python' | 'nextjs' | 'go') => {
    if (presetType === 'node') {
      setName('Node API Microservice');
      setSlug('node-api');
      setDescription('High throughput Express REST API running on Kubernetes pods');
      setRepoUrl('https://github.com/expressjs/express');
      setBranch('main');
      setBuildCommand('npm install');
      setRunCommand('node index.js');
      setPort(3000);
      setReplicasMin(1);
      setReplicasMax(3);
      setTargetCpuPercent(80);
      setEnvVars([
        { key: 'NODE_ENV', value: 'production' },
        { key: 'PORT', value: '3000' },
      ]);
    } else if (presetType === 'python') {
      setName('Python Flask Service');
      setSlug('flask-service');
      setDescription('Python Flask analytics API running with Gunicorn workers');
      setRepoUrl('https://github.com/pallets/flask');
      setBranch('main');
      setBuildCommand('pip install -r requirements.txt');
      setRunCommand('gunicorn -w 4 -b 0.0.0.0:5000 app:app');
      setPort(5000);
      setReplicasMin(1);
      setReplicasMax(4);
      setTargetCpuPercent(75);
      setEnvVars([
        { key: 'FLASK_ENV', value: 'production' },
        { key: 'WORKERS', value: '4' },
      ]);
    } else if (presetType === 'nextjs') {
      setName('Next.js Fullstack App');
      setSlug('nextjs-app');
      setDescription('Production React 18 / Next.js server with edge rendering');
      setRepoUrl('https://github.com/vercel/next.js');
      setBranch('canary');
      setBuildCommand('pnpm build');
      setRunCommand('pnpm start');
      setPort(3000);
      setReplicasMin(2);
      setReplicasMax(5);
      setTargetCpuPercent(70);
      setEnvVars([
        { key: 'NODE_ENV', value: 'production' },
        { key: 'NEXT_TELEMETRY_DISABLED', value: '1' },
      ]);
    } else if (presetType === 'go') {
      setName('Go Fiber Microservice');
      setSlug('go-service');
      setDescription('Ultra-low latency Golang API compiled into scratch container');
      setRepoUrl('https://github.com/gofiber/fiber');
      setBranch('master');
      setBuildCommand('go build -o server .');
      setRunCommand('./server');
      setPort(8080);
      setReplicasMin(1);
      setReplicasMax(6);
      setTargetCpuPercent(85);
      setEnvVars([
        { key: 'PORT', value: '8080' },
      ]);
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

  const handleFinalDeploy = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const envRecord: Record<string, string> = {};
      envVars.forEach((ev) => {
        if (ev.key.trim()) {
          envRecord[ev.key.trim()] = ev.value;
        }
      });

      const res = await api.createProject({
        name,
        slug,
        description,
        repoUrl,
        branch,
        rootDirectory,
        buildCommand: buildCommand || undefined,
        runCommand: runCommand || undefined,
        port,
        replicasMin,
        replicasMax,
        targetCpuPercent,
        envVars: envRecord,
      });

      onCreated(res.project.id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Repository', desc: 'Source git repo' },
    { num: 2, title: 'Branch', desc: 'Git target' },
    { num: 3, title: 'Build', desc: 'Commands' },
    { num: 4, title: 'Port & Env', desc: 'Config' },
    { num: 5, title: 'Autoscale', desc: 'HPA Limits' },
    { num: 6, title: 'Review', desc: 'Launch' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-[#0C1019] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-md shadow-violet-500/20">
              <Rocket className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Create New Project
                <span className="text-[10px] font-mono font-normal text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/40">
                  Step {currentStep} of {totalSteps}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Deploy code directly to Kubernetes with zero infrastructure config</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 bg-[#080B12]/80 border-b border-slate-800/60 flex items-center justify-between gap-1 overflow-x-auto">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                className={`flex items-center gap-2 cursor-pointer transition-all ${isCurrent
                    ? 'text-violet-400 font-semibold'
                    : isCompleted
                      ? 'text-cyan-400 hover:text-cyan-300'
                      : 'text-slate-400 opacity-60'
                  }`}
              >
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 transition-all ${isCurrent
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/40'
                      : isCompleted
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.num}
                </div>
                <span className="text-[11px] whitespace-nowrap hidden sm:inline">{s.title}</span>
                {s.num < totalSteps && (
                  <div
                    className={`h-[1px] w-4 sm:w-6 hidden sm:block ${isCompleted ? 'bg-cyan-500/40' : 'bg-slate-800'
                      }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Wizard Step Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          {/* STEP 1: CONNECT REPOSITORY & PRESETS */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200">1-Click Starter Presets</label>
                <p className="text-[11px] text-slate-400 mb-2">Select a pre-configured architecture or specify custom Git repo</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('node')}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:border-violet-500/40 group"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-cyan-400">Node.js Express</div>
                    <div className="text-[10px] text-slate-400">REST API • Port 3000</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('python')}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:border-violet-500/40 group"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-cyan-400">Python Flask</div>
                    <div className="text-[10px] text-slate-400">Gunicorn • Port 5000</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('nextjs')}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:border-violet-500/40 group"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-cyan-400">Next.js 14</div>
                    <div className="text-[10px] text-slate-400">Fullstack • Port 3000</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('go')}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:border-violet-500/40 group"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-cyan-400">Go Fiber</div>
                    <div className="text-[10px] text-slate-400">Microservice • Port 8080</div>
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-200">Project Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Payments Gateway"
                    className="w-full mt-1 bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200">Application Slug</label>
                  <div className="mt-1 flex items-center rounded-xl bg-[#080B12] border border-slate-800 px-3.5 py-2 text-xs font-mono text-slate-400">
                    <span className="text-violet-400">localtest.me/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="bg-transparent text-white focus:outline-none ml-1 w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Github className="h-3.5 w-3.5 text-slate-400" />
                    Git Repository URL
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="w-full mt-1 bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BRANCH & ROOT DIRECTORY */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
                  Target Deployment Branch
                </label>
                <p className="text-[11px] text-slate-400 mb-2">The branch DeployForge watches for CI/CD builds</p>
                <div className="grid grid-cols-3 gap-2">
                  {['main', 'staging', 'dev'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBranch(b)}
                      className={`p-2.5 rounded-xl border text-xs font-mono text-center transition-all ${branch === b
                          ? 'bg-violet-600/20 border-violet-500 text-white font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Or enter custom branch"
                  className="w-full mt-2 bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200">Root Directory in Repository</label>
                <input
                  type="text"
                  value={rootDirectory}
                  onChange={(e) => setRootDirectory(e.target.value)}
                  placeholder="/"
                  className="w-full mt-1 bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Leave as / unless your project is in a monorepo subdirectory.</span>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIGURE BUILD & START COMMANDS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-violet-400" />
                  Build Command (Optional)
                </label>
                <input
                  type="text"
                  value={buildCommand}
                  onChange={(e) => setBuildCommand(e.target.value)}
                  placeholder="e.g. npm run build"
                  className="w-full mt-1 bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Executed during container creation (Kaniko build phase).</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Rocket className="h-3.5 w-3.5 text-cyan-400" />
                  Run / Start Command (Optional)
                </label>
                <input
                  type="text"
                  value={runCommand}
                  onChange={(e) => setRunCommand(e.target.value)}
                  placeholder="e.g. npm start or node index.js"
                  className="w-full mt-1 bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">The main container ENTRYPOINT / CMD inside the pod.</span>
              </div>
            </div>
          )}

          {/* STEP 4: PORT & ENVIRONMENT VARIABLES */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-cyan-400" />
                  Container Target Port
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  min={1}
                  max={65535}
                  className="w-full mt-1 bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">The port your application server listens on (e.g. 3000, 5000, 8080).</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-violet-400" />
                    Environment Variables (AES-256 Encrypted)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEnvVar}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Variable
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {envVars.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="KEY"
                        value={ev.key}
                        onChange={(e) => handleEnvVarChange(i, 'key', e.target.value)}
                        className="w-1/2 bg-[#080B12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                      />
                      <input
                        type="text"
                        placeholder="VALUE"
                        value={ev.value}
                        onChange={(e) => handleEnvVarChange(i, 'value', e.target.value)}
                        className="w-1/2 bg-[#080B12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEnvVar(i)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: AUTOSCALING (HPA) */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-200 text-xs font-semibold">
                <Sliders className="h-4 w-4 text-violet-400" />
                Kubernetes Horizontal Pod Autoscaler (HPA) Settings
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300">Min Replicas</label>
                  <input
                    type="number"
                    value={replicasMin}
                    onChange={(e) => setReplicasMin(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full mt-1 bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">Max Replicas</label>
                  <input
                    type="number"
                    value={replicasMax}
                    onChange={(e) => setReplicasMax(Number(e.target.value))}
                    min={replicasMin}
                    max={20}
                    className="w-full mt-1 bg-[#080B12] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Target CPU Utilization</span>
                  <span className="font-mono text-cyan-400 font-bold">{targetCpuPercent}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={95}
                  value={targetCpuPercent}
                  onChange={(e) => setTargetCpuPercent(Number(e.target.value))}
                  className="w-full accent-violet-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Kubernetes will automatically scale pods out when average CPU usage exceeds {targetCpuPercent}%.
                </span>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & DEPLOY */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#080B12] border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-sans">Project Name:</span>
                  <span className="text-white font-bold">{name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-sans">Slug / Live Ingress:</span>
                  <span className="text-cyan-400 font-bold">http://{slug}.localtest.me</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-sans">Git Repo:</span>
                  <span className="text-slate-200 truncate max-w-xs">{repoUrl}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-sans">Branch:</span>
                  <span className="text-violet-300">{branch}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-sans">Port:</span>
                  <span className="text-white">{port}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-sans">HPA Replicas:</span>
                  <span className="text-white">{replicasMin} - {replicasMax} pods (CPU: {targetCpuPercent}%)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-sans">Environment Variables:</span>
                  <span className="text-emerald-400">{envVars.filter((e) => e.key).length} secrets configured</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-800/30 flex items-center gap-3 text-xs text-slate-300">
                <Sparkles className="h-5 w-5 text-violet-400 shrink-0" />
                <span>Ready to containerize with Kaniko and provision isolated Kubernetes deployment, service, and ingress.</span>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0C1019] flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02]"
            >
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalDeploy}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white flex items-center gap-2 shadow-xl shadow-violet-500/30 transition-all hover:scale-[1.03] disabled:opacity-50"
            >
              <Rocket className="h-4 w-4" />
              <span>{isSubmitting ? 'Deploying to Cluster...' : 'Deploy Application'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
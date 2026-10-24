import React, { useEffect, useState, useRef } from 'react';
import { BuildLogLine } from '../types/index.js';
import { api, getToken } from '../api/client.js';
import { Terminal, Copy, Check, ArrowDown, RefreshCw } from 'lucide-react';

interface LogTerminalProps {
  deploymentId: string;
  isLive?: boolean;
}

export const LogTerminal: React.FC<LogTerminalProps> = ({ deploymentId, isLive = true }) => {
  const [logs, setLogs] = useState<BuildLogLine[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial historical logs
  useEffect(() => {
    let isMounted = true;
    api.getDeploymentLogs(deploymentId).then((res) => {
      if (isMounted) {
        setLogs(res.logs);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [deploymentId]);

  // Connect to SSE live log stream
  useEffect(() => {
    if (!isLive) return;

    const token = getToken();
    const url = `/api/deployments/${deploymentId}/logs/stream${token ? `?token=${token}` : ''}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.addEventListener('connected', () => {
      setConnected(true);
    });

    eventSource.addEventListener('log', (event) => {
      try {
        const parsed: BuildLogLine = JSON.parse(event.data);
        setLogs((prev) => {
          // Deduplicate by lineNumber if already present
          if (prev.some((l) => l.lineNumber === parsed.lineNumber)) return prev;
          return [...prev, parsed];
        });
      } catch (e) {
        // Fallback for plain text stream
        setLogs((prev) => [
          ...prev,
          {
            deploymentId,
            lineNumber: prev.length + 1,
            message: event.data,
            stream: 'stdout',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    });

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [deploymentId, isLive]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.stream}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLineStyle = (stream: string) => {
    switch (stream) {
      case 'stderr':
        return 'text-rose-400';
      case 'system':
        return 'text-cyan-400 font-semibold';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#070b14] shadow-2xl terminal-window">
      {/* Terminal Title Bar */}
      <div className="bg-[#0c1220] px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono text-slate-400 pl-2 flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            deploy-logs: {deploymentId.substring(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE SSE
            </span>
          ) : (
            <span className="text-[11px] font-mono text-slate-500">Stream idle</span>
          )}

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded text-xs transition-colors ${
              autoScroll ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-400 hover:text-white'
            }`}
            title="Auto-scroll"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleCopyLogs}
            className="p-1 rounded text-xs text-slate-400 hover:text-white transition-colors"
            title="Copy logs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono text-xs overflow-y-auto max-h-[520px] min-h-[320px] space-y-1 selection:bg-cyan-500 selection:text-black">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-slate-600 gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-500" />
            <span>Awaiting build pipeline events...</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start gap-3 hover:bg-white/[0.02] py-0.5 px-1 rounded">
              <span className="text-slate-600 select-none text-[10px] w-8 text-right shrink-0">
                {log.lineNumber || index + 1}
              </span>
              <span className="text-slate-600 select-none text-[10px] shrink-0">
                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
              </span>
              <span className={`break-all ${getLineStyle(log.stream)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

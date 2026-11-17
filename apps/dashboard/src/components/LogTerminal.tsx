import React, { useEffect, useState, useRef } from 'react';
import { BuildLogLine } from '../types/index.js';
import { api, getToken } from '../api/client.js';
import {
  Terminal,
  Copy,
  Check,
  ArrowDown,
  Trash2,
  Search,
  Maximize2,
  Minimize2,
  Radio,
} from 'lucide-react';

interface LogTerminalProps {
  deploymentId: string;
  isLive?: boolean;
}

export const LogTerminal: React.FC<LogTerminalProps> = ({ deploymentId, isLive = true }) => {
  const [logs, setLogs] = useState<BuildLogLine[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial historical logs from DB
  useEffect(() => {
    let isMounted = true;
    api
      .getDeploymentLogs(deploymentId)
      .then((res) => {
        if (isMounted && res.logs) {
          setLogs(res.logs);
        }
      })
      .catch(() => { });

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
          if (prev.some((l) => l.lineNumber === parsed.lineNumber)) return prev;
          return [...prev, parsed];
        });
      } catch {
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
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.stream.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const getLineStreamColor = (stream: string) => {
    switch (stream) {
      case 'stderr':
        return 'text-rose-400 font-medium';
      case 'system':
        return 'text-cyan-400 font-semibold';
      default:
        return 'text-slate-300';
    }
  };

  const filteredLogs = filterText
    ? logs.filter((l) => l.message.toLowerCase().includes(filterText.toLowerCase()))
    : logs;

  return (
    <div
      className={`glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col transition-all ${isFullscreen ? 'fixed inset-4 z-50 bg-[#06090F]' : 'relative'
        }`}
    >
      {/* Terminal Title Bar */}
      <div className="px-4 py-3 bg-[#0A0E17] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left Mac-style controls & ID */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80"></span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-200">build.log</span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline truncate max-w-[120px]">
              [{deploymentId.substring(0, 8)}]
            </span>
          </div>

          {/* Connection status badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
            {connected ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-semibold">Live SSE</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                <span className="text-slate-400">Stream Idle</span>
              </>
            )}
          </div>
        </div>

        {/* Right Search & Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Filter */}
          <div className="relative hidden sm:block">
            <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-[#0C1019] border border-slate-800 rounded-lg pl-7 pr-2 py-1 text-[11px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 w-36"
            />
          </div>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${autoScroll
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            title="Auto-scroll"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            <span className="text-[10px] hidden md:inline">Auto-scroll</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={handleClearLogs}
            title="Clear display logs"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            title="Copy logs to clipboard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        className={`p-4 overflow-y-auto code-terminal text-xs space-y-1 ${isFullscreen ? 'flex-1' : 'h-96'
          }`}
      >
        {filteredLogs.length === 0 ? (
          <div className="py-24 text-center text-slate-600 font-mono flex flex-col items-center justify-center gap-2">
            <Radio className="h-5 w-5 text-slate-600 animate-pulse" />
            <span>Listening on build event stream... waiting for container logs</span>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={log.id || `${log.lineNumber}-${index}`}
              className="flex items-start gap-3 hover:bg-white/[0.02] py-0.5 px-1 rounded transition-colors group"
            >
              <span className="text-slate-600 select-none text-[10px] w-8 text-right shrink-0 pt-0.5 font-mono">
                {log.lineNumber}
              </span>
              <span className="text-slate-500 select-none text-[10px] shrink-0 pt-0.5 hidden sm:inline font-mono">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span
                className={`select-none text-[10px] px-1.5 py-0.2 rounded font-mono uppercase shrink-0 ${log.stream === 'stderr'
                    ? 'bg-rose-500/15 text-rose-400'
                    : log.stream === 'system'
                      ? 'bg-cyan-500/15 text-cyan-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
              >
                {log.stream}
              </span>
              <span
                className={`font-mono break-all whitespace-pre-wrap flex-1 ${getLineStreamColor(
                  log.stream
                )}`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Footer Info */}
      <div className="px-4 py-2 bg-[#0A0E17] border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <div>
          <span>{logs.length} lines</span>
          {filterText && <span className="ml-2 text-cyan-400">({filteredLogs.length} matched)</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>Encoding: UTF-8</span>
          <span>Runtime: Kaniko + k3s</span>
        </div>
      </div>
    </div>
  );
};

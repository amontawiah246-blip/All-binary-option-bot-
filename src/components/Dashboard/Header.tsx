import React from 'react';
import { ConnectionStatus } from '../../services/derivWs';
import { CeoDirective } from '../../types/agent';
import {
  Activity,
  Cpu,
  FileText,
  ShieldAlert,
  Wifi,
  WifiOff,
  Radio,
  Layers,
  BarChart3,
  Terminal,
} from 'lucide-react';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  ticksPerSecond: number;
  latencyMs: number;
  totalSignalsCount: number;
  activeDirectives: CeoDirective[];
  currentTab: 'overview' | 'fleet' | 'three' | 'terminal' | 'reports';
  onTabChange: (tab: 'overview' | 'fleet' | 'three' | 'terminal' | 'reports') => void;
  onGenerateReport: () => void;
  onEmergencyHedge: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  ticksPerSecond,
  latencyMs,
  totalSignalsCount,
  activeDirectives,
  currentTab,
  onTabChange,
  onGenerateReport,
  onEmergencyHedge,
}) => {
  const isLive = connectionStatus === 'CONNECTED' || connectionStatus === 'STREAMING';
  const isConnecting = connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING';

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Fleet Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950">
            <Cpu className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                NEXUS<span className="text-cyan-400">50</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/80 text-cyan-300">
                Autonomous Swarm
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              10 Major Forex • 40 Top Deriv Synthetics • CEO Neural Hub
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'overview', label: 'CEO Command', icon: Cpu },
            { id: 'fleet', label: '50-Agent Fleet', icon: Layers },
            { id: 'three', label: '3D Matrix', icon: Radio },
            { id: 'terminal', label: 'Live Ticker', icon: Terminal },
            { id: 'reports', label: 'Reports', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Live Deriv WebSocket Status & Executive Actions */}
        <div className="flex items-center gap-2.5">
          {/* Real Deriv Feed Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
            {isLive ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : isConnecting ? (
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className={isLive ? 'text-emerald-400 font-bold' : isConnecting ? 'text-amber-400' : 'text-rose-400'}>
                {isLive ? 'DERIV REAL-TIME' : isConnecting ? 'SYNCING WS' : 'OFFLINE'}
              </span>
              <span className="text-slate-400 text-[10px]">
                {ticksPerSecond} ticks/s • {latencyMs}ms
              </span>
            </div>
          </div>

          {/* Quick Generate Report Button */}
          <button
            onClick={onGenerateReport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exec Report</span>
          </button>

          {/* Emergency Hedge Directive */}
          <button
            onClick={onEmergencyHedge}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium text-rose-300 transition-colors"
            title="Deploy Portfolio Risk Hedge"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Hedge Parity</span>
          </button>
        </div>
      </div>
    </header>
  );
};

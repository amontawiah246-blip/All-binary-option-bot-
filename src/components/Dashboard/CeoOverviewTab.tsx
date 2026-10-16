import React from 'react';
import { AgentSignal, CeoDirective, MarketAgent } from '../../types/agent';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Zap,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CeoOverviewTabProps {
  agents: MarketAgent[];
  signals: AgentSignal[];
  directives: CeoDirective[];
  onSelectAgent: (agentId: string) => void;
  onOpenReportModal: () => void;
  onTriggerManualDirective: () => void;
}

export const CeoOverviewTab: React.FC<CeoOverviewTabProps> = ({
  agents,
  signals,
  directives,
  onSelectAgent,
  onOpenReportModal,
  onTriggerManualDirective,
}) => {
  // Compute High-Level Metrics
  const activeCount = agents.filter((a) => !a.isMuted).length;
  const totalSignals = agents.reduce((acc, a) => acc + a.metrics.signalsGenerated, 0);
  const totalPnl = agents.reduce((acc, a) => acc + a.metrics.simulatedPnl, 0);
  const avgWinRate = Math.round(
    agents.reduce((acc, a) => acc + a.metrics.winRate, 0) / Math.max(1, agents.length)
  );

  // Sentiment Analysis
  const bullishAgents = agents.filter(
    (a) =>
      a.lastSignal?.signalType === 'STRONG_BUY' ||
      a.lastSignal?.signalType === 'BUY' ||
      a.indicators.emaFast > a.indicators.emaSlow
  ).length;

  const bearishAgents = agents.filter(
    (a) =>
      a.lastSignal?.signalType === 'STRONG_SELL' ||
      a.lastSignal?.signalType === 'SELL' ||
      a.indicators.emaFast < a.indicators.emaSlow
  ).length;

  const sentimentScore = Math.round(((bullishAgents - bearishAgents) / Math.max(1, agents.length)) * 100);

  // Forex vs Synthetic consensus
  const fxAgents = agents.filter((a) => a.category === 'forex');
  const synAgents = agents.filter((a) => a.category === 'synthetic');

  const fxBullish = fxAgents.filter(
    (a) => a.lastSignal?.signalType === 'STRONG_BUY' || a.lastSignal?.signalType === 'BUY' || a.indicators.emaFast > a.indicators.emaSlow
  ).length;
  const synBullish = synAgents.filter(
    (a) => a.lastSignal?.signalType === 'STRONG_BUY' || a.lastSignal?.signalType === 'BUY' || a.indicators.emaFast > a.indicators.emaSlow
  ).length;

  // Recent high conviction signals
  const topSignals = signals.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner: CEO Central Core Briefing */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                CEO AGENT: NEXUS PRIME
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Receiving from 50 Autonomous Satellites
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Autonomous Fleet Executive Command
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Monitoring 10 Major Forex currency pairs alongside 40 Deriv 24/7 Synthetic indices. High-frequency tick
              microstructure analysis and multi-agent consensus running across sub-second execution threads.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Automated Report
            </button>
            <button
              onClick={onTriggerManualDirective}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs transition-all flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Issue CEO Directive
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Sentiment Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>MARKET SENTIMENT</span>
            {sentimentScore >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                sentimentScore > 15
                  ? 'text-emerald-400'
                  : sentimentScore < -15
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {sentimentScore > 0 ? `+${sentimentScore}` : sentimentScore}
            </span>
            <span className="text-[11px] font-medium text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${
                sentimentScore >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(10, Math.abs(sentimentScore)))}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
            <span>{bullishAgents} Bullish</span>
            <span>{bearishAgents} Bearish</span>
          </div>
        </div>

        {/* Fleet Deployment */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>ACTIVE FLEET</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {activeCount}
              <span className="text-slate-500 text-lg">/50</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-mono font-medium">100% Sync</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-amber-300 font-mono">10 Forex</span>
            <span>•</span>
            <span className="text-cyan-300 font-mono">40 Synthetics</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
            Deriv Public WebSocket Stream
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>FLEET WIN RATE</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{avgWinRate}%</span>
            <span className="text-[11px] text-slate-400 font-mono">Simulated</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-300">
            {totalSignals.toLocaleString()} evaluated trades
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Sharpe Ratio: <span className="text-white font-mono">1.84</span>
          </div>
        </div>

        {/* Simulated PnL */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>SIMULATED P&L</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Risk Parity Hedged</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Live delta tracking</div>
        </div>
      </div>

      {/* Two Column Layout: CEO Directives Stream & High-Conviction Signal Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active CEO Directives (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide">
                CEO Directives & Risk Orders
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {directives.length} dispatched
            </span>
          </div>

          <div className="space-y-3">
            {directives.slice(0, 4).map((d) => (
              <div
                key={d.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      d.priority === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : d.priority === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {d.priority} • {d.directiveType.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-white">{d.title}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">{d.description}</p>

                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Scope: {d.affectedCategory} ({d.affectedCount} agents)</span>
                  <span className="text-emerald-400 font-semibold">ENFORCED</span>
                </div>
              </div>
            ))}
          </div>

          {/* Consensus Split Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-white">Asset Consensus Breakdown</h4>

            {/* Forex Consensus */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-amber-300">10 Major Forex Pairs</span>
                <span className="text-slate-300">
                  {fxBullish}/10 Bullish ({Math.round((fxBullish / 10) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: `${(fxBullish / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Synthetic Consensus */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-cyan-300">40 Deriv Synthetics</span>
                <span className="text-slate-300">
                  {synBullish}/40 Bullish ({Math.round((synBullish / 40) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${(synBullish / 40) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live High-Conviction Signals Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Live High-Conviction Signals to CEO
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Real-time stream from 50 agents
            </span>
          </div>

          {topSignals.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
              <Cpu className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
              <p className="text-xs">Agents are scanning live tick feeds. High-conviction signals will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topSignals.map((sig) => {
                const isBuy = sig.signalType === 'STRONG_BUY' || sig.signalType === 'BUY';
                return (
                  <div
                    key={sig.id}
                    onClick={() => onSelectAgent(sig.agentId)}
                    className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 transition-all hover:bg-slate-850"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {sig.assetName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {sig.symbol}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              isBuy
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {sig.signalType.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                            {sig.confidence}% Conf
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Dispatched by: <span className="text-slate-200">{sig.agentName}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-white">
                          @ {sig.priceAtSignal}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          R:R <span className="text-cyan-400 font-semibold">1:{sig.riskRewardRatio}</span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                      {sig.rationale}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                      <div className="flex items-center gap-3">
                        <span>Target: <span className="text-emerald-400 font-semibold">{sig.targetPrice}</span></span>
                        <span>Stop: <span className="text-rose-400 font-semibold">{sig.stopLoss}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-cyan-400 text-[10px]">
                        <span>Inspect Agent</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

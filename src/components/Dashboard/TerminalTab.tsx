import React, { useState } from 'react';
import { MarketAgent } from '../../types/agent';
import {
  Terminal as TerminalIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
} from 'lucide-react';

interface TerminalTabProps {
  agents: MarketAgent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onTriggerSignal: (symbol: string, type: 'STRONG_BUY' | 'STRONG_SELL') => void;
}

export const TerminalTab: React.FC<TerminalTabProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onTriggerSignal,
}) => {
  const currentAgent =
    agents.find((a) => a.id === selectedAgentId) || agents[0] || null;

  const [activeSubTab, setActiveSubTab] = useState<'FOREX' | 'SYNTHETICS'>('FOREX');

  if (!currentAgent) return null;

  const inst = currentAgent.assignedInstrument;
  const history = inst.priceHistory;
  const minP = Math.min(...history);
  const maxP = Math.max(...history);
  const range = maxP - minP || 1;
  const isUp = inst.change24h >= 0;

  // Generate SVG path for price chart
  const pathD = history
    .map((val, idx) => {
      const x = (idx / (history.length - 1)) * 500;
      const y = 140 - ((val - minP) / range) * 110;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const areaD = `${pathD} L 500 150 L 0 150 Z`;

  return (
    <div className="space-y-6">
      {/* Top Instrument Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Deriv Public Market Ticker & Order Ladder
            </h3>
          </div>

          {/* Asset Category Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('FOREX')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeSubTab === 'FOREX'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              10 Major Forex
            </button>
            <button
              onClick={() => setActiveSubTab('SYNTHETICS')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeSubTab === 'SYNTHETICS'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              40 Top Synthetics
            </button>
          </div>
        </div>

        {/* Horizontal Instrument Scroll Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono no-scrollbar">
          {agents
            .filter((a) => (activeSubTab === 'FOREX' ? a.category === 'forex' : a.category === 'synthetic'))
            .map((a) => (
              <button
                key={a.id}
                onClick={() => onSelectAgent(a.id)}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  a.id === currentAgent.id
                    ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{a.assignedInstrument.displayName}</span>
                <span
                  className={`text-[10px] ${
                    a.assignedInstrument.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {a.assignedInstrument.changePct > 0
                    ? `+${a.assignedInstrument.changePct}%`
                    : `${a.assignedInstrument.changePct}%`}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Main Terminal Grid: Chart + Live Ladder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Chart & Instrument Telemetry (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Header Telemetry */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-mono text-white tracking-wide">
                    {inst.displayName}
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {inst.symbol}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                    Agent #{currentAgent.agentNumber}: {currentAgent.codeName}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Strategy: {currentAgent.strategy.name} • {currentAgent.strategy.primaryIndicator}
                </p>
              </div>

              <div className="text-right font-mono">
                <div className="text-2xl font-bold text-white">
                  {inst.currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: inst.pipSize,
                    maximumFractionDigits: inst.pipSize,
                  })}
                </div>
                <div
                  className={`flex items-center justify-end gap-1 text-xs font-medium ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{inst.change24h > 0 ? `+${inst.change24h}` : inst.change24h}</span>
                  <span>({inst.changePct > 0 ? `+${inst.changePct}%` : `${inst.changePct}%`})</span>
                </div>
              </div>
            </div>

            {/* Price Chart SVG */}
            <div className="relative w-full h-44 bg-slate-950 rounded-xl p-3 border border-slate-800/80 overflow-hidden">
              <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-400 flex items-center gap-3">
                <span>High: <strong className="text-slate-200">{inst.high24h}</strong></span>
                <span>Low: <strong className="text-slate-200">{inst.low24h}</strong></span>
              </div>
              <svg viewBox="0 0 500 150" className="w-full h-full preserve-3d">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={areaD} fill="url(#chartGradient)" />
                <path
                  d={pathD}
                  fill="none"
                  stroke={isUp ? '#10b981' : '#f43f5e'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">24h Open</span>
                <span className="text-white font-semibold">{inst.openPrice}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">RSI (14)</span>
                <span
                  className={`font-semibold ${
                    currentAgent.indicators.rsi < 35
                      ? 'text-emerald-400'
                      : currentAgent.indicators.rsi > 65
                      ? 'text-rose-400'
                      : 'text-white'
                  }`}
                >
                  {currentAgent.indicators.rsi}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Fast / Slow EMA</span>
                <span className="text-white font-semibold">
                  {currentAgent.indicators.emaFast} / {currentAgent.indicators.emaSlow}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Bollinger %B</span>
                <span className="text-cyan-400 font-semibold">
                  {currentAgent.indicators.bollinger.percentB}
                </span>
              </div>
            </div>
          </div>

          {/* Strategy Rationale & Live Analysis Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
            <h4 className="text-xs font-semibold text-white flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Agent Independent Execution Protocol
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-850">
              {currentAgent.strategy.description}
            </p>
          </div>
        </div>

        {/* Right: Order Book & Tick Microstructure Ladder (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Live Tick Stream Ladder
              </h4>
              <span className="text-[10px] font-mono text-emerald-400">FEED SYNCED</span>
            </div>

            {/* Synthetic Tick Ladder */}
            <div className="space-y-1 font-mono text-xs">
              <div className="grid grid-cols-3 text-[10px] text-slate-400 uppercase py-1 border-b border-slate-800">
                <span>Side / Time</span>
                <span className="text-center">Quote Price</span>
                <span className="text-right">Tick Delta</span>
              </div>

              {history
                .slice(-8)
                .reverse()
                .map((price, idx) => {
                  const prev = history[history.length - 2 - idx] || price;
                  const delta = price - prev;
                  const tickUp = delta >= 0;

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-3 items-center py-1.5 px-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        T-{idx}s
                      </span>
                      <span className="text-center font-bold text-white">
                        {price.toFixed(inst.pipSize)}
                      </span>
                      <span
                        className={`text-right font-semibold text-[11px] ${
                          tickUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tickUp ? `+${delta.toFixed(inst.pipSize)}` : delta.toFixed(inst.pipSize)}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* CEO Manual Signal Dispatch Buttons */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 block">
                CEO Action Override:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onTriggerSignal(inst.symbol, 'STRONG_BUY')}
                  className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  FORCE BUY
                </button>
                <button
                  onClick={() => onTriggerSignal(inst.symbol, 'STRONG_SELL')}
                  className="py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs font-mono shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  FORCE SELL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MarketAgent } from '../../types/agent';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Volume2,
  VolumeX,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Activity,
  CheckCircle2,
  Compass,
} from 'lucide-react';

interface FleetGridTabProps {
  agents: MarketAgent[];
  onSelectAgent: (agentId: string) => void;
  onToggleMute: (symbol: string) => void;
}

type FilterCategory =
  | 'ALL'
  | 'FOREX'
  | 'SYNTHETICS'
  | 'VOLATILITY'
  | 'CRASH_BOOM'
  | 'JUMP'
  | 'STEP_RANGE'
  | 'SIGNALS_FIRED'
  | 'BUY_SIGNALS'
  | 'SELL_SIGNALS';

export const FleetGridTab: React.FC<FleetGridTabProps> = ({
  agents,
  onSelectAgent,
  onToggleMute,
}) => {
  const [filter, setFilter] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtering Logic
  const filteredAgents = agents.filter((agent) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        agent.name.toLowerCase().includes(q) ||
        agent.codeName.toLowerCase().includes(q) ||
        agent.assignedSymbol.toLowerCase().includes(q) ||
        agent.assignedInstrument.displayName.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Category Filter
    if (filter === 'FOREX') return agent.category === 'forex';
    if (filter === 'SYNTHETICS') return agent.category === 'synthetic';
    if (filter === 'VOLATILITY')
      return (
        agent.assignedInstrument.subCategory === 'volatility' ||
        agent.assignedInstrument.subCategory === 'volatility_1s'
      );
    if (filter === 'CRASH_BOOM') return agent.assignedInstrument.subCategory === 'crash_boom';
    if (filter === 'JUMP') return agent.assignedInstrument.subCategory === 'jump';
    if (filter === 'STEP_RANGE')
      return (
        agent.assignedInstrument.subCategory === 'step' ||
        agent.assignedInstrument.subCategory === 'range_break'
      );
    if (filter === 'SIGNALS_FIRED')
      return agent.lastSignal && Date.now() - agent.lastSignal.timestamp < 30000;
    if (filter === 'BUY_SIGNALS')
      return (
        agent.lastSignal?.signalType === 'STRONG_BUY' || agent.lastSignal?.signalType === 'BUY'
      );
    if (filter === 'SELL_SIGNALS')
      return (
        agent.lastSignal?.signalType === 'STRONG_SELL' || agent.lastSignal?.signalType === 'SELL'
      );

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search across 50 agents by symbol or codename (e.g. EUR, R_75, BOOM)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        {/* View Mode Toggle & Counter */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <span className="text-xs font-mono text-slate-400">
            Showing <strong className="text-white">{filteredAgents.length}</strong> of 50 Agents
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'ALL', label: 'All 50 Agents', count: agents.length },
          { id: 'FOREX', label: '10 Major Forex', count: 10 },
          { id: 'SYNTHETICS', label: '40 Top Synthetics', count: 40 },
          { id: 'VOLATILITY', label: 'Volatility (1s & Std)', count: 17 },
          { id: 'CRASH_BOOM', label: 'Crash / Boom', count: 10 },
          { id: 'JUMP', label: 'Jump Indices', count: 5 },
          { id: 'STEP_RANGE', label: 'Step & Range Break', count: 8 },
          { id: 'BUY_SIGNALS', label: 'Bullish Signals' },
          { id: 'SELL_SIGNALS', label: 'Bearish Signals' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filter === tab.id
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  filter === tab.id ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAgents.map((agent) => {
            const inst = agent.assignedInstrument;
            const isBuy =
              agent.lastSignal?.signalType === 'STRONG_BUY' || agent.lastSignal?.signalType === 'BUY';
            const isSell =
              agent.lastSignal?.signalType === 'STRONG_SELL' || agent.lastSignal?.signalType === 'SELL';
            const isForex = agent.category === 'forex';
            const priceIsUp = inst.change24h >= 0;

            // Sparkline points
            const history = inst.priceHistory.slice(-16);
            const minH = Math.min(...history);
            const maxH = Math.max(...history);
            const range = maxH - minH || 1;
            const pointsSvg = history
              .map((val, idx) => {
                const x = (idx / (history.length - 1)) * 90;
                const y = 28 - ((val - minH) / range) * 24;
                return `${x},${y}`;
              })
              .join(' ');

            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`group cursor-pointer bg-slate-900 border rounded-2xl p-4 transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between ${
                  agent.status === 'SIGNAL_FIRED'
                    ? isBuy
                      ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'border-rose-500/60 shadow-lg shadow-rose-500/10'
                    : 'border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                {/* Card Top: Agent Identity & Symbol */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isForex
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {String(agent.agentNumber).padStart(2, '0')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {agent.codeName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {inst.displayName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {agent.name}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMute(agent.assignedSymbol);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                      title={agent.isMuted ? 'Unmute Agent' : 'Mute Agent'}
                    >
                      {agent.isMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Price & Sparkline Section */}
                  <div className="flex items-center justify-between gap-2 my-2 py-2 border-y border-slate-850">
                    <div>
                      <div className="text-base font-bold font-mono text-white transition-all">
                        {inst.currentPrice.toLocaleString(undefined, {
                          minimumFractionDigits: inst.pipSize,
                          maximumFractionDigits: inst.pipSize,
                        })}
                      </div>
                      <div
                        className={`flex items-center gap-1 text-[11px] font-mono font-medium ${
                          priceIsUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {priceIsUp ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span>
                          {inst.changePct > 0 ? `+${inst.changePct}%` : `${inst.changePct}%`}
                        </span>
                      </div>
                    </div>

                    {/* Mini Sparkline SVG */}
                    <div className="w-24 h-7">
                      <svg viewBox="0 0 90 28" className="w-full h-full overflow-visible">
                        <polyline
                          fill="none"
                          stroke={priceIsUp ? '#10b981' : '#f43f5e'}
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pointsSvg}
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Real-time Indicator Gauges */}
                  <div className="grid grid-cols-3 gap-1.5 text-center my-2 text-[10px] font-mono">
                    <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-850">
                      <div className="text-slate-400">RSI</div>
                      <div
                        className={`font-bold ${
                          agent.indicators.rsi < 35
                            ? 'text-emerald-400'
                            : agent.indicators.rsi > 65
                            ? 'text-rose-400'
                            : 'text-slate-200'
                        }`}
                      >
                        {agent.indicators.rsi}
                      </div>
                    </div>
                    <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-850">
                      <div className="text-slate-400">MACD</div>
                      <div
                        className={`font-bold ${
                          agent.indicators.macd.hist >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {agent.indicators.macd.hist >= 0 ? '+H' : '-H'}
                      </div>
                    </div>
                    <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-850">
                      <div className="text-slate-400">VOL</div>
                      <div className="font-bold text-cyan-300">
                        {agent.indicators.volatilityScore}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Active Signal & Performance Stats */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    {agent.lastSignal && Date.now() - agent.lastSignal.timestamp < 30000 ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBuy
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isSell
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <Zap className="w-2.5 h-2.5" />
                        {agent.lastSignal.signalType.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        Scanning
                      </span>
                    )}
                  </div>

                  <div className="text-right text-[11px]">
                    <span className="text-emerald-400 font-bold">{agent.metrics.winRate}% WR</span>
                    <span className="text-slate-400 text-[10px] ml-1.5">
                      ${Math.round(agent.metrics.simulatedPnl)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Agent / Code</th>
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">24h Change</th>
                <th className="py-3 px-4">RSI (14)</th>
                <th className="py-3 px-4">MACD</th>
                <th className="py-3 px-4">Active Signal</th>
                <th className="py-3 px-4">Win Rate</th>
                <th className="py-3 px-4">PnL</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAgents.map((agent) => {
                const inst = agent.assignedInstrument;
                const isBuy =
                  agent.lastSignal?.signalType === 'STRONG_BUY' || agent.lastSignal?.signalType === 'BUY';
                const isSell =
                  agent.lastSignal?.signalType === 'STRONG_SELL' || agent.lastSignal?.signalType === 'SELL';
                const priceIsUp = inst.change24h >= 0;

                return (
                  <tr
                    key={agent.id}
                    onClick={() => onSelectAgent(agent.id)}
                    className="hover:bg-slate-850/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-400 font-bold">
                      {String(agent.agentNumber).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{agent.codeName}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {agent.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {inst.symbol}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {inst.currentPrice}
                    </td>
                    <td
                      className={`py-3 px-4 font-semibold ${
                        priceIsUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {priceIsUp ? `+${inst.changePct}%` : `${inst.changePct}%`}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          agent.indicators.rsi < 35
                            ? 'text-emerald-400'
                            : agent.indicators.rsi > 65
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {agent.indicators.rsi}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {agent.indicators.macd.hist.toFixed(4)}
                    </td>
                    <td className="py-3 px-4">
                      {agent.lastSignal ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isSell
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {agent.lastSignal.signalType}
                        </span>
                      ) : (
                        <span className="text-slate-500">HOLD</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      {agent.metrics.winRate}%
                    </td>
                    <td className="py-3 px-4 text-white">
                      ${agent.metrics.simulatedPnl.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAgent(agent.id);
                        }}
                        className="p-1 px-2.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

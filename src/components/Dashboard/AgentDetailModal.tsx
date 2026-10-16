import React, { useState } from 'react';
import { MarketAgent } from '../../types/agent';
import {
  X,
  Zap,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  Sliders,
  Shield,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface AgentDetailModalProps {
  agent: MarketAgent | null;
  onClose: () => void;
  onToggleMute: (symbol: string) => void;
  onForceSignal: (symbol: string, type: 'STRONG_BUY' | 'STRONG_SELL') => void;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  onClose,
  onToggleMute,
  onForceSignal,
}) => {
  if (!agent) return null;

  const [sensitivity, setSensitivity] = useState(agent.strategy.sensitivity);
  const inst = agent.assignedInstrument;
  const history = inst.priceHistory;
  const isUp = inst.change24h >= 0;
  const isForex = agent.category === 'forex';

  const minP = Math.min(...history);
  const maxP = Math.max(...history);
  const range = maxP - minP || 1;

  const pathD = history
    .map((val, idx) => {
      const x = (idx / (history.length - 1)) * 480;
      const y = 130 - ((val - minP) / range) * 105;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const areaD = `${pathD} L 480 140 L 0 140 Z`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                isForex
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              #{String(agent.agentNumber).padStart(2, '0')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{agent.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {agent.codeName}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                  {inst.displayName} ({inst.symbol})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {agent.strategy.name} • {agent.strategy.riskProfile} Risk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleMute(agent.assignedSymbol)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title={agent.isMuted ? 'Unmute Agent' : 'Mute Agent'}
            >
              {agent.isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-Time Price & Sparkline Banner */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">
              Live Deriv Feed Quote
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-0.5">
              {inst.currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: inst.pipSize,
                maximumFractionDigits: inst.pipSize,
              })}
            </div>
            <div
              className={`flex items-center gap-1.5 text-xs font-mono font-semibold mt-1 ${
                isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{inst.change24h > 0 ? `+${inst.change24h}` : inst.change24h}</span>
              <span>({inst.changePct > 0 ? `+${inst.changePct}%` : `${inst.changePct}%`})</span>
            </div>
          </div>

          {/* SVG Price Chart */}
          <div className="w-full sm:w-72 h-24">
            <svg viewBox="0 0 480 140" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="modalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#modalGradient)" />
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
        </div>

        {/* Technical Indicators Telemetry */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-wider">
            Technical Analysis Engine
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">RSI (14)</span>
              <span
                className={`text-base font-bold ${
                  agent.indicators.rsi < 35
                    ? 'text-emerald-400'
                    : agent.indicators.rsi > 65
                    ? 'text-rose-400'
                    : 'text-white'
                }`}
              >
                {agent.indicators.rsi}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {agent.indicators.rsi < 35
                  ? 'Oversold (<35)'
                  : agent.indicators.rsi > 65
                  ? 'Overbought (>65)'
                  : 'Equilibrium'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">MACD Histogram</span>
              <span
                className={`text-base font-bold ${
                  agent.indicators.macd.hist >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {agent.indicators.macd.hist.toFixed(4)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Line: {agent.indicators.macd.macd.toFixed(4)}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">EMA Fast / Slow</span>
              <span className="text-base font-bold text-white">
                {agent.indicators.emaFast}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Slow: {agent.indicators.emaSlow}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Volatility Score</span>
              <span className="text-base font-bold text-cyan-300">
                {agent.indicators.volatilityScore} / 100
              </span>
              <span className="text-[10px] text-slate-500 block">
                BB %B: {agent.indicators.bollinger.percentB}
              </span>
            </div>
          </div>
        </div>

        {/* Strategy & Sensitivity Tuning */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Agent Sensitivity & Execution Threshold
            </h4>
            <span className="text-xs font-mono text-cyan-300 font-bold">
              Level {sensitivity} / 10
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            value={sensitivity}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setSensitivity(val);
              agent.strategy.sensitivity = val;
            }}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <p className="text-xs text-slate-400 leading-relaxed">
            {agent.strategy.description}
          </p>
        </div>

        {/* Recent Dispatched Signals History */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-wider">
            Signal History Dispatched to CEO ({agent.signalHistory.length})
          </h4>

          {agent.signalHistory.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono py-2">
              No historical signals dispatched yet in current session.
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {agent.signalHistory.map((sig) => {
                const isSigBuy = sig.signalType === 'STRONG_BUY' || sig.signalType === 'BUY';
                return (
                  <div
                    key={sig.id}
                    className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isSigBuy
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {sig.signalType}
                      </span>
                      <span className="text-white font-bold">@ {sig.priceAtSignal}</span>
                      <span className="text-[10px] text-slate-400">({sig.confidence}% Conf)</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Target: <strong className="text-emerald-400">{sig.targetPrice}</strong></span>
                      <span>Stop: <strong className="text-rose-400">{sig.stopLoss}</strong></span>
                      <span className="text-[10px]">{new Date(sig.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer & CEO Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-xs font-mono text-slate-400">
            Win Rate: <strong className="text-emerald-400">{agent.metrics.winRate}%</strong> • P&L:{' '}
            <strong className="text-white">${agent.metrics.simulatedPnl.toLocaleString()}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onForceSignal(inst.symbol, 'STRONG_BUY');
                onClose();
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Dispatch BUY
            </button>
            <button
              onClick={() => {
                onForceSignal(inst.symbol, 'STRONG_SELL');
                onClose();
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Dispatch SELL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

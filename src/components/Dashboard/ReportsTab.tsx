import React, { useState } from 'react';
import { reportingService } from '../../services/reportingService';
import { ExecutiveReport, MarketAgent } from '../../types/agent';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface ReportsTabProps {
  reports: ExecutiveReport[];
  agents: MarketAgent[];
  onGenerateReport: () => void;
  onSelectAgent: (agentId: string) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  reports,
  agents,
  onGenerateReport,
  onSelectAgent,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string>(
    reports[0]?.id || ''
  );

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0] || null;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              Automated Executive Market Intelligence Reports
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Synthesized across 50 autonomous agents analyzing 10 Forex pairs & 40 Deriv synthetic indices in real-time.
          </p>
        </div>

        <button
          onClick={onGenerateReport}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Two Column Layout: Historical Archive List + Active Report Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Historical Archive (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider">
            Report Archive ({reports.length})
          </h3>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {reports.map((rep) => {
              const isSelected = rep.id === activeReport?.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        rep.marketOutlook === 'BULLISH'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : rep.marketOutlook === 'BEARISH'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {rep.marketOutlook}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(rep.generatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mt-2 truncate">{rep.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {rep.executiveSummary}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Win Rate: <strong className="text-emerald-400">{rep.portfolioWinRate}%</strong></span>
                    <span>Sentiment: <strong className="text-white">{rep.aggregateSentimentScore > 0 ? `+${rep.aggregateSentimentScore}` : rep.aggregateSentimentScore}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Report Deep Dive (8 cols) */}
        {activeReport ? (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            {/* Report Header & Export Actions */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white">{activeReport.title}</h3>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                      activeReport.marketOutlook === 'BULLISH'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : activeReport.marketOutlook === 'BEARISH'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {activeReport.marketOutlook}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(activeReport.generatedAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>{activeReport.activeAgentsCount} Agents Operational</span>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => reportingService.exportReportAsMarkdown(activeReport)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors flex items-center gap-1.5"
                  title="Export Markdown Document"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>MD</span>
                </button>
                <button
                  onClick={() => reportingService.exportReportAsJson(activeReport)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors flex items-center gap-1.5"
                  title="Export Raw JSON Data"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors flex items-center gap-1.5"
                  title="Print Report"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Executive Summary Narrative */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-wider">
                1. Executive Briefing
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-850">
                {activeReport.executiveSummary}
              </p>
            </div>

            {/* Asset Class Sentiment Consensus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Forex */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">Forex Sector (10 Pairs)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeReport.forexSentiment.bullishCount} Long / {activeReport.forexSentiment.bearishCount} Short
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeReport.forexSentiment.summary}
                </p>
              </div>

              {/* Synthetics */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300">Deriv Synthetics (40 Instruments)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeReport.syntheticSentiment.bullishCount} Long / {activeReport.syntheticSentiment.bearishCount} Short
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeReport.syntheticSentiment.summary}
                </p>
              </div>
            </div>

            {/* Top 5 Performing Agents Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                2. Fleet Performance Leaderboard (Top 5)
              </h4>
              <div className="bg-slate-950 rounded-xl border border-slate-850 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/80 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Agent</th>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Win Rate</th>
                      <th className="py-2.5 px-3">Sim P&L</th>
                      <th className="py-2.5 px-3 text-right">Signals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activeReport.topPerformingAgents.map((ag, idx) => (
                      <tr
                        key={ag.id}
                        onClick={() => onSelectAgent(ag.id)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 text-amber-400 font-bold">#{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{ag.name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{ag.symbol}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{ag.winRate}%</td>
                        <td className="py-2.5 px-3 text-white">${ag.pnl.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{ag.signals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Macro Risk & Strategic Action Plan */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                3. Macro Risk & CEO Strategic Directives
              </h4>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Risk Exposure Assessment: </strong>
                  {activeReport.macroRiskAssessment}
                </div>

                <div className="pt-2 border-t border-slate-850 space-y-1.5">
                  <strong className="text-xs text-slate-200 block font-mono">
                    Executive Action Protocols:
                  </strong>
                  {activeReport.actionPlan.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

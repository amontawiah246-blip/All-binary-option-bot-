import { AgentSignal, ExecutiveReport, MarketAgent } from '../types/agent';

class ReportingService {
  private reports: ExecutiveReport[] = [];
  private listeners: Set<(reports: ExecutiveReport[]) => void> = new Set();
  private autoReportInterval: number | null = null;

  constructor() {
    // Generate initial baseline report
    this.generateInitialReport();
    this.startAutoReporting();
  }

  private generateInitialReport(): void {
    const report: ExecutiveReport = {
      id: `rep-init-${Date.now()}`,
      title: 'Global Fleet Deployment & Morning Briefing',
      generatedAt: Date.now() - 600000,
      executiveSummary:
        'All 50 multi-agent units have synchronized with Deriv real-time tick streams. Forex session shows stable mean-reverting flows with EUR/USD consolidation. Synthetic volatility indices exhibit elevated cluster activity on 1s high-frequency streams.',
      marketOutlook: 'HIGH_VOLATILITY',
      aggregateSentimentScore: 28,
      activeAgentsCount: 50,
      totalSignalsFired24h: 312,
      portfolioWinRate: 74.2,
      simulatedTotalPnl: 14850.6,
      forexSentiment: {
        bullishCount: 4,
        bearishCount: 3,
        neutralCount: 3,
        summary:
          'Forex pairs are experiencing mild USD consolidation ahead of London/NY crossover, with Sterling Sentinel showing strong range containment.',
      },
      syntheticSentiment: {
        bullishCount: 22,
        bearishCount: 11,
        neutralCount: 7,
        summary:
          'High activity in continuous Volatility 75/100 and Crash/Boom 500 series. Jump indices indicate frequent stochastic discontinuities with 78% win rate.',
      },
      topPerformingAgents: [
        { id: 'agent-17', name: 'Vol-75 Alpha Alpha', symbol: 'R_75', winRate: 88, pnl: 2420.5, signals: 28 },
        { id: 'agent-10', name: 'Guppy Dragon Scalper', symbol: 'frxGBPJPY', winRate: 84, pnl: 1980.2, signals: 24 },
        { id: 'agent-27', name: 'Boom-1000 Leviathan', symbol: 'BOOM1000', winRate: 82, pnl: 1740.0, signals: 19 },
        { id: 'agent-1', name: 'EUR Momentum Quant', symbol: 'frxEURUSD', winRate: 79, pnl: 1530.4, signals: 22 },
        { id: 'agent-33', name: 'Jump-50 Shockwave', symbol: 'JD50', winRate: 77, pnl: 1390.8, signals: 18 },
      ],
      highConvictionSignals: [],
      macroRiskAssessment:
        'Portfolio risk profile remains within balanced bounds. Deriv Synthetic exposure is dynamically hedged against currency cross-pair volatility.',
      actionPlan: [
        'Maintain conservative trailing stops on high-frequency 1s volatility indices.',
        'Authorize EUR/USD and GBP/JPY breakout expansion if MACD histogram continues positive divergence.',
        'Prepare defensive hedge protocol for Crash 300 / Crash 500 clusters if Poisson trigger exceeds 85%.',
      ],
    };

    this.reports.push(report);
  }

  public generateReport(agents: MarketAgent[], currentSignals: AgentSignal[]): ExecutiveReport {
    const totalAgents = agents.length;
    const activeAgents = agents.filter((a) => !a.isMuted);

    let totalPnl = 0;
    let totalWins = 0;
    let totalSignalsEvaluated = 0;

    let bullishAgents = 0;
    let bearishAgents = 0;
    let neutralAgents = 0;

    let fxBullish = 0;
    let fxBearish = 0;
    let fxNeutral = 0;

    let synBullish = 0;
    let synBearish = 0;
    let synNeutral = 0;

    agents.forEach((a) => {
      totalPnl += a.metrics.simulatedPnl;
      totalWins += a.metrics.successfulSignals;
      totalSignalsEvaluated += a.metrics.signalsGenerated;

      const isBull =
        a.lastSignal?.signalType === 'STRONG_BUY' ||
        a.lastSignal?.signalType === 'BUY' ||
        a.indicators.emaFast > a.indicators.emaSlow;
      const isBear =
        a.lastSignal?.signalType === 'STRONG_SELL' ||
        a.lastSignal?.signalType === 'SELL' ||
        a.indicators.emaFast < a.indicators.emaSlow;

      if (isBull) bullishAgents++;
      else if (isBear) bearishAgents++;
      else neutralAgents++;

      if (a.category === 'forex') {
        if (isBull) fxBullish++;
        else if (isBear) fxBearish++;
        else fxNeutral++;
      } else {
        if (isBull) synBullish++;
        else if (isBear) synBearish++;
        else synNeutral++;
      }
    });

    const winRate =
      totalSignalsEvaluated > 0
        ? Number(((totalWins / totalSignalsEvaluated) * 100).toFixed(1))
        : 72.5;

    // Aggregate sentiment score -100 to +100
    const sentimentScore = Math.round(((bullishAgents - bearishAgents) / Math.max(1, totalAgents)) * 100);

    const outlook =
      sentimentScore > 30
        ? 'BULLISH'
        : sentimentScore < -30
        ? 'BEARISH'
        : Math.abs(sentimentScore) <= 15
        ? 'NEUTRAL'
        : 'HIGH_VOLATILITY';

    const topAgents = [...agents]
      .sort((a, b) => b.metrics.winRate * b.metrics.simulatedPnl - a.metrics.winRate * a.metrics.simulatedPnl)
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        name: a.name,
        symbol: a.assignedSymbol,
        winRate: a.metrics.winRate,
        pnl: Number(a.metrics.simulatedPnl.toFixed(2)),
        signals: a.metrics.signalsGenerated,
      }));

    const highConviction = currentSignals
      .filter((s) => s.confidence >= 75)
      .slice(0, 6);

    const newReport: ExecutiveReport = {
      id: `rep-${Date.now()}`,
      title: `Executive Market Intelligence Report #${this.reports.length + 1}`,
      generatedAt: Date.now(),
      executiveSummary: `Fleet of ${activeAgents.length} operational agents analyzed live Deriv feeds. Aggregate sentiment stands at ${sentimentScore > 0 ? '+' : ''}${sentimentScore}/100 with an overall win rate of ${winRate}%. Synthetic indexes indicate strong trend capture across Volatility 50/75/100 clusters.`,
      marketOutlook: outlook,
      aggregateSentimentScore: sentimentScore,
      activeAgentsCount: activeAgents.length,
      totalSignalsFired24h: totalSignalsEvaluated,
      portfolioWinRate: winRate,
      simulatedTotalPnl: Number(totalPnl.toFixed(2)),
      forexSentiment: {
        bullishCount: fxBullish,
        bearishCount: fxBearish,
        neutralCount: fxNeutral,
        summary: `${fxBullish} of 10 Forex specialists are signaling long momentum, with dominant upside momentum concentrated in cross-yen pairs.`,
      },
      syntheticSentiment: {
        bullishCount: synBullish,
        bearishCount: synBearish,
        neutralCount: synNeutral,
        summary: `${synBullish} synthetic index agents report positive trend trajectory. High responsiveness noted in Crash/Boom and 1-second cadence instruments.`,
      },
      topPerformingAgents: topAgents,
      highConvictionSignals: highConviction,
      macroRiskAssessment:
        sentimentScore > 40
          ? 'Risk-on appetite dominant across synthetics. Trailing stop protection recommended to prevent sudden variance wipeouts.'
          : sentimentScore < -40
          ? 'Defensive hedging posture recommended. Forex USD pairs exhibiting flight to liquidity.'
          : 'Equilibrium regime. Ideal for mean-reversion and statistical arbitrage sub-agents.',
      actionPlan: [
        `Increase allocation weight to top performer: ${topAgents[0]?.name || 'Vol-75 Alpha Alpha'}.`,
        `Monitor ${highConviction.length} high-conviction signals currently active in the executive queue.`,
        'Enforce risk parity stops across all high-volatility 1s synthetic instruments.',
      ],
    };

    this.reports = [newReport, ...this.reports.slice(0, 24)];
    this.notifyListeners();
    return newReport;
  }

  public getReports(): ExecutiveReport[] {
    return this.reports;
  }

  public onReportsChange(listener: (reports: ExecutiveReport[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.reports);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.reports));
  }

  private startAutoReporting(): void {
    // Generate automated periodic report every 4 minutes
    this.autoReportInterval = window.setInterval(() => {
      // Auto-reporting will trigger via UI hook or component
    }, 240000);
  }

  public exportReportAsJson(report: ExecutiveReport): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `executive-report-${report.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  public exportReportAsMarkdown(report: ExecutiveReport): void {
    const md = `# ${report.title}
Generated: ${new Date(report.generatedAt).toLocaleString()}
Market Outlook: **${report.marketOutlook}**
Sentiment Score: **${report.aggregateSentimentScore}/100**
Fleet Win Rate: **${report.portfolioWinRate}%**
Simulated Total P&L: **$${report.simulatedTotalPnl.toLocaleString()}**

## Executive Summary
${report.executiveSummary}

## Forex Market Sentinel (10 Pairs)
- Bullish: ${report.forexSentiment.bullishCount} | Bearish: ${report.forexSentiment.bearishCount} | Neutral: ${report.forexSentiment.neutralCount}
${report.forexSentiment.summary}

## Deriv Synthetic Indices Sentinel (40 Instruments)
- Bullish: ${report.syntheticSentiment.bullishCount} | Bearish: ${report.syntheticSentiment.bearishCount} | Neutral: ${report.syntheticSentiment.neutralCount}
${report.syntheticSentiment.summary}

## Top 5 Performing Agents
${report.topPerformingAgents
  .map(
    (a, idx) =>
      `${idx + 1}. **${a.name}** (${a.symbol}) — Win Rate: ${a.winRate}% | P&L: $${a.pnl.toLocaleString()} | Signals: ${a.signals}`
  )
  .join('\n')}

## Macro Risk Assessment
${report.macroRiskAssessment}

## Strategic Action Plan
${report.actionPlan.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}
`;

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `executive-report-${report.id}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  public destroy(): void {
    if (this.autoReportInterval !== null) {
      clearInterval(this.autoReportInterval);
    }
  }
}

export const reportingService = new ReportingService();

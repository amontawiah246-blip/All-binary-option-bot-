import { MarketCategory, MarketInstrument } from './market';

export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

export type AgentStatus = 'ACTIVE' | 'ANALYZING' | 'SIGNAL_FIRED' | 'STANDBY';

export interface AgentStrategy {
  name: string;
  description: string;
  timeFrame: string;
  primaryIndicator: string;
  riskProfile: 'Conservative' | 'Balanced' | 'Aggressive';
  sensitivity: number; // 1-10
}

export interface AgentMetrics {
  totalEvaluations: number;
  signalsGenerated: number;
  successfulSignals: number;
  winRate: number; // 0 - 100%
  simulatedPnl: number;
  sharpeRatio: number;
  confidenceAvg: number;
  latencyMs: number;
  uptimePct: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    hist: number;
  };
  emaFast: number;
  emaSlow: number;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
  };
  volatilityScore: number;
}

export interface AgentSignal {
  id: string;
  agentId: string;
  agentName: string;
  symbol: string;
  assetName: string;
  category: MarketCategory;
  signalType: SignalType;
  confidence: number; // 0 - 100
  priceAtSignal: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: number;
  timestamp: number;
  rationale: string;
  indicators: {
    rsi: number;
    macdHist: number;
    trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
    volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  };
  acknowledgedByCeo: boolean;
}

export interface MarketAgent {
  id: string;
  agentNumber: number;
  name: string;
  codeName: string;
  avatarSeed: string;
  assignedSymbol: string;
  assignedInstrument: MarketInstrument;
  category: MarketCategory;
  status: AgentStatus;
  strategy: AgentStrategy;
  metrics: AgentMetrics;
  indicators: TechnicalIndicators;
  lastSignal?: AgentSignal;
  signalHistory: AgentSignal[];
  isMuted: boolean;
  priorityScore: number;
}

export interface CeoDirective {
  id: string;
  title: string;
  directiveType: 'TIGHTEN_RISK' | 'EXPAND_ALLOCATION' | 'HEDGE_PORTFOLIO' | 'REBALANCE' | 'VOLATILITY_ALERT';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  affectedCount: number;
  affectedCategory: 'ALL' | 'FOREX' | 'SYNTHETICS';
  timestamp: number;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface ExecutiveReport {
  id: string;
  title: string;
  generatedAt: number;
  executiveSummary: string;
  marketOutlook: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'HIGH_VOLATILITY';
  aggregateSentimentScore: number; // -100 to +100
  activeAgentsCount: number;
  totalSignalsFired24h: number;
  portfolioWinRate: number;
  simulatedTotalPnl: number;
  forexSentiment: {
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    summary: string;
  };
  syntheticSentiment: {
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    summary: string;
  };
  topPerformingAgents: {
    id: string;
    name: string;
    symbol: string;
    winRate: number;
    pnl: number;
    signals: number;
  }[];
  highConvictionSignals: AgentSignal[];
  macroRiskAssessment: string;
  actionPlan: string[];
}

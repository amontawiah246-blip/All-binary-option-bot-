import { createInitialAgents } from '../data/agentDefinitions';
import {
  AgentSignal,
  CeoDirective,
  MarketAgent,
  SignalType,
  TechnicalIndicators,
} from '../types/agent';
import { TickData } from '../types/market';
import { derivWs } from './derivWs';

type StateListener = (agents: MarketAgent[], signals: AgentSignal[], directives: CeoDirective[]) => void;

class AgentEngine {
  private agents: Map<string, MarketAgent> = new Map();
  private signals: AgentSignal[] = [];
  private directives: CeoDirective[] = [];
  private listeners: Set<StateListener> = new Set();
  private tickUnsub: (() => void) | null = null;
  private isRunning = false;

  constructor() {
    this.initAgents();
  }

  private initAgents(): void {
    const initialList = createInitialAgents();
    initialList.forEach((agent) => {
      this.agents.set(agent.assignedSymbol, agent);
    });

    // Initial CEO Directive
    this.directives.push({
      id: `dir-${Date.now()}`,
      title: 'Global Fleet Deployment Initialized',
      directiveType: 'EXPAND_ALLOCATION',
      priority: 'HIGH',
      description: 'All 50 agents active: 10 Forex specialists & 40 Deriv synthetic analysts deployed across live feeds.',
      affectedCount: 50,
      affectedCategory: 'ALL',
      timestamp: Date.now(),
      status: 'ACTIVE',
    });
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Connect WebSocket
    derivWs.connect();

    // Subscribe all 50 agent symbols
    const symbols = Array.from(this.agents.keys());
    derivWs.subscribeSymbols(symbols);

    // Listen to real ticks
    this.tickUnsub = derivWs.onTick((tick) => {
      this.processTick(tick);
    });
  }

  public stop(): void {
    this.isRunning = false;
    if (this.tickUnsub) {
      this.tickUnsub();
      this.tickUnsub = null;
    }
  }

  private processTick(tick: TickData): void {
    const agent = this.agents.get(tick.symbol);
    if (!agent || agent.isMuted) return;

    const inst = agent.assignedInstrument;
    const oldPrice = inst.currentPrice;

    let newPrice: number;
    // If tick.quote is small delta (simulated), apply relative change; otherwise use absolute quote
    if (Math.abs(tick.quote) < 0.05 && tick.quote !== 0 && oldPrice > 1) {
      newPrice = Number((oldPrice * (1 + tick.quote)).toFixed(inst.pipSize));
    } else if (tick.quote > 0) {
      newPrice = Number(tick.quote.toFixed(inst.pipSize));
    } else {
      newPrice = oldPrice;
    }

    if (newPrice <= 0) return;

    // Update price history
    const history = [...inst.priceHistory.slice(-40), newPrice];
    const change24h = newPrice - inst.openPrice;
    const changePct = Number(((change24h / inst.openPrice) * 100).toFixed(2));
    const high24h = Math.max(inst.high24h, newPrice);
    const low24h = Math.min(inst.low24h, newPrice);

    inst.previousPrice = oldPrice;
    inst.currentPrice = newPrice;
    inst.priceHistory = history;
    inst.change24h = change24h;
    inst.changePct = changePct;
    inst.high24h = high24h;
    inst.low24h = low24h;
    inst.lastUpdated = Date.now();

    // Update agent metrics
    agent.metrics.totalEvaluations++;

    // Compute updated technical indicators
    agent.indicators = this.computeIndicators(history, newPrice, agent.indicators);

    // Run independent strategy evaluation
    const generatedSignal = this.evaluateAgentStrategy(agent, newPrice);
    if (generatedSignal) {
      agent.status = 'SIGNAL_FIRED';
      agent.lastSignal = generatedSignal;
      agent.signalHistory = [generatedSignal, ...agent.signalHistory.slice(0, 19)];
      agent.metrics.signalsGenerated++;

      // Update win rate & simulated PnL based on high confidence
      if (generatedSignal.confidence >= 75) {
        agent.metrics.successfulSignals++;
        agent.metrics.simulatedPnl += Number((Math.random() * 45 + 15).toFixed(2));
      } else {
        agent.metrics.simulatedPnl += Number(((Math.random() - 0.4) * 20).toFixed(2));
      }
      agent.metrics.winRate = Math.round(
        (agent.metrics.successfulSignals / Math.max(1, agent.metrics.signalsGenerated)) * 100
      );

      // Add to global signal feed
      this.signals = [generatedSignal, ...this.signals.slice(0, 79)];

      // Check if CEO needs to emit an executive directive
      this.checkCeoDirectives(generatedSignal);
    } else {
      if (agent.status === 'SIGNAL_FIRED' && Date.now() - (agent.lastSignal?.timestamp || 0) > 8000) {
        agent.status = 'ACTIVE';
      }
    }

    this.notifyState();
  }

  private computeIndicators(
    history: number[],
    currentPrice: number,
    prevInd: TechnicalIndicators
  ): TechnicalIndicators {
    const len = history.length;
    if (len < 5) return prevInd;

    // Fast EMA (9) & Slow EMA (21)
    const kFast = 2 / (9 + 1);
    const kSlow = 2 / (21 + 1);
    const emaFast = prevInd.emaFast * (1 - kFast) + currentPrice * kFast;
    const emaSlow = prevInd.emaSlow * (1 - kSlow) + currentPrice * kSlow;

    // MACD
    const macdLine = emaFast - emaSlow;
    const kSig = 2 / (9 + 1);
    const macdSignal = prevInd.macd.signal * (1 - kSig) + macdLine * kSig;
    const macdHist = macdLine - macdSignal;

    // RSI (14) approximation
    let gains = 0;
    let losses = 0;
    const lookback = Math.min(14, len - 1);
    for (let i = len - lookback; i < len; i++) {
      const diff = history[i] - history[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / lookback;
    const avgLoss = losses / lookback;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = Number((100 - 100 / (1 + rs)).toFixed(1));

    // Bollinger Bands (20 periods)
    const bbSlice = history.slice(-20);
    const mean = bbSlice.reduce((a, b) => a + b, 0) / bbSlice.length;
    const variance =
      bbSlice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / bbSlice.length;
    const stdDev = Math.sqrt(variance);
    const upperBB = mean + stdDev * 2;
    const lowerBB = mean - stdDev * 2;
    const percentB =
      upperBB === lowerBB ? 0.5 : (currentPrice - lowerBB) / (upperBB - lowerBB);

    // Volatility score (0-100)
    const volScore = Math.min(
      100,
      Math.max(10, Math.round((stdDev / (mean || 1)) * 10000 + 20))
    );

    return {
      rsi: isNaN(rsi) ? 50 : Math.min(99, Math.max(1, rsi)),
      macd: {
        macd: Number(macdLine.toFixed(5)),
        signal: Number(macdSignal.toFixed(5)),
        hist: Number(macdHist.toFixed(5)),
      },
      emaFast: Number(emaFast.toFixed(5)),
      emaSlow: Number(emaSlow.toFixed(5)),
      bollinger: {
        upper: Number(upperBB.toFixed(5)),
        middle: Number(mean.toFixed(5)),
        lower: Number(lowerBB.toFixed(5)),
        percentB: Number(percentB.toFixed(2)),
      },
      volatilityScore: volScore,
    };
  }

  private evaluateAgentStrategy(agent: MarketAgent, currentPrice: number): AgentSignal | null {
    const ind = agent.indicators;
    const strat = agent.strategy;

    // Throttle: Fast responsive signal trigger (3.2s minimum per agent)
    if (agent.lastSignal && Date.now() - agent.lastSignal.timestamp < 3200) {
      return null;
    }

    let signalType: SignalType = 'HOLD';
    let confidence = 0;
    let rationale = '';

    const isOversold = ind.rsi < 34;
    const isOverbought = ind.rsi > 66;
    const isEmaBullish = ind.emaFast > ind.emaSlow;
    const isEmaBearish = ind.emaFast < ind.emaSlow;
    const isMacdBullish = ind.macd.hist > 0;
    const isMacdBearish = ind.macd.hist < 0;

    // Calculate signals based on multi-factor alignment
    if (isOversold && isEmaBullish && isMacdBullish) {
      signalType = 'STRONG_BUY';
      confidence = Math.min(98, 80 + Math.floor(Math.random() * 18));
      rationale = `Triple confluence: RSI (${ind.rsi}) oversold bounce, Fast EMA crossed above Slow EMA, positive MACD momentum (${ind.macd.hist.toFixed(4)}).`;
    } else if (isOverbought && isEmaBearish && isMacdBearish) {
      signalType = 'STRONG_SELL';
      confidence = Math.min(98, 80 + Math.floor(Math.random() * 18));
      rationale = `Severe exhaustion: RSI (${ind.rsi}) overbought, Fast EMA descending below Slow EMA, negative MACD histogram.`;
    } else if ((isOversold || ind.bollinger.percentB < 0.15) && isMacdBullish) {
      signalType = 'BUY';
      confidence = 65 + Math.floor(Math.random() * 20);
      rationale = `Mean reversion trigger: Lower Bollinger Band touch (%B ${ind.bollinger.percentB}) with upward momentum inflection.`;
    } else if ((isOverbought || ind.bollinger.percentB > 0.88) && isMacdBearish) {
      signalType = 'SELL';
      confidence = 65 + Math.floor(Math.random() * 20);
      rationale = `Upper band rejection: Bollinger %B (${ind.bollinger.percentB}) resistance with negative momentum turnover.`;
    } else if (Math.random() < 0.03 * (strat.sensitivity / 5)) {
      // Occasional trend continuation or breakout signal
      if (isEmaBullish) {
        signalType = 'BUY';
        confidence = 60 + Math.floor(Math.random() * 18);
        rationale = `Dynamic trend continuation along Fast EMA support with healthy RSI (${ind.rsi}).`;
      } else {
        signalType = 'SELL';
        confidence = 60 + Math.floor(Math.random() * 18);
        rationale = `Breakdown momentum confirmation along Slow EMA resistance line.`;
      }
    }

    if (signalType === 'HOLD') {
      return null;
    }

    // Determine target price and stop loss using volatility and pip sizes
    const volatilityFactor = (ind.volatilityScore / 100) * 0.008 + 0.003;
    const isBuy = signalType === 'STRONG_BUY' || signalType === 'BUY';

    const targetDelta = currentPrice * volatilityFactor * (signalType === 'STRONG_BUY' || signalType === 'STRONG_SELL' ? 2.2 : 1.5);
    const stopDelta = currentPrice * volatilityFactor * 0.9;

    const targetPrice = isBuy
      ? Number((currentPrice + targetDelta).toFixed(agent.assignedInstrument.pipSize))
      : Number((currentPrice - targetDelta).toFixed(agent.assignedInstrument.pipSize));

    const stopLoss = isBuy
      ? Number((currentPrice - stopDelta).toFixed(agent.assignedInstrument.pipSize))
      : Number((currentPrice + stopDelta).toFixed(agent.assignedInstrument.pipSize));

    const riskRewardRatio = Number((targetDelta / Math.max(0.00001, stopDelta)).toFixed(2));

    const signal: AgentSignal = {
      id: `sig-${Date.now()}-${agent.agentNumber}`,
      agentId: agent.id,
      agentName: agent.name,
      symbol: agent.assignedSymbol,
      assetName: agent.assignedInstrument.displayName,
      category: agent.category,
      signalType,
      confidence,
      priceAtSignal: currentPrice,
      targetPrice,
      stopLoss,
      riskRewardRatio,
      timestamp: Date.now(),
      rationale,
      indicators: {
        rsi: ind.rsi,
        macdHist: ind.macd.hist,
        trend: isEmaBullish ? 'BULLISH' : 'BEARISH',
        volatility:
          ind.volatilityScore > 75
            ? 'EXTREME'
            : ind.volatilityScore > 50
            ? 'HIGH'
            : ind.volatilityScore > 25
            ? 'MEDIUM'
            : 'LOW',
      },
      acknowledgedByCeo: false,
    };

    return signal;
  }

  private checkCeoDirectives(signal: AgentSignal): void {
    // When a high-conviction signal (confidence >= 88) fires, CEO issues strategic directive
    if (signal.confidence >= 88 && (signal.signalType === 'STRONG_BUY' || signal.signalType === 'STRONG_SELL')) {
      const isForex = signal.category === 'forex';
      const existing = this.directives.find(
        (d) => d.title.includes(signal.symbol) && Date.now() - d.timestamp < 30000
      );

      if (!existing) {
        const newDirective: CeoDirective = {
          id: `dir-${Date.now()}`,
          title: `CEO Priority: High-Conviction ${signal.signalType} on ${signal.assetName}`,
          directiveType: isForex ? 'EXPAND_ALLOCATION' : 'VOLATILITY_ALERT',
          priority: 'CRITICAL',
          description: `Agent ${signal.agentName} flagged ${signal.signalType} (${signal.confidence}% confidence). Rationale: ${signal.rationale} Risk-Reward target: 1:${signal.riskRewardRatio}.`,
          affectedCount: isForex ? 10 : 40,
          affectedCategory: isForex ? 'FOREX' : 'SYNTHETICS',
          timestamp: Date.now(),
          status: 'ACTIVE',
        };

        signal.acknowledgedByCeo = true;
        this.directives = [newDirective, ...this.directives.slice(0, 19)];
      }
    }
  }

  public getAgentsList(): MarketAgent[] {
    return Array.from(this.agents.values()).sort((a, b) => a.agentNumber - b.agentNumber);
  }

  public getSignals(): AgentSignal[] {
    return this.signals;
  }

  public getDirectives(): CeoDirective[] {
    return this.directives;
  }

  public toggleMuteAgent(symbol: string): void {
    const agent = this.agents.get(symbol);
    if (agent) {
      agent.isMuted = !agent.isMuted;
      this.notifyState();
    }
  }

  public triggerManualSignal(symbol: string, forcedType: SignalType): void {
    const agent = this.agents.get(symbol);
    if (!agent) return;

    const currentPrice = agent.assignedInstrument.currentPrice;
    const isBuy = forcedType === 'STRONG_BUY' || forcedType === 'BUY';
    const delta = currentPrice * 0.008;

    const signal: AgentSignal = {
      id: `sig-manual-${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
      symbol: agent.assignedSymbol,
      assetName: agent.assignedInstrument.displayName,
      category: agent.category,
      signalType: forcedType,
      confidence: 94,
      priceAtSignal: currentPrice,
      targetPrice: isBuy ? currentPrice + delta : currentPrice - delta,
      stopLoss: isBuy ? currentPrice - delta * 0.5 : currentPrice + delta * 0.5,
      riskRewardRatio: 2.0,
      timestamp: Date.now(),
      rationale: `Manual CEO Override: Dispatched immediate ${forcedType} execution order with prioritized risk-parity stops.`,
      indicators: {
        rsi: agent.indicators.rsi,
        macdHist: agent.indicators.macd.hist,
        trend: isBuy ? 'BULLISH' : 'BEARISH',
        volatility: 'HIGH',
      },
      acknowledgedByCeo: true,
    };

    agent.lastSignal = signal;
    agent.signalHistory = [signal, ...agent.signalHistory];
    agent.status = 'SIGNAL_FIRED';
    this.signals = [signal, ...this.signals];
    this.notifyState();
  }

  public onStateChange(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getAgentsList(), this.signals, this.directives);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private rafPending = false;

  private notifyState(): void {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      const list = this.getAgentsList();
      this.listeners.forEach((l) => l(list, this.signals, this.directives));
    });
  }
}

export const agentEngine = new AgentEngine();

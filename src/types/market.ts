export type MarketCategory = 'forex' | 'synthetic';

export type MarketSubCategory =
  | 'major_forex'
  | 'minor_forex'
  | 'volatility'
  | 'volatility_1s'
  | 'crash_boom'
  | 'jump'
  | 'step'
  | 'range_break'
  | 'basket'
  | 'dex';

export interface TickData {
  symbol: string;
  quote: number;
  ask?: number;
  bid?: number;
  epoch: number;
  pipSize: number;
}

export interface MarketInstrument {
  id: string;
  symbol: string;
  displayName: string;
  category: MarketCategory;
  subCategory: MarketSubCategory;
  pipSize: number;
  currentPrice: number;
  previousPrice: number;
  openPrice: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePct: number;
  priceHistory: number[];
  lastUpdated: number;
}

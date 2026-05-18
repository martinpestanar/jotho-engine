export interface Company {
  id: string
  ticker: string
  name: string
  region: string
  sector: string
  ceo_name: string
  ceo_title: string
  ceo_sprite: string
  description: string
  base_price: number
  current_price: number
  prev_close: number
  change_percent: number
  market_sentiment: "Bullish" | "Bearish" | "Neutral"
  is_active: boolean
}

export interface PricePoint {
  time: string
  price: number
}

export interface NewsEvent {
  id: string
  title: string
  description: string
  ticker_affected: string
  impact_factor: number
  sentiment: string
  is_read: boolean
  published_at: string
}

export interface PortfolioItem {
  id: string
  user_id: string
  company_id: string
  shares: number
  avg_price: number
}

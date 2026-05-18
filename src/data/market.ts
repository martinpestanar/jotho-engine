export interface StockCompany {
  ticker: string
  name: string
  logo: string
  price: number
  prevClose: number
  changePercent: number
  sector: string
}

export interface PricePoint {
  time: string
  price: number
}

// Generate mock price history (48 data points, 30 min intervals)
function generateHistory(basePrice: number, volatility: number): PricePoint[] {
  let price = basePrice
  const points: PricePoint[] = []
  const now = new Date()
  for (let i = 48; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 30 * 60000)
    price += (Math.random() - 0.48) * volatility
    price = Math.max(price, basePrice * 0.7)
    points.push({
      time: t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      price: Math.round(price * 100) / 100,
    })
  }
  return points
}

export const STOCKS: StockCompany[] = [
  { ticker: "SLPH", name: "Silph Co.", logo: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png", price: 284.50, prevClose: 275.00, changePercent: 3.45, sector: "Technology" },
  { ticker: "DVN", name: "Devon S.A.", logo: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/devon-parts.png", price: 142.80, prevClose: 145.20, changePercent: -1.65, sector: "Manufacturing" },
  { ticker: "MOMO", name: "Mu-mu Farm", logo: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moomoo-milk.png", price: 67.30, prevClose: 63.10, changePercent: 6.66, sector: "Agriculture" },
  { ticker: "GCT", name: "Game Corner Token", logo: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coin.png", price: 12.45, prevClose: 12.80, changePercent: -2.73, sector: "Entertainment" },
  { ticker: "RKT", name: "Rocket Enterprises", logo: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/black-glasses.png", price: 53.20, prevClose: 55.00, changePercent: -3.27, sector: "Logistics" },
  { ticker: "PWR", name: "Power Plant Inc.", logo: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png", price: 198.00, prevClose: 190.50, changePercent: 3.94, sector: "Energy" },
]

export const PRICE_HISTORY: Record<string, PricePoint[]> = {}
for (const s of STOCKS) {
  PRICE_HISTORY[s.ticker] = generateHistory(s.price, s.price * 0.02)
}

export const MAGNATE_TIPS = [
  "Buy the dip — Silph Co. is about to announce a new Poke Ball line.",
  "Devon S.A. is overvalued. Consider taking profits.",
  "Mu-mu Farm Q3 earnings beat expectations. Bullish!",
  "Game Corner tokens are highly volatile. Trade with caution.",
  "Rocket Enterprises is under federal investigation. Stay away.",
  "Power Plant Inc. just signed a contract with the Johto League.",
  "Diversify! Don't put all your PKD in one basket.",
  "The market is entering a bull phase. Time to accumulate.",
  "Silph Co. has strong fundamentals. Hold for the long term.",
  "MOMO is the people's stock. It always rises.",
]

export function getRandomTip(): string {
  return MAGNATE_TIPS[Math.floor(Math.random() * MAGNATE_TIPS.length)]
}

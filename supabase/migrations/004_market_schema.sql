-- ============================================================
-- Johto Stock Exchange — Market Schema
-- ============================================================

-- 1. STOCKS: Listed companies on the Johto Exchange
CREATE TABLE IF NOT EXISTS public.stocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker          TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  ceo_id          INTEGER NOT NULL,          -- PokeAPI species ID for sprite
  ceo_name        TEXT NOT NULL,
  lore            TEXT NOT NULL,             -- World-building description
  sector          TEXT NOT NULL,
  logo_url        TEXT DEFAULT '',
  current_price   NUMERIC NOT NULL DEFAULT 100,
  prev_close      NUMERIC NOT NULL DEFAULT 100,
  change_percent  NUMERIC NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. STOCK_HISTORY: Price points for charting
CREATE TABLE IF NOT EXISTS public.stock_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id   UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  price      NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_history_stock_time ON public.stock_history(stock_id, recorded_at);

-- 3. NEWS_EVENTS: Market-moving headlines
CREATE TABLE IF NOT EXISTS public.news_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT DEFAULT '',
  stocks_affected  JSONB DEFAULT '[]',       -- [{ticker: "SLPH", impact: "positive"}]
  sentiment        TEXT DEFAULT 'neutral',   -- positive, negative, neutral
  published_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_news_published ON public.news_events(published_at DESC);

-- 4. USER_PORTFOLIO: Player holdings
CREATE TABLE IF NOT EXISTS public.user_portfolio (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  stock_id   UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  shares     INTEGER NOT NULL DEFAULT 0,
  avg_price  NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_id)
);

-- RLS Policies
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_stocks" ON public.stocks FOR SELECT USING (true);

ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_history" ON public.stock_history FOR SELECT USING (true);

ALTER TABLE public.news_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_news" ON public.news_events FOR SELECT USING (true);

ALTER TABLE public.user_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_portfolio" ON public.user_portfolio FOR SELECT USING (true);
CREATE POLICY "anon_insert_portfolio" ON public.user_portfolio FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_portfolio" ON public.user_portfolio FOR UPDATE USING (true);

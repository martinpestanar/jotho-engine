-- ============================================================
-- JSE Seed Data — Companies of the Ether Market
-- ============================================================

DELETE FROM public.news_events;
DELETE FROM public.stock_history;
DELETE FROM public.user_portfolio;
DELETE FROM public.stocks;

-- ── 10 Listed Companies ──

INSERT INTO public.stocks (ticker, name, ceo_id, ceo_name, lore, sector, logo_url, current_price, prev_close, change_percent)
VALUES
('SLPH', 'Silph Co.', 474, 'Porygon-Z',
 'Monitors the ethereal boundary between Johto and the Ether Primordial. Porygon-Z''s erratic algorithms process infinite possible market futures simultaneously — though sometimes it crashes mid-quarter.',
 'Ether Monitoring',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
 284.50, 275.00, 3.45),

('DVN', 'Devon S.A.', 376, 'Metagross',
 'Extracts crystallized joy from the Ether and forges it into adventure technology. Metagross''s four brains achieve perfect resource allocation, making Devon the most efficient corporation in any dimension.',
 'Ether Extraction',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/devon-parts.png',
 142.80, 145.20, -1.65),

('MOMO', 'Mu-mu Farms', 241, 'Miltank',
 'Harnesses the emotional resonance of contented Miltank to stabilize the Anchor''s connection to Johto. Higher happiness yields mean higher stock prices.',
 'Emotional Agriculture',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moomoo-milk.png',
 67.30, 63.10, 6.66),

('RKT', 'Rocket Ether-Works', 150, 'Mewtwo',
 'Controversial research lab probing forbidden Ether domains. Nobody knows if Mewtwo is the CEO, the experiment, or both. The stock is volatile but never boring.',
 'Controversial Research',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/black-glasses.png',
 53.20, 55.00, -3.27),

('PWR', 'Lighthouse Power', 181, 'Ampharos',
 'The Ampharos collective channels raw Ether lightning to illuminate Johto''s grid. Ether storms cause dramatic price spikes — hold during rainy seasons.',
 'Energy',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png',
 198.00, 190.50, 3.94),

('BALL', 'Poké Ball Foundry', 250, 'Ho-Oh',
 'Each Poké Ball is an Ether containment vessel forged with Ho-Oh''s sacred flame. When a legendary is sighted, the forges burn brighter and production triples.',
 'Ether Forging',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/luxury-ball.png',
 412.00, 408.50, 0.86),

('DREAM', 'Dream Mirror Corp', 518, 'Musharna',
 'Harvests dream mist from the Ether and refines it into therapy tools for burnt-out Anchors. Stock rises when global anxiety metrics spike.',
 'Mental Wellness',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/awakening.png',
 89.75, 84.00, 6.85),

('ERI', 'Ether Research Inst.', 201, 'Unown',
 'Academic consortium mapping the Ether''s topology. Research papers appear in reality-altering Unown script — investors decode quarterly reports like ancient prophecies.',
 'Academia',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/odd-keystone.png',
 155.20, 160.00, -3.00),

('CEL', 'Celadon Fragrance', 182, 'Bellossom',
 'Bottles the scent of nostalgia extracted from the Ether into luxury perfumes. Bellossom''s seasonal petals determine limited-edition blends that collectors fight over.',
 'Luxury Goods',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/beauty-scale.png',
 221.00, 215.80, 2.41),

('GEX', 'Goldenrod Exchange', 52, 'Meowth',
 'The marketplace itself is a listed entity. Meowth''s Pay Day generates actual currency from the Ether — shareholders receive dividends in literal raining coins.',
 'Finance',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coin.png',
 310.75, 305.00, 1.89)
;

-- ── Generate 48 hours of price history for each stock ──
DO $$
DECLARE
  s RECORD;
  i INTEGER;
  base_price NUMERIC;
  vol NUMERIC;
  new_price NUMERIC;
BEGIN
  FOR s IN SELECT id, current_price FROM public.stocks LOOP
    vol := s.current_price * 0.015; -- 1.5% volatility
    base_price := s.current_price;
    FOR i IN 0..95 LOOP
      base_price := base_price + (random() - 0.48) * vol;
      base_price := GREATEST(base_price, s.current_price * 0.55);
      INSERT INTO public.stock_history (stock_id, price, recorded_at)
      VALUES (s.id, ROUND(base_price::numeric, 2), now() - ((96 - i) * interval '30 minutes'));
    END LOOP;
  END LOOP;
END $$;

-- ── 6 Market-Moving News Events ──

INSERT INTO public.news_events (title, description, stocks_affected, sentiment, published_at)
VALUES
(
  'Ether Storm Approaches the Lighthouse Region',
  'Ampharos stations across Johto enter emergency mode as an unprecedented Ether storm gathers over Olivine. Energy output projected to triple.',
  '[{"ticker":"PWR","impact":"positive"},{"ticker":"DVN","impact":"positive"}]',
  'positive', now() - interval '2 hours'
),
(
  'Ho-Oh Spotted Over Tin Tower — Forges Ignite',
  'A legendary sighting near Ecruteak sends energy waves through the Poké Ball Foundry. Production capacity has automatically tripled. Analysts predict a surge.',
  '[{"ticker":"BALL","impact":"positive"},{"ticker":"SLPH","impact":"positive"}]',
  'positive', now() - interval '5 hours'
),
(
  'Mewtwo Threatens to Resign from Rocket Ether-Works',
  'In an unprecedented telepathic broadcast, Mewtwo expressed dissatisfaction with current lab protocols. RKT dropped 3% on the news.',
  '[{"ticker":"RKT","impact":"negative"},{"ticker":"MOMO","impact":"negative"}]',
  'negative', now() - interval '8 hours'
),
(
  'Unown Script Discovery Reveals New Ether Topology',
  'A previously unseen Unown pattern found in the Ruins of Alph has decoded a new layer of the Ether. ERI shares have spiked 4% as research teams mobilize.',
  '[{"ticker":"ERI","impact":"positive"},{"ticker":"SLPH","impact":"positive"}]',
  'positive', now() - interval '12 hours'
),
(
  'Miltank Happiness Report — Record Highs',
  'The quarterly emotional yield report from Mu-mu Farms shows Miltank contentment at a 5-year high. Milk quality and Ether stabilization both up.',
  '[{"ticker":"MOMO","impact":"positive"},{"ticker":"DREAM","impact":"positive"}]',
  'positive', now() - interval '18 hours'
),
(
  'Global Anchor Anxiety Index Rises',
  'Reports from the Ether Monitoring Bureau show increased stress levels among Anchors worldwide. Dream Mirror Corp shares reflect the growing demand for therapy tools.',
  '[{"ticker":"DREAM","impact":"positive"},{"ticker":"CEL","impact":"negative"}]',
  'neutral', now() - interval '1 day'
);

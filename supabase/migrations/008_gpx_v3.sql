-- GPX v3 — Global Poké-Exchange (90-company ready)
-- ============================================================
DROP TABLE IF EXISTS public.user_portfolio CASCADE;
DROP TABLE IF EXISTS public.user_watchlist CASCADE;
DROP TABLE IF EXISTS public.stock_history CASCADE;
DROP TABLE IF EXISTS public.market_news CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- 1. COMPANIES
CREATE TABLE public.companies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker           TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  region           TEXT NOT NULL DEFAULT 'Johto',
  sector           TEXT NOT NULL,
  ceo_name         TEXT NOT NULL,
  ceo_sprite       TEXT NOT NULL,
  description      TEXT NOT NULL,
  base_price       NUMERIC NOT NULL DEFAULT 100,
  current_price    NUMERIC NOT NULL DEFAULT 100,
  prev_close       NUMERIC NOT NULL DEFAULT 100,
  change_percent   NUMERIC NOT NULL DEFAULT 0,
  market_sentiment TEXT NOT NULL DEFAULT 'Neutral',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. MARKET NEWS (with impact_factor for n8n)
CREATE TABLE public.market_news (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT DEFAULT '',
  ticker_affected  TEXT NOT NULL,
  impact_factor    NUMERIC NOT NULL DEFAULT 1.0, -- 1.2 = +20%, 0.8 = -20%
  sentiment        TEXT DEFAULT 'neutral',
  is_read          BOOLEAN NOT NULL DEFAULT false,
  published_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_market_news_date ON public.market_news(published_at DESC);

-- 3. STOCK HISTORY  
CREATE TABLE public.stock_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  price       NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hist_company_time ON public.stock_history(company_id, recorded_at);

-- 4. USER PORTFOLIO
CREATE TABLE public.user_portfolio (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shares     INTEGER NOT NULL DEFAULT 0,
  avg_price  NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- 5. USER WATCHLIST (favorites)
CREATE TABLE public.user_watchlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_companies" ON public.companies FOR SELECT USING (true);
ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_news" ON public.market_news FOR SELECT USING (true);
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_history" ON public.stock_history FOR SELECT USING (true);
ALTER TABLE public.user_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_portfolio" ON public.user_portfolio FOR ALL USING (true);
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_watchlist" ON public.user_watchlist FOR ALL USING (true);

-- ============================================================
-- SEED: 30 COMPANIES (10 Kanto, 10 Johto, 10 Hoenn)
-- ============================================================
-- Helper to construct PokeAPI item sprite URL
-- ceo_sprite uses item sprites that match the CEO's profession

-- KANTO
INSERT INTO public.companies (ticker, name, region, sector, ceo_name, ceo_sprite, description, base_price, current_price, prev_close, change_percent, market_sentiment) VALUES

('SLPH', 'Silph Co.', 'Kanto', 'Technology',
 'Presidente Silph', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-revive.png',
 'Monopolio global de Poké Balls y contención Ether. Fabricando en Saffron desde la guerra.', 300, 312.40, 298.00, 4.83, 'Bullish'),

('RCKT', 'Rocket Game Corner', 'Kanto', 'Entertainment',
 'Giovanni', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blackglasses.png',
 'Fachada del Equipo Rocket. Casinos, tráfico y blanqueo de Ether. Alta volatilidad.', 55, 53.20, 55.00, -3.27, 'Bearish'),

('CINN', 'Cinnabar Genetics Lab', 'Kanto', 'Biotech',
 'Dr. Blaine', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ether.png',
 'Pioneros en clonación fósil y terapia génica con Ether. Reactor experimental en el volcán.', 190, 198.60, 194.30, 2.21, 'Bullish'),

('KPOW', 'Kanto Power Grid', 'Kanto', 'Energy',
 'Lt. Surge', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png',
 'Red eléctrica de Kanto. Convertida de base militar a central de energía Ether.', 170, 167.80, 171.20, -1.99, 'Neutral'),

('PEWT', 'Pewter Mining Corp', 'Kanto', 'Mining',
 'Brock Samson', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hard-stone.png',
 'Extracción de minerales raros y fósiles del Monito Moon. Proveedores de Devon.', 88, 91.40, 86.00, 6.28, 'Bullish'),

('CELD', 'Celadon Dept. Stores', 'Kanto', 'Retail',
 'Erika Hayashi', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rage-candy-bar.png',
 'Mayor cadena minorista de Kanto. Vende desde Poké Balls hasta perfumes de flores.', 145, 141.20, 144.00, -1.94, 'Neutral'),

('SAFF', 'Saffron Dojo Inc.', 'Kanto', 'Training',
 'Master Kiyo', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/focus-band.png',
 'Centro de entrenamiento de élite. Entrenadores de la Liga se forman aquí.', 122, 128.50, 124.00, 3.63, 'Bullish'),

('CERU', 'Cerulean Aquarium', 'Kanto', 'Tourism',
 'Misty Waterflower', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sea-incense.png',
 'Acuario público más grande de Kanto. Atrae 2M de visitantes al año.', 76, 78.30, 75.60, 3.57, 'Bullish'),

('VIRI', 'Viridian Forestry', 'Kanto', 'Forestry',
 'Gardener Grove', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leaf-stone.png',
 'Gestiona los bosques protegidos de Kanto. Madera sostenible y conservación Ether.', 63, 61.80, 63.90, -3.29, 'Bearish'),

('PALL', 'Pallet Ranch', 'Kanto', 'Agriculture',
 'Prof. Oak', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/berry-juice.png',
 'Granja experimental del Prof. Oak. Referencia en investigación de razas y bayas.', 210, 215.40, 211.00, 2.09, 'Bullish');

-- JOHTO
INSERT INTO public.companies (ticker, name, region, sector, ceo_name, ceo_sprite, description, base_price, current_price, prev_close, change_percent, market_sentiment) VALUES

('RADI', 'Goldenrod Radio Tower', 'Johto', 'Media',
 'DJ Mary', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/wide-lens.png',
 'La voz de Johto. Radio, TV y streaming. El índice de audiencia mueve elecciones.', 90, 91.30, 85.00, 7.41, 'Bullish'),

('MOMO', 'MooMoo Agro Corp', 'Johto', 'Agriculture',
 'Farmer Bailey', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moomoo-milk.png',
 'Leche Mu-Mu, el estándar de calidad láctea. Alimento certificado para Pokémon.', 65, 67.30, 63.10, 6.66, 'Bullish'),

('KURT', 'Kurt Artisan Balls', 'Johto', 'Luxury',
 'Kurt', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lure-ball.png',
 'Artesano de Apricornas. Poké Balls de colección, cada pieza es única.', 420, 432.00, 425.00, 1.65, 'Bullish'),

('MAGN', 'Magnet Rail Transit', 'Johto', 'Logistics',
 'Copycat', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mach-bike.png',
 'Tren maglev Kanto-Johto. Proyecto de expansión a Hoenn en desarrollo.', 155, 156.40, 158.90, -1.57, 'Neutral'),

('OLIV', 'Olivine Port Authority', 'Johto', 'Shipping',
 'Captain Stern', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sea-incense.png',
 'Puerto principal de Johto. Todo el comercio marítimo pasa por aquí.', 134, 137.60, 133.20, 3.30, 'Bullish'),

('LAKE', 'Lake of Rage Resorts', 'Johto', 'Tourism',
 'Clair Sasaki', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png',
 'Complejo turístico alrededor del lago. Famoso por sus Gyarados rojos.', 98, 95.40, 97.10, -1.75, 'Neutral'),

('SPRO', 'Sprout Tower Trust', 'Johto', 'Heritage',
 'Elder Li', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/old-rod.png',
 'Organización que preserva linajes de Bellsprout y tradiciones Ether antiguas.', 45, 47.80, 44.50, 7.42, 'Bullish'),

('ALPH', 'Ruins of Alph Authority', 'Johto', 'Research',
 'Prof. S. Maple', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/odd-keystone.png',
 'Consorcio arqueológico que descifra los Unown y la topografía del Ether.', 115, 112.30, 116.40, -3.52, 'Bearish'),

('BTTL', 'Johto Battle Tower', 'Johto', 'Entertainment',
 'Palmer', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/expert-belt.png',
 'Estadio de batalla profesional. Organiza torneos internacionales.', 185, 189.20, 183.50, 3.11, 'Bullish'),

('DRGN', 'Dragon Den Breeders', 'Johto', 'Breeding',
 'Clair Sasaki', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-scale.png',
 'Santuario de dragones en Blackthorn. Criaderos de élite certificados por la Liga.', 310, 315.80, 308.00, 2.53, 'Bullish');

-- HOENN
INSERT INTO public.companies (ticker, name, region, sector, ceo_name, ceo_sprite, description, base_price, current_price, prev_close, change_percent, market_sentiment) VALUES

('DVON', 'Devon Corporation', 'Hoenn', 'Technology',
 'Mr. Stone', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/devon-parts.png',
 'Rival directo de Silph. Nanotecnología, restauración fósil y expansión agresiva.', 145, 142.80, 145.20, -1.65, 'Neutral'),

('STERN', 'Stern Shipyards', 'Hoenn', 'Shipping',
 'Captain Stern', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sail-fossil.png',
 'Astilleros de Slateport. Construcción naval, exploración abisal y submarinos Ether.', 220, 221.50, 215.00, 3.02, 'Bullish'),

('MAUV', 'Mauville Mega Mall', 'Hoenn', 'Retail',
 'Wattson', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/magnet.png',
 'Complejo comercial autosuficiente de Wattson. Tiendas, gimnasio y eléctricas.', 290, 293.50, 291.00, 0.86, 'Bullish'),

('WTHR', 'Weather Institute', 'Hoenn', 'Climate',
 'Dr. Storm', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/damp-rock.png',
 'Predicción climática global con Castform. Precisión del 94%. Contratos gubernamentales.', 185, 187.90, 183.50, 2.40, 'Bullish'),

('RUST', 'Rusturf Tunnel Mining', 'Hoenn', 'Mining',
 'Worker Wally', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hard-stone.png',
 'Minera de Rustboro. Provee materiales para Devon y construcción regional.', 72, 74.10, 71.50, 3.64, 'Bullish'),

('SLAT', 'Slateport Market', 'Hoenn', 'Commerce',
 'Stern Sec.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coin.png',
 'Mercado portuario más activo de Hoenn. Punto de encuentro de traders de las tres regiones.', 101, 103.20, 100.10, 3.10, 'Bullish'),

('FALL', 'Fallarbor Ranch', 'Hoenn', 'Agriculture',
 'Rancher Hill', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rawst-berry.png',
 'Crianza de Pokémon de tipo tierra y fuego. Proveedor de berries para toda Hoenn.', 55, 53.80, 56.00, -3.93, 'Bearish'),

('LAVA', 'Lavaridge Spa & Heat', 'Hoenn', 'Energy',
 'Flannery Sage', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/charcoal.png',
 'Balneario geotérmico. Energía de magma para media Hoenn y turismo termal.', 168, 171.40, 166.20, 3.13, 'Bullish'),

('PACF', 'Pacifidlog Trawlers', 'Hoenn', 'Fishing',
 'Fisherman Drake', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/old-rod.png',
 'Flota pesquera que cruza la ruta 134. Especialistas en captura de especies raras.', 42, 40.30, 42.80, -5.84, 'Bearish'),

('EVGR', 'Ever Grande League', 'Hoenn', 'Entertainment',
 'Champion Wallace', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png',
 'Sede de la Liga Hoenn. Mega-eventos, merchandising y derechos de transmisión global.', 245, 252.60, 243.00, 3.95, 'Bullish');

-- ============================================================
-- PRICE HISTORY (48h × 30min)
-- ============================================================
DO $$
DECLARE c RECORD; i INTEGER; bp NUMERIC; vl NUMERIC;
BEGIN
  FOR c IN SELECT id, current_price FROM public.companies LOOP
    vl := c.current_price * 0.018; bp := c.current_price;
    FOR i IN 0..95 LOOP
      bp := bp + (random() - 0.48) * vl;
      bp := GREATEST(bp, c.current_price * 0.35);
      INSERT INTO public.stock_history (company_id, price, recorded_at)
      VALUES (c.id, ROUND(bp::numeric, 2), now() - ((96 - i) * interval '30 minutes'));
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- SAMPLE BREAKING NEWS
-- ============================================================
INSERT INTO public.market_news (title, description, ticker_affected, impact_factor, sentiment, published_at) VALUES
('Silph demanda a Devon por patentes de Poké Ball', 'Guerra legal entre Kanto y Hoenn sacude el sector tecnológico.', 'SLPH', 1.08, 'positive', now() - interval '1 hour'),
('Giovanni bajo investigación federal', 'Rocket Game Corner enfrenta auditoría por lavado de Ether.', 'RCKT', 0.82, 'negative', now() - interval '3 hours'),
('Storm advierte: temporada de huracanes récord', 'Instituto Meteorológico emite alerta roja para costas de Hoenn.', 'WTHR', 1.12, 'positive', now() - interval '5 hours'),
('Magnet Rail anuncia expansión a Hoenn', 'El tren bala conectará las tres regiones en 2027.', 'MAGN', 1.15, 'positive', now() - interval '7 hours'),
('Kurt lanza colección limitada de lujo', 'Fast Ball dorada alcanza récord en subasta: 2M PKD.', 'KURT', 1.06, 'positive', now() - interval '10 hours'),
('Apagón masivo en Ciudad Azulona', 'KPOW strugglea por mantener la red ante tormenta Ether.', 'KPOW', 0.88, 'negative', now() - interval '14 hours'),
('Misty inaugura ala de especies abisales', 'Cerulean Aquarium bate récord de visitas en su primer mes.', 'CERU', 1.04, 'positive', now() - interval '18 hours'),
('Cinnabar Labs revela terapia antienvejecimiento', 'Acciones de biotecnología se disparan en todos los mercados.', 'CINN', 1.18, 'positive', now() - interval '1 day');

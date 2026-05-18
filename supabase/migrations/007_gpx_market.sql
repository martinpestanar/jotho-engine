-- ============================================================
-- GPX — Global Poké-Exchange v3
-- Geopolitical market: Kanto, Johto & Hoenn
-- ============================================================
DROP TABLE IF EXISTS public.user_portfolio CASCADE;
DROP TABLE IF EXISTS public.stock_history CASCADE;
DROP TABLE IF EXISTS public.news_events CASCADE;
DROP TABLE IF EXISTS public.stocks CASCADE;

CREATE TABLE public.stocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker          TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  ceo_name        TEXT NOT NULL,
  ceo_title       TEXT NOT NULL,
  ceo_sprite      TEXT NOT NULL,
  lore            TEXT NOT NULL,
  sector          TEXT NOT NULL,
  region          TEXT NOT NULL DEFAULT 'Johto',
  logo_url        TEXT DEFAULT '',
  current_price   NUMERIC NOT NULL DEFAULT 100,
  prev_close      NUMERIC NOT NULL DEFAULT 100,
  change_percent  NUMERIC NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id    UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  price       NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_history_stock_time ON public.stock_history(stock_id, recorded_at);

CREATE TABLE public.news_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT DEFAULT '',
  stocks_affected  JSONB DEFAULT '[]',
  sentiment        TEXT DEFAULT 'neutral',
  published_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_news_published ON public.news_events(published_at DESC);

CREATE TABLE public.user_portfolio (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  stock_id   UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  shares     INTEGER NOT NULL DEFAULT 0,
  avg_price  NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_id)
);

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

-- ============================================================
-- KANTO
-- ============================================================
INSERT INTO public.stocks (ticker, name, ceo_name, ceo_title, ceo_sprite, lore, sector, region, logo_url, current_price, prev_close, change_percent) VALUES

('SLPH', 'Silph Co.', 'Presidente Silph', 'Chairman',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-revive.png',
 'Fundada por la familia Silph hace setenta años en Saffron, es el monopolio global de Poké Balls y tecnología de contención Ether. Su reactor Poké Ball abastece al 90% del mercado. El Presidente Silph maneja la empresa con mano firme, aunque rumores de espionaje industrial por parte de Devon nunca desaparecen.',
 'Tecnología', 'Kanto',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png', 312.40, 298.00, 4.83),

('RCKT', 'Rocket Game Corner', 'Giovanni', 'Don',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blackglasses.png',
 'Operación fachada del Equipo Rocket. Bajo la aparente sala de juegos de Ciudad Azulona se esconde un imperio de manipulación del Ether y tráfico de especies. Giovanni ha diversificado el negocio hacia el sector financiero legítimo, pero investigaciones federales acechan. Volátil — puede dispararse o colapsar con una sola noticia.',
 'Entretenimiento', 'Kanto',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coin.png', 53.20, 55.00, -3.27),

('CINN', 'Laboratorios Isla Canela', 'Blaine', 'Director Científico',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ether.png',
 'Enclave científico en el volcán de Isla Canela. Blaine lidera investigaciones pioneras en modificación genética y evolución inducida por Ether. Sus avances en clonación fósil (aerodactyl) revolucionaron la biotecnología. La demanda de sus tratamientos genéticos sube cada trimestre.',
 'Biotecnología', 'Kanto',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ether.png', 198.60, 194.30, 2.21),

('KPW', 'Kanto Power Station', 'Teniente Surge', 'Director de Operaciones',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png',
 'La red eléctrica que mantiene encendidas las luces de Kanto. El Teniente Surge, héroe de guerra de la Liga, transformó una base militar abandonada en la planta de energía más eficiente de la región. Su tecnología de descargas Ether-Electricidad es codiciada globalmente.',
 'Energía', 'Kanto',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png', 167.80, 171.20, -1.99);

-- ============================================================
-- JOHTO
-- ============================================================
INSERT INTO public.stocks (ticker, name, ceo_name, ceo_title, ceo_sprite, lore, sector, region, logo_url, current_price, prev_close, change_percent) VALUES

('RADI', 'Goldenrod Radio Tower', 'Directora Buena', 'CEO de Medios',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/wide-lens.png',
 'La voz del pueblo Johto. La Directora Buena transformó una estación local de radio en un imperio mediático que abarca TV, streaming y la popular Poké Flute Sessions. Su índice de audiencia determina la opinión pública en elecciones regionales.',
 'Medios', 'Johto',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/wide-lens.png', 91.30, 85.00, 7.41),

('MOOM', 'Granja Mu-Mu', 'Granjero Baoba', 'Agricultor Principal',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moomoo-milk.png',
 'Productora láctea más grande de Johto. La Granja Mu-Mu produce la mundialmente famosa Leche Mu-Mu, cuyo contenido de Ether natural potencia el sistema inmunológico de entrenadores y Pokémon. Baoba fue pionero en la ganadería sostenible asistida por Ether.',
 'Agricultura', 'Johto',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moomoo-milk.png', 67.30, 63.10, 6.66),

('KURT', 'Artesanías Kurt', 'Kurt', 'Maestro Artesano',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lure-ball.png',
 'El legendario artesano de Apricornas. Cada Poké Ball de Kurt es una pieza única forjada a mano con tintes naturales del Bosque Azalea. Sus diseños exclusivos (Level Ball, Love Ball) se venden en subastas por cifras récord. No produce en masa — cada unidad es una obra de arte.',
 'Manufactura', 'Johto',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lure-ball.png', 432.00, 425.00, 1.65),

('MAGN', 'Magnet Train Transit', 'Copión', 'Ingeniero Jefe',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mach-bike.png',
 'El tren de levitación magnética que conecta Kanto y Johto. Copión, el ingeniero excéntrico que revivió el proyecto abandonado de Silph, logró unir las dos regiones en un viaje de dos horas. La expansión a Hoenn está en fase de prototipo.',
 'Logística', 'Johto',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mach-bike.png', 156.40, 158.90, -1.57);

-- ============================================================
-- HOENN
-- ============================================================
INSERT INTO public.stocks (ticker, name, ceo_name, ceo_title, ceo_sprite, lore, sector, region, logo_url, current_price, prev_close, change_percent) VALUES

('DVN', 'Devon S.A.', 'Sr. Peñas', 'Presidente',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/devon-parts.png',
 'El gigante tecnológico de Hoenn. Devon compite directamente con Silph en el mercado de Poké Balls y dispositivos de Ether, pero su ventaja diferencial es la nanotecnología de restauración fósil. El Sr. Peñas ha llevado a Devon de un taller familiar en Ciudad Férrica a una multinacional que cotiza en tres regiones.',
 'Tecnología', 'Hoenn',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/devon-parts.png', 142.80, 145.20, -1.65),

('AQUA', 'Astilleros Stern', 'Capitán Stern', 'Director Naval',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sea-incense.png',
 'Los astilleros más grandes del mundo Pokémon. El Capitán Stern construye desde cruceros de lujo (S.S. Anne) hasta submarinos de exploración abisal. Su proyecto secreto, el "Explorador de las Profundidades", podría abrir nuevas rutas de Ether submarino y cambiar el comercio global.',
 'Logística', 'Hoenn',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sea-incense.png', 221.50, 215.00, 3.02),

('MAUV', 'Mauville Energy', 'Wattson', 'CEO',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/magnet.png',
 'Wattson convirtió un pequeño taller de bicicletas eléctricas en la empresa de infraestructura urbana más innovadora de Hoenn. Mauville City es su vitrina: un complejo autosuficiente con energía 100% renovable, gimnasio Pokémon, centro comercial y el primer estadio cubierto del mundo.',
 'Energía', 'Hoenn',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/magnet.png', 293.50, 291.00, 0.86),

('WTHR', 'Instituto Meteorológico', 'Dr. Storm', 'Meteorólogo Jefe',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/damp-rock.png',
 'El centro de predicción climática más avanzado del mundo. El Dr. Storm lidera un equipo de Castform que puede manipular el clima a escala local. Gobiernos regionales contratan sus servicios para prevenir desastres naturales y optimizar cosechas. Su precisión del 94% lo hace indispensable.',
 'Tecnología', 'Hoenn',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/damp-rock.png', 187.90, 183.50, 2.40);

-- ============================================================
-- Price History (48h × 30min intervals)
-- ============================================================
DO $$
DECLARE s RECORD; i INTEGER; bp NUMERIC; vl NUMERIC;
BEGIN
  FOR s IN SELECT id, current_price FROM public.stocks LOOP
    vl := s.current_price * 0.018; bp := s.current_price;
    FOR i IN 0..95 LOOP
      bp := bp + (random() - 0.48) * vl;
      bp := GREATEST(bp, s.current_price * 0.35);
      INSERT INTO public.stock_history (stock_id, price, recorded_at)
      VALUES (s.id, ROUND(bp::numeric, 2), now() - ((96 - i) * interval '30 minutes'));
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- News (8 geopolitical breaking stories)
-- ============================================================
INSERT INTO public.news_events (title, description, stocks_affected, sentiment, published_at) VALUES

('SILPH DENUNCIA ESPIONAJE INDUSTRIAL DE DEVON',
 'El Presidente Silph declaró en conferencia de prensa que "código fuente de la Poké Ball 9.0 fue extraído de nuestros servidores". Devon niega las acusaciones. Silph Co. sube 4% por confianza inversionista; Devon cae 2%.',
 '[{"ticker":"SLPH","impact":"positive"},{"ticker":"DVN","impact":"negative"}]',
 'positive', now() - interval '1 hour'),

('GIOVANNI DECLARA DIVIDENDO EXTRAORDINARIO',
 'Rocket Game Corner anuncia pago de dividendo récord. Analistas sospechan que el efectivo proviene de operaciones no declaradas. La SEC de Johto abre investigación preliminar.',
 '[{"ticker":"RCKT","impact":"positive"},{"ticker":"SLPH","impact":"negative"}]',
 'neutral', now() - interval '3 hours'),

('BLAINE REVELA TERAPIA GENÉTICA CONTRA EL ENVEJECIMIENTO',
 'CINN anuncia un avance en la regeneración celular inducida por Ether. Acciones trepan 8% en pre-mercado. La comunidad científica pide ensayos clínicos independientes.',
 '[{"ticker":"CINN","impact":"positive"},{"ticker":"AQUA","impact":"negative"}]',
 'positive', now() - interval '5 hours'),

('APAGÓN EN CIUDAD AZULONA — SURGE RESPONDE',
 'Una tormenta Ether dejó sin electricidad al sector oeste de Ciudad Azulona. KPW envió equipos de emergencia. Surge declaró que "la red está obsoleta y necesita inversión urgente".',
 '[{"ticker":"KPW","impact":"negative"},{"ticker":"MAUV","impact":"positive"}]',
 'negative', now() - interval '8 hours'),

('EQUIPO AQUA ROBAN SUBMARINO EN ASTILLEROS STERN',
 'Un comando armado sustrajo un prototipo de sumergible de aguas profundas. $AQUA cae 18% en minutos. El Capitán Stern ofrece recompensa por información.',
 '[{"ticker":"AQUA","impact":"negative"},{"ticker":"DVN","impact":"neutral"}]',
 'negative', now() - interval '12 hours'),

('WATTSON PROPONE RED ELÉCTRICA INTERREGIONAL',
 'Mauville Energy presenta plan para conectar las redes eléctricas de Kanto, Johto y Hoenn. KPW y MAGN muestran interés. Acciones de MAUV suben 5%',
 '[{"ticker":"MAUV","impact":"positive"},{"ticker":"KPW","impact":"positive"},{"ticker":"MAGN","impact":"positive"}]',
 'positive', now() - interval '16 hours'),

('INSTITUTO METEOROLÓGICO PREDICE COLAPSO CLIMÁTICO',
 'El Dr. Storm advierte que la temporada de tormentas Ether será la peor en 50 años. $WTHR se dispara 7% mientras gobiernos contratan sus servicios de emergencia.',
 '[{"ticker":"WTHR","impact":"positive"},{"ticker":"MOOM","impact":"negative"},{"ticker":"AQUA","impact":"negative"}]',
 'positive', now() - interval '20 hours'),

('KURT LANZA EDICIÓN LIMITADA DE APRICORNAS DORADAS',
 'La subasta anual de Kurt establece nuevo récord: una Fast Ball edición coleccionista alcanza 2M de PKD. $KURT sube 3% en medio de alta demanda de artículos de lujo.',
 '[{"ticker":"KURT","impact":"positive"},{"ticker":"SLPH","impact":"neutral"}]',
 'positive', now() - interval '1 day');

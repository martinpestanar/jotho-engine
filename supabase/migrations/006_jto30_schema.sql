-- ============================================================
-- JSE Schema v2 — Human CEOs + 30 companies (JTO-30 Index)
-- ============================================================
DROP TABLE IF EXISTS public.user_portfolio CASCADE;
DROP TABLE IF EXISTS public.stock_history CASCADE;
DROP TABLE IF EXISTS public.news_events CASCADE;
DROP TABLE IF EXISTS public.stocks CASCADE;

CREATE TABLE public.stocks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker           TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  ceo_name         TEXT NOT NULL,
  ceo_title        TEXT NOT NULL,
  ceo_sprite       TEXT NOT NULL,           -- PokeAPI item sprite URL for avatar
  lore             TEXT NOT NULL,
  sector           TEXT NOT NULL,
  logo_url         TEXT DEFAULT '',
  current_price    NUMERIC NOT NULL DEFAULT 100,
  prev_close       NUMERIC NOT NULL DEFAULT 100,
  change_percent   NUMERIC NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
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
-- JTO-30 INDEX — Seed Data
-- ============================================================

INSERT INTO public.stocks (ticker, name, ceo_name, ceo_title, ceo_sprite, lore, sector, logo_url, current_price, prev_close, change_percent) VALUES

('SLPH', 'Silph Co.', 'Gregory Silph', 'Chairman',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-revive.png',
 'The founding giant of Poké Ball manufacturing and Ether containment technology. Gregory Silph personally oversees the development of new capture methodologies at Saffron HQ.',
 'Manufacturing', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
 284.50, 275.00, 3.45),

('DVN', 'Devon Corporation', 'Joseph Stone', 'President',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/devon-parts.png',
 'Rustboro-based conglomerate specializing in fossil revival, biomechanical engineering, and Ether-powered machinery. Joseph Stone inherited the company from his father and expanded into renewable Ether energy.',
 'Technology', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/devon-parts.png',
 142.80, 145.20, -1.65),

('MACR', 'Macro Cosmos', 'Rose M.' , 'Chairman',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/up-grade.png',
 'The largest energy conglomerate in the Galar region, now expanding into Johto. Rose M. champions infinite Ether energy as the solution to the world''s resource scarcity. Controversial but brilliant.',
 'Energy', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/up-grade.png',
 412.00, 408.50, 0.86),

('AETH', 'Aether Foundation', 'Lusamine Akua', 'President',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/heal-powder.png',
 'A philanthropic organization focused on Ether conservation and Anchor welfare. Lusamine Akua has deep personal ties to the Ether dimension, driving the foundation''s research at any cost.',
 'Non-Profit', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/heal-powder.png',
 198.00, 190.50, 3.94),

('BALL', 'Poké Ball Forge Ltd.', 'Hiroshi Takeda', 'Master Forger',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/luxury-ball.png',
 'Every Poké Ball begins here in the heart of Johto. Master Takeda has spent forty years perfecting the art of Ether forging. His signature Luxury Balls are considered investment-grade assets.',
 'Manufacturing', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/luxury-ball.png',
 356.00, 348.00, 2.30),

('MOMO', 'MooMoo Agro Corp', 'Yuki Hanamura', 'Chief Agriculturist',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moomoo-milk.png',
 'The leading organic Ether feed supplier. Miltank happiness is the #1 metric tracked by Yuki''s team. Higher morale equals higher milk quality equals higher stock.',
 'Agriculture', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moomoo-milk.png',
 67.30, 63.10, 6.66),

('RAD', 'Goldenrod Broadcasting', 'Mary Silvers', 'Station Director',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/wide-lens.png',
 'The voice of Johto. Goldenrod Radio broadcasts Ether weather reports, market news, and the legendary Poké Flute Sessions. Mary Silvers is the most trusted voice in regional media.',
 'Media', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/wide-lens.png',
 89.75, 84.00, 6.85),

('MTMN', 'Mt. Moon Mining Co.', 'Takeshi Ishiyama', 'Foreman',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hard-stone.png',
 'Extracts Moon Stones and rare Ether minerals from the depths of Mt. Moon. Takeshi led the rescue operation during the 2024 cave-in and has since modernized safety protocols.',
 'Mining', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hard-stone.png',
 155.20, 160.00, -3.00),

('CURE', 'Cianwood Pharmaceuticals', 'Elena Flores', 'Chief Pharmacist',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/full-heal.png',
 'Cianwood is the world leader in Ether-based medicine. Their SecretPotion formula, developed by Elena Flores, has cured countless conditions from the common cold to Ether poisoning.',
 'Pharma', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/full-heal.png',
 221.00, 215.80, 2.41),

('PORT', 'Olivine Port Authority', 'Kaito Muroi', 'Harbor Master',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sea-incense.png',
 'The gateway of Johto. Every imported Poké Ball, export of MooMoo Milk, and Ether shipment passes through Kaito Muroi''s docks. Port expansion is the hotly watched development.',
 'Logistics', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sea-incense.png',
 134.60, 128.00, 5.16),

('PWR', 'Lighthouse Power Grid', 'Emma Faraday', 'Chief Engineer',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png',
 'Ampharos-powered Ether lightning stations across Johto. Emma Faraday''s team of electric-type specialists keeps the grid running through even the worst Ether storms.',
 'Energy', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png',
 231.00, 224.00, 3.13),

('CELD', 'Celadon Realty Group', 'Sakura Midori', 'Lead Developer',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rage-candy-bar.png',
 'The force behind Celadon''s urban expansion. Sakura Midori transforms Ether-zoned land into residential and commercial hubs. The new Silph Tower annex is her crown jewel.',
 'Real Estate', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rage-candy-bar.png',
 178.40, 175.30, 1.77),

('MAUV', 'Mauville Holdings', 'Hector Watts', 'CEO',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mach-bike.png',
 'A sprawling complex of retail, entertainment, and Ether tech startups. Hector Watts created Mauville City''s economic boom and now exports the model to other regions.',
 'Conglomerate', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mach-bike.png',
 293.50, 291.00, 0.86),

('SSAN', 'S.S. Anne Cruises', 'Captain Sterling', 'Captain',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sail-fossil.png',
 'Luxury Ether-powered cruises between Kanto, Johto, and beyond. Captain Sterling is a former League Champion who traded battles for the high seas.',
 'Hospitality', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sail-fossil.png',
 177.80, 180.00, -1.22),

('FRON', 'Battle Frontier Corp.', 'Scott Brison', 'Director',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/expert-belt.png',
 'Hoenn''s premier battle entertainment franchise. Scott Brison built the Frontier from a single arena into a multi-regional sports empire. Now expanding into Johto.',
 'Entertainment', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/expert-belt.png',
 189.30, 192.40, -1.61),

('DRGN', 'Dragon''s Den Ltd.', 'Claire Sasaki', 'Master Trainer',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-scale.png',
 'Blackthorn City''s ancient dragon-type sanctuary. Claire Sasaki, the youngest Gym Leader in Johto, runs the company as a premium breeding and training consultancy.',
 'Training', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-scale.png',
 310.75, 305.00, 1.89),

('SAF', 'Safari Zone Corp.', 'Warden Smith', 'Park Warden',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/safari-ball.png',
 'The original Ether conservation zone. Warden Smith pioneered the concept of controlled Ether habitats. Now operates safari parks in three regions with a fourth planned in Johto.',
 'Tourism', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/safari-ball.png',
 143.20, 146.80, -2.45),

('BERRY', 'Berry Fields Co-op', 'Anita Groves', 'Master Grower',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rawst-berry.png',
 'Collective of Ether-enriched berry farms. Master Grower Anita Groves developed the cross-pollination technique that doubled yield per acre across the JTO-30.',
 'Agriculture', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rawst-berry.png',
 101.50, 99.20, 2.32),

('DAYC', 'Johto Daycare Centers', 'Hana & Takeshi Yamada', 'Founders',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/soothe-bell.png',
 'A network of licensed Ether daycare facilities. Hana and Takeshi have raised more Champion-level Pokémon than any school in the world. Their owners are famously hands-on.',
 'Services', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/soothe-bell.png',
 78.40, 76.10, 3.02),

('FAN', 'Pokémon Fan Club Inc.', 'Mr. Happy', 'Chairman',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/red-scarf.png',
 'The world''s largest community organization for Ether enthusiasts. Chairman Happy turned a fan newsletter into a media conglomerate with merchandise, events, and the prestigious Fan Club Awards.',
 'Media', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/red-scarf.png',
 56.80, 58.40, -2.74),

('TUTR', 'Move Tutor Academy', 'Grand Master Ling', 'Head Tutor',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/teach-tv.png',
 'The world authority on advanced combat techniques. Grand Master Ling''s academy certifies tutors across four regions. Their move patents are licensed by every major battle circuit.',
 'Education', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/teach-tv.png',
 136.50, 133.20, 2.48),

('RATE', 'Name Rater & Identity Corp.', 'Mr. Shinoda', 'Chief Rater',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/clear-bell.png',
 'Official Ether identity registration and nicknaming authority. Mr. Shinoda has personally rated over one million names. His rulings determine the legality of competitive nicknames.',
 'Services', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/clear-bell.png',
 44.30, 45.10, -1.77),

('TRCK', 'Trick House Amusements', 'Houdin Mago', 'Master of Illusions',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/puzzle-scarf.png',
 'Puzzle design and interactive entertainment company. Houdin Mago''s trick rooms are featured in theme parks worldwide. The annual Golden Puzzle award draws top designers.',
 'Entertainment', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/puzzle-scarf.png',
 95.60, 98.10, -2.55),

('WEATH', 'Weather Institute Corp.', 'Dr. Stormfield', 'Head Meteorologist',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/damp-rock.png',
 'The authority on Ether weather forecasting. Dr. Stormfield''s team of Castform specialists can predict Ether storms with 93% accuracy — vital for the energy and agriculture sectors.',
 'Technology', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/damp-rock.png',
 187.90, 183.50, 2.40),

('GCOIN', 'Game Corner Corp.', 'Lucky Luciano', 'Casino Director',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coin.png',
 'Goldenrod City''s iconic entertainment destination. Game Corner generates Ether-based poker and slot machines. Lucky Luciano is a former Rocket executive who went legitimate.',
 'Entertainment', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coin.png',
 310.75, 305.00, 1.89),

('JUBI', 'Jubilife Media Group', 'Rhonda Newsom', 'Executive Producer',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/old-rod.png',
 'Sinnoh''s premier broadcast network, now the largest independent media outlet in Johto. Rhonda Newsom built the Jubilife TV brand from a local station to a regional empire.',
 'Media', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/old-rod.png',
 167.20, 164.00, 1.95),

('LUMI', 'Lumiose Press', 'Alexandre Beau', 'Editor-in-Chief',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blue-scarf.png',
 'The most respected financial newspaper in the Ether world. Every market-moving story breaks here. Alexandre Beau has been the editor for 30 years and owns a controlling share.',
 'Media', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blue-scarf.png',
 212.30, 215.00, -1.26),

('POTWN', 'Po Town Redevelopment', 'Sheriff Ames', 'Town Council Lead',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blackglasses.png',
 'An ambitious urban renewal project in an abandoned Alolan town. Sheriff Ames is converting former Team Skull territory into affordable Ether housing. A risky but well-observed social experiment.',
 'Real Estate', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blackglasses.png',
 38.90, 41.20, -5.58),

('AQUA', 'Deep Sea Recovery Ltd.', 'Captain Marina', 'Marine Director',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png',
 'Salvage operations in the treacherous Seafloor Cavern. Captain Marina''s team of divers and water-type specialists recover lost Ether artifacts from ancient underwater ruins.',
 'Extraction', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png',
 123.00, 127.40, -3.45),

('CHAT', 'Battle Chateau Estates', 'Marquis Octavian', 'Chateau Lord',
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-claw.png',
 'Kalos''s most prestigious battle venue and social club. Marquis Octavian hosts invitation-only tournaments for the ultra-wealthy. A gatecrasher could double their account overnight.',
 'Hospitality', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-claw.png',
 281.60, 278.40, 1.15);

-- Generate 48h price history for each stock
DO $$
DECLARE s RECORD; i INTEGER; bp NUMERIC; vl NUMERIC;
BEGIN
  FOR s IN SELECT id, current_price FROM public.stocks LOOP
    vl := s.current_price * 0.015; bp := s.current_price;
    FOR i IN 0..95 LOOP
      bp := bp + (random() - 0.48) * vl;
      bp := GREATEST(bp, s.current_price * 0.45);
      INSERT INTO public.stock_history (stock_id, price, recorded_at)
      VALUES (s.id, ROUND(bp::numeric, 2), now() - ((96 - i) * interval '30 minutes'));
    END LOOP;
  END LOOP;
END $$;

INSERT INTO public.news_events (title, description, stocks_affected, sentiment, published_at) VALUES
('Ether Storm Disrupts Mt. Moon Operations — Production Halved',
 'A sudden Ether fluctuation deep within Mt. Moon has forced temporary evacuation. Mt. Moon Mining Co. stock down 3% pre-market. Macro Cosmos energy futures are volatile.',
 '[{"ticker":"MTMN","impact":"negative"},{"ticker":"MACR","impact":"negative"}]',
 'negative', now() - interval '1 hour'),

('Silph Co. Announces Breakthrough in Dream Ball Technology',
 'Gregory Silph unveiled a new Poké Ball variant that can contain Ether storms. Analysts predict a 15% upside if mass production succeeds.',
 '[{"ticker":"SLPH","impact":"positive"},{"ticker":"BALL","impact":"positive"}]',
 'positive', now() - interval '3 hours'),

('Cianwood Pharma Gets FDA Approval for Ether-Infused Antidote',
 'Dr. Elena Flores''s new formula shows 99% efficacy in treating Ether poisoning. Cianwood Pharmaceuticals limited to 5% daily gain ceiling.',
 '[{"ticker":"CURE","impact":"positive"},{"ticker":"AETH","impact":"positive"}]',
 'positive', now() - interval '5 hours'),

('Dragon''s Den Breeding Program Yields Rare Evolutionary Line',
 'Claire Sasaki''s latest breeding milestone has produced a previously undocumented evolutionary sequence. Dragon-themed stocks rally across the board.',
 '[{"ticker":"DRGN","impact":"positive"},{"ticker":"FRON","impact":"positive"}]',
 'positive', now() - interval '8 hours'),

('Macro Cosmos Chairman Faces Regulatory Inquiry',
 'Rose M. has been called to testify before the Johto Ether Commission regarding undisclosed energy trading. Macro Cosmos stock declines sharply.',
 '[{"ticker":"MACR","impact":"negative"},{"ticker":"PWR","impact":"positive"}]',
 'negative', now() - interval '12 hours'),

('Game Corner Corp Expands to Celadon — New License Approved',
 'Lucky Luciano has secured the limited gaming license for Kanto''s Celadon district. GCOIN shareholders celebrate expansion into a new region.',
 '[{"ticker":"GCOIN","impact":"positive"},{"ticker":"CELD","impact":"positive"}]',
 'positive', now() - interval '18 hours'),

('Weather Institute Forecast: Ether Storm Season Peaking',
 'Dr. Stormfield warns of increased Ether volatility over the next six weeks. Agriculture and energy sectors brace for impact.',
 '[{"ticker":"WEATH","impact":"positive"},{"ticker":"PWR","impact":"positive"},{"ticker":"BERRY","impact":"negative"},{"ticker":"MOMO","impact":"negative"}]',
 'neutral', now() - interval '1 day'),

('Lumiose Press Investigation: Inside the Ether Black Market',
 'Alexandre Beau''s investigative series reveals a shadow economy trading illegal Ether artifacts. Aether Foundation stocks stable, but industry-wide regulations expected.',
 '[{"ticker":"LUMI","impact":"positive"},{"ticker":"AETH","impact":"neutral"},{"ticker":"SLPH","impact":"neutral"}]',
 'neutral', now() - interval '2 days');

-- EGP Pro - Velas japonesas + Órdenes pendientes

-- 1. Historial OHLC (Open, High, Low, Close)
CREATE TABLE IF NOT EXISTS public.historial_ohlc (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  apertura   NUMERIC NOT NULL,
  maximo     NUMERIC NOT NULL,
  minimo     NUMERIC NOT NULL,
  cierre     NUMERIC NOT NULL,
  volumen    BIGINT NOT NULL DEFAULT 0,
  intervalo  TEXT NOT NULL DEFAULT '30m',
  registrado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ohlc_empresa ON public.historial_ohlc(empresa_id, registrado_en);

-- 2. Órdenes pendientes (SL/TP/Límite)
CREATE TABLE IF NOT EXISTS public.ordenes_pendientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL,
  empresa_id      UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_orden      TEXT NOT NULL, -- COMPRA_LIMITE, VENTA_LIMITE, STOP_LOSS, TAKE_PROFIT
  cantidad        INTEGER NOT NULL,
  precio_objetivo NUMERIC NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'ACTIVA', -- ACTIVA, EJECUTADA, CANCELADA
  creada_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ejecutada_en    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario ON public.ordenes_pendientes(usuario_id, estado);

ALTER TABLE public.historial_ohlc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lectura_publica" ON public.historial_ohlc FOR SELECT USING (true);
ALTER TABLE public.ordenes_pendientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todo_usuario" ON public.ordenes_pendientes FOR ALL USING (true);

-- Generar datos OHLC mock para cada empresa (48 velas de 30 min)
DO $$
DECLARE c RECORD; i INTEGER; ap NUMERIC; hi NUMERIC; lo NUMERIC; cl NUMERIC;
BEGIN
  FOR c IN SELECT id, precio_actual FROM public.empresas LOOP
    ap := c.precio_actual;
    FOR i IN 0..95 LOOP
      hi := ap + random() * ap * 0.025;
      lo := ap - random() * ap * 0.025;
      cl := lo + random() * (hi - lo);
      IF i = 0 THEN ap := c.precio_actual; ELSE ap := cl + (random() - 0.48) * c.precio_actual * 0.015; END IF;
      ap := GREATEST(ap, c.precio_actual * 0.3);
      INSERT INTO public.historial_ohlc (empresa_id, apertura, maximo, minimo, cierre, volumen, registrado_en)
      VALUES (c.id, ROUND(ap::numeric,2), ROUND(hi::numeric,2), ROUND(lo::numeric,2), ROUND(cl::numeric,2),
              floor(random()*9000+1000)::bigint, now() - ((96-i)*interval '30 minutes'));
    END LOOP;
  END LOOP;
END $$;

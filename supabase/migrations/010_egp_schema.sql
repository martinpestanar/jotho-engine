-- EGP - Exchange Global de Pokémon - Schema
-- TODO: Eliminar tablas anteriores, crear en español

DROP TABLE IF EXISTS public.historial_precios CASCADE;
DROP TABLE IF EXISTS public.historial_transacciones CASCADE;
DROP TABLE IF EXISTS public.portafolio_usuario CASCADE;
DROP TABLE IF EXISTS public.noticias_mercado CASCADE;
DROP TABLE IF EXISTS public.empresas CASCADE;

CREATE TABLE public.empresas (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker                  TEXT NOT NULL UNIQUE,
  nombre                  TEXT NOT NULL,
  region                  TEXT NOT NULL DEFAULT 'Johto',
  sector                  TEXT NOT NULL,
  ceo_nombre              TEXT NOT NULL,
  ceo_sprite              TEXT NOT NULL,
  descripcion             TEXT NOT NULL,
  precio_base             NUMERIC NOT NULL DEFAULT 100,
  precio_actual           NUMERIC NOT NULL DEFAULT 100,
  precio_cierre           NUMERIC NOT NULL DEFAULT 100,
  variacion_24h           NUMERIC NOT NULL DEFAULT 0,
  capitalizacion_mercado  BIGINT NOT NULL DEFAULT 0,
  activa                  BOOLEAN NOT NULL DEFAULT true,
  creado_en               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.historial_precios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  precio       NUMERIC NOT NULL,
  registrado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hprecios_empresa ON public.historial_precios(empresa_id, registrado_en);

CREATE TABLE public.noticias_mercado (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo            TEXT NOT NULL,
  descripcion       TEXT DEFAULT '',
  ticker_afectado   TEXT NOT NULL,
  factor_impacto    NUMERIC NOT NULL DEFAULT 1.0,
  sentimiento       TEXT DEFAULT 'neutral',
  publicada_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_noticias_fecha ON public.noticias_mercado(publicada_en DESC);

CREATE TABLE public.portafolio_usuario (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID NOT NULL,
  empresa_id     UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cantidad       INTEGER NOT NULL DEFAULT 0,
  precio_promedio NUMERIC NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, empresa_id)
);

CREATE TABLE public.historial_transacciones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID NOT NULL,
  empresa_id        UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo              TEXT NOT NULL, -- 'COMPRA' / 'VENTA'
  cantidad          INTEGER NOT NULL,
  precio_ejecucion  NUMERIC NOT NULL,
  comision_pagada   NUMERIC NOT NULL,
  total_neto        NUMERIC NOT NULL,
  creada_en         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transacciones_usuario ON public.historial_transacciones(usuario_id, creada_en DESC);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lectura_publica" ON public.empresas FOR SELECT USING (true);
ALTER TABLE public.historial_precios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lectura_publica" ON public.historial_precios FOR SELECT USING (true);
ALTER TABLE public.noticias_mercado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lectura_publica" ON public.noticias_mercado FOR SELECT USING (true);
ALTER TABLE public.portafolio_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todo_usuario" ON public.portafolio_usuario FOR ALL USING (true);
ALTER TABLE public.historial_transacciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todo_usuario" ON public.historial_transacciones FOR ALL USING (true);

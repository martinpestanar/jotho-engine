-- Migration: 013_oracle_challenges.sql
-- Description: Creates demon_streaks, oracle_challenges_master, and oracle_challenges tables for the Oracle dashboard and challenges cycle.

-- 1. Create demon_streaks table to hold habits or vice control streaks
CREATE TABLE IF NOT EXISTS public.demon_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    demon_type TEXT NOT NULL CHECK (demon_type IN ('pmo', 'lol')),
    streak_days INTEGER DEFAULT 0,
    last_broken_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_demon UNIQUE (user_id, demon_type)
);

-- 2. Create oracle_challenges_master table to store the 12 challenges template
CREATE TABLE IF NOT EXISTS public.oracle_challenges_master (
    id INT PRIMARY KEY, -- 1 to 12
    title TEXT NOT NULL,
    duration TEXT NOT NULL,
    level TEXT NOT NULL,
    stack TEXT NOT NULL,
    what_to_build TEXT,
    problem_solved TEXT,
    markdown_content TEXT, -- Store full rich markdown description
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create oracle_challenges table to track active/completed user attempts
CREATE TABLE IF NOT EXISTS public.oracle_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    idea_index INTEGER REFERENCES public.oracle_challenges_master(id),
    due_at TIMESTAMPTZ,
    n8n_completed BOOLEAN DEFAULT false,
    recording_completed BOOLEAN DEFAULT false,
    youtube_completed BOOLEAN DEFAULT false,
    tiktok_completed BOOLEAN DEFAULT false,
    linkedin_completed BOOLEAN DEFAULT false,
    github_completed BOOLEAN DEFAULT false,
    social_completed BOOLEAN DEFAULT false,
    github_url TEXT DEFAULT '',
    video_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.demon_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_challenges_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_challenges ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- demon_streaks
CREATE POLICY "Users can manage their own streaks" ON public.demon_streaks
    FOR ALL USING (auth.uid() = user_id);

-- oracle_challenges_master (Readable by everyone, writable only by system/admins)
CREATE POLICY "Anyone can view master challenges" ON public.oracle_challenges_master
    FOR SELECT USING (true);

-- oracle_challenges
CREATE POLICY "Users can manage their own active challenges" ON public.oracle_challenges
    FOR ALL USING (auth.uid() = user_id);

-- 6. Seed all 12 challenge templates into oracle_challenges_master
INSERT INTO public.oracle_challenges_master (id, title, duration, level, stack, what_to_build, problem_solved, markdown_content) VALUES
(
    1,
    'Sistema de Recordatorios Inteligentes para Grooming & Petshop',
    'Lunes y Martes (2 días)',
    'Intermedio',
    'n8n + Supabase + WhatsApp (Twilio o Evolution API) + Claude/OpenAI',
    'Un sistema automatizado que le recuerda a los dueños de mascotas que su perro o gato tiene cita de baño/corte próxima, y si no confirman, les manda un mensaje personalizado con IA que suena humano, no robótico. Todo conectado a una base de datos real en Supabase.',
    'Los grooming tienen entre 20-40% de inasistencia sin aviso. El dueño del negocio pierde tiempo y dinero. Un recordatorio humano reduce drásticamente las inasistencias.',
    '# 🐾 Reto #1 — Sistema de Recordatorios Inteligentes para Grooming & Petshop\n\n**Duración:** Lunes y Martes (2 días)\n**Nivel:** Intermedio\n**Stack:** n8n + Supabase + WhatsApp (Twilio o Evolution API) + Claude/OpenAI\n\n---\n\n## ¿Qué vas a construir?\n\nUn sistema automatizado que le recuerda a los dueños de mascotas que su perro o gato tiene cita de baño/corte próxima, y si no confirman, les manda un mensaje personalizado con IA que suena humano, no robótico. Todo conectado a una base de datos real en Supabase.\n\n---\n\n## El problema real que resuelve\n\nLos grooming tienen entre 20-40% de inasistencia sin aviso. El dueño del negocio pierde tiempo y dinero, pero un recordatorio demasiado frío o robótico es ignorado. La IA añade empatía y personalización para mejorar la confirmación.'
),
(
    2,
    'Menú Inteligente con QR para Restaurante Vegano',
    'Lunes y Martes (2 días)',
    'Intermedio',
    'n8n + Supabase + Next.js (vibe coding) + OpenAI',
    'Una mini web app con código QR que el restaurante pone en la mesa. El cliente escanea, ve el menú del día (actualizado desde Supabase), y puede preguntarle a un chat IA sobre ingredientes, alérgenos o maridajes. El dueño actualiza el menú desde un formulario simple, sin tocar código.',
    'Los restaurantes veganos tienen menús que rotan mucho. Imprimir cartas cuesta dinero y tiempo. Un menú digital con IA integrada eleva la experiencia y reduce preguntas repetitivas al mesero.',
    '# 🚀 Reto #2 — Menú Inteligente con QR para Restaurante Vegano\n\n**Duración:** Lunes y Martes (2 días)\n**Nivel:** Intermedio\n**Stack:** n8n + Supabase + Next.js (vibe coding) + OpenAI\n\n---\n\n## ¿Qué vas a construir?\n\nUna mini web app con código QR que el restaurante pone en la mesa. El cliente escanea, ve el menú del día (actualizado desde Supabase), y puede preguntarle a un chat IA sobre ingredientes, alérgenos o maridajes. El dueño actualiza el menú desde un formulario simple, sin tocar código.\n\n---\n\n## El problema real que resuelve\n\nLos restaurantes veganos tienen menús que rotan mucho. Imprimir cartas cuesta dinero y tiempo. Un menú digital con IA integrada eleva la experiencia y reduce preguntas repetitivas al mesero.\n\n---\n\n## Conceptos clave\n\n- **RAG simple:** La IA no "sabe" el menú de memoria. Le pasas el menú como contexto en el prompt. Eso es Retrieval Augmented Generation en su forma más básica.'
),
(
    3,
    'Agente de IA para Agendamiento de Citas en Salón de Belleza',
    'Lunes y Martes (2 días)',
    'Avanzado',
    'n8n + Supabase + WhatsApp + OpenAI (GPT-4o-mini)',
    'Un chatbot de WhatsApp que permite a las clientas agendar citas consultando los horarios disponibles en Supabase. Si el horario está libre, la IA lo bloquea en la base de datos y le envía una tarjeta de confirmación estética.',
    'Los salones de belleza pierden hasta un 30% de citas fuera del horario comercial porque nadie responde a los mensajes. Un agente 24/7 autónomo asegura que ningún cliente se vaya a la competencia.',
    '# 💇‍♀️ Reto #3 — Agente de IA para Agendamiento de Citas en Salón de Belleza\n\n**Duración:** Lunes y Martes (2 días)\n**Nivel:** Avanzado\n**Stack:** n8n + Supabase + WhatsApp + OpenAI (GPT-4o-mini)\n\n---\n\n## ¿Qué vas a construir?\n\nUn chatbot de WhatsApp que permite a las clientas agendar citas consultando los horarios disponibles en Supabase. Si el horario está libre, la IA lo bloquea en la base de datos y le envía una tarjeta de confirmación estética.\n\n---\n\n## El problema real que resuelve\n\nLos salones de belleza pierden hasta un 30% de citas fuera del horario comercial porque nadie responde a los mensajes. Un agente 24/7 autónomo asegura que ningún cliente se vaya a la competencia.'
),
(
    4,
    'Sistema de Calificación y Reputación Google Maps en Piloto Automático',
    'Lunes y Martes (2 días)',
    'Intermedio',
    'n8n + WhatsApp + Supabase + Google Places API',
    'Un flujo de automatización que detecta cuando un cliente completa una compra. Le envía un WhatsApp preguntando por su experiencia. Si califica con 4 o 5 estrellas, le manda el link directo a Google Maps para dejar reseña. Si califica con menos, canaliza el reclamo a un chat humano de soporte.',
    'Las reseñas de Google Maps son el factor número 1 de decisión para negocios locales. Este sistema filtra opiniones negativas en privado y multiplica las reseñas positivas en público de forma automática.',
    '# 🌟 Reto #4 — Sistema de Calificación y Reputación Google Maps en Piloto Automático\n\n**Duración:** Lunes y Martes (2 días)\n**Nivel:** Intermedio\n**Stack:** n8n + WhatsApp + Supabase + Google Places API\n\n---\n\n## ¿Qué vas a construir?\n\nUn flujo de automatización que detecta cuando un cliente completa una compra. Le envía un WhatsApp preguntando por su experiencia. Si califica con 4 o 5 estrellas, le manda el link directo a Google Maps para dejar reseña. Si califica con menos, canaliza el reclamo a un chat humano de soporte.\n\n---\n\n## El problema real que resuelve\n\nLas reseñas de Google Maps son el factor número 1 de decisión para negocios locales. Este sistema filtra opiniones negativas en privado y multiplica las reseñas positivas en público de forma automática.'
),
(
    5,
    'Clasificador e Inyector de Leads Inmobiliarios por WhatsApp',
    'Lunes y Martes (2 días)',
    'Intermedio',
    'n8n + OpenAI + Supabase + Evolution API',
    'Un agente conversacional que recibe leads de portales inmobiliarios o campañas de anuncios. El agente conversa por WhatsApp para calificar presupuesto, zona de interés, y urgencia. Si cumple el perfil, lo inserta calificado en Supabase y notifica al broker asignado por WhatsApp con un resumen premium.',
    'Los agentes inmobiliarios tardan horas en calificar leads fríos. Automatizar el primer contacto incrementa el ratio de conversión en un 400% y filtra a los curiosos sin perder tiempo humano.',
    '# 🏠 Reto #5 — Clasificador e Inyector de Leads Inmobiliarios por WhatsApp\n\n**Duración:** Lunes y Martes (2 días)\n**Nivel:** Intermedio\n**Stack:** n8n + OpenAI + Supabase + Evolution API\n\n---\n\n## ¿Qué vas a construir?\n\nUn agente conversacional que recibe leads de portales inmobiliarios o campañas de anuncios. El agente conversa por WhatsApp para calificar presupuesto, zona de interés, y urgencia. Si cumple el perfil, lo inserta calificado en Supabase y notifica al broker asignado por WhatsApp con un resumen premium.\n\n---\n\n## El problema real que resuelve\n\nLos agentes inmobiliarios tardan horas en calificar leads fríos. Automatizar el primer contacto incrementa el ratio de conversión en un 400% y filtra a los curiosos sin perder tiempo humano.'
),
(
    6,
    'Asistente de Ventas conversacional para E-commerce con RAG',
    'Miércoles y Jueves (2 días)',
    'Avanzado',
    'n8n + Supabase Vector DB + WhatsApp + Claude 3.5 Sonnet',
    'Un vendedor experto en WhatsApp conectado al catálogo de productos de una tienda online. Utiliza búsqueda vectorial (RAG) en Supabase para buscar los productos exactos que cumplen con lo que pide el usuario, calcula stock, y ofrece links de pago automáticos.',
    'Los compradores de e-commerce abandonan los carritos por dudas sobre talles, stock o envíos. Un vendedor conversacional con IA resuelve estas dudas al instante y cierra la venta directamente en el chat.',
    '# 🛍️ Reto #6 — Asistente de Ventas conversacional para E-commerce con RAG\n\n**Duración:** Miércoles y Jueves (2 días)\n**Nivel:** Avanzado\n**Stack:** n8n + Supabase Vector DB + WhatsApp + Claude 3.5 Sonnet\n\n---\n\n## ¿Qué vas a construir?\n\nUn vendedor experto en WhatsApp conectado al catálogo de productos de una tienda online. Utiliza búsqueda vectorial (RAG) en Supabase para buscar los productos exactos que cumplen con lo que pide el usuario, calcula stock, y ofrece links de pago automáticos.\n\n---\n\n## El problema real que resuelve\n\nLos compradores de e-commerce abandonan los carritos por dudas sobre talles, stock o envíos. Un vendedor conversacional con IA resuelve estas dudas al instante y cierra la venta directamente en el chat.'
),
(
    7,
    'Recuperador de Carrito Abandonado Conversacional por WhatsApp',
    'Miércoles y Jueves (2 días)',
    'Intermedio',
    'n8n + Supabase + Shopify/WooCommerce + WhatsApp',
    'Un flujo que se dispara cuando un usuario abandona el proceso de pago. En lugar de mandar un correo frío, la IA le manda un mensaje empático por WhatsApp preguntándole si tuvo algún problema con el pago o si necesita ayuda técnica, ofreciendo un cupón dinámico guardado en Supabase.',
    'El correo electrónico de carrito abandonado tiene tasas de apertura bajísimas (menos del 20%). WhatsApp tiene más del 98%, multiplicando por 5 el retorno de carritos recuperados.',
    '# 🛒 Reto #7 — Recuperador de Carrito Abandonado Conversacional por WhatsApp\n\n**Duración:** Miércoles y Jueves (2 días)\n**Nivel:** Intermedio\n**Stack:** n8n + Supabase + Shopify/WooCommerce + WhatsApp\n\n---\n\n## ¿Qué vas a construir?\n\nUn flujo que se dispara cuando un usuario abandona el proceso de pago. En lugar de mandar un correo frío, la IA le manda un mensaje empático por WhatsApp preguntándole si tuvo algún problema con el pago o si necesita ayuda técnica, ofreciendo un cupón dinámico guardado en Supabase.\n\n---\n\n## El problema real que resuelve\n\nEl correo electrónico de carrito abandonado tiene tasas de apertura bajísimas (menos del 20%). WhatsApp tiene más del 98%, multiplicando por 5 el retorno de carritos recuperados.'
),
(
    8,
    'Generador de Facturas y Firma de Contratos Automatizado',
    'Miércoles y Jueves (2 días)',
    'Avanzado',
    'n8n + Supabase + DocuSign / SignWell API + Stripe',
    'Al recibir una confirmación de pago por Stripe, el flujo genera un PDF de contrato personalizado usando datos de Supabase, lo envía para firma digital, y una vez firmado, emite la factura formal y la envía por WhatsApp al cliente de manera autónoma.',
    'La burocracia administrativa consume el 25% del tiempo de una agencia B2B. Este sistema automatiza la legalidad y facturación al instante, ofreciendo una experiencia cliente impecable.',
    '# 📄 Reto #8 — Generador de Facturas y Firma de Contratos Automatizado\n\n**Duración:** Miércoles y Jueves (2 días)\n**Nivel:** Avanzado\n**Stack:** n8n + Supabase + DocuSign / SignWell API + Stripe\n\n---\n\n## ¿Qué vas a construir?\n\nAl recibir una confirmación de pago por Stripe, el flujo genera un PDF de contrato personalizado usando datos de Supabase, lo envía para firma digital, y una vez firmado, emite la factura formal y la envía por WhatsApp al cliente de manera autónoma.\n\n---\n\n## El problema real que resuelve\n\nLa burocracia administrativa consume el 25% del tiempo de una agencia B2B. Este sistema automatiza la legalidad y facturación al instante, ofreciendo una experiencia cliente impecable.'
),
(
    9,
    'Soporte Técnico B2B de Primer Nivel con Base de Conocimiento',
    'Viernes y Sábado (2 días)',
    'Avanzado',
    'n8n + Supabase Vector DB + Slack / Discord + OpenAI',
    'Un bot de soporte técnico corporativo que responde de manera precisa a preguntas de usuarios basándose en la documentación interna de la empresa guardada en Supabase. Si la IA no sabe la respuesta con un 85% de confianza, genera un ticket interno en Jira y avisa al equipo de soporte humano.',
    'El 70% de los tickets de soporte técnico son repetitivos. Automatizar el primer nivel de atención libera de carga operativa al equipo técnico y reduce el tiempo de resolución a cero.',
    '# 🛠️ Reto #9 — Soporte Técnico B2B de Primer Nivel con Base de Conocimiento\n\n**Duración:** Viernes y Sábado (2 días)\n**Nivel:** Avanzado\n**Stack:** n8n + Supabase Vector DB + Slack / Discord + OpenAI\n\n---\n\n## ¿Qué vas a construir?\n\nUn bot de soporte técnico corporativo que responde de manera precisa a preguntas de usuarios basándose en la documentación interna de la empresa guardada en Supabase. Si la IA no sabe la respuesta con un 85% de confianza, genera un ticket interno en Jira y avisa al equipo de soporte humano.\n\n---\n\n## El problema real que resuelve\n\nEl 70% de los tickets de soporte técnico son repetitivos. Automatizar el primer nivel de atención libera de carga operativa al equipo técnico y reduce el tiempo de resolución a cero.'
),
(
    10,
    'Dashboard de Métricas y Alertas de Flujo de Caja por WhatsApp',
    'Viernes y Sábado (2 días)',
    'Intermedio',
    'n8n + Supabase + Stripe API + WhatsApp',
    'Un sistema diario que consolida los ingresos, suscripciones activas y gastos en Supabase, genera un reporte ejecutivo bellamente formateado y lo envía al fundador de la empresa todas las mañanas a las 8:00 AM con alertas de salud financiera inteligente.',
    'Los CEOs no tienen tiempo de entrar a múltiples plataformas a revisar números. Tener el flujo de caja neto consolidado en un solo WhatsApp diario permite tomar decisiones rápidas y estratégicas.',
    '# 📊 Reto #10 — Dashboard de Métricas y Alertas de Flujo de Caja por WhatsApp\n\n**Duración:** Viernes y Sábado (2 días)\n**Nivel:** Intermedio\n**Stack:** n8n + Supabase + Stripe API + WhatsApp\n\n---\n\n## ¿Qué vas a construir?\n\nUn sistema diario que consolida los ingresos, suscripciones activas y gastos en Supabase, genera un reporte ejecutivo bellamente formateado y lo envía al fundador de la empresa todas las mañanas a las 8:00 AM con alertas de salud financiera inteligente.\n\n---\n\n## El problema real que resuelve\n\nLos CEOs no tienen tiempo de entrar a múltiples plataformas a revisar números. Tener el flujo de caja neto consolidado en un solo WhatsApp diario permite tomar decisiones rápidas y estratégicas.'
),
(
    11,
    'Automatización de Onboarding de Clientes con Contratos Autónomos',
    'Viernes y Sábado (2 días)',
    'Intermedio',
    'n8n + Supabase + Notion + Email / WhatsApp',
    'Cuando un cliente firma el contrato, este flujo crea automáticamente su espacio de trabajo en Notion, le asigna sus accesos de Drive, le envía una bienvenida interactiva por WhatsApp y agenda una llamada estratégica de inicio en Google Calendar.',
    'El inicio de un servicio B2B suele ser caótico y manual. Un onboarding inmediato y estructorado aumenta la retención de clientes y proyecta un profesionalismo insuperable desde el primer minuto.',
    '# 🤝 Reto #11 — Automatización de Onboarding de Clientes con Contratos Autónomos\n\n**Duración:** Viernes y Sábado (2 días)\n**Nivel:** Intermedio\n**Stack:** n8n + Supabase + Notion + Email / WhatsApp\n\n---\n\n## ¿Qué vas a construir?\n\nCuando un cliente firma el contrato, este flujo crea automáticamente su espacio de trabajo en Notion, le asigna sus accesos de Drive, le envía una bienvenida interactiva por WhatsApp y agenda una llamada estratégica de inicio en Google Calendar.\n\n---\n\n## El problema real que resuelve\n\nEl inicio de un servicio B2B suele ser caótico y manual. Un onboarding inmediato y estructurado aumenta la retención de clientes y proyecta un profesionalismo insuperable desde el primer minuto.'
),
(
    12,
    'Agente de IA de Atención y Nutrición de Leads B2B en LinkedIn',
    'Domingo (1 día)',
    'Avanzado',
    'n8n + Supabase + LinkedIn API + Claude 3.5 Sonnet',
    'Un flujo de prospección automatizada que monitorea publicaciones relevantes del sector en LinkedIn. Si detecta una oportunidad, analiza la empresa del lead usando IA, guarda la información en Supabase y redacta un primer mensaje introductorio personalizado e hiper-enfocado para que el vendedor solo tenga que darle a enviar.',
    'La prospección fría genérica ya no funciona. La personalización a escala mediante IA incrementa la tasa de respuesta en LinkedIn en un 300% sin consumir horas de investigación manual.',
    '# 💼 Reto #12 — Agente de IA de Atención y Nutrición de Leads B2B en LinkedIn\n\n**Duración:** Domingo (1 día)\n**Nivel:** Avanzado\n**Stack:** n8n + Supabase + LinkedIn API + Claude 3.5 Sonnet\n\n---\n\n## ¿Qué vas a construir?\n\nUn flujo de prospección automatizada que monitorea publicaciones relevantes del sector en LinkedIn. Si detecta una oportunidad, analiza la empresa del lead usando IA, guarda la información en Supabase y redacta un primer mensaje introductorio personalizado e hiper-enfocado para que el vendedor solo tenga que darle a enviar.\n\n---\n\n## El problema real que resuelve\n\nLa prospección fría genérica ya no funciona. La personalización a escala mediante IA incrementa la tasa de respuesta en LinkedIn en un 300% sin consumir horas de investigación manual.'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    duration = EXCLUDED.duration,
    level = EXCLUDED.level,
    stack = EXCLUDED.stack,
    what_to_build = EXCLUDED.what_to_build,
    problem_solved = EXCLUDED.problem_solved,
    markdown_content = EXCLUDED.markdown_content;


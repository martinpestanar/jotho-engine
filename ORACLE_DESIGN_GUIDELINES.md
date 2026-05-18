# 🛰️ Oracle War Room: Design & Logic Manifesto

Este documento es la **Regla de Oro** para cualquier modificación en el Oracle Center (`/oracle`). Antigravity debe consultar este archivo antes de realizar cualquier cambio visual o funcional en este módulo.

## 1. Filosofía Visual: Zen-Tech Brutalism
El diseño debe transmitir **orden absoluto, urgencia y tecnología de punta**. No es un dashboard de oficina; es una terminal de comando para un guerrero de la disciplina.

### Paleta de Colores
- **Fondo Primario (Dark):** `#0B0F1A` (Profundidad absoluta).
- **Acento Primario:** `cyan-500` (#22d3ee) - Representa tecnología y enfoque.
- **Acento Secundario:** `indigo-500` (#6366f1) - Representa sabiduría y el Oráculo.
- **Estado de Alerta:** `rose-500` (#f43f5e) - Reservado para procrastinación y White Out.
- **Supervivencia:** `emerald-500` (#10b881) - Reservado para finanzas y salud.
- **Superficies (Glassmorphism):** `bg-white/[0.03]` con `backdrop-blur-xl` y `border-white/5`.

## 2. Tipografía y Estilo
- **Headers:** Siempre `font-black` (900), `uppercase`, `italic` y `tracking-tighter`.
- **Labels:** `text-[10px]`, `font-black`, `uppercase`, `tracking-[0.2em]`.
- **Cuerpo:** `font-medium`, `text-slate-400` (en dark mode).
- **Impacto:** Uso de `leading-none` o `leading-[0.8]` para títulos masivos.

## 3. Componentes y Layout
- **Radios de Borde:** `rounded-3xl` (24px) para widgets pequeños, `rounded-[2.5rem]` o `rounded-[3rem]` para contenedores grandes.
- **Bordes:** Siempre `border-2`. En Dark Mode, usar opacidades bajas (`border-white/5`).
- **Sombras:** No usar sombras estándar. Usar "Glows" de colores (`shadow-cyan-500/20`) o sombras masivas muy difusas en Light Mode.
- **Grid:** Layout modular basado en columnas de 12. Los widgets deben ser expansivos.

## 4. Animaciones (Framer Motion)
- **Carga de Widgets:** Entradas con `y: 20` y `opacity: 0`.
- **Hover Effects:** Escala sutil `scale: 1.02` y cambio de brillo en el borde.
- **Estados Activos:** Pulsaciones sutiles (`animate-pulse`) en elementos críticos como el "Radar" o el "Monolito".

## 5. Reglas de Contenido
- **Tono del Oráculo:** Directo, frío, a veces desafiante. Debe usar términos como "Protocolo", "Sincronización", "White Out" y "Ejecución".
- **Widgets Obligatorios:**
    - Radar de Supervivencia (Ventas/SaaS).
    - Monolito de Enfoque (Timer/Horario).
    - Eco del Oráculo (IA Insight).
    - Árbol de Habilidades (Progreso RPG).
    - El Vacío (Miedos/Procrastinación).

---
*Cualquier código que rompa estas reglas se considera un fallo de sistema. Mantén la disciplina visual.*

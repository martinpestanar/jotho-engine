# Design System — Pokémon Johto LifeSync (Nintendo Light Aesthetic)

## Philosophy
Clean, bright, Nintendo-inspired. White backgrounds, pastel textures, pop colors, ultra-rounded geometry. Think Pokémon HOME meets Switch OS.

## Color Palette

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Nintendo Red | `#E60012` | `nintendo-red` | Primary CTAs, badges |
| Joy-Con Cyan | `#00C3E3` | `joycon-cyan` | Links, accent borders |
| Pokémon Yellow | `#FFDE00` | `pk-yellow` | PKD, stars, highlights |
| Plant Green | `#00D68F` | `plant-green` | Success, checkmarks, progress fill |
| Psychic Purple | `#A855F7` | `psychic` | Oracle, mystical accents |
| Soft White | `#FFFFFF` | `white` | Cards, text bases |
| Page Background | `#F0F2F5` | `bg-[#F0F2F5]` | Main page bg |
| Card Background | `#FFFFFF` | `bg-white` | Card fill |
| Navy Text | `#1A1A2E` | `text-navy` | Body text |
| Slate Soft | `#94A3B8` | `text-slate-400` | Subtle labels |
| Coral | `#FF6B6B` | `coral` | Alerts, danger |
| Electric Blue | `#3B82F6` | `electric` | Links |

## Typography
- **Primary:** Poppins (Google Fonts) — geometric, rounded, modern
- **Mono:** Geist Mono / JetBrains Mono for numbers
- **Sizes:** Responsive, mobile-first

## Component Rules

### Buttons
- `rounded-full` — always pill-shaped
- Framer Motion: `whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}`
- Primary: `bg-nintendo-red text-white`
- Secondary (ghost): `bg-transparent border-2 border-nintendo-red/20 text-nintendo-red`
- Large CTAs: min-height 56px, shadow-lg

### Cards
- `rounded-3xl` `bg-white` `shadow-sm border border-slate-100`
- Framer Motion: `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`
- Spring transition: `type: "spring", stiffness: 160, damping: 20`

### Inputs
- `rounded-2xl` `bg-white` `border-2 border-slate-200`
- Focus: `ring-2 ring-joycon-cyan/40 border-joycon-cyan`
- Placeholder: `text-slate-300`

### Progress Bars
- Height: 12px, `rounded-full`
- Fill: gradient `plant-green → joycon-cyan`
- Track: `bg-slate-100`

## Typography Tokens
- Header: `text-navy font-bold`
- Body: `text-navy/80`
- Subtitle: `text-slate-400 text-sm`

## Animations
- Buttons: `type: "spring", stiffness: 200, damping: 18`
- Cards: `type: "spring", stiffness: 160, damping: 20`
- CTA pulse: `animate={{ scale: [1, 1.03, 1] }}`, 2s loop
- Page transitions: AnimatePresence mode="wait"

## Background Patterns
- Subtle grid texture on page bg
- Faint Poké Ball silhouette (opacity 2%) behind hero sections

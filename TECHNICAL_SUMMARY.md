# Technical Summary: Pokémon Johto LifeSync - Initial Setup

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4, shadcn/ui (base-nova theme) |
| State | Zustand 5 |
| Animations | Framer Motion |
| Emulator | EmulatorJS v4 via react-emulatorjs 2.2.6 (iframe-based) |
| Backend | Supabase JS client (v2) - configured, not yet wired |
| Package Install | npm with legacy-peer-deps (.npmrc) |

## EmulatorJS Integration

### The iframe constraint

EmulatorJS [requires an iframe](https://emulatorjs.org/docs/embed#react--single-page-apps) for React SPAs — it manipulates globals on `window` and would corrupt the DOM if rendered inline. The `react-emulatorjs` npm package handles this internally: it generates an iframe with `srcDoc` containing the EmulatorJS HTML template, then injects config globals (`EJS_player`, `EJS_core`, `EJS_gameUrl`, etc.) into the iframe's `window` once the document loads.

### SSR safety

The `EmulatorCanvas` component is marked `"use client"` — this is sufficient because:
1. The `"use client"` boundary prevents server-side rendering.
2. `react-emulatorjs` internally uses `srcDoc` on an `<iframe>`, which is only meaningful in the browser.
3. No `next/dynamic` wrapper was necessary — the client boundary alone eliminates hydration mismatches.

### ROM loading

ROMs are loaded via two paths:
- **File upload** — `URL.createObjectURL(file)` creates a blob URL fed directly to `EJS_gameUrl`.
- **Static files** — Drop a `.gba` file in `public/roms/` and set `romUrl="/roms/filename.gba"`.

### Core & data path

- **Core:** `gba` (mGBA via RetroArch WASM)
- **Data path:** `https://cdn.emulatorjs.org/stable/data/` (CDN-hosted emulator binaries — no local download needed)

### Peer dependency conflict

react-emulatorjs specifies `peerDependencies: { react: "^18.2.0" }` but Next.js 16 ships React 19. Resolved with `.npmrc` containing `legacy-peer-deps=true`. The package works correctly at runtime — the peer constraint is a publish-time artifact from 2 years ago.

## Folder Structure (Feature-Sliced Design)

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (metadata, fonts)
│   ├── page.tsx            # Main page: emulator + controls
│   └── globals.css         # Tailwind + shadcn theme
├── features/               # Feature modules
│   ├── emulator/
│   │   ├── components/
│   │   │   └── EmulatorCanvas.tsx  # EmulatorJS wrapper + HUD overlay
│   │   ├── model/
│   │   │   └── types.ts            # EmulatorConfig, EmulatorState
│   │   └── index.ts               # Barrel export
│   ├── game/
│   │   ├── model/
│   │   │   └── types.ts            # GameState, PKDTransaction, GamePhase
│   │   ├── store/
│   │   │   └── useGameStore.ts     # Zustand store (phase, PKD balance, events)
│   │   └── index.ts
│   ├── habits/              # Placeholder - future habit tracking
│   └── oracle/              # Placeholder - future AI oracle
├── shared/                  # Shared utilities
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts           # Supabase client (anon key, realtime)
│   │   └── ...
│   └── config/
│       └── constants.ts            # Emulator, game, and DB constants
├── entities/                # Domain entities
│   ├── player/types.ts             # Player
│   └── pokemon/types.ts            # Pokémon
├── components/ui/           # shadcn/ui components (auto-generated)
└── lib/utils.ts             # cn() utility
```

## Zustand Store (`useGameStore`)

Serves as the **bridge** between frontend and backend:

| Property/Method | Purpose |
|----------------|---------|
| `phase` | `idle → playing → paused → oracle_speaking` |
| `pkdBalance` | In-game currency earned from habits |
| `transactions` | Audit trail of PKD earning/spending |
| `activeEvents` | Oracle messages, weather, rewards |
| `setPhase()` | Emulator lifecycle control |
| `addPKD()` | Award currency (will connect to Supabase RPC) |
| `pushEvent()` | Inject game events |

## Supabase Client

Pre-configured in `src/shared/lib/supabase/client.ts`:
- Auth with `persistSession: true` + `autoRefreshToken: true`
- Realtime enabled (`eventsPerSecond: 10`)
- Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`

## Running the project

```bash
npm install --legacy-peer-deps  # already done
npm run dev                      # http://localhost:3000
```

Load a `.gba` ROM via the "Load ROM" button, and the emulator renders inline.

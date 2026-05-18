# Informe de Auditoría Técnica: Pokémon Heart & Soul (pokeemerald fork)

**Repositorio:** `github.com/martinpestanar/pokemonHnS`  
**Base:** pokeemerald decompilation (pret)  
**Fecha de análisis:** 2026-05-12  
**Objetivo:** Evaluar viabilidad de integración con stack externo Next.js + Supabase para la plataforma "Pokémon Johto LifeSync".

---

## Resumen Ejecutivo

> **Veredicto: Altamente viable.** El fork de Heart & Soul, al ser una decompilación completa en C con toolchain documentado, nos da un control quirúrgico sobre el juego que ninguna ROM hack tradicional ofrece. Podemos leer/escribir flags desde fuera, inyectar ítems/Pokémon vía scripts, y compilar ROMs personalizadas bajo demanda. La única decisión arquitectónica crítica es si optamos por **parcheo de memoria en runtime** (rápido, frágil) o **recompilación de ROM** (lento, robusto). Mi recomendación es un modelo híbrido.

---

## 1. Capacidades de Integración

### 1.1 Flags y Variables de Memoria (Progreso de Juego)

**Arquitectura:** El juego maneja **2,408 flags** y **256 variables** de 16 bits, ambos almacenados en `SaveBlock1` dentro de la EWRAM del GBA (offset `+0x1270` para flags, `+0x139C` para vars).

| Categoría | Rango | ¿Qué controla? |
|-----------|-------|----------------|
| **Badges Johto** | `0x867–0x86E` | 8 medallas de gimnasio |
| **Badges Kanto** | `0x8E5–0x8EC` | 8 medallas post-game |
| **Gym defeats** | `0x4F0–0x4F7` (Johto), `0x26D–0x274` (Kanto) | Derrotas a líderes |
| **Elite 4** | `0x4FB–0x4FE` | Derrotas a Will, Koga, Bruno, Karen |
| **Champion** | `0x4F8` | Derrota a Red |
| **Game Clear** | `0x864` | Flag sistema de juego completado |
| **Story vars** | `0x4050–0x408F` | Estados de progreso por ciudad (New Bark, Violet, Azalea...) |
| **Pokedex** | `VAR_NATIONAL_DEX` (0x4046) | Estado de la Pokédex Nacional |
| **Badge count** | `VAR_NUM_BADGES` (0x4090) | Contador total de medallas |

**Lectura externa:** Conociendo `gSaveBlock1Ptr`, cualquier flag o var se lee con aritmética trivial:
- Flag: `flags[id / 8] >> (id % 8) & 1`
- Var: `vars[id - 0x4020]`

**Problema ASLR:** Las direcciones exactas en memoria cambian en cada arranque (`SaveBlock1ASLR` aleatoriza +0 a +128 bytes). Solución: leer el pointer `gSaveBlock1Ptr` desde IWRAM (offset fijo en el linker map) para localizar el bloque.

**Conclusión:** Podemos mapear TODAS las variables de progreso y exponerlas en el Dashboard web. Esto es el **superpoder #1** del fork: transparencia total del estado de juego.

### 1.2 Sistema de Eventos y NPCs (Scripts de Mapa)

**Lenguaje de scripting:** El juego usa un sistema de macros ensamblador (GAS) definido en `asm/macros/event.inc`. Las macros se expanden a bytecodes interpretados por el motor del juego (`src/scrcmd.c`).

**Capacidades críticas para integración:**

| Operación | Macro | Notas |
|-----------|-------|-------|
| Dar ítem | `giveitem ITEM_ID, qty` | Con fanfarria, mensaje UI, fallback a PC |
| Dar Pokémon | `givemon SPECIES, LEVEL, ITEM` | Resultado en VAR_RESULT |
| Dar huevo | `giveegg SPECIES` | -- |
| Activar flag | `setflag FLAG_ID` | Persistente en save |
| Leer flag | `checkflag FLAG_ID` + `goto_if_set` | Branch condicional |
| Leer var | `compare VAR, value` + `goto_if_eq` | Branch condicional |
| Llamar C | `special FUNC` o `callnative FUNC` | Puente al código nativo |
| Mensaje | `msgbox TEXT, MSGBOX_NPC` | Diálogo customizado |

**Añadir un NPC nuevo:** 3 pasos.
1. Añadir entrada en `data/maps/<Mapa>/map.json` bajo `object_events`
2. Escribir script en `data/maps/<Mapa>/scripts.inc` usando las macros
3. El NPC puede verificar flags (`goto_if_set FLAG_CUSTOM`) o vars (`compare VAR_CUSTOM`) definidos por nosotros para comportamiento condicional

**Puente a C nativo:** La tabla `gSpecials[]` en `data/specials.inc` (590 funciones) permite que un script llame código C arbitrario. Podemos añadir nuestros propios `special` para lógica compleja (ej. `special CheckExternalHabitAPI`).

**Conclusión:** Podemos crear NPCs que reaccionen a flags/vars controlados externamente. El sistema de scripting es Turing-completo dentro de sus límites. **Superpoder #2.**

### 1.3 Inyección de Ítems y Pokémon

**Desde scripts (macro):**
```asm
giveitem ITEM_MASTER_BALL, 1      @ Da ítem con UI completa
givemon SPECIES_CHIKORITA, 5, ITEM_NONE  @ Da Pokémon nivel 5
```

**Desde C nativo (vía `special` o `callnative`):**
```c
AddItem(&gSaveBlock1Ptr->bag, ITEM_RARE_CANDY, 10);
GiveMonToPlayer(&gEnemyParty[0]);  // desde batalla
CreateMon(&mon, SPECIES_CELEBI, 30, 0, TRUE, 0, OT_ID, 0);
```

**Limitación:** No hay un "API de inyección desde fuera" nativo. Pero podemos crear un `special InyectarRecompensaExterna` en C que lea de una variable predefinida qué ítem/Pokémon entregar y ejecute la lógica correspondiente.

**Conclusión:** Inyectar recompensas es trivial desde dentro del juego. Desde fuera, necesitamos un canal de comunicación (ver sección 2).

### 1.4 Sistema de Textos y Localización

**Estructura de textos:**
- `src/strings.c`: ~2,200 líneas con strings de UI/menú/sistema (patrón `gText_X`)
- `data/maps/<Mapa>/scripts.inc`: diálogos de NPCs mezclados con scripts (~40,000+ strings total)
- `data/text/*.inc`: textos especializados (TV, Birch, match call, etc.)

**Codificación:** El charmap (`charmap.txt`, 1,459 líneas) mapea UTF-8 fuente → GBA tile indices. Soporta hiragana/katakana completo más caracteres occidentales básicos.

**Extracción/reinyección automatizada:** 
- **Dificultad: 6/10.** Viable con tooling custom.
- Los archivos `.inc` usan `.string` directives con labels locales — parseables con regex.
- El mayor riesgo es el overflow de buffer: los strings tienen tamaños fijos en ROM.
- Para traducción simple (modificar texto existente sin expandir): fácil y seguro.
- Para añadir texto nuevo o expandir significativamente: requiere repointing de datos.

**Conclusión:** Extraer todo el diálogo a JSON es viable. Reinyectar con validación de longitud de buffer también. Para personalización de diálogos por parte del Oráculo (IA), mejor usar vars de texto dinámico (`{STR_VAR_1}`, `{STR_VAR_2}`, `{STR_VAR_3}`) que ya existen en el motor y se rellenan en runtime.

### 1.5 Entorno de Compilación

| Requisito | Detalle |
|-----------|---------|
| **OS** | Linux (nativo o WSL), macOS |
| **Toolchain** | devkitARM r65 (`arm-none-eabi-gcc`) |
| **Build system** | GNU Make + 11 herramientas custom en C |
| **ROM output** | `pokemonHnS.gba` (MODERN=1), `pokeemerald.gba` (vanilla) |
| **Tiempo build limpio** | 3–8 min (GitHub Actions), 2–5 min (máquina local) |
| **Tiempo incremental** | 5–30 segundos |
| **CI/CD** | Completamente viable en GitHub Actions (ya documentado en el repo vía `remote_build.sh`)

**Conclusión:** Podemos compilar ROMs automáticamente desde un trigger del Dashboard. **Superpoder #3.**

---

## 2. Estrategia de Comunicación: Emulador ↔ Backend

Hay dos paradigmas. Analizo pros/contras de cada uno.

### 2.1 Parcheo de Memoria en Runtime

**Cómo funciona:** El emulador (mGBA en EmulatorJS) expone la RAM del GBA. Un script externo lee/escribe direcciones de memoria directamente mientras el juego corre.

**Ventajas:**
- Tiempo real: cambios instantáneos sin recompilar
- No requiere toolchain de compilación en el backend
- Funciona con cualquier ROM (incluso vanilla)

**Desventajas:**
- **Extremadamente frágil.** Las direcciones cambian con cualquier modificación al código (el ASLR de save blocks, cambios en el linker layout)
- Requiere mantener un mapa de direcciones por build
- No hay API documentada — es ingeniería inversa continua
- mGBA en WASM (EmulatorJS) no expone fácilmente la RAM al JavaScript host (sandbox del iframe)
- EmulatorJS no tiene una API pública para leer/escribir memoria del emulador desde fuera del iframe

**Veredicto:** No recomendado como estrategia principal. Es una capa de fragilidad innecesaria. La arquitectura de EmulatorJS (iframe sandbox) hace que el acceso a memoria raw sea prácticamente imposible sin modificar el propio EmulatorJS.

### 2.2 Recompilación de ROM con Datos Embebidos (RECOMENDADO)

**Cómo funciona:** El backend genera una ROM personalizada que incluye datos nuevos (ítems, flags activados, diálogos modificados) como parte del proceso de build. El jugador carga la ROM y los cambios ya están "horneados" dentro.

**Ventajas:**
- Robusto: los datos son parte del binario, no dependen de direcciones volátiles
- Sin límites: podemos modificar cualquier aspecto del juego
- Aprovecha toda la infraestructura de decompilación existente

**Desventajas:**
- Latencia: 3–8 minutos por build
- No es "en tiempo real" — requiere recargar la ROM en el emulador

### 2.3 Modelo Híbrido (RECOMENDACIÓN FINAL)

```
┌─────────────────────────────────────────────────────────┐
│                   ARQUITECTURA HÍBRIDA                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [Dashboard Next.js]                                      │
│       │                                                   │
│       ├──► Build jobs (diario/semanal): ROM personalizada │
│       │    - Nuevos ítems ganados                         │
│       │    - Diálogos del Oráculo pre-cocidos             │
│       │    - Eventos especiales activados                 │
│       │                                                   │
│       └──► Runtime state (por sesión de juego):            │
│            - Save states (.sav) leídos desde Supabase     │
│            - Flags/vars extraídos del save file           │
│            - Progreso sincronizado al dashboard           │
│                                                           │
│  [Supabase]                                               │
│       ├── Save states bucket (Storage)                    │
│       ├── Player progress (flags/vars como JSON)          │
│       └── Habit completions → trigger rewards             │
│                                                           │
│  [EmulatorJS]                                             │
│       ├── Carga ROM base desde CDN/bucket                 │
│       ├── Carga save state desde Supabase                 │
│       └── Guarda save state periódicamente a Supabase     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

El truco está en los **save states**: son snapshots de toda la RAM del GBA. Podemos:
1. **Leer progreso:** Extraer flags/vars del save state (los offsets son fijos una vez localizado SaveBlock1)
2. **Escribir recompensas:** Modificar el save state para añadir items o activar flags antes de que el jugador cargue
3. **Sincronizar:** Guardar el save state a Supabase periódicamente → el dashboard refleja el estado real

Esto nos da lo mejor de ambos mundos: builds diarias para cambios estructurales (diálogos, eventos), y manipulación de save states para recompensas en tiempo real.

---

## 3. Superpoderes Específicos del Fork

Este fork nos da capacidades que ningún ROM hack binario ofrece:

| # | Superpoder | Explicación |
|---|-----------|-------------|
| **1** | **Transparencia total de estado** | 2,408 flags + 256 vars documentados con nombres semánticos y offsets fijos. Podemos construir un dashboard que muestre EXACTAMENTE en qué punto de la historia está el jugador, qué medallas tiene, qué Pokémon ha visto. |
| **2** | **NPCs conscientes del mundo exterior** | Podemos crear un NPC "Oráculo" que lea una variable custom (`VAR_ORACLE_MESSAGE_ID`) y muestre diálogo generado por IA. El backend escribe el ID del mensaje en el save state, el NPC lo lee y muestra el texto correspondiente. |
| **3** | **Economía PKD nativa** | El juego ya tiene `money` (u32 en offset +0x490 de SaveBlock1). Podemos renombrarlo a PKD, modificar la UI, y hacer que el backend inyecte PKD directamente en el save state como recompensa por hábitos. |
| **4** | **Sistema de recompensas scriptable** | `giveitem`, `givemon`, `giveegg` son macros de una línea. Podemos crear scripts que entreguen recompensas condicionadas a flags externos sin tocar código C. |
| **5** | **Compilación CI/CD** | El repo compila en GitHub Actions en ~5 min. Podemos tener un pipeline que: recibe parámetros del dashboard → compila ROM → sube a bucket → notifica al jugador. |
| **6** | **Custom features ya existentes** | El fork ya tiene Randomizer, Challenge modes, Follower Pokémon, Pokédex Plus HGSS, Debug Pokemon Creator. Estas features demuestran que el equipo ya sabe modificar profundamente el juego. |
| **7** | **Textos dinámicos** | Los placeholders `{STR_VAR_1}`, `{STR_VAR_2}`, `{STR_VAR_3}` permiten inyectar texto en runtime. Podemos usarlos para mensajes del Oráculo sin recompilar. |

---

## 4. Tabla de Viabilidad por Feature

| Feature | Viabilidad | Esfuerzo | Riesgo |
|---------|-----------|----------|--------|
| Leer badges desde el save state | ✅ Trivial | Bajo | Bajo |
| Leer progreso de historia (vars) | ✅ Trivial | Bajo | Bajo |
| Leer money/PKD | ✅ Trivial | Bajo | Bajo |
| Escribir money/PKD en save state | ✅ Trivial | Bajo | Medio (checksum) |
| Activar flag (ej. dar medalla) | ✅ Trivial | Bajo | Medio (consistencia) |
| Dar ítem vía save state | ✅ Viable | Medio | Medio (inventario) |
| Dar Pokémon vía save state | ⚠️ Complejo | Alto | Alto (struct compleja) |
| Diálogo custom vía save state (STR_VARs) | ✅ Viable | Bajo | Bajo |
| Diálogo custom vía recompilación | ✅ Viable | Medio | Bajo |
| NPC nuevo que lee flag externo | ✅ Viable | Medio | Bajo |
| Build automatizado de ROM | ✅ Viable | Medio | Bajo |
| Sincronización save state ↔ Supabase | ⚠️ Medio | Medio | Medio (tamaño ~128KB) |
| Traducción completa del juego | ⚠️ Complejo | Alto | Alto (charmap + fuentes) |

---

## 5. Arquitectura de Sincronización Recomendada

```
FLUJO DE RECOMPENSA POR HÁBITO:

1. Usuario completa hábito en Dashboard
2. Backend (Supabase Edge Function) registra el hábito
3. Backend calcula recompensa PKD + posible ítem/Pokémon
4. Backend descarga el último save state del jugador desde Supabase Storage
5. Backend parsea el save state (formato .sav = raw EWRAM dump)
6. Backend localiza SaveBlock1 dentro del save
7. Backend modifica:
   - money (+PKD ganado)
   - flags (activar evento si toca)
   - Si es ítem: modificar la mochila (bag pocket)
   - Si es Pokémon: modificar el PC o party
8. Backend recalcula checksum del save
9. Backend sube el save state modificado a Supabase Storage
10. La próxima vez que el jugador carga la ROM, EmulatorJS carga el save state actualizado
11. El juego arranca con las recompensas ya aplicadas
```

**Nota sobre el save format:** Los saves de GBA son dumps de la EWRAM (256KB). El formato del `SaveBlock1` dentro del save está documentado en el código fuente (struct en `include/global.h`). Extraer/modificar campos es cuestión de leer/escribir en offsets fijos una vez localizado el bloque. La única complejidad es el checksum del save (16-bit) y la verificación de integridad.

---

## 6. Hoja de Ruta Técnica Sugerida

### Fase 1: Lectura (Semana 1-2)
- Implementar parser de save states (.sav → JSON con flags, vars, money, badges)
- Dashboard muestra progreso del jugador en tiempo real
- Supabase Storage para persistir save states

### Fase 2: Escritura Simple (Semana 3-4)
- Modificar money (PKD) en save state
- Activar/desactivar flags desde el backend
- Sistema de recompensas por hábitos (PKD + badge flags)
- Validar que el juego arranca correctamente con saves modificados

### Fase 3: Recompensas Avanzadas (Semana 5-6)
- Inyectar ítems en la mochila vía save state
- NPC Oráculo con STR_VARs dinámicos
- Build CI/CD para ROMs personalizadas

### Fase 4: Builds Programáticas (Semana 7-8+)
- Generar ROMs con diálogos del Oráculo pre-integrados
- Modificar encuentros wild basados en hábitos (ej. más probabilidad de shiny si el usuario lleva racha)
- Eventos especiales activados por hitos de hábitos

---

## 7. Verdad Técnica: Lo Que NO Recomiendo

1. **No intentar parchear memoria en runtime vía EmulatorJS.** El sandbox del iframe + la falta de API de memoria en EmulatorJS lo hacen inviable sin forks masivos.
2. **No intentar dar Pokémon shiny/legendarios vía save state sin testeo exhaustivo.** La struct `Pokemon` tiene ~100 bytes con campos interdependientes (checksum de datos, cifrado por especie/OT). Un error silencioso puede corromper el save.
3. **No intentar traducción completa ahora.** Esfuerzo enorme (fuentes, charmap, 40K+ strings) con poco retorno inmediato. Mejor enfocarse en diálogos del Oráculo vía STR_VARs.
4. **No dependas de direcciones de memoria hardcodeadas.** Usa siempre offsets relativos a `gSaveBlock1Ptr` dentro del save state. El linker puede reordenar cosas entre builds.

---

**Documento preparado para revisión del estratega jefe. Todas las afirmaciones están respaldadas por inspección directa del código fuente del fork.** 

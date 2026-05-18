# 📜 Documentación Técnica: Proyecto Johto Legacy Remake

Este documento detalla las fases de implementación para la integración profunda entre el emulador de GBA y el ecosistema web/Supabase.

---

## 💹 Fase 1: Economía Dinámica (Market-Driven) [COMPLETADA]
**Objetivo:** Sincronizar el valor del dinero y los precios del juego con un mercado de valores simulado en el frontend.

### Implementación Final:
- **Economía Hardcore:** Se han multiplicado los precios base por 10x (Poké Balls a 2000 PKD, Hiper Pociones a 20000 PKD, etc.) para forzar al jugador a completar hábitos en la web.
- **Sincronización Bidireccional:** El archivo `.srm` (juego) es ahora la fuente de verdad para el balance. Cualquier compra realizada en el emulador se sincroniza automáticamente con el `HabitStore` y el perfil de Supabase del usuario.
- **Inyección en Tiempo Real:** El `useEconomyEngine` parchea el heap de WASM del emulador cada 60s para asegurar que los precios reflejen las fluctuaciones del mercado web sin necesidad de reiniciar el juego.
- **Puntos de Ganancia:** El jugador genera PKD completando tareas en el frontend, que luego se inyectan en el juego vía `syncPKD`.

---

## 🛡️ Fase 2: El Guantelete (Progression Gates)
**Objetivo:** Implementar una lógica de progresión circular y acumulativa para los desafíos de gimnasio.

### Componentes:
- **Lógica de Bloqueo:**
  - Implementación de "Flags de Guantelete" en Supabase que rastrean el estado de los líderes.
  - Aunque el jugador tenga la medalla, el acceso al siguiente líder estará bloqueado físicamente (mediante NPCs de bloqueo o colisiones dinámicas) hasta que se cumpla el requisito del Guantelete.
- **Re-Desafío Obligatorio:**
  - Programación de disparadores que obliguen al jugador a vencer a los líderes anteriores (ej: Vencer al Líder 1 y 2 consecutivamente) para desbloquear la entrada al Gimnasio 3.
  - El estado del Guantelete se reseteará si el jugador falla en una etapa intermedia.

---

## 💎 Fase 3: Nivel 250 & Sistema de Prestigio
**Objetivo:** Romper los límites tradicionales de Pokémon (Nivel 100) y añadir un endgame infinito.

### Componentes:
- **Modificación del Núcleo en C:**
  - Edición de las rutinas de cálculo de experiencia y crecimiento de stats en el código fuente de la ROM (C) para elevar el límite de `MAX_LEVEL` de 100 a 250.
  - Ajuste de las tablas de experiencia para soportar la curva de crecimiento extendida.
- **Sistema de Ascensión (Web):**
  - Creación de una interfaz de "Prestigio" en el frontend.
  - Al llegar al nivel 250, el jugador podrá realizar una "Ascensión" en la web: el Pokémon vuelve a nivel 5 en el juego, pero recibe un bono permanente de stats ("Prestigio") almacenado en Supabase e inyectado en la estructura de datos del Pokémon en el save file.

---

## 🎫 Fase 4: Inyección de Pokémon (Bill’s PC Injection)
**Objetivo:** Permitir la adquisición de Pokémon y items en la web con entrega segura dentro del juego.

### Componentes:
- **Sistema de Tickets:**
  - Al realizar una "compra" o canje en la tienda web, se genera un Ticket único en Supabase.
- **Inyección Segura en Bill's PC:**
  - Desarrollo de una rutina de escritura que localice slots vacíos en las cajas de la PC de Bill dentro del archivo `.srm`.
  - Inyección de la estructura de datos completa del Pokémon (IVs, EVs, ataques, ID) directamente en el buffer antes de la sincronización con el emulador.
  - Verificación de integridad para evitar corrupción de las cajas existentes durante la inyección.


## Fase 3: Nivel 250 & Juego Eterno (Prestigio)

**Objetivo:** Permitir una progresión infinita sin romper los tipos de datos nativos de la ROM de GBA.

### Detalles de Implementación:
- **Límite de Nivel:** MAX_LEVEL ampliado a 250. Las tablas de experiencia continúan con una progresión plana desde el nivel 100 para evitar grindeo extremo.
- **Prestigio:** Se utilizará la variable no utilizada u16 unknown en struct BoxPokemon para guardar el prestigio individual (0 a 65535).
- **Escalado Dinámico:** VAR_WORLD_TIER dictará la dificultad del Boss Rush. Enemigos recibirán un +10% a sus stats base por cada Tier completado.
- **Ascensión Web:** La web permitirá resetear a nivel 1 a cambio de sumar +1 al prestigio del Pokémon.

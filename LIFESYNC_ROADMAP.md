# 🗺️ Johto LifeSync: Roadmap de Desarrollo

Este documento detalla las fases para convertir el remake de Johto en una experiencia de "Life-RPG" totalmente integrada con hábitos del mundo real.

## ✅ Fase 1: Estabilización del Motor (Completada)
- [x] Persistencia en la nube (Supabase Storage).
- [x] Sincronización de PKD (Pocket Dollars) sin corrupción.
- [x] **FS Polling (30s):** Extracción automática del save incluso si el emulador no emite eventos.
- [x] Cache-busting para evitar cargar partidas antiguas del navegador.

## 💀 Fase 2: Modo Hardcore & Sistema de Vida
**Objetivo:** Que el juego tenga consecuencias reales. Si pierdes, tu partida se bloquea hasta que cumplas hábitos.

- [ ] **Detección de "White Out":** Monitorear la memoria RAM para saber cuando el jugador pierde una batalla.
- [ ] **Bloqueo de Partida:** Si el jugador pierde, se activa un estado de "Muerte" en Supabase que impide cargar el emulador.
- [ ] **Tickets de Resurrección:** Implementar un sistema donde completar un hábito difícil (ej: ir al gimnasio) genere un ticket en Supabase que desbloquee la partida.

## 🎫 Fase 3: Economía de Hábitos (PKD)
**Objetivo:** Vincular el dinero del juego con tus logros diarios.

- [ ] **Tablero de Hábitos:** UI en la web para marcar tareas completadas.
- [ ] **Multiplicadores de Recompensa:** Ganar más PKD por rachas de días cumpliendo hábitos.
- [ ] **Tienda de Items Reales:** Gastar PKD para "comprar" tiempo de ocio o recompensas reales.

## 🏛️ Fase 4: El Guantelete de Gimnasios
**Objetivo:** Gamificar el progreso a largo plazo.

- [ ] **Gym Gates:** Bloquear el acceso a ciertas áreas del mapa mediante parches en la RAM hasta que se completen hitos de vida específicos.
- [ ] **Logros de Supabase:** Sincronizar las medallas ganadas con el perfil de usuario.

---
*Nota: Este Roadmap es dinámico y se ajustará según el progreso del desarrollo.*

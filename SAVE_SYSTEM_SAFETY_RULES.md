# 🛑 Johto Legacy: Save System Safety Rules

Este documento contiene las reglas críticas para el sistema de sincronización de partidas. **CUALQUIER MODIFICACIÓN** de estas reglas o de los archivos mencionados sin validación previa resultará en pérdida de datos del usuario.

## 1. Archivos Críticos
- `src/features/cloudsave/useCloudSave.ts`: Motor principal de sync.
- `src/features/emulator/components/EmulatorCanvas.tsx`: Orquestación del emulador.

## 2. Reglas de Oro (NO ROMPER)

### A. El Poller es Sagrado
- **Intervalo:** 10 segundos.
- **Mecanismo:** DEBE llamar a `gm.saveSaveFiles()` antes de leer el FS. mGBA es perezoso y no escribe al sistema de archivos virtual a menos que se le fuerce.
- **Estabilidad:** El `useEffect` del poller **SÓLO** puede depender de `userId`. Si añades otras dependencias, el intervalo se destruirá y recreará constantemente, perdiendo el hilo de ejecución.

### B. Uso de `uploadSaveRef`
- Nunca llames a `uploadSave` directamente dentro de un `setInterval` o evento del DOM.
- Usa siempre `uploadSaveRef.current()`. Esto asegura que siempre uses la versión más reciente de la función sin que el `setInterval` tenga que reiniciarse.

### C. El Cierre de Pestaña es Crítico
- El evento `visibilitychange → hidden` es nuestra última oportunidad de salvar la partida.
- El evento `beforeunload` debe ser **SÍNCRONO**. Sólo se usa para forzar el flush de mGBA. No intentes hacer un fetch ahí (fallará).

## 3. Errores Históricos (Lecciones Aprendidas)
1. **El bucle infinito:** Inyectar el save de vuelta al emulador después de leerlo del FS. (Solución: No inyectar en el poller).
2. **Hash Fantasma:** Leer el FS, detectar cambio, subir, y que el siguiente poll detecte el mismo cambio. (Solución: Actualizar el hash `lastFsHashRef` **ANTES** de iniciar la subida asíncrona).
3. **Pérdida al cerrar:** El usuario guarda in-game y cierra rápido. (Solución: Forzar flush y upload en `visibilitychange`).

---
**Nota para la IA:** Si vas a modificar algo que afecte al guardado, detente y pide confirmación explícita al usuario mencionando este documento.

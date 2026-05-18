/**
 * EconomyStatusWidget — LifeSync Fase 1
 *
 * Muestra el estado de la economía de Johto en tiempo real.
 * Se integra en el dashboard para que el jugador siempre sepa
 * cuánto costarán los objetos en el juego.
 */

import { useEconomyEngine, type EstadoEconomia } from '../useEconomyEngine'

// ─── Configuración visual por estado ─────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoEconomia, {
  label: string
  color: string
  bg: string
  border: string
  glow: string
  icon: string
  barColor: string
}> = {
  BOOM: {
    label: 'BOOM',
    color: '#00ff88',
    bg: 'rgba(0, 255, 136, 0.08)',
    border: 'rgba(0, 255, 136, 0.3)',
    glow: '0 0 20px rgba(0, 255, 136, 0.2)',
    icon: '📈',
    barColor: '#00ff88',
  },
  ESTABLE: {
    label: 'ESTABLE',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.3)',
    glow: '0 0 20px rgba(96, 165, 250, 0.15)',
    icon: '⚖️',
    barColor: '#60a5fa',
  },
  RECESION: {
    label: 'RECESIÓN',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.3)',
    glow: '0 0 20px rgba(251, 191, 36, 0.2)',
    icon: '📉',
    barColor: '#fbbf24',
  },
  CRISIS: {
    label: '⚠️ CRISIS',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.4)',
    glow: '0 0 24px rgba(239, 68, 68, 0.3)',
    icon: '🚨',
    barColor: '#ef4444',
  },
}

// ─── Subcomponente: barra de índice ──────────────────────────────────────────

function IndiceBar({ indice, estado }: { indice: number; estado: EstadoEconomia }) {
  const cfg = ESTADO_CONFIG[estado]
  // indice va de 0.5 (BOOM) a 3.0 (CRISIS MAX)
  // Normalizar a 0-100% para la barra
  const pct = Math.round(((indice - 0.5) / (3.0 - 0.5)) * 100)

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 4, fontSize: 11, color: 'rgba(255,255,255,0.5)',
      }}>
        <span>BOOM 0.5×</span>
        <span style={{ color: cfg.color, fontWeight: 700, fontSize: 13 }}>
          {indice.toFixed(2)}×
        </span>
        <span>CRISIS 3.0×</span>
      </div>
      <div style={{
        height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, #00ff88, ${cfg.barColor})`,
          borderRadius: 3,
          transition: 'width 1s ease',
          boxShadow: `0 0 8px ${cfg.barColor}`,
        }} />
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface EconomyStatusWidgetProps {
  /** Si true, muestra la tabla de precios de tienda */
  showPrices?: boolean
  /** Clase CSS adicional para el wrapper */
  className?: string
}

export function EconomyStatusWidget({ showPrices = false, className }: EconomyStatusWidgetProps) {
  const { economia, loading, error, lastPatchedAt, forceRepatch } = useEconomyEngine()

  if (loading && !economia) {
    return (
      <div style={styles.container} className={className}>
        <div style={styles.loadingRow}>
          <span style={styles.pulse}>●</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            Leyendo mercado Johto...
          </span>
        </div>
      </div>
    )
  }

  if (error && !economia) {
    return (
      <div style={{ ...styles.container, borderColor: 'rgba(239,68,68,0.3)' }} className={className}>
        <span style={{ color: '#ef4444', fontSize: 12 }}>⚠️ {error}</span>
      </div>
    )
  }

  if (!economia) return null

  const cfg = ESTADO_CONFIG[economia.estado]

  return (
    <div style={{
      ...styles.container,
      background: cfg.bg,
      borderColor: cfg.border,
      boxShadow: cfg.glow,
    }} className={className}>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{cfg.icon}</span>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
              Economía de Johto
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>
              {cfg.label}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Var. promedio</div>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: economia.variacion_promedio >= 0 ? '#00ff88' : '#ef4444',
          }}>
            {economia.variacion_promedio >= 0 ? '+' : ''}
            {economia.variacion_promedio.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Barra de índice */}
      <IndiceBar indice={economia.indice} estado={economia.estado} />

      {/* Descripción */}
      <p style={styles.descripcion}>{economia.descripcion}</p>

      {/* Stats rápidos */}
      <div style={styles.statsRow}>
        <div style={styles.statChip}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Empresas en crisis</span>
          <span style={{ color: economia.empresas_en_crisis > 0 ? '#ef4444' : '#00ff88', fontWeight: 700 }}>
            {economia.empresas_en_crisis}
          </span>
        </div>
        <div style={styles.statChip}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Pago NPCs</span>
          <span style={{ color: '#60a5fa', fontWeight: 700 }}>
            ×{economia.multiplicador_npc.toFixed(1)}
          </span>
        </div>
        <div style={styles.statChip}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Inflación tiendas</span>
          <span style={{ color: cfg.color, fontWeight: 700 }}>
            ×{economia.indice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Tabla de precios (opcional) */}
      {showPrices && economia.precios && (
        <div style={styles.priceTable}>
          <div style={styles.priceHeader}>
            <span>Objeto</span>
            <span>Base</span>
            <span style={{ color: cfg.color }}>Hoy</span>
          </div>
          {economia.precios
            .filter(p => p.precio > 0)
            .map(p => (
              <div key={p.id_gba} style={styles.priceRow}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{p.nombre}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {p.precio_base.toLocaleString()} PKD
                </span>
                <span style={{
                  color: p.precio > p.precio_base ? '#ef4444' : p.precio < p.precio_base ? '#00ff88' : 'rgba(255,255,255,0.6)',
                  fontWeight: p.precio !== p.precio_base ? 700 : 400,
                }}>
                  {p.precio.toLocaleString()} PKD
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Footer: estado del RAM patch */}
      <div style={styles.footer}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
          {lastPatchedAt
            ? `🎮 RAM parchada ${lastPatchedAt.toLocaleTimeString()}`
            : '🎮 Esperando emulador...'}
        </span>
        <button
          id="btn-repatch-economy"
          onClick={forceRepatch}
          style={styles.patchBtn}
          title="Forzar re-inyección de precios en el juego"
        >
          ⚡ Re-patch
        </button>
      </div>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(96,165,250,0.06)',
    border: '1px solid rgba(96,165,250,0.2)',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.5s ease',
  },
  loadingRow: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  pulse: {
    color: '#60a5fa',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  descripcion: {
    margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4,
  },
  statsRow: {
    display: 'flex', gap: 8,
  },
  statChip: {
    flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 10px',
    display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  priceTable: {
    background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  priceHeader: {
    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16,
    fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 4, paddingBottom: 4,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  priceRow: {
    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16,
    fontSize: 12, alignItems: 'center',
  },
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 2,
  },
  patchBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.6)',
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
}

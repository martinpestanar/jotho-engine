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
    color: '#059669',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.2)',
    glow: '0 0 20px rgba(16, 185, 129, 0.05)',
    icon: '📈',
    barColor: '#059669',
  },
  ESTABLE: {
    label: 'ESTABLE',
    color: '#1d4ed8',
    bg: 'rgba(37, 99, 235, 0.08)',
    border: 'rgba(37, 99, 235, 0.2)',
    glow: '0 0 20px rgba(37, 99, 235, 0.05)',
    icon: '⚖️',
    barColor: '#1d4ed8',
  },
  RECESION: {
    label: 'RECESIÓN',
    color: '#b45309',
    bg: 'rgba(217, 119, 6, 0.08)',
    border: 'rgba(217, 119, 6, 0.2)',
    glow: '0 0 20px rgba(217, 119, 6, 0.05)',
    icon: '📉',
    barColor: '#b45309',
  },
  CRISIS: {
    label: '⚠️ CRISIS',
    color: '#b91c1c',
    bg: 'rgba(220, 38, 38, 0.08)',
    border: 'rgba(220, 38, 38, 0.2)',
    glow: '0 0 24px rgba(220, 38, 38, 0.08)',
    icon: '🚨',
    barColor: '#b91c1c',
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
        marginBottom: 4, fontSize: 11, color: 'rgba(15, 23, 42, 0.5)',
      }}>
        <span>BOOM 0.5×</span>
        <span style={{ color: cfg.color, fontWeight: 700, fontSize: 13 }}>
          {indice.toFixed(2)}×
        </span>
        <span>CRISIS 3.0×</span>
      </div>
      <div style={{
        height: 6, background: 'rgba(15, 23, 42, 0.08)', borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, #10b981, ${cfg.barColor})`,
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
          <span style={{ color: 'rgba(15,23,42,0.45)', fontSize: 12 }}>
            Leyendo mercado Johto...
          </span>
        </div>
      </div>
    )
  }

  if (error && !economia) {
    return (
      <div style={{ ...styles.container, borderColor: 'rgba(220,38,38,0.3)' }} className={className}>
        <span style={{ color: '#b91c1c', fontSize: 12 }}>⚠️ {error}</span>
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
            <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase' }}>
              Economía de Johto
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>
              {cfg.label}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'rgba(15,23,42,0.4)' }}>Var. promedio</div>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: economia.variacion_promedio >= 0 ? '#059669' : '#b91c1c',
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
          <span style={{ color: 'rgba(15,23,42,0.5)', fontSize: 10 }}>Empresas en crisis</span>
          <span style={{ color: economia.empresas_en_crisis > 0 ? '#b91c1c' : '#059669', fontWeight: 700 }}>
            {economia.empresas_en_crisis}
          </span>
        </div>
        <div style={styles.statChip}>
          <span style={{ color: 'rgba(15,23,42,0.5)', fontSize: 10 }}>Pago NPCs</span>
          <span style={{ color: '#1d4ed8', fontWeight: 700 }}>
            ×{economia.multiplicador_npc.toFixed(1)}
          </span>
        </div>
        <div style={styles.statChip}>
          <span style={{ color: 'rgba(15,23,42,0.5)', fontSize: 10 }}>Inflación tiendas</span>
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
                <span style={{ color: 'rgba(15,23,42,0.85)' }}>{p.nombre}</span>
                <span style={{ color: 'rgba(15,23,42,0.45)' }}>
                  {p.precio_base.toLocaleString()} PKD
                </span>
                <span style={{
                  color: p.precio > p.precio_base ? '#b91c1c' : p.precio < p.precio_base ? '#059669' : 'rgba(15,23,42,0.6)',
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
        <span style={{ color: 'rgba(15,23,42,0.4)', fontSize: 10 }}>
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
    background: 'rgba(37,99,235,0.06)',
    border: '1px solid rgba(37,99,235,0.2)',
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
    color: '#2563eb',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  descripcion: {
    margin: 0, fontSize: 12, color: 'rgba(15,23,42,0.7)', lineHeight: 1.4,
  },
  statsRow: {
    display: 'flex', gap: 8,
  },
  statChip: {
    flex: 1, background: 'rgba(15,23,42,0.03)', borderRadius: 8, padding: '6px 10px',
    display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center',
    border: '1px solid rgba(15,23,42,0.06)',
  },
  priceTable: {
    background: 'rgba(15,23,42,0.03)', borderRadius: 8, padding: '8px 10px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  priceHeader: {
    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16,
    fontSize: 10, color: 'rgba(15,23,42,0.45)', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 4, paddingBottom: 4,
    borderBottom: '1px solid rgba(15,23,42,0.06)',
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
    background: 'rgba(15,23,42,0.04)',
    border: '1px solid rgba(15,23,42,0.1)',
    color: 'rgba(15,23,42,0.65)',
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
}

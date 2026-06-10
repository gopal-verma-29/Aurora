// Pipeline.jsx — Aurora v1
import { useState } from 'react'
import { usePipeline } from '../hooks/usePipeline'
import KanbanColumn from '../components/KanbanColumn'

const STATUSES = ['new', 'contacted', 'responded', 'closed', 'skip']

export default function Pipeline() {
  const { leads, update } = usePipeline()
  const [expanded, setExpanded] = useState(null)
  const total = Object.keys(leads).length

  return (
    <div style={{ padding: '2rem 1.5rem', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          marginBottom: 4,
        }}>
          Pipeline
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          // {total} lead{total !== 1 ? 's' : ''} · drag to move between stages
        </p>
      </div>

      {/* Kanban board */}
      <div style={{
        display: 'flex', gap: '0.875rem',
        alignItems: 'flex-start',
        overflowX: 'auto',
        paddingBottom: '1rem',
      }}>
        {STATUSES.map(s => (
          <KanbanColumn key={s} status={s} onExpand={setExpanded} />
        ))}
      </div>

      {/* Expanded modal */}
      {expanded && (
        <div
          onClick={() => setExpanded(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(6,6,16,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border-bright)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.75rem',
              maxWidth: 560, width: '100%',
              maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 0 60px rgba(124,92,255,0.15), 0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>
                  {expanded.name}
                </h2>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {expanded.address}
                </p>
              </div>
              <button
                onClick={() => setExpanded(null)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', fontSize: '1.2rem',
                  cursor: 'pointer', padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Status selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Stage
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => { update(expanded.id, { status: s }); setExpanded({ ...expanded, status: s }) }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      border: expanded.status === s ? '1px solid var(--accent)' : '1px solid var(--border-bright)',
                      background: expanded.status === s ? 'var(--accent-dim)' : 'transparent',
                      color: expanded.status === s ? 'var(--accent-bright)' : 'var(--text-muted)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {expanded.painPoints && (
              <div style={{ borderLeft: '2px solid var(--red)', paddingLeft: '0.75rem', marginBottom: '1rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Pain Points</p>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{expanded.painPoints}</p>
              </div>
            )}

            {(expanded.linkedinMessage || expanded.pitch) && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>LinkedIn Message</p>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontStyle: 'italic', background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  {expanded.linkedinMessage || expanded.pitch}
                </p>
              </div>
            )}

            {/* Links */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {expanded.googleMapsUrl && (
                <a href={expanded.googleMapsUrl} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-bright)', textDecoration: 'none' }}>
                  Maps ↗
                </a>
              )}
              {expanded.website && (
                <a href={expanded.website} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--cyan)', textDecoration: 'none' }}>
                  Website ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

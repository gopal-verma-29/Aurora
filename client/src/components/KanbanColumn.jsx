// KanbanColumn.jsx — Aurora v1
import { useState } from 'react'
import { usePipeline } from '../hooks/usePipeline'
import { useToast } from './Toast'

const STATUS_META = {
  new:       { label: 'New',        color: 'var(--text-muted)',    border: 'var(--border-bright)' },
  contacted: { label: 'Contacted',  color: '#60a5fa',              border: 'rgba(96,165,250,0.4)' },
  responded: { label: 'Responded',  color: 'var(--amber)',         border: 'var(--amber-dim)'     },
  closed:    { label: 'Closed',     color: 'var(--green)',         border: 'var(--green-dim)'     },
  skip:      { label: 'Skip',       color: 'var(--red)',           border: 'var(--red-dim)'       },
}

function scoreStyle(n) {
  if (n >= 8) return { color: 'var(--green)', bg: 'var(--green-dim)', glow: 'rgba(0,232,117,0.3)' }
  if (n >= 5) return { color: 'var(--amber)', bg: 'var(--amber-dim)', glow: 'rgba(255,194,0,0.3)' }
  return           { color: 'var(--red)',   bg: 'var(--red-dim)',   glow: 'rgba(255,61,90,0.3)'  }
}

export default function KanbanColumn({ status, onExpand }) {
  const { byStatus, update, remove } = usePipeline()
  const { add: toast }               = useToast()
  const [dragOver, setDragOver]      = useState(false)
  const leads = byStatus(status)
  const meta  = STATUS_META[status]

  function onDragStart(e, id) {
    e.dataTransfer.setData('leadId', id)
    e.dataTransfer.setData('fromStatus', status)
  }

  async function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const id   = e.dataTransfer.getData('leadId')
    const from = e.dataTransfer.getData('fromStatus')
    if (!id || from === status) return
    await update(id, { status })
    toast(`Moved to ${meta.label}`, 'info')
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        minHeight: 220, padding: 12, borderRadius: 'var(--radius-lg)',
        minWidth: 210, flex: '1 1 200px',
        background: dragOver ? 'rgba(124,92,255,0.05)' : 'var(--card)',
        border: `1px solid ${dragOver ? 'rgba(124,92,255,0.4)' : 'var(--border)'}`,
        transition: 'all 0.2s',
      }}
    >
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 4px 8px',
        borderBottom: `1px solid var(--border)`,
        marginBottom: 4,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: meta.color,
          boxShadow: `0 0 6px ${meta.color}`,
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: meta.color,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          flex: 1,
        }}>
          {meta.label}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--text-dim)',
          background: 'var(--surface)',
          padding: '1px 7px',
          borderRadius: 20,
        }}>
          {leads.length}
        </span>
      </div>

      {/* Empty state */}
      {leads.length === 0 && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--text-dim)',
          margin: '0.25rem 0',
          padding: '2rem 0',
        }}>
          drop here
        </div>
      )}

      {/* Cards */}
      {leads.map(lead => {
        const sc = scoreStyle(lead.score || 0)
        return (
          <div
            key={lead.id}
            draggable
            onDragStart={e => onDragStart(e, lead.id)}
            onClick={() => onExpand(lead)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              cursor: 'grab',
              transition: 'border-color 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                {lead.name}
              </p>
              <span style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                padding: '2px 7px',
                borderRadius: 20,
                border: `1px solid ${sc.glow}`,
                background: sc.bg,
                color: sc.color,
                flexShrink: 0,
                boxShadow: `0 0 6px ${sc.glow}`,
              }}>
                {lead.score}/10
              </span>
            </div>
            {lead.phone && (
              <p style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 4 }}>
                📞 {lead.phone}
              </p>
            )}
            {(lead.linkedinMessage || lead.pitch) && (
              <p style={{
                fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {lead.linkedinMessage || lead.pitch}
              </p>
            )}
            <button
              onClick={e => { e.stopPropagation(); remove(lead.id) }}
              style={{
                marginTop: 6, fontSize: '0.62rem', fontFamily: 'var(--font-mono)',
                color: 'rgba(255,61,90,0.4)', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,61,90,0.4)'}
            >
              remove ×
            </button>
          </div>
        )
      })}
    </div>
  )
}

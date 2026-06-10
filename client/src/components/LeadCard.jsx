// LeadCard.jsx — Aurora v1
// CHANGED FROM v7:
//   - Full visual redesign
//   - WhatsApp button removed
//   - "Pitch" tab replaced with LinkedIn Message tab + Loom Brief tab
//   - Copy LinkedIn Message button + Copy Loom Brief button
//   - Follow-up message section added
//   - Score badge has color glow (green/amber/red)
//   - Website verdict pill with color coding
//   - DM-to-book and subdomain flags highlighted

import { useState } from 'react'
import { usePipeline } from '../hooks/usePipeline'
import { useToast } from './Toast'

function scoreStyle(n) {
  if (n >= 8) return { color: 'var(--green)',  bg: 'var(--green-dim)',  glow: 'rgba(0,232,117,0.3)' }
  if (n >= 5) return { color: 'var(--amber)',  bg: 'var(--amber-dim)',  glow: 'rgba(255,194,0,0.3)' }
  return           { color: 'var(--red)',    bg: 'var(--red-dim)',    glow: 'rgba(255,61,90,0.3)' }
}

function verdictChip(wq) {
  if (!wq) return null
  const map = {
    poor:       { label: 'POOR SITE',    color: 'var(--red)',   bg: 'var(--red-dim)'   },
    outdated:   { label: 'OUTDATED',     color: 'var(--amber)', bg: 'var(--amber-dim)' },
    decent:     { label: 'DECENT',       color: 'var(--green)', bg: 'var(--green-dim)' },
    unverified: { label: 'UNVERIFIED',   color: 'var(--text-muted)', bg: 'transparent' },
  }
  const v = map[wq.verdict] || map.unverified
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.6rem',
      padding: '2px 8px',
      borderRadius: 20,
      background: v.bg,
      color: v.color,
      letterSpacing: '0.06em',
    }}>
      {v.label}
    </span>
  )
}

export default function LeadCard({ lead, index }) {
  const [tab, setTab]         = useState('linkedin')
  const [expanded, setExpanded] = useState(false)
  const { save, isSaved }     = usePipeline()
  const { add: toast }        = useToast()
  const saved                 = isSaved(lead.id)
  const sc                    = scoreStyle(lead.score || 0)

  function copy(text, label) {
    navigator.clipboard.writeText(text || '')
      .then(() => toast(`${label} copied`, 'success'))
      .catch(() => toast('Copy failed', 'error'))
  }

  async function handleSave() {
    if (saved) return
    await save(lead)
    toast(`${lead.name} added to pipeline`, 'success')
  }

  const wq = lead.websiteQuality

  const loomPoints = (lead.loomBrief || '')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)

  return (
    <div
      style={{
        background: 'var(--card)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        animation: `fadeUp 0.35s ease both`,
        animationDelay: `${index * 0.06}s`,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: expanded ? `0 0 0 1px var(--border-bright), 0 8px 32px rgba(0,0,0,0.3)` : 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >

      {/* ── Header ──────────────────────────────────────── */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '1rem 1.25rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        {/* Score badge */}
        <div style={{
          width: 44, height: 44,
          borderRadius: 12,
          background: sc.bg,
          border: `1px solid ${sc.glow}`,
          boxShadow: `0 0 12px ${sc.glow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 800,
            color: sc.color,
          }}>
            {lead.score || '?'}
          </span>
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 4 }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--text)',
            }}>
              {lead.name}
            </h3>
            {wq && verdictChip(wq)}
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
            alignItems: 'center',
          }}>
            {lead.rating && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--amber)' }}>
                ★ {lead.rating} ({lead.reviewCount})
              </span>
            )}
            {lead.type && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                · {lead.type}
              </span>
            )}
            {wq?.hasDMBooking && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: 'var(--cyan)', background: 'var(--cyan-dim)',
                padding: '1px 7px', borderRadius: 20,
              }}>
                DM-TO-BOOK
              </span>
            )}
            {wq?.isOnSubdomain && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: 'var(--red)', background: 'var(--red-dim)',
                padding: '1px 7px', borderRadius: 20,
              }}>
                FREE SUBDOMAIN
              </span>
            )}
          </div>

          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-dim)',
            marginTop: 4,
          }}>
            {lead.address}
          </p>
        </div>

        {/* Expand chevron */}
        <span style={{
          color: 'var(--text-dim)',
          fontSize: '0.8rem',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          flexShrink: 0,
          marginTop: 4,
        }}>
          ▾
        </span>
      </div>

      {/* ── Score reason strip ───────────────────────────── */}
      {lead.scoreReason && (
        <div style={{
          padding: '0.5rem 1.25rem',
          borderTop: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: sc.color,
          background: sc.bg,
          display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
        }}>
          <span style={{ opacity: 0.6 }}>⌖</span>
          {lead.scoreReason}
        </div>
      )}

      {/* ── Expanded content ─────────────────────────────── */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem' }}>

          {/* Pain points */}
          {lead.painPoints && (
            <div style={{
              borderLeft: '2px solid var(--red)',
              paddingLeft: '0.75rem',
              marginBottom: '1rem',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}>
                Pain Points
              </p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                {lead.painPoints}
              </p>
            </div>
          )}

          {/* Output tabs */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {[
                { key: 'linkedin', label: '💼 LinkedIn' },
                { key: 'loom',     label: '🎥 Loom Brief' },
                { key: 'followup', label: '↩ Follow-Up' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    border: tab === t.key ? '1px solid var(--accent)' : '1px solid var(--border-bright)',
                    background: tab === t.key ? 'var(--accent-dim)' : 'transparent',
                    color: tab === t.key ? 'var(--accent-bright)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* LinkedIn tab */}
            {tab === 'linkedin' && (
              <div>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.7,
                  background: 'var(--surface)',
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontStyle: 'italic',
                  marginBottom: '0.5rem',
                }}>
                  {lead.linkedinMessage || lead.pitch || 'No message generated.'}
                </p>
                <button
                  onClick={() => copy(lead.linkedinMessage || lead.pitch, 'LinkedIn message')}
                  style={ghostBtn}
                >
                  Copy LinkedIn Message
                </button>
              </div>
            )}

            {/* Loom tab */}
            {tab === 'loom' && (
              <div>
                {loomPoints.length > 0 ? (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem',
                    marginBottom: '0.5rem',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                  }}>
                    {loomPoints.map((point, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          color: 'var(--accent-bright)',
                          background: 'var(--accent-dim)',
                          borderRadius: 6,
                          padding: '2px 7px',
                          flexShrink: 0,
                          marginTop: 2,
                        }}>
                          {i + 1}
                        </span>
                        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    No loom brief generated.
                  </p>
                )}
                <button
                  onClick={() => copy(lead.loomBrief, 'Loom brief')}
                  style={ghostBtn}
                >
                  Copy Loom Brief
                </button>
              </div>
            )}

            {/* Follow-up tab */}
            {tab === 'followup' && (
              <div>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.7,
                  background: 'var(--surface)',
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontStyle: 'italic',
                  marginBottom: '0.5rem',
                }}>
                  {lead.followUp || 'No follow-up generated.'}
                </p>
                <button
                  onClick={() => copy(lead.followUp, 'Follow-up message')}
                  style={ghostBtn}
                >
                  Copy Follow-Up
                </button>
              </div>
            )}
          </div>

          {/* Action row */}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleSave}
              disabled={saved}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                cursor: saved ? 'default' : 'pointer',
                border: 'none',
                background: saved
                  ? 'var(--green-dim)'
                  : 'linear-gradient(135deg, var(--accent), #5b3fff)',
                color: saved ? 'var(--green)' : '#fff',
                boxShadow: saved ? 'none' : '0 0 16px var(--accent-glow)',
                transition: 'all 0.2s',
              }}
            >
              {saved ? '✓ In Pipeline' : '+ Add to Pipeline'}
            </button>

            {lead.googleMapsUrl && (
              <a
                href={lead.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid var(--border-bright)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  display: 'inline-flex', alignItems: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-bright)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                View on Maps ↗
              </a>
            )}

            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid var(--border-bright)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  display: 'inline-flex', alignItems: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.color = 'var(--cyan)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                Visit Site ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const ghostBtn = {
  background: 'transparent',
  border: '1px solid var(--border-bright)',
  borderRadius: 'var(--radius-sm)',
  padding: '5px 12px',
  fontSize: '0.72rem',
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  transition: 'all 0.15s',
}

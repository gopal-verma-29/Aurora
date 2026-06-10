import { useEffect } from 'react'
import { useLeads } from '../hooks/useLeads'
import SearchForm from '../components/SearchForm'
import LeadCard from '../components/LeadCard'

export default function Search() {
  const { state, setField, search, clear, loadDefaults } = useLeads()
  const { leads, summary, loading, error, ran } = state

  useEffect(() => { loadDefaults() }, [])

  const sorted = [...leads].sort((a, b) => b.score - a.score)

  return (
    <div style={{
      maxWidth: 700,
      margin: '0 auto',
      padding: '2rem 1.5rem',
      position: 'relative',
    }}>

      {/* Ambient glow behind the page */}
      <div style={{
        position: 'fixed',
        top: '10%', right: '5%',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Page header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: 'var(--text)',
            marginBottom: 4,
          }}>
            Run Scan
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}>
            // Google Maps discovery · site audit · Claude scoring · LinkedIn outreach
          </p>
        </div>

        <SearchForm
          state={state}
          setField={setField}
          onSearch={search}
          loading={loading}
        />

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--red-dim)',
            border: '1px solid rgba(255,61,90,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--red)',
            marginBottom: '1rem',
          }}>
            // {error}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div style={{
            background: 'var(--accent-dim)',
            border: '1px solid rgba(124,92,255,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--accent-bright)',
            marginBottom: '1rem',
          }}>
            ◈ {summary}
          </div>
        )}

        {/* Results header */}
        {ran && leads.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '1rem',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}>
              {leads.length} lead{leads.length !== 1 ? 's' : ''} · sorted by score
            </span>
            <button
              onClick={clear}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 12px',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              clear ×
            </button>
          </div>
        )}

        {/* Lead cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {sorted.map((lead, i) => (
            <LeadCard key={lead.id} lead={lead} index={i} />
          ))}
        </div>

        {/* Empty state */}
        {ran && leads.length === 0 && !loading && !error && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.3 }}>⌖</div>
            <div>// no leads returned</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 6 }}>
              try adjusting filters or a different city
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Dashboard.jsx — Aurora v1
import { usePipeline } from '../hooks/usePipeline'
import StatCard from '../components/StatCard'

const STATUS_ORDER = ['new', 'contacted', 'responded', 'closed', 'skip']
const STATUS_COLORS = {
  new:       'var(--text-muted)',
  contacted: '#60a5fa',
  responded: 'var(--amber)',
  closed:    'var(--green)',
  skip:      'var(--red)',
}

export default function Dashboard() {
  const { leads, byStatus } = usePipeline()
  const all = Object.values(leads)
  const total = all.length

  const avgScore  = total ? (all.reduce((s, l) => s + (l.score || 0), 0) / total) : 0
  const contacted = byStatus('contacted').length
  const responded = byStatus('responded').length
  const closed    = byStatus('closed').length
  const convRate  = contacted > 0 ? Math.round((closed / contacted) * 100) : 0

  // Top niches
  const nicheCounts = {}
  all.forEach(l => {
    const k = l.type || 'other'
    nicheCounts[k] = (nicheCounts[k] || 0) + 1
  })
  const topNiches = Object.entries(nicheCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          // pipeline metrics · UK / AU beauty studio outreach
        </p>
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Leads"     value={total}     icon="⌖" color="var(--text)"          />
        <StatCard label="Avg Score"       value={avgScore}  icon="◈" color="var(--accent-bright)" suffix="/10" />
        <StatCard label="Contacted"       value={contacted} icon="💼" color="#60a5fa"              />
        <StatCard label="Responded"       value={responded} icon="↩" color="var(--amber)"         />
        <StatCard label="Closed"          value={closed}    icon="✓" color="var(--green)"         />
        <StatCard label="Conv. Rate"      value={convRate}  icon="%" color="var(--cyan)"          suffix="%" />
      </div>

      {/* Pipeline breakdown */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '0.875rem',
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
          Pipeline Breakdown
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {STATUS_ORDER.map(s => {
            const count = byStatus(s).length
            const pct   = total > 0 ? (count / total) * 100 : 0
            return (
              <div key={s}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: STATUS_COLORS[s], textTransform: 'capitalize' }}>
                    {s}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {count}
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: STATUS_COLORS[s],
                    borderRadius: 3,
                    boxShadow: `0 0 8px ${STATUS_COLORS[s]}`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top niches */}
      {topNiches.length > 0 && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            Top Niches
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {topNiches.map(([niche, count], i) => (
              <div key={niche} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', width: 16 }}>
                  {i + 1}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text)', flex: 1, textTransform: 'capitalize' }}>
                  {niche}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-bright)' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.2 }}>▦</div>
          <div>// no pipeline data yet</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 6 }}>
            run a scan and save leads to see stats here
          </div>
        </div>
      )}
    </div>
  )
}

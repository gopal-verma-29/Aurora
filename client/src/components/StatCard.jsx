// StatCard.jsx — Aurora v1
export default function StatCard({ label, value, suffix = '', color = 'var(--text)', icon }) {
  const display = typeof value === 'number'
    ? Math.round(value) + suffix
    : (value ?? '—')

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.5rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          {label}
        </p>
        {icon && <span style={{ fontSize: '1rem', opacity: 0.5 }}>{icon}</span>}
      </div>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: '2.2rem',
        fontWeight: 800,
        letterSpacing: '-2px',
        color,
        lineHeight: 1,
        animation: 'count-up 0.4s ease both',
      }}>
        {display}
      </p>
    </div>
  )
}

// SearchForm.jsx — Aurora v1
// CHANGED FROM v7:
//   - Full visual redesign — neon/dark aesthetic
//   - Language toggle (hindi/hinglish/english) → Output Mode toggle (linkedin/loom)
//   - City placeholder updated to UK/AU cities
//   - Niche placeholder updated to beauty studio niches
//   - RUN SCAN button with animated sweep effect
//   - Filter sliders recalibrated for UK/AU (minReviews default 15, minRating 3.5)

export default function SearchForm({ state, setField, onSearch, loading }) {
  const {
    niche, city, service,
    count, minRating, minReviews,
    outputMode,
  } = state

  const inputStyle = {
    width: '100%',
    background: 'var(--card)',
    border: '1px solid var(--border-bright)',
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const labelStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: '0.4rem',
  }

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
  }

  const MODES = [
    { key: 'linkedin', icon: '💼', label: 'LinkedIn' },
    { key: 'loom',     icon: '🎥', label: 'Loom Brief' },
  ]

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
    }}>

      {/* Row 1: Niche + City */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Niche</label>
          <input
            style={inputStyle}
            value={niche}
            onChange={e => setField('niche', e.target.value)}
            placeholder="lash studio, brow studio, beauty salon..."
            onKeyDown={e => e.key === 'Enter' && onSearch()}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>City / Region</label>
          <input
            style={inputStyle}
            value={city}
            onChange={e => setField('city', e.target.value)}
            placeholder="Leeds UK, Melbourne AU, Bristol UK..."
            onKeyDown={e => e.key === 'Enter' && onSearch()}
          />
        </div>
      </div>

      {/* Row 2: Service */}
      <div style={{ ...fieldStyle, marginBottom: '1rem' }}>
        <label style={labelStyle}>Your Service Offer</label>
        <input
          style={inputStyle}
          value={service}
          onChange={e => setField('service', e.target.value)}
          placeholder="modern website design, booking systems, mobile-first builds"
        />
      </div>

      {/* Row 3: Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>

        {/* Lead count */}
        <div style={fieldStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Leads</label>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-bright)' }}>{count}</span>
          </div>
          <input
            type="range" min={1} max={15} step={1}
            value={count}
            onChange={e => setField('count', parseInt(e.target.value))}
          />
        </div>

        {/* Min rating */}
        <div style={fieldStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Min Rating</label>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-bright)' }}>{parseFloat(minRating).toFixed(1)}★</span>
          </div>
          <input
            type="range" min={2.5} max={5} step={0.1}
            value={minRating}
            onChange={e => setField('minRating', parseFloat(e.target.value))}
          />
        </div>

        {/* Min reviews */}
        <div style={fieldStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Min Reviews</label>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-bright)' }}>{minReviews}+</span>
          </div>
          <input
            type="range" min={5} max={300} step={5}
            value={minReviews}
            onChange={e => setField('minReviews', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Row 4: Output Mode toggle */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>Output Mode</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setField('outputMode', m.key)}
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                border: outputMode === m.key
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border-bright)',
                background: outputMode === m.key
                  ? 'var(--accent-dim)'
                  : 'transparent',
                color: outputMode === m.key
                  ? 'var(--accent-bright)'
                  : 'var(--text-muted)',
                transition: 'all 0.15s',
                boxShadow: outputMode === m.key ? '0 0 12px var(--accent-dim)' : 'none',
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* RUN SCAN button */}
      <button
        onClick={onSearch}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.9rem',
          background: loading
            ? 'rgba(124,92,255,0.15)'
            : 'linear-gradient(135deg, var(--accent) 0%, #5b3fff 100%)',
          border: loading ? '1px solid var(--accent-dim)' : 'none',
          borderRadius: 'var(--radius-md)',
          color: loading ? 'var(--accent-bright)' : '#fff',
          fontSize: '0.9rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.06em',
          cursor: loading ? 'not-allowed' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: loading ? 'none' : '0 0 24px var(--accent-glow)',
          transition: 'all 0.2s',
        }}
      >
        {!loading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)',
            animation: 'scan-line 2.2s linear infinite',
          }} />
        )}
        <span style={{ position: 'relative', zIndex: 1 }}>
          {loading ? '⟳  SCANNING ...' : '⌖  RUN SCAN'}
        </span>
      </button>
    </div>
  )
}

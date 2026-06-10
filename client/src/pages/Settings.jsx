// Settings.jsx — Aurora v1
// CHANGED FROM v7:
//   - language toggle → outputMode toggle (linkedin/loom)
//   - Default city placeholder updated to UK/AU
//   - Default niche placeholder updated to beauty niches
//   - localStorage key: aurora-defaults (separate from India agent)
//   - All styles updated to Aurora design system

import { useState, useEffect } from 'react'
import { resetSeen, getSeenCount } from '../api'
import { usePipeline } from '../hooks/usePipeline'
import { useToast } from '../components/Toast'

const DEFAULT_SERVICE = 'modern website design, online booking systems & mobile-first builds'

export default function Settings() {
  const { leads } = usePipeline()
  const { add: toast } = useToast()
  const [seenCount, setSeenCount] = useState(0)
  const [form, setForm] = useState({
    niche:      '',
    city:       '',
    service:    DEFAULT_SERVICE,
    minRating:  3.5,
    minReviews: 15,
    outputMode: 'linkedin',
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aurora-defaults')
      if (stored) setForm(f => ({ ...f, ...JSON.parse(stored) }))
    } catch {}
    getSeenCount().then(d => setSeenCount(d.count)).catch(() => {})
  }, [])

  const card = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    marginBottom: '0.875rem',
  }

  const lbl = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: '0.4rem',
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border-bright)',
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
  }

  const MODES = [
    { key: 'linkedin', icon: '💼', label: 'LinkedIn' },
    { key: 'loom',     icon: '🎥', label: 'Loom Brief' },
  ]

  function save() {
    localStorage.setItem('aurora-defaults', JSON.stringify(form))
    toast('Defaults saved', 'success')
  }

  async function handleReset() {
    await resetSeen()
    setSeenCount(0)
    toast('Seen leads cleared', 'info')
  }

  function exportData(type) {
    const all = Object.values(leads)
    if (type === 'json') {
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `aurora-leads-${Date.now()}.json`
      a.click()
    } else {
      const headers = ['Name','Type','Address','Phone','Website','Score','Score Reason','LinkedIn Message','Loom Brief','Follow Up','Status','Maps URL']
      const rows = all.map(l => [
        l.name, l.type, l.address, l.phone, l.website,
        l.score, l.scoreReason,
        `"${(l.linkedinMessage||l.pitch||'').replace(/"/g,'""')}"`,
        `"${(l.loomBrief||'').replace(/"/g,'""')}"`,
        `"${(l.followUp||'').replace(/"/g,'""')}"`,
        l.status, l.googleMapsUrl,
      ].map(v => v ?? '').join(','))
      const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `aurora-leads-${Date.now()}.csv`
      a.click()
    }
    toast(`Exported as ${type.toUpperCase()}`, 'success')
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          // defaults · data management · export
        </p>
      </div>

      {/* Search defaults */}
      <div style={card}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
          Search Defaults
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div>
            <label style={lbl}>Default Niche</label>
            <input style={inputStyle} value={form.niche}
              onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
              placeholder="lash studio, brow studio, beauty salon..." />
          </div>

          <div>
            <label style={lbl}>Default City</label>
            <input style={inputStyle} value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="Leeds UK, Melbourne AU, Bristol UK..." />
          </div>

          <div>
            <label style={lbl}>Your Service</label>
            <input style={inputStyle} value={form.service}
              onChange={e => setForm(f => ({ ...f, service: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Min Rating</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-bright)' }}>{parseFloat(form.minRating).toFixed(1)}★</span>
              </div>
              <input type="range" min="2.5" max="5" step="0.1" value={form.minRating}
                onChange={e => setForm(f => ({ ...f, minRating: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Min Reviews</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-bright)' }}>{form.minReviews}+</span>
              </div>
              <input type="range" min="5" max="200" step="5" value={form.minReviews}
                onChange={e => setForm(f => ({ ...f, minReviews: parseInt(e.target.value) }))} />
            </div>
          </div>

          <div>
            <label style={lbl}>Default Output Mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {MODES.map(m => (
                <button key={m.key} onClick={() => setForm(f => ({ ...f, outputMode: m.key }))}
                  style={{
                    flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
                    border: form.outputMode === m.key ? '1px solid var(--accent)' : '1px solid var(--border-bright)',
                    background: form.outputMode === m.key ? 'var(--accent-dim)' : 'transparent',
                    color: form.outputMode === m.key ? 'var(--accent-bright)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={save} style={{
            background: 'linear-gradient(135deg, var(--accent), #5b3fff)',
            border: 'none', borderRadius: 'var(--radius-md)',
            padding: '0.75rem', fontSize: '0.9rem', fontWeight: 700,
            fontFamily: 'var(--font-display)', color: '#fff', cursor: 'pointer',
            boxShadow: '0 0 20px var(--accent-glow)',
            letterSpacing: '0.04em',
          }}>
            Save Defaults
          </button>
        </div>
      </div>

      {/* Export */}
      <div style={card}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Export Pipeline
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {Object.keys(leads).length} leads saved
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['csv', 'json'].map(t => (
            <button key={t} onClick={() => exportData(t)} style={{
              flex: 1, background: 'transparent',
              border: '1px solid var(--border-bright)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem', fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)', cursor: 'pointer',
              transition: 'all 0.15s',
              textTransform: 'uppercase',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-bright)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              Export {t}
            </button>
          ))}
        </div>
      </div>

      {/* Seen leads reset */}
      <div style={card}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Seen Leads
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {seenCount} businesses seen — reset to get fresh results
        </p>
        <button onClick={handleReset} style={{
          width: '100%', background: 'transparent',
          border: '1px solid rgba(255,61,90,0.3)',
          borderRadius: 'var(--radius-md)', padding: '0.65rem',
          fontSize: '0.82rem', fontFamily: 'var(--font-mono)',
          color: 'rgba(255,61,90,0.7)', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,61,90,0.3)'; e.currentTarget.style.color = 'rgba(255,61,90,0.7)' }}
        >
          Reset Seen Leads
        </button>
      </div>
    </div>
  )
}

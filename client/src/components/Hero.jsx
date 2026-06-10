import { useState, useEffect, useRef } from 'react'

const BOOT_LINES = [
  '> initialising aurora v1.0 ...',
  '> loading niche context maps ...',
  '> connecting anthropic api ...',
  '> connecting google maps api ...',
  '> website quality engine ready ...',
  '> linkedin outreach module loaded ...',
  '> loom brief generator ready ...',
  '> pipeline: UK / AU beauty studios ...',
  '> all systems nominal.',
  '> AURORA IS READY.',
]

export default function Hero({ onLaunch }) {
  const [lines, setLines]      = useState([])
  const [ready, setReady]      = useState(false)
  const [launching, setLaunch] = useState(false)
  const [fadeOut, setFadeOut]  = useState(false)
  const idxRef                 = useRef(0)

  // useRef keeps index stable across React StrictMode double-invoke
  useEffect(() => {
    idxRef.current = 0
    setLines([])
    setReady(false)
    const interval = setInterval(() => {
      const i = idxRef.current
      if (i >= BOOT_LINES.length) {
        clearInterval(interval)
        setTimeout(() => setReady(true), 400)
        return
      }
      const line = BOOT_LINES[i]
      if (line !== undefined) setLines(prev => [...prev, line])
      idxRef.current = i + 1
    }, 260)
    return () => clearInterval(interval)
  }, [])

  function handleLaunch() {
    setLaunch(true)
    setTimeout(() => setFadeOut(true), 400)
    setTimeout(() => onLaunch(), 900)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.5s ease',
      zIndex: 9999,
    }}>

      {/* Ambient blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: '55%', height: '55%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,92,255,0.18) 0%, transparent 70%)',
          animation: 'aurora-drift 14s ease-in-out infinite',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-5%',
          width: '60%', height: '60%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 70%)',
          animation: 'aurora-drift-2 18s ease-in-out infinite',
          filter: 'blur(50px)',
        }} />
      </div>

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(124,92,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,92,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '2rem',
        padding: '2rem', maxWidth: 540, width: '100%',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem',
            boxShadow: '0 0 32px var(--accent-glow), 0 0 64px rgba(0,229,255,0.15)',
            animation: ready ? 'pulse-glow 2.5s ease-in-out infinite' : 'none',
          }}>◈</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.8rem', fontWeight: 800,
            letterSpacing: '-2px', lineHeight: 1,
            background: 'linear-gradient(135deg, #ffffff 30%, var(--accent-bright) 60%, var(--cyan) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>AURORA</h1>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
            color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>UK · AU · Beauty Studio Pipeline · v1.0</p>
        </div>

        {/* Boot terminal */}
        <div style={{
          width: '100%',
          background: 'rgba(10,10,24,0.9)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem', minHeight: 220,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
          {/* Terminal bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: '1rem', paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red)', opacity: 0.7 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)', opacity: 0.7 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', opacity: 0.7 }} />
            <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              aurora — system boot
            </span>
          </div>

          {/* Lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {lines.map((line, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                color: line.includes('READY')   ? 'var(--green)'
                     : line.includes('nominal') ? 'var(--cyan)'
                     : 'var(--text-muted)',
                animation: 'fadeUp 0.3s ease both',
                fontWeight: line.includes('READY') ? 600 : 400,
              }}>
                {line}
              </div>
            ))}

            {/* Cursor */}
            {!ready && (
              <div style={{
                display: 'inline-block', width: 7, height: 14,
                background: 'var(--accent)', borderRadius: 2, marginTop: 2,
                animation: 'pulse-dot 1s ease-in-out infinite',
              }} />
            )}
          </div>
        </div>

        {/* Launch button */}
        <div style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.5s ease',
          width: '100%',
          pointerEvents: ready ? 'auto' : 'none',
        }}>
          <button
            onClick={handleLaunch}
            disabled={launching}
            style={{
              width: '100%', padding: '1rem',
              background: launching
                ? 'rgba(124,92,255,0.2)'
                : 'linear-gradient(135deg, var(--accent) 0%, #5b3fff 100%)',
              border: launching ? '1px solid var(--accent-dim)' : 'none',
              borderRadius: 'var(--radius-md)',
              color: '#fff', fontSize: '1rem', fontWeight: 700,
              fontFamily: 'var(--font-display)', letterSpacing: '0.05em',
              cursor: launching ? 'default' : 'pointer',
              position: 'relative', overflow: 'hidden',
              boxShadow: launching ? 'none' : '0 0 32px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.4)',
              transition: 'all 0.3s ease',
            }}
          >
            {!launching && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                animation: 'scan-line 2s linear infinite',
              }} />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {launching ? 'LAUNCHING ENGINE ...' : '⚡  LAUNCH AURORA'}
            </span>
          </button>
        </div>

      </div>
    </div>
  )
}

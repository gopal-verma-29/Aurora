import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { usePipeline } from '../hooks/usePipeline'

const NAV = [
  { to: '/',          icon: '⌖',  label: 'Scan'      },
  { to: '/pipeline',  icon: '◫',  label: 'Pipeline'  },
  { to: '/dashboard', icon: '▦',  label: 'Dashboard' },
  { to: '/settings',  icon: '⚙',  label: 'Settings'  },
]

export default function Sidebar() {
  const location = useLocation()
  const { leads } = usePipeline()
  const pipelineCount = Object.keys(leads).length
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside style={{
      width: collapsed ? 64 : 220,
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflow: 'hidden',
    }}>

      {/* ── Logo ─────────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '1.5rem 0' : '1.5rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0,
          boxShadow: '0 0 16px var(--accent-glow)',
        }}>
          ◈
        </div>
        {!collapsed && (
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(90deg, #fff, var(--accent-bright))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              AURORA
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              color: 'var(--text-dim)',
              letterSpacing: '0.12em',
              marginTop: 1,
            }}>
              PIPELINE 2 · UK/AU
            </div>
          </div>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav style={{
        flex: 1,
        padding: '0.75rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {NAV.map(({ to, icon, label }) => {
          const isActive = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: collapsed ? '0.75rem 0' : '0.75rem 1.25rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--text-muted)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s ease',
                position: 'relative',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span style={{
                fontSize: '1.1rem',
                filter: isActive ? `drop-shadow(0 0 6px var(--accent))` : 'none',
                transition: 'filter 0.15s',
                flexShrink: 0,
              }}>
                {icon}
              </span>
              {!collapsed && (
                <span style={{ fontFamily: 'var(--font-body)' }}>{label}</span>
              )}

              {/* Pipeline badge */}
              {!collapsed && label === 'Pipeline' && pipelineCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent-glow)',
                  color: 'var(--accent-bright)',
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 7px',
                  borderRadius: 20,
                }}>
                  {pipelineCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ── Bottom status ─────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '1rem 0' : '1rem 1.25rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: 'var(--green)',
          boxShadow: '0 0 8px var(--green)',
          animation: 'pulse-dot 2s ease-in-out infinite',
          flexShrink: 0,
        }} />
        {!collapsed && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--text-dim)',
            letterSpacing: '0.05em',
          }}>
            ENGINE ONLINE
          </span>
        )}
      </div>

      {/* ── Collapse toggle ───────────────────────────────── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0.75rem',
          color: 'var(--text-dim)',
          fontSize: '0.8rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderTop: '1px solid var(--border)',
          transition: 'color 0.15s',
        }}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? '›' : '‹'}
      </button>
    </aside>
  )
}

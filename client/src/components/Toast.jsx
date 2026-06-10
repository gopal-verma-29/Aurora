// Toast.jsx — Aurora v1 (same logic, Aurora colors)
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

const STYLES = {
  success: { bg: 'rgba(0,232,117,0.1)',   border: 'rgba(0,232,117,0.3)',  color: 'var(--green)'        },
  error:   { bg: 'var(--red-dim)',         border: 'rgba(255,61,90,0.3)',  color: 'var(--red)'          },
  info:    { bg: 'var(--accent-dim)',      border: 'rgba(124,92,255,0.3)', color: 'var(--accent-bright)'},
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ add }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const s = STYLES[t.type] || STYLES.info
          return (
            <div key={t.id} style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              color: s.color,
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              animation: 'fadeUp 0.3s ease both',
              backdropFilter: 'blur(8px)',
              boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
            }}>
              {t.message}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

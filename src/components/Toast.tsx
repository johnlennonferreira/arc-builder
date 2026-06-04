'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'loading'

interface Toast { id: number; msg: string; type: ToastType }

interface ToastCtx {
  toast: (msg: string, type?: ToastType, duration?: number) => void
  success: (msg: string) => void
  error:   (msg: string) => void
  info:    (msg: string) => void
}

const Ctx = createContext<ToastCtx>({
  toast: () => {}, success: () => {}, error: () => {}, info: () => {},
})

export function useToast() { return useContext(Ctx) }

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: '✓', iconColor: '#059669' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: '✕', iconColor: '#dc2626' },
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: 'ℹ', iconColor: '#5b8af7' },
  loading: { bg: '#f0fdfa', border: '#5eead4', icon: '⟳', iconColor: '#00d4aa' },
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let counter = 0

  const toast = useCallback((msg: string, type: ToastType = 'info', duration = 3500) => {
    const id = ++counter
    setToasts(prev => [...prev, { id, msg, type }])
    if (type !== 'loading') setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast])
  const error   = useCallback((msg: string) => toast(msg, 'error', 5000), [toast])
  const info    = useCallback((msg: string) => toast(msg, 'info'), [toast])

  return (
    <Ctx.Provider value={{ toast, success, error, info }}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => {
          const c = COLORS[t.type]
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: c.bg,
              border: '1px solid ' + c.border,
              borderRadius: 12, padding: '12px 16px',
              color: '#111827', fontSize: 13, fontWeight: 500,
              boxShadow: '0 4px 16px rgba(0,0,0,.10)',
              fontFamily: "'Inter', sans-serif",
              animation: 'slideIn 0.2s ease',
              minWidth: 220, maxWidth: 360,
              pointerEvents: 'all',
            }}>
              <span style={{
                color: c.iconColor, fontSize: 14, fontWeight: 700, flexShrink: 0,
                animation: t.type === 'loading' ? 'spin 1s linear infinite' : 'none',
              }}>{c.icon}</span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0 }}>×</button>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin    { from { transform: rotate(0deg); }                to { transform: rotate(360deg); } }
      `}</style>
    </Ctx.Provider>
  )
}

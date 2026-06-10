import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { PipelineProvider } from './hooks/usePipeline'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import Search from './pages/Search'
import Pipeline from './pages/Pipeline'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

export default function App() {
  const [launched, setLaunched] = useState(false)

  if (!launched) return <Hero onLaunch={() => setLaunched(true)} />

  return (
    <ToastProvider>
      <PipelineProvider>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: 'var(--font-body)',
        }}>
          <Sidebar />
          <main style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: '100vh',
            background: 'var(--bg)',
          }}>
            <Routes>
              <Route path="/"          element={<Search />}   />
              <Route path="/pipeline"  element={<Pipeline />} />
              <Route path="/dashboard" element={<Dashboard />}/>
              <Route path="/settings"  element={<Settings />} />
            </Routes>
          </main>
        </div>
      </PipelineProvider>
    </ToastProvider>
  )
}

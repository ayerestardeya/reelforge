import { useState, useCallback } from 'react'
import './App.css'

type AppState = 'idle' | 'dragging' | 'loaded'

export default function App() {
  const [state, setState] = useState<AppState>('idle')
  const [fileName, setFileName] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState('dragging')
  }, [])

  const handleDragLeave = useCallback(() => {
    setState('idle')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setFileName(file.name)
      setState('loaded')
    } else {
      setState('idle')
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setState('loaded')
    }
  }, [])

  const handleReset = useCallback(() => {
    setFileName(null)
    setState('idle')
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🎬</span>
          <span className="logo-text">ReelForge</span>
        </div>
        <p className="tagline">Craft your reel, frame by frame</p>
      </header>

      <main className="main">
        {state === 'loaded' && fileName ? (
          <div className="loaded-state">
            <div className="file-icon">🎞️</div>
            <h2>File loaded</h2>
            <p className="file-name">{fileName}</p>
            <p className="coming-soon">Editor coming soon…</p>
            <button className="btn-secondary" onClick={handleReset}>
              Load a different file
            </button>
          </div>
        ) : (
          <div
            className={`drop-zone ${state === 'dragging' ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-icon">📁</div>
            <h2>Drop your main video file here</h2>
            <p>or</p>
            <label className="btn-primary">
              Browse files
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            <p className="hint">Supports MP4, MOV, AVI, MKV, WebM</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>ReelForge — video reel creator <span className="version">v0.1.0</span></p>
      </footer>
    </div>
  )
}

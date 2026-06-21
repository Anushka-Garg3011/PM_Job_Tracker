import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function ResumePage() {
  const [resume, setResume] = useState('')
  const [saved, setSaved] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchLog, setSearchLog] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/resume').then(r => {
      if (r.data.resume) setResume(r.data.resume)
    }).catch(() => {})
  }, [])

  async function handleFileUpload(file) {
    if (!file) return
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const extOk = /\.(pdf|doc|docx)$/i.test(file.name)
    if (!allowed.includes(file.type) && !extOk) {
      setError('Only PDF, DOC, or DOCX files are supported.')
      return
    }
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await axios.post('/api/resume/upload', formData)
      setResume(data.text)
      setUploadedFileName(file.name)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to parse file.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  async function handleSave() {
    setError('')
    setSaved(false)
    try {
      await axios.post('/api/resume', { resume })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Failed to save resume.')
    }
  }

  async function handleSearch() {
    setError('')
    setSearchLog('')
    setSearching(true)

    // Save first
    try {
      await axios.post('/api/resume', { resume })
    } catch {
      setError('Failed to save resume before search.')
      setSearching(false)
      return
    }

    const evtSource = new EventSource('/api/search')
    // EventSource only does GET; use fetch + ReadableStream instead
    evtSource.close()

    const response = await fetch('/api/search', { method: 'POST' })
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const payload = JSON.parse(line.slice(6))
          if (payload.chunk) setSearchLog(prev => prev + payload.chunk)
          if (payload.done) {
            setSearching(false)
            navigate('/board')
          }
          if (payload.error) {
            setError(payload.error)
            setSearching(false)
          }
        } catch {}
      }
    }
    setSearching(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Resume</h1>
        <p className="page-subtitle">Upload or paste your resume — the AI agent will search for matching jobs posted in the last 48 hours.</p>
      </div>

      {/* Upload drop zone */}
      <div
        className={`upload-zone ${dragOver ? 'upload-zone-active' : ''} ${uploading ? 'upload-zone-loading' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: 'none' }}
          onChange={e => handleFileUpload(e.target.files[0])}
        />
        {uploading ? (
          <div className="upload-zone-content">
            <span className="spinner spinner-dark" />
            <span className="upload-label">Extracting text…</span>
          </div>
        ) : uploadedFileName ? (
          <div className="upload-zone-content">
            <span className="upload-file-icon">📄</span>
            <span className="upload-label"><strong>{uploadedFileName}</strong> — text extracted</span>
            <span className="upload-hint">Click or drop to replace</span>
          </div>
        ) : (
          <div className="upload-zone-content">
            <span className="upload-file-icon">⬆️</span>
            <span className="upload-label">Drop your resume here, or <u>browse</u></span>
            <span className="upload-hint">PDF, DOC, DOCX · max 10 MB</span>
          </div>
        )}
      </div>

      <div className="section-divider"><span>or paste text below</span></div>

      <div className="resume-card">
        <div className="resume-toolbar">
          <span className="char-count">{resume.length.toLocaleString()} chars</span>
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={handleSave} disabled={!resume.trim()}>
              Save
            </button>
            <button className="btn btn-primary" onClick={handleSearch} disabled={!resume.trim() || searching}>
              {searching ? (
                <><span className="spinner" /> Searching…</>
              ) : (
                <><span>🔍</span> Find Jobs</>
              )}
            </button>
          </div>
        </div>

        {saved && <div className="alert alert-success">Resume saved.</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <textarea
          className="resume-textarea"
          placeholder="Paste your resume text here (plain text or markdown)…"
          value={resume}
          onChange={e => { setResume(e.target.value); setUploadedFileName('') }}
          spellCheck={false}
        />
      </div>

      {searchLog && (
        <div className="search-log-card">
          <div className="search-log-header">
            <span className="search-log-dot" />
            <span>AI Agent running…</span>
          </div>
          <pre className="search-log-body">{searchLog}</pre>
        </div>
      )}
    </div>
  )
}

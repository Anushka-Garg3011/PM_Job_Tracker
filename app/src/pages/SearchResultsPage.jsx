import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function SearchResultsPage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/search/latest')
      .then(r => { setResult(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><div className="loading">Loading…</div></div>

  if (!result) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">AI Search Results</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No search run yet. Go to Resume and click <strong>Find Jobs</strong>.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Resume</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Search Results</h1>
          <p className="page-subtitle">Last run: {new Date(result.runAt).toLocaleString()}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Re-run Search</button>
      </div>
      <div className="results-card">
        <div
          className="results-markdown"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(result.result) }}
        />
      </div>
    </div>
  )
}

// Minimal markdown renderer (tables + headings + bold + code)
function markdownToHtml(md) {
  if (!md) return ''
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // headings
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // code blocks
    .replace(/```[\s\S]*?```/g, m => `<pre><code>${m.slice(3, -3).replace(/^\w*\n/, '')}</code></pre>`)
    // horizontal rule
    .replace(/^---$/gm, '<hr/>')
    // tables
    .replace(/(\|.+\|\n)(\|[-: |]+\|\n)((\|.+\|\n)*)/g, (_, header, sep, body) => {
      const th = header.split('|').filter((c, i, a) => i > 0 && i < a.length - 1).map(c => `<th>${c.trim()}</th>`).join('')
      const rows = body.trim().split('\n').map(row => {
        const cells = row.split('|').filter((c, i, a) => i > 0 && i < a.length - 1).map(c => `<td>${c.trim()}</td>`).join('')
        return `<tr>${cells}</tr>`
      }).join('')
      return `<table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`
    })
    // bullet lists
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    // numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // paragraphs
    .replace(/\n\n/g, '</p><p>')
  return `<p>${html}</p>`
}

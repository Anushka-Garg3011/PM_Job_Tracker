import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const SENIORITY_COLOR = { intern: '#6366f1', junior: '#3b82f6', mid: '#f59e0b', senior: '#10b981', lead: '#8b5cf6' }

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/profile').then(r => {
      if (r.data) { setProfile(r.data); setLoading(false) }
      else parseProfile()
    }).catch(() => parseProfile())
  }, [])

  async function parseProfile() {
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post('/api/profile/parse')
      setProfile(data)
    } catch (e) {
      setError(e.response?.data?.error || 'Could not parse resume. Make sure your resume is saved.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="page">
      <div className="profile-loading">
        <div className="profile-loading-spinner" />
        <p>Parsing your resume with AI…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Profile</h1></div>
      <div className="alert alert-error">{error}</div>
      <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate('/')}>Go to Resume</button>
    </div>
  )

  if (!profile) return (
    <div className="page">
      <div className="empty-state">
        <div className="empty-icon">👤</div>
        <p>No resume found. Add your resume first.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Add Resume</button>
      </div>
    </div>
  )

  const seniorityColor = SENIORITY_COLOR[profile.seniority] || '#64748b'

  return (
    <div className="page profile-page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <button className="btn btn-secondary" onClick={parseProfile}>↺ Re-parse</button>
      </div>

      {/* Hero card */}
      <div className="profile-hero">
        <div className="profile-avatar">{(profile.name || '?')[0].toUpperCase()}</div>
        <div className="profile-hero-info">
          <h2 className="profile-name">{profile.name || '—'}</h2>
          <p className="profile-role">{profile.currentRole || '—'}</p>
          <div className="profile-meta-row">
            {profile.location && <span className="profile-meta-item">📍 {profile.location}</span>}
            {profile.email    && <a href={`mailto:${profile.email}`} className="profile-meta-item">✉️ {profile.email}</a>}
            {profile.phone    && <span className="profile-meta-item">📞 {profile.phone}</span>}
            {profile.linkedin && <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noreferrer" className="profile-meta-item">🔗 LinkedIn</a>}
            {profile.github   && <a href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="profile-meta-item">🐙 GitHub</a>}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {profile.seniority && (
              <span className="profile-badge" style={{ background: seniorityColor + '22', color: seniorityColor, border: `1px solid ${seniorityColor}44` }}>
                {profile.seniority.charAt(0).toUpperCase() + profile.seniority.slice(1)} Level
              </span>
            )}
            {(profile.targetRoles || []).map((r, i) => (
              <span key={i} className="profile-badge profile-badge-target">{r}</span>
            ))}
          </div>
        </div>
        {profile.atsScore && (
          <div className="ats-score-box">
            <div className="ats-score-ring" style={{ '--pct': profile.atsScore }}>
              <span className="ats-score-number">{profile.atsScore}</span>
            </div>
            <span className="ats-score-label">ATS Score</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {profile.summary && (
        <Section title="Summary">
          <p className="profile-summary">{profile.summary}</p>
        </Section>
      )}

      {/* Skills */}
      {(profile.skills?.hard?.length > 0 || profile.skills?.soft?.length > 0) && (
        <Section title="Skills">
          <div className="skills-grid">
            {profile.skills?.hard?.length > 0 && (
              <div>
                <div className="skills-group-label">Technical</div>
                <div className="chips">{profile.skills.hard.map((s, i) => <span key={i} className="chip chip-hard">{s}</span>)}</div>
              </div>
            )}
            {profile.skills?.soft?.length > 0 && (
              <div>
                <div className="skills-group-label">Soft Skills</div>
                <div className="chips">{profile.skills.soft.map((s, i) => <span key={i} className="chip chip-soft">{s}</span>)}</div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Work Experience */}
      {profile.experience?.length > 0 && (
        <Section title="Work Experience">
          <div className="timeline">
            {profile.experience.map((exp, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-role">{exp.role}</span>
                    {exp.duration && <span className="timeline-duration">{exp.duration}</span>}
                  </div>
                  <div className="timeline-company">{exp.company}</div>
                  {exp.highlights?.length > 0 && (
                    <ul className="timeline-highlights">
                      {exp.highlights.map((h, j) => <li key={j}>{h}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {profile.education?.length > 0 && (
        <Section title="Education">
          <div className="edu-grid">
            {profile.education.map((edu, i) => (
              <div key={i} className="edu-card">
                <div className="edu-degree">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                <div className="edu-institution">{edu.institution}</div>
                {edu.year && <div className="edu-year">{edu.year}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {profile.certifications?.length > 0 && (
        <Section title="Certifications">
          <div className="cert-list">
            {profile.certifications.map((c, i) => {
              const name = typeof c === 'string' ? c : c.name
              const issuer = typeof c === 'object' ? c.issuer : ''
              const year = typeof c === 'object' ? c.year : ''
              return (
                <div key={i} className="cert-item">
                  <span className="cert-icon">🏅</span>
                  <div>
                    <div className="cert-name">{name}</div>
                    {(issuer || year) && <div className="cert-meta">{[issuer, year].filter(Boolean).join(' · ')}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Projects */}
      {profile.projects?.length > 0 && (
        <Section title="Projects">
          <div className="projects-grid">
            {profile.projects.map((p, i) => (
              <div key={i} className="project-card">
                <div className="project-name">{p.name}</div>
                {p.description && <p className="project-desc">{p.description}</p>}
                {p.tech?.length > 0 && (
                  <div className="chips" style={{ marginTop: 8 }}>
                    {p.tech.map((t, j) => <span key={j} className="chip chip-tech">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {profile.languages?.length > 0 && (
        <Section title="Languages">
          <div className="chips">{profile.languages.map((l, i) => <span key={i} className="chip chip-soft">{l}</span>)}</div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="profile-section">
      <h3 className="profile-section-title">{title}</h3>
      <div className="profile-section-body">{children}</div>
    </div>
  )
}

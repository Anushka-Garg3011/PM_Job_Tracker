export default function SearchedJobCard({ job, onRemove, onSave }) {
  const score = job.matchScore || 0
  const scoreColor = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#6366f1'

  return (
    <div className="searched-job-card">
      <div className="sjc-top">
        <div className="sjc-logo">{(job.company || '?')[0].toUpperCase()}</div>
        <div className="sjc-actions">
          <button className="sjc-btn sjc-btn-save" onClick={onSave} title="Save to Board">＋</button>
          <button className="sjc-btn sjc-btn-remove" onClick={onRemove} title="Remove">✕</button>
        </div>
      </div>

      <div className="sjc-title">{job.title || 'Untitled Role'}</div>
      <div className="sjc-company">{job.company || '—'}</div>

      <div className="sjc-meta">
        {job.location && <span className="meta-tag">📍 {job.location}</span>}
        {job.workType && (
          <span className="meta-tag">
            {job.workType === 'remote' ? '🌐' : job.workType === 'hybrid' ? '🏢' : '🏬'} {job.workType}
          </span>
        )}
        {job.salary && job.salary !== 'Not listed' && (
          <span className="meta-tag">💰 {job.salary}</span>
        )}
      </div>

      {job.whyMatch && (
        <p className="sjc-why">{job.whyMatch.length > 90 ? job.whyMatch.slice(0, 90) + '…' : job.whyMatch}</p>
      )}

      <div className="sjc-footer">
        <span className="match-badge" style={{ background: scoreColor + '22', color: scoreColor, border: `1px solid ${scoreColor}44` }}>
          {score}% match
        </span>
        {job.applyUrl && (
          <a href={job.applyUrl} target="_blank" rel="noreferrer" className="apply-link" onClick={e => e.stopPropagation()}>
            Apply →
          </a>
        )}
      </div>

      {job.missingSkills && job.missingSkills !== '—' && (
        <div className="sjc-missing">Gap: {job.missingSkills.length > 60 ? job.missingSkills.slice(0, 60) + '…' : job.missingSkills}</div>
      )}
    </div>
  )
}

export default function JobCard({ job, onEdit, onDelete }) {
  const scoreColor = job.matchScore >= 85 ? '#10b981' : job.matchScore >= 70 ? '#f59e0b' : job.matchScore ? '#6366f1' : '#94a3b8'

  return (
    <div className="job-card">
      <div className="job-card-top">
        <div className="job-company-logo">
          {(job.company || '?')[0].toUpperCase()}
        </div>
        <div className="job-card-actions">
          <button className="icon-btn" onClick={onEdit} title="Edit">✏️</button>
          <button className="icon-btn" onClick={onDelete} title="Delete">🗑️</button>
        </div>
      </div>

      <div className="job-title">{job.title || 'Untitled Role'}</div>
      <div className="job-company">{job.company || '—'}</div>

      <div className="job-meta">
        {job.location && <span className="meta-tag">📍 {job.location}</span>}
        {job.workType && <span className="meta-tag">{job.workType === 'remote' ? '🌐' : job.workType === 'hybrid' ? '🏢' : '🏬'} {job.workType}</span>}
        {job.salary && <span className="meta-tag">💰 {job.salary}</span>}
      </div>

      <div className="job-card-footer">
        {job.matchScore && (
          <span className="match-badge" style={{ background: scoreColor + '22', color: scoreColor, border: `1px solid ${scoreColor}44` }}>
            {job.matchScore}% match
          </span>
        )}
        {job.applyUrl && (
          <a href={job.applyUrl} target="_blank" rel="noreferrer" className="apply-link">Apply →</a>
        )}
      </div>

      {job.appliedAt && (
        <div className="job-date">Applied {new Date(job.appliedAt).toLocaleDateString()}</div>
      )}
    </div>
  )
}

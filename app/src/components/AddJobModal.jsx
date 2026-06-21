import { useState } from 'react'

export default function AddJobModal({ job, onSave, onClose }) {
  const [form, setForm] = useState({
    title: job?.title || '',
    company: job?.company || '',
    location: job?.location || '',
    salary: job?.salary || '',
    workType: job?.workType || 'remote',
    applyUrl: job?.applyUrl || '',
    matchScore: job?.matchScore || '',
    notes: job?.notes || '',
    appliedAt: job?.appliedAt ? job.appliedAt.slice(0, 10) : '',
  })

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, matchScore: form.matchScore ? Number(form.matchScore) : undefined })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{job ? 'Edit Job' : 'Add Job'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Job Title *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Product Manager" />
            </div>
            <div className="form-group">
              <label>Company *</label>
              <input required value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Anthropic" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bangalore / Remote" />
            </div>
            <div className="form-group">
              <label>Work Type</label>
              <select value={form.workType} onChange={e => set('workType', e.target.value)}>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Salary</label>
              <input value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="e.g. ₹18–22 LPA" />
            </div>
            <div className="form-group">
              <label>Match Score (%)</label>
              <input type="number" min="0" max="100" value={form.matchScore} onChange={e => set('matchScore', e.target.value)} placeholder="e.g. 88" />
            </div>
          </div>
          <div className="form-group">
            <label>Apply URL</label>
            <input type="url" value={form.applyUrl} onChange={e => set('applyUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label>Applied Date</label>
            <input type="date" value={form.appliedAt} onChange={e => set('appliedAt', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Recruiter name, next steps, impressions…" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{job ? 'Save Changes' : 'Add Job'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

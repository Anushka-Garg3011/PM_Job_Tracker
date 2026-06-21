import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'

const STAGE_ORDER = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected']
const STAGE_LABELS = { saved: 'Saved', applied: 'Applied', screening: 'Phone Screen', interview: 'Interview', offer: 'Offer', rejected: 'Rejected' }
const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444']

export default function StatsPage() {
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    axios.get('/api/jobs').then(r => setJobs(r.data)).catch(() => {})
  }, [])

  const total = jobs.length
  const applied = jobs.filter(j => !['saved'].includes(j.stage)).length
  const interviews = jobs.filter(j => ['interview', 'offer'].includes(j.stage)).length
  const offers = jobs.filter(j => j.stage === 'offer').length
  const rejected = jobs.filter(j => j.stage === 'rejected').length
  const responseRate = applied > 0 ? Math.round((interviews + offers) / applied * 100) : 0
  const offerRate = applied > 0 ? Math.round(offers / applied * 100) : 0

  const stageData = STAGE_ORDER.map(s => ({
    name: STAGE_LABELS[s],
    count: jobs.filter(j => j.stage === s).length
  }))

  // Applications over time (by createdAt date)
  const byDate = {}
  jobs.forEach(j => {
    const d = j.createdAt ? j.createdAt.slice(0, 10) : 'Unknown'
    byDate[d] = (byDate[d] || 0) + 1
  })
  const timelineData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), count }))

  // Match score distribution
  const scoredJobs = jobs.filter(j => j.matchScore)
  const scoreRanges = [
    { label: '90–100', count: scoredJobs.filter(j => j.matchScore >= 90).length },
    { label: '75–89', count: scoredJobs.filter(j => j.matchScore >= 75 && j.matchScore < 90).length },
    { label: '60–74', count: scoredJobs.filter(j => j.matchScore >= 60 && j.matchScore < 75).length },
    { label: '<60',   count: scoredJobs.filter(j => j.matchScore < 60).length },
  ]

  const avgScore = scoredJobs.length > 0
    ? Math.round(scoredJobs.reduce((s, j) => s + j.matchScore, 0) / scoredJobs.length)
    : null

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Statistics</h1>
        <p className="page-subtitle">Your application pipeline at a glance.</p>
      </div>

      {total === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>No jobs tracked yet. Add jobs on the Board to see stats.</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="kpi-grid">
            <KPI label="Total Tracked" value={total} />
            <KPI label="Applied" value={applied} />
            <KPI label="Interviews" value={interviews} color="#8b5cf6" />
            <KPI label="Offers" value={offers} color="#10b981" />
            <KPI label="Rejected" value={rejected} color="#ef4444" />
            <KPI label="Response Rate" value={`${responseRate}%`} color="#3b82f6" />
            <KPI label="Offer Rate" value={`${offerRate}%`} color="#10b981" />
            {avgScore !== null && <KPI label="Avg Match Score" value={`${avgScore}%`} color="#6366f1" />}
          </div>

          <div className="charts-grid">
            {/* Pipeline funnel bar chart */}
            <div className="chart-card">
              <h3 className="chart-title">Pipeline by Stage</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stageData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stageData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Timeline */}
            <div className="chart-card">
              <h3 className="chart-title">Applications Over Time</h3>
              {timelineData.length < 2 ? (
                <div className="chart-placeholder">Add more jobs on different dates to see trend.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={timelineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Match score pie */}
            {scoredJobs.length > 0 && (
              <div className="chart-card">
                <h3 className="chart-title">Match Score Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={scoreRanges} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ label, count }) => count > 0 ? `${label}: ${count}` : ''}>
                      {scoreRanges.map((_, i) => (
                        <Cell key={i} fill={['#10b981', '#6366f1', '#f59e0b', '#ef4444'][i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Work type breakdown */}
            <div className="chart-card">
              <h3 className="chart-title">Work Type Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={['remote', 'hybrid', 'onsite'].map(t => ({
                      name: t.charAt(0).toUpperCase() + t.slice(1),
                      value: jobs.filter(j => j.workType === t).length
                    })).filter(d => d.value > 0)}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label
                  >
                    {['#6366f1', '#3b82f6', '#f59e0b'].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KPI({ label, value, color = '#1e293b' }) {
  return (
    <div className="kpi-card">
      <div className="kpi-value" style={{ color }}>{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

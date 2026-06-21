import { useState, useEffect, useRef } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import axios from 'axios'
import JobCard from '../components/JobCard.jsx'
import SearchedJobCard from '../components/SearchedJobCard.jsx'
import AddJobModal from '../components/AddJobModal.jsx'

const BOARD_COLUMNS = [
  { id: 'saved',       label: 'Saved',        color: '#6366f1' },
  { id: 'applied',     label: 'Applied',       color: '#3b82f6' },
  { id: 'screening',   label: 'Phone Screen',  color: '#f59e0b' },
  { id: 'interview',   label: 'Interview',     color: '#8b5cf6' },
  { id: 'offer',       label: 'Offer',         color: '#10b981' },
  { id: 'rejected',    label: 'Rejected',      color: '#ef4444' },
]

const MIN_SEARCHED = 15

export default function BoardPage() {
  const [jobs, setJobs] = useState([])
  const [searchedJobs, setSearchedJobs] = useState([])
  const [isTopping, setIsTopping] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const toppingRef = useRef(false)

  useEffect(() => {
    fetchJobs()
    fetchSearchedJobs()
  }, [])

  async function fetchJobs() {
    const { data } = await axios.get('/api/jobs')
    setJobs(data)
  }

  async function fetchSearchedJobs() {
    const { data } = await axios.get('/api/searched-jobs')
    setSearchedJobs(data)
    if (data.length < MIN_SEARCHED) triggerTopup()
  }

  async function triggerTopup() {
    if (toppingRef.current) return
    toppingRef.current = true
    setIsTopping(true)
    try {
      const response = await fetch('/api/search/topup', { method: 'POST' })
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const p = JSON.parse(line.slice(6))
            if (p.done) {
              const { data } = await axios.get('/api/searched-jobs')
              setSearchedJobs(data)
            }
          } catch {}
        }
      }
    } catch {}
    toppingRef.current = false
    setIsTopping(false)
  }

  async function handleRemoveSearched(id) {
    const { data } = await axios.delete(`/api/searched-jobs/${id}`)
    setSearchedJobs(prev => prev.filter(j => j.id !== id))
    if (data.remaining < MIN_SEARCHED) triggerTopup()
  }

  async function handleSaveSearched(id) {
    const { data } = await axios.post(`/api/searched-jobs/${id}/save`)
    setSearchedJobs(prev => prev.filter(j => j.id !== id))
    setJobs(prev => [...prev, data.job])
    if (data.remaining < MIN_SEARCHED) triggerTopup()
  }

  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result
    if (!destination || source.droppableId === destination.droppableId) return
    if (destination.droppableId === 'jobsearched') return // can't drop into AI column

    if (source.droppableId === 'jobsearched') {
      // Drag from AI searched → board column
      const job = searchedJobs.find(j => j.id === draggableId)
      if (!job) return
      await axios.post(`/api/searched-jobs/${job.id}/save`)
      setSearchedJobs(prev => prev.filter(j => j.id !== draggableId))
      fetchJobs()
      const { data: remaining } = await axios.get('/api/searched-jobs')
      if (remaining.length < MIN_SEARCHED) triggerTopup()
      return
    }

    // Regular board drag
    setJobs(prev => prev.map(j => j.id === draggableId ? { ...j, stage: destination.droppableId } : j))
    await axios.put(`/api/jobs/${draggableId}`, { stage: destination.droppableId })
  }

  async function handleSaveJob(jobData) {
    if (editingJob) {
      const { data } = await axios.put(`/api/jobs/${editingJob.id}`, jobData)
      setJobs(prev => prev.map(j => j.id === editingJob.id ? data : j))
    } else {
      const { data } = await axios.post('/api/jobs', { stage: 'saved', ...jobData })
      setJobs(prev => [...prev, data])
    }
    setShowModal(false)
    setEditingJob(null)
  }

  async function handleDeleteJob(id) {
    await axios.delete(`/api/jobs/${id}`)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  const totalTracked = jobs.length
  const totalSearched = searchedJobs.length

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Board</h1>
          <p className="page-subtitle">{totalSearched} AI matches · {totalTracked} tracked</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingJob(null); setShowModal(true) }}>
          + Add Job
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">

          {/* ── Jobs Searched Column (AI) ── */}
          <div className="kanban-column kanban-column-ai">
            <div className="column-header">
              <span className="column-dot" style={{ background: '#0ea5e9' }} />
              <span className="column-label">Jobs Searched</span>
              <span className="column-count" style={{ background: '#e0f2fe', color: '#0369a1' }}>{totalSearched}</span>
              {isTopping && <span className="topup-spinner" title="Finding more jobs…" />}
            </div>
            <Droppable droppableId="jobsearched">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`column-cards column-cards-ai ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                >
                  {searchedJobs.map((job, index) => (
                    <Draggable key={job.id} draggableId={job.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={snapshot.isDragging ? 'dragging' : ''}
                        >
                          <SearchedJobCard
                            job={job}
                            onRemove={() => handleRemoveSearched(job.id)}
                            onSave={() => handleSaveSearched(job.id)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {isTopping && (
                    <div className="topup-skeleton">
                      <div className="skeleton-line w60" />
                      <div className="skeleton-line w40" />
                      <div className="skeleton-line w80" style={{ marginTop: 6 }} />
                    </div>
                  )}

                  {!isTopping && totalSearched === 0 && (
                    <div className="column-empty">Run a search from the Resume page</div>
                  )}
                </div>
              )}
            </Droppable>
          </div>

          {/* ── Regular Board Columns ── */}
          {BOARD_COLUMNS.map(col => (
            <div className="kanban-column" key={col.id}>
              <div className="column-header">
                <span className="column-dot" style={{ background: col.color }} />
                <span className="column-label">{col.label}</span>
                <span className="column-count">{jobs.filter(j => j.stage === col.id).length}</span>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`column-cards ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                  >
                    {jobs.filter(j => j.stage === col.id).map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'dragging' : ''}
                          >
                            <JobCard
                              job={job}
                              onEdit={() => { setEditingJob(job); setShowModal(true) }}
                              onDelete={() => handleDeleteJob(job.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {jobs.filter(j => j.stage === col.id).length === 0 && (
                      <div className="column-empty">Drop here</div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {showModal && (
        <AddJobModal
          job={editingJob}
          onSave={handleSaveJob}
          onClose={() => { setShowModal(false); setEditingJob(null) }}
        />
      )}
    </div>
  )
}

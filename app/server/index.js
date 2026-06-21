import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createRequire } from 'module'
import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'
import mammoth from 'mammoth'

// pdf-parse v1 ships CommonJS with a default function export
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env from project root (two levels up from server/)
const envPath = join(__dirname, '../../.env')
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  })
}

const DB_PATH = join(__dirname, 'db.json')
const AGENT_PATH = join(__dirname, '../../docs/job-search-agent.md')

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = /pdf|msword|vnd\.openxmlformats|doc|docx/.test(file.mimetype) ||
               /\.(pdf|doc|docx)$/i.test(file.originalname)
    cb(ok ? null : new Error('Only PDF, DOC, or DOCX files are allowed'), ok)
  }
})

// ── DB helpers ──────────────────────────────────────────────────────────────
function readDB() {
  if (!existsSync(DB_PATH)) return { jobs: [], resume: '', searchResults: [], searchedJobs: [], profile: null }
  const raw = JSON.parse(readFileSync(DB_PATH, 'utf8'))
  return { jobs: [], searchedJobs: [], searchResults: [], profile: null, resume: '', ...raw }
}
function writeDB(data) { writeFileSync(DB_PATH, JSON.stringify(data, null, 2)) }

// ── Parse markdown job table from AI output ──────────────────────────────────
function parseJobTable(markdown) {
  const lines = markdown.split('\n')
  let headerIdx = -1
  let headers = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('|') && line.includes('Match Score') && line.includes('Role')) {
      headers = line.split('|').map(h => h.trim()).filter(Boolean)
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) return []

  const jobs = []
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('|')) continue
    if (/^\|[\s\-:|]+\|$/.test(line)) continue

    const cells = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length < 4) continue

    const raw = {}
    headers.forEach((h, idx) => { raw[h] = cells[idx] || '' })

    const score = parseInt((raw['Match Score'] || '0').replace(/[^0-9]/g, '')) || 0
    if (score < 60) continue

    const wt = (raw['Work Type'] || '').toLowerCase()
    const workType = wt.includes('remote') ? 'remote' : wt.includes('hybrid') ? 'hybrid' : wt.includes('onsite') || wt.includes('on-site') ? 'onsite' : 'remote'

    // Strip markdown link syntax from apply URL: [text](url) → url
    let applyUrl = raw['Apply Link'] || ''
    const mdLink = applyUrl.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/)
    if (mdLink) applyUrl = mdLink[1]
    if (applyUrl.toLowerCase().startsWith('verify')) applyUrl = ''

    jobs.push({
      id: uuidv4(),
      title: raw['Role'] || '',
      company: raw['Company'] || '',
      location: raw['Location'] || '',
      salary: raw['Salary'] || 'Not listed',
      matchScore: score,
      workType,
      applyUrl,
      whyMatch: raw['Why It Matches'] || '',
      missingSkills: raw['Missing Skills'] || '',
      postedAt: raw['Posted'] || '',
      stage: 'jobsearched',
      source: 'ai-search',
      createdAt: new Date().toISOString()
    })
  }
  return jobs
}

function dedup(existing, incoming) {
  const keys = new Set(existing.map(j => `${j.company}::${j.title}`.toLowerCase()))
  return incoming.filter(j => !keys.has(`${j.company}::${j.title}`.toLowerCase()))
}

// ── Jobs (tracked board) ─────────────────────────────────────────────────────
app.get('/api/jobs', (_, res) => res.json(readDB().jobs))

app.post('/api/jobs', (req, res) => {
  const db = readDB()
  const job = { id: uuidv4(), createdAt: new Date().toISOString(), ...req.body }
  db.jobs.push(job)
  writeDB(db)
  res.json(job)
})

app.put('/api/jobs/:id', (req, res) => {
  const db = readDB()
  const idx = db.jobs.findIndex(j => j.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.jobs[idx] = { ...db.jobs[idx], ...req.body }
  writeDB(db)
  res.json(db.jobs[idx])
})

app.delete('/api/jobs/:id', (req, res) => {
  const db = readDB()
  db.jobs = db.jobs.filter(j => j.id !== req.params.id)
  writeDB(db)
  res.json({ ok: true })
})

// ── Resume ────────────────────────────────────────────────────────────────────
app.get('/api/resume', (_, res) => res.json({ resume: readDB().resume || '' }))

app.post('/api/resume/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' })
  const { buffer, mimetype, originalname } = req.file
  const isPdf  = mimetype === 'application/pdf' || /\.pdf$/i.test(originalname)
  const isDocx = /vnd\.openxmlformats/.test(mimetype) || /\.docx$/i.test(originalname)
  const isDoc  = mimetype === 'application/msword'    || /\.doc$/i.test(originalname)
  try {
    let text = ''
    if (isPdf)        { const p = await pdfParse(buffer);              text = p.text }
    else if (isDocx)  { const r = await mammoth.extractRawText({ buffer }); text = r.value }
    else if (isDoc)   { const r = await mammoth.extractRawText({ buffer }); text = r.value }
    else return res.status(400).json({ error: 'Unsupported file type.' })
    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    if (!text) return res.status(422).json({ error: 'Could not extract text. Try pasting manually.' })
    res.json({ text })
  } catch (err) {
    res.status(500).json({ error: `Parse error: ${err.message}` })
  }
})

app.post('/api/resume', (req, res) => {
  const { resume } = req.body
  if (!resume) return res.status(400).json({ error: 'Resume text required' })
  const db = readDB()
  db.resume = resume
  db.profile = null // invalidate cached profile on new resume
  writeDB(db)
  res.json({ ok: true })
})

// ── Profile ───────────────────────────────────────────────────────────────────
app.get('/api/profile', (_, res) => res.json(readDB().profile || null))

app.post('/api/profile/parse', async (_, res) => {
  const db = readDB()
  if (!db.resume) return res.status(400).json({ error: 'No resume saved' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })

  const client = new Anthropic({ apiKey })
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Extract structured profile data from this resume. Return ONLY valid JSON, no markdown fences, no explanation.

Use this exact schema (keep arrays empty [] if not found, strings empty "" if not found):
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "website": "",
  "seniority": "intern|junior|mid|senior|lead",
  "currentRole": "",
  "targetRoles": [],
  "summary": "",
  "skills": { "hard": [], "soft": [] },
  "experience": [{ "company": "", "role": "", "duration": "", "highlights": [] }],
  "education": [{ "institution": "", "degree": "", "field": "", "year": "" }],
  "certifications": [{ "name": "", "issuer": "", "year": "" }],
  "projects": [{ "name": "", "description": "", "tech": [] }],
  "languages": [],
  "atsScore": 70
}

Resume:
${db.resume}`
      }]
    })

    let text = msg.content[0].text.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    const profile = JSON.parse(text)
    const db2 = readDB()
    db2.profile = profile
    writeDB(db2)
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: `Profile parse failed: ${err.message}` })
  }
})

// ── Searched Jobs ─────────────────────────────────────────────────────────────
app.get('/api/searched-jobs', (_, res) => res.json(readDB().searchedJobs || []))

app.delete('/api/searched-jobs/:id', (req, res) => {
  const db = readDB()
  db.searchedJobs = (db.searchedJobs || []).filter(j => j.id !== req.params.id)
  writeDB(db)
  res.json({ ok: true, remaining: db.searchedJobs.length })
})

// Save a searched job → move to tracked board
app.post('/api/searched-jobs/:id/save', (req, res) => {
  const db = readDB()
  const job = (db.searchedJobs || []).find(j => j.id === req.params.id)
  if (!job) return res.status(404).json({ error: 'Not found' })
  db.searchedJobs = db.searchedJobs.filter(j => j.id !== req.params.id)
  const tracked = { ...job, id: uuidv4(), stage: 'saved', createdAt: new Date().toISOString() }
  db.jobs.push(tracked)
  writeDB(db)
  res.json({ ok: true, job: tracked, remaining: db.searchedJobs.length })
})

// ── Search (full agent run) ───────────────────────────────────────────────────
function runSearch(system, userContent, apiKey, onChunk, onDone, onError) {
  const client = new Anthropic({ apiKey })
  const stream = client.messages.stream({ model: 'claude-sonnet-4-6', max_tokens: 8000, system, messages: [{ role: 'user', content: userContent }] })
  let fullText = ''
  stream.on('text', t => { fullText += t; onChunk(t) })
  stream.on('finalMessage', () => onDone(fullText))
  stream.on('error', onError)
}

app.post('/api/search', async (_, res) => {
  const db = readDB()
  if (!db.resume) return res.status(400).json({ error: 'No resume saved' })

  let agentPrompt = ''
  try { agentPrompt = readFileSync(AGENT_PATH, 'utf8') }
  catch { return res.status(500).json({ error: 'Could not read job-search-agent.md' }) }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  runSearch(
    agentPrompt,
    `Here is my resume:\n\n${db.resume}\n\nRun the full job search workflow and return the complete structured output.`,
    apiKey,
    chunk => res.write(`data: ${JSON.stringify({ chunk })}\n\n`),
    fullText => {
      const newJobs = parseJobTable(fullText)
      const db2 = readDB()
      db2.searchResults = [{ id: uuidv4(), runAt: new Date().toISOString(), result: fullText }]
      const toAdd = dedup(db2.searchedJobs, newJobs)
      db2.searchedJobs = [...db2.searchedJobs, ...toAdd]
      writeDB(db2)
      res.write(`data: ${JSON.stringify({ done: true, jobsFound: toAdd.length, total: db2.searchedJobs.length })}\n\n`)
      res.end()
    },
    err => { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); res.end() }
  )
})

// ── Topup (add more jobs when below 15) ──────────────────────────────────────
app.post('/api/search/topup', async (_, res) => {
  const db = readDB()
  if (!db.resume) return res.status(400).json({ error: 'No resume saved' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })

  const existing = (db.searchedJobs || [])
    .map(j => `${j.company} — ${j.title}`).join('\n') || '(none)'

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const system = `You are a job search specialist. Search for real job postings from the last 48 hours and return results ONLY as a markdown table with these exact columns:

| # | Match Score | Role | Company | Location | Salary | Posted | Work Type | Why It Matches | Missing Skills | Apply Link |

Rules: only include jobs with match score ≥ 65. Find at least 10 new jobs. Never fabricate. Only real, active postings.`

  const userContent = `Find 10+ more job matches for this resume. DO NOT repeat these already-found jobs:
${existing}

Resume:
${db.resume}

Return only the markdown table.`

  runSearch(
    system,
    userContent,
    apiKey,
    chunk => res.write(`data: ${JSON.stringify({ chunk })}\n\n`),
    fullText => {
      const newJobs = parseJobTable(fullText)
      const db2 = readDB()
      const toAdd = dedup(db2.searchedJobs, newJobs)
      db2.searchedJobs = [...db2.searchedJobs, ...toAdd]
      writeDB(db2)
      res.write(`data: ${JSON.stringify({ done: true, added: toAdd.length, total: db2.searchedJobs.length })}\n\n`)
      res.end()
    },
    err => { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); res.end() }
  )
})

app.get('/api/search/latest', (_, res) => {
  const db = readDB()
  res.json((db.searchResults || []).at(-1) || null)
})

const PORT = 3001
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))

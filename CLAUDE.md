# CLAUDE.md

This file gives Claude Code context about the PM Job Tracker project.

@AGENTS.md

## Project Overview

PM Job Tracker is an AI-powered job search and tracking tool for Product Managers. It uses Claude to search for matching jobs, parse resumes into structured profiles, and help track applications through a Kanban board.

## Repository Structure

```
PM_Job_Tracker/
├── app/                        # Full-stack web application
│   ├── server/index.js         # Express API + Anthropic SDK integration
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ResumePage.jsx      # Resume upload + job search trigger
│   │   │   ├── BoardPage.jsx       # Kanban board with Jobs Searched column
│   │   │   ├── StatsPage.jsx       # Stats dashboard with charts
│   │   │   └── ProfilePage.jsx     # Parsed resume profile cards
│   │   ├── components/
│   │   │   ├── JobCard.jsx         # Card for tracked jobs (board)
│   │   │   ├── SearchedJobCard.jsx # Card for AI-found jobs
│   │   │   └── AddJobModal.jsx     # Add/edit job modal
│   │   └── styles/global.css       # All styles (light theme)
│   ├── package.json
│   └── vite.config.js          # Vite config with proxy to :3001
├── docs/
│   └── job-search-agent.md     # AI agent prompt (system prompt for Claude)
├── .env                        # ANTHROPIC_API_KEY (never committed)
├── .gitignore
├── AGENTS.md                   # Agent documentation
└── README.md                   # Setup instructions
```

## Running the App

```bash
cd app
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Data stored in: app/server/db.json (auto-created, git-ignored)

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/resume | Save resume text |
| POST | /api/resume/upload | Upload PDF/DOCX, returns extracted text |
| POST | /api/profile/parse | Parse resume → structured JSON profile |
| GET  | /api/profile | Get cached profile |
| POST | /api/search | Run full AI job search (SSE stream) |
| POST | /api/search/topup | Add more jobs when below 15 (SSE stream) |
| GET  | /api/searched-jobs | Get AI-found jobs list |
| DELETE | /api/searched-jobs/:id | Remove a searched job |
| POST | /api/searched-jobs/:id/save | Move searched job → tracked board |
| GET/POST/PUT/DELETE | /api/jobs | CRUD for tracked board jobs |

## Environment Variables

```
ANTHROPIC_API_KEY=your_key_here   # Required — get from console.anthropic.com
```

## Models Used

- **claude-sonnet-4-6** — job search agent (full search + scoring)
- **claude-haiku-4-5-20251001** — profile parsing (fast, structured extraction)

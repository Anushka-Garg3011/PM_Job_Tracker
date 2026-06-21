# PM Job Tracker 🎯

An AI-powered job tracking tool built for Product Managers. Upload your resume, let the AI find matching jobs posted in the last 48 hours, track applications on a Kanban board, and monitor your pipeline with a stats dashboard.

---

## Features

### 📄 Resume Upload
- Upload PDF, DOC, or DOCX — text is extracted automatically
- Or paste resume text directly
- Click **Find Jobs** to run the AI job search agent

### 🔍 AI Job Search Agent
- Searches 20+ job boards: LinkedIn, Indeed, Naukri, Wellfound, Greenhouse, Lever, YC, Remotive, Remote OK, and more
- Scores every match out of 100 based on skills, experience, ATS keywords, and preferred requirements
- Only shows jobs with a match score ≥ 65
- Automatically keeps 15+ fresh matches at all times (auto-refills when count drops)

### 📋 Kanban Board
- **Jobs Searched** column — AI-populated, auto-refills to 15+ jobs
- Drag jobs across stages: Saved → Applied → Phone Screen → Interview → Offer → Rejected
- Save any AI-found job to your tracked board with one click
- Add, edit, and delete jobs manually

### 👤 Profile
- AI parses your resume into structured cards:
  - Personal info, contact links, seniority level
  - Hard skills and soft skills
  - Work experience timeline
  - Education, certifications, projects
  - ATS strength score

### 📊 Stats Dashboard
- Pipeline breakdown by stage
- Applications over time
- Match score distribution
- Work type breakdown (remote / hybrid / onsite)
- KPIs: response rate, offer rate, average match score

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router |
| Drag & Drop | @hello-pangea/dnd |
| Charts | Recharts |
| Backend | Node.js, Express |
| AI | Anthropic Claude (Sonnet for search, Haiku for profile parsing) |
| File Parsing | pdf-parse, mammoth |
| Data | File-based JSON (local) |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Anushka-Garg3011/PM_Job_Tracker.git
cd PM_Job_Tracker
```

### 2. Add your Anthropic API key

Create a `.env` file in the root:

```
ANTHROPIC_API_KEY=your_api_key_here
```

Get your key at [console.anthropic.com](https://console.anthropic.com)

### 3. Install dependencies

```bash
cd app
npm install
```

### 4. Run the app

```bash
npm run dev
```

Open **http://localhost:5173**

---

## Project Structure

```
PM_Job_Tracker/
├── app/
│   ├── server/              # Express API + Claude integration
│   ├── src/
│   │   ├── pages/           # Resume, Board, Stats, Profile
│   │   ├── components/      # JobCard, SearchedJobCard, AddJobModal
│   │   └── styles/          # Global CSS
│   └── vite.config.js
├── docs/
│   └── job-search-agent.md  # AI agent prompt & search instructions
├── .env                     # API key (not committed)
└── .gitignore
```

---

## Job Search Agent

The agent in `docs/job-search-agent.md` defines the full search workflow:
- Extracts your profile from the resume
- Searches all listed job boards for postings from the last 48 hours
- Scores each role across 7 factors (skills, experience, ATS keywords, education, etc.)
- Returns structured output with match reasons, missing skills, and apply links

---

## Notes

- Job data is stored locally in `app/server/db.json` (auto-created, git-ignored)
- The `.env` file is git-ignored — never commit your API key
- Resume and profile are cached locally and re-parsed on demand

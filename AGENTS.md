# Agents

## Job Search Agent

The primary agent for this project is defined in [`docs/job-search-agent.md`](docs/job-search-agent.md).

It acts as an elite AI recruiting assistant and performs the following workflow when invoked:

1. **Profile Extraction** — parses the user's resume into structured data (skills, experience, education, seniority, ATS keywords, target roles)
2. **Job Search** — searches 20+ live job boards for postings from the last 48 hours (LinkedIn, Indeed, Naukri, Wellfound, Greenhouse, Lever, YC, Remotive, Remote OK, and more)
3. **Match Scoring** — scores every role out of 100 across 7 weighted factors (skill overlap, experience level, ATS keywords, industry fit, preferred JD requirements, education, location)
4. **Structured Output** — returns a results table, top 10 picks, ATS keyword analysis, resume improvement tips, skill gap analysis, and application strategy

### How to invoke

From the app: upload your resume on the **Resume** page and click **Find Jobs**.

From Claude Code directly:
```
Use the job-search-agent from docs/job-search-agent.md.
My resume is in docs/resume.md.
Find me jobs posted in the last 48 hours.
```

### Match Score Thresholds

| Score | Action |
|---|---|
| 95–100 | Perfect fit. Apply immediately. |
| 85–94 | Strong fit. Very high interview probability. |
| 75–84 | Good fit. Apply with minor resume tweaks. |
| 60–74 | Moderate fit. Only apply if company/comp is exceptional. |
| < 60 | Not included. |

---

## Project Context

**PM Job Tracker** is an AI-powered job search and tracking tool for Product Managers.

- Resume upload (PDF/DOCX) → AI job search → Kanban board tracking → Stats dashboard
- Built with React + Vite (frontend), Express + Anthropic SDK (backend)
- All data stored locally in `app/server/db.json`
- See [README.md](README.md) for full setup instructions

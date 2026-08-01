# Study Planner — Personal Adaptive Study Scheduler

A study scheduling site built for GATE CS 2027 + MAKAUT B.Tech IT + placement prep,
with an Indian/Bengali-aware calendar, rollover of missed study hours, and an
AI agent that generates your next day's plan + a motivational note.

## Folder layout

```
study-planner/
  frontend/   -> React (Vite) + Tailwind + Framer Motion. The website itself.
  backend/    -> Express API. Owns the data, the rollover math, semester switching.
  ai/         -> Gemini-backed AI calls. Backend imports this; frontend never talks to it directly.
```

Keeping `ai/` separate means your API key stays on the backend and is never exposed to the browser.

## Running it locally

### 1. Backend (start this first)
```bash
cd backend
npm install
cp .env.example .env      # then paste your Gemini key into .env
npm run dev
```
Runs on http://localhost:4000

Set either `GEMINI_API_KEY` or `GOOGLE_API_KEY` in your local `.env` file.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173 and calls the backend at localhost:4000.

## What's real vs. what's a starting point

- Calendar, animation, daily plan UI, rollover logic, semester-switch flow: fully working.
- Data storage: **in-memory** in the backend (resets on server restart) so you can run this
  tonight with zero setup. Swap `backend/lib/store.js` for Supabase/Postgres calls when
  you're ready to persist across restarts — every other file stays the same.
- `subjects.json` / `events-bengali.json`: seeded with placeholder topics. Replace with your
  real MAKAUT 5th-sem syllabus and actual Bengali festival dates for the year.
- AI calls: real Gemini API calls, but you must supply your own API key in `backend/.env`.

## Deploying to Vercel or Render

- Set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) in your hosting platform's environment variables.
- Do not hardcode the key in the source code.
- After changing the key or pushing code changes, redeploy the service so the new environment values are loaded.
- If you update the code and want the live site to reflect it, push the change and trigger a new deployment.

## Next steps (in order)
1. Edit `backend/data/subjects.json` with your real subjects/topics.
2. Edit `frontend/src/data/events-bengali.json` with this year's real festival dates.
3. Get an Anthropic API key and drop it in `backend/.env`.
4. Later: replace `backend/lib/store.js` in-memory arrays with a real database.

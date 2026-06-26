Deployment to Vercel

- Frontend (this repo root) expects these environment variables in Vercel Project Settings (Build & Runtime env):
  - `VITE_SUPABASE_URL` (example: https://your-project.supabase.co)
  - `VITE_SUPABASE_ANON_KEY` (publishable/anon key)
  - `VITE_BACKEND_URL` (if you host the backend separately)

- Backend (if you deploy the `backend/` folder separately) needs server-only env vars set in its hosting provider (do NOT expose service role key to client):
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY` (optional)
  - `SUPABASE_SERVICE_ROLE_KEY` (service role - secret)
  - `DATABASE_URL` (if using external DB)

Steps to deploy frontend on Vercel (quick):
1. Push repo to GitHub
2. In Vercel, create a new Project → import the GitHub repo
3. Set the environment variables listed above in Project Settings
4. Vercel will run `npm run build` (make sure `package.json` has a `build` script - this repo uses Vite)

Notes:
- I removed the Firebase env vars from `/.env` because the app now uses Supabase for auth. If you still need Firebase helpers, re-add the values in Vercel env settings.
- Keep `SUPABASE_SERVICE_ROLE_KEY` strictly server-side. Do not add it to the frontend Vercel environment.

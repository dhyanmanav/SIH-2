# CAPACITY CONNECT

A training portal for IMD staff — trainees, trainers, and admins each get their own
dashboard, built on React + Supabase.

## 1. Create your Supabase project

1. Go to https://supabase.com/dashboard → **New project**.
2. Once it's ready, open **SQL Editor → New query**.
3. Paste the entire contents of `supabase_schema.sql` (in this folder) and click **Run**.
   This creates every table, security rule, and the trigger that auto-creates a profile
   whenever someone signs up.

## 2. Get your API URL and key

In your Supabase project: **Settings → API**.
- Copy **Project URL**
- Copy the **anon public** key

## 3. Connect the app to Supabase

In this project folder:

```bash
cp .env.example .env
```

Open `.env` and paste your values:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

## 4. Install and run

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

## 5. Create your first admin

1. In the app, sign up choosing role **Admin**.
2. In Supabase: **Table Editor → profiles**, find your row, and set `status` to
   `approved` (new accounts start as `pending` so any admin can vet them — the first
   one has to be approved manually, this way, in the dashboard).
3. Sign in — you'll land on the admin dashboard, where you can approve everyone else
   from then on.

## What's included

- **Trainee**: browse and enroll in courses, watch/read uploaded material, take
  adaptive multiple-choice tests (question difficulty adjusts to how you're doing),
  rate courses, collect sealed certificates.
- **Trainer**: create courses, upload material, build quizzes with difficulty-tagged
  questions, see who's enrolled and how they're progressing.
- **Admin**: approve sign-ups, assign/re-assign trainers to courses with AI-suggested
  matches based on trainer skills, post announcements, see org-wide stats and a
  participation-by-region breakdown.
- **Security**: Supabase Row Level Security so trainees only ever see their own
  enrollments/certificates, trainers only manage their own courses, and only approved
  admins can approve people or post announcements.
- **Certificates**: each one gets a unique SHA-256 seal generated at issue time, so it
  can't be silently altered after the fact. Trainees can download a certificate PDF,
  and anyone can verify a certificate publicly using its hash or QR code at `/verify`.

## Deploying

Any static host works (Vercel, Netlify, GitHub Pages). Build with:

```bash
npm run build
```

This creates a `dist/` folder — upload that. Remember to set the same two environment
variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in your host's dashboard.

The production build is also an installable PWA. It caches the application shell and
static assets for faster repeat loads, while Supabase authentication and database
requests always use the network. When the service-worker cache version changes,
previous application caches are removed automatically.

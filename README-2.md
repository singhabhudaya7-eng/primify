# PrimeOS — Gamified Habit Tracker

> Turn discipline into power. Earn points by completing daily habits. Fight dragons. Unlock rewards.

## Features
- ✅ Daily habit tracking with points
- 🔥 Streak system (miss a day = dragon heals)
- 🎯 Goal tracking with progress bars
- 🐉 Dragon Arena — spend points to attack bosses
- ⚔️ Weapon Shop — buy better weapons
- 🎁 Rewards — redeem real-life treats with earned points
- 🔐 Supabase auth + full Row Level Security

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Supabase setup
1. Go to [supabase.com](https://supabase.com) → create a new project
2. Go to **SQL Editor** → paste the full contents of `schema.sql` → click **Run**
3. Go to **Project Settings → API** → copy your Project URL and anon key

### 3. Environment variables
Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel / Netlify

### Vercel
```bash
npm i -g vercel
vercel
```
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel dashboard under **Settings → Environment Variables**.

### Netlify
```bash
npm run build
# drag the dist/ folder to netlify.com/drop
```
Or connect your GitHub repo and add env vars in **Site Settings → Environment**.

---

## Push to GitHub
```bash
git init
git add .
git commit -m "initial commit: PrimeOS habit tracker"
# create a repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/primeos.git
git branch -M main
git push -u origin main
```

---

## Project Structure
```
src/
├── App.tsx                  # Routes
├── main.tsx                 # Entry point
├── index.css                # Design tokens + global styles
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── store.ts             # Zustand auth store
│   └── utils.ts             # Helpers (cn, todayStr, etc.)
├── types/
│   ├── database.ts          # TypeScript interfaces
│   └── weapons.ts           # Weapon definitions & dragon list
├── hooks/
│   ├── useAuth.ts           # Auth + profile bootstrap
│   ├── useHabits.ts         # Habits + daily completion
│   ├── useGoals.ts          # Goal CRUD + progress
│   ├── useStreak.ts         # Streak query
│   ├── useGame.ts           # Dragon + inventory + weapons
│   └── useRewards.ts        # Rewards + redemption
├── pages/
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── HabitsPage.tsx
│   ├── GoalsPage.tsx
│   ├── DragonPage.tsx
│   ├── ShopPage.tsx
│   └── RewardsPage.tsx
└── components/ui/
    ├── Layout.tsx            # Sidebar + nav
    ├── LoadingScreen.tsx
    ├── Modal.tsx
    └── ProgressBar.tsx
```

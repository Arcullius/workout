# Falcon FitPal

Falcon FitPal is a full-stack workout companion built with Expo + React Native and Supabase.

## Features

- Email/password auth with persistent sessions
- Protected routes for authenticated users
- Workout templates with exercise builder
- Supersets, drop sets, rest-pause notes, and exercise cues
- Drag-and-drop exercise reordering
- Live workout logging with set completion checkboxes
- Auto-start rest timer after set completion
- Add/remove sets during live session
- Session notes, workout history, and per-exercise progression table
- Delete confirmations for workouts and session records

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Create `.env` file in project root:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. In Supabase SQL Editor, run schema from:

   - `supabase/schema.sql`

4. Start app:

   ```bash
   npx expo start
   ```

## Data Model

- `users` (linked to Supabase Auth)
- `workouts` (templates)
- `exercises` (ordered exercise items with superset metadata)
- `sessions` (live/completed workouts)
- `set_logs` (per-set targets and actual logs)

## Notes

- App theme uses navy background (`#0A1628`), white cards, and electric blue accents (`#1E90FF`).
- Supabase Row Level Security policies are included in `supabase/schema.sql`.

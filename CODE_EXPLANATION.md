# Falcon FitPal Code Explanation (Beginner-Friendly)

This guide explains how our app is structured and why files like `[id].tsx` exist.

---

## 1) Big Picture: How our app is organized

Our app uses **Expo Router** (file-based routing). That means:

- Files/folders in `app/` automatically become screens/routes.
- Route groups like `(tabs)` and `(auth)` organize screens but usually do not appear in the URL.
- Dynamic route files like `[id].tsx` create routes that accept parameters.

Main folders we use:

- `app/` → screens (routing)
- `lib/` → clients like Supabase setup
- `providers/` → global state/context (`AuthProvider`)
- `types/` → TypeScript DB row shapes
- `constants/` → colors/theme values

---

## 2) Root app flow (`app/_layout.tsx`)

File: `app/_layout.tsx`

This file is our app shell and does 3 important jobs:

1. Wraps the app with `GestureHandlerRootView` (needed for drag/gesture components).
2. Wraps the app with `AuthProvider` so auth/session state is available everywhere.
3. Defines top-level stack routes:
   - `(auth)` for sign-in
   - `(tabs)` for main app
   - detail routes:
     - `workouts/[id]`
     - `sessions/[id]`
     - `history/[id]`

### Auth guard logic

Inside `RootNavigator`, it checks:

- if the user is **not logged in** and route is not auth route → redirect to `/(auth)/sign-in`
- if the user **is logged in** and route is auth route → redirect to `/(tabs)`

That is what protects our app screens.

---

## 3) Why `[id].tsx` exists

This is the part we asked about specifically.

`[id].tsx` is a **dynamic route file**.

Example files:

- `app/workouts/[id].tsx`
- `app/sessions/[id].tsx`
- `app/history/[id].tsx`

These let one file handle many records.

### Example

If we navigate to:

- `/sessions/abc123`

Expo Router loads:

- `app/sessions/[id].tsx`

and `id` will be `abc123`.

Inside code:

```ts
const { id } = useLocalSearchParams<{ id: string }>();
```

That `id` is used in Supabase queries:

```ts
supabase.from('sessions').select('*').eq('id', id)
```

So `[id].tsx` means:

- “Use this screen for any session/workout/history item”
- “Read the item ID from the route, then load that specific data”

Without `[id].tsx`, we would need separate files for every single record, which is impossible.

---

## 4) Session screen deep explanation (`app/sessions/[id].tsx`)

File: `app/sessions/[id].tsx`

This is our **live workout screen**.

### State variables

- `session` → the current session row (`sessions` table)
- `setLogs` → all set logs for this session (`set_logs` + exercise info)
- `notes` → session notes text
- `remaining` → rest timer seconds

### `load()`

`load()` fetches in parallel:

- session info from `sessions`
- set logs + related exercise fields from `set_logs`

Then it sorts by:

1. exercise order (`order_index`)
2. set number

so display is stable and predictable.

### Rest timer effect

```ts
useEffect(() => {
  if (!remaining) return;
  const timer = setInterval(...)
  return () => clearInterval(timer)
}, [remaining])
```

This decrements timer every second and cleans the interval correctly.

### Completing a set

`onCompleteToggle()`:

- toggles `completed`
- writes to Supabase (`updateSet`)
- triggers haptic feedback
- starts rest timer using `exercise.rest_seconds` (fallback 90)

### Add/remove sets during session

- `addSet(exerciseId)` inserts a new `set_logs` row with `maxSet + 1`
- `removeSet(setId)` deletes a set row

This supports our requirement to modify sets live.

### Finish vs leave

- **Finish Session** sets `ended_at` and redirects to history.
- **Leave Session (Keep Active)** does not set `ended_at`; it just navigates away so the session can be resumed.

---

## 5) Workouts screen (`app/(tabs)/workouts.tsx`)

This screen now does both:

1. Template management (create/start/edit workout)
2. Active session resume list

### Why this matters

We removed the separate Log tab, so this page now includes active sessions.

It loads in parallel:

- `workouts` owned by the user
- active `sessions` where `ended_at IS NULL`

This keeps “start session” and “resume session” in one place.

---

## 6) Data model mapping (Supabase)

Our UI maps directly to tables:

- `workouts` → templates
- `exercises` → exercise definitions in template
- `sessions` → one performed workout instance
- `set_logs` → per-set targets + actual performance

Flow:

1. Start session from a workout
2. Insert `sessions` row
3. Seed `set_logs` from template exercises
4. During workout, update `set_logs`
5. Finish workout by setting `sessions.ended_at`

---

## 7) Safe area + iPhone Dynamic Island

We now use `SafeAreaView` with `edges={['top']}` in key screens.

That ensures top content starts below the status area/Dynamic Island.

---

## 8) Common confusion: route groups vs real routes

Folders like `(tabs)` and `(auth)` are **group names**, not typical URL path segments.

That’s why auth checks should use router segments (as our code does), not fragile string assumptions.

---

## 9) If we want to trace one user action end-to-end

Example: tap **Start Session** in workouts.

1. `app/(tabs)/workouts.tsx` → `startSession(workout)`
2. Insert into `sessions`
3. Load exercises for workout
4. Seed `set_logs`
5. Navigate to `/sessions/{sessionId}`
6. `app/sessions/[id].tsx` reads `{sessionId}` using `useLocalSearchParams`
7. Screen loads and renders that session

---

## 10) Quick glossary

- **Dynamic route**: route that accepts params, e.g. `[id].tsx`
- **Param**: value from URL/route (our `id`)
- **RLS**: Row-Level Security in Supabase
- **Session (table)**: performed workout instance
- **Auth session**: logged-in user token/session (different concept)

---

If we want, we can also create a second markdown file with a **screen-by-screen diagram** (navigation + data flow arrows) for even easier understanding.
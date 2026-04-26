# Falcon FitPal Code Explanation (Robust Walkthrough)

This guide is a deeper explanation of how our app works end-to-end, with special focus on drag-and-drop behavior and session logging internals.

---

## 1) Mental model of our app

We can think about our app in 4 layers:

1. **Routing layer** (`app/`)
  - What screen we are on
  - How route params like `id` get read
2. **State/UI layer** (React state + JSX)
  - What the user sees
  - What changes instantly on screen
3. **Data layer** (Supabase)
  - What gets saved in DB tables
  - What gets loaded and transformed
4. **Platform layer** (safe area, gestures, haptics)
  - iPhone notch/dynamic island spacing
  - drag gestures
  - tactile feedback

When debugging, it helps to ask: “Which layer is failing?”

---

## 2) Routing architecture: why files become screens

We use Expo Router file-based routing:

- `app/(tabs)/workouts.tsx` → workouts tab screen
- `app/sessions/[id].tsx` → session details for one session ID
- `app/workouts/[id].tsx` → workout builder for one workout ID

Route groups:

- `(auth)` and `(tabs)` are organization groups
- They are not always literal URL path text

Top stack registration is in `app/_layout.tsx`, where we define which screens are in the root stack and what header behavior they use.

---

## 3) Why `[id].tsx` exists (detailed)

`[id].tsx` is a dynamic route segment.

It means:

- One screen file can represent many concrete pages
- The concrete item is selected by the route param `id`

Examples:

- `/workouts/7fb1...` opens our workout-builder details for that workout row
- `/sessions/57aa...` opens our live session page for that session row

Inside each dynamic page, we read this param:

```ts
const { id } = useLocalSearchParams<{ id: string }>();
```

Then we use it in Supabase queries:

```ts
supabase.from('sessions').select('*').eq('id', id)
```

So `[id].tsx` is the bridge between navigation and database row identity.

---

## 4) Root layout behavior (`app/_layout.tsx`)

Our root layout does the following:

1. Wraps app with `GestureHandlerRootView`
  - Required for `react-native-gesture-handler`
  - If missing, drag/gesture components can crash or not respond
2. Wraps app with `AuthProvider`
  - Makes auth session/user available globally
3. Applies route protection
  - Not logged in → force auth flow
  - Logged in + currently in auth flow → send to tabs
4. Defines stack detail screens
  - `workouts/[id]`, `sessions/[id]`, `history/[id]`

This is why we can navigate from tabs into detail pages and still have proper headers.

---

## 5) Supabase data model and ownership

Our important entities:

- `workouts`: template containers
- `exercises`: template exercise lines (ordered)
- `sessions`: one performed workout instance
- `set_logs`: set-by-set tracking rows inside a session

Core relationship chain:

`workout` → many `exercises`

`session` belongs to one `workout`

`session` → many `set_logs`

`set_log` points to one exercise + set number + targets + actuals + completion state

---

## 6) Workouts tab flow (`app/(tabs)/workouts.tsx`)

This screen now combines:

- Template creation
- Active session resume list
- Template list + start/edit actions

### Load behavior

We load workouts and active sessions in parallel with `Promise.all`.

Why this is good:

- Faster first render than sequential calls
- One loading state for both blocks

### Start session behavior

On “Start Session”:

1. Insert a row in `sessions`
2. Read template exercises for that workout
3. Create seed rows in `set_logs` for each set of each exercise
4. Navigate to `/sessions/{newSessionId}`

So session pages always start with concrete rows in DB.

---

## 7) Workout builder flow + dragging internals (`app/workouts/[id].tsx`)

This is where drag-and-drop is implemented.

### Main component used

`DraggableFlatList` from `react-native-draggable-flatlist`

Key props we use:

- `data={exercises}`
- `keyExtractor={(item) => item.id}`
- `renderItem={renderExercise}`
- `onDragEnd={({ data }) => saveOrder(data)}`

### How drag is initiated

Inside `renderExercise`, each row receives `drag` from the library.

We call it from long press:

```tsx
<Pressable onLongPress={drag} ...>
```

So drag starts only when long-pressing a row.

### What happens when drag ends

`onDragEnd` provides reordered list.

We call `saveOrder(data)`:

1. Update local state immediately: `setExercises(items)`
2. Persist order to Supabase by writing `order_index` for each row

This is optimistic-first UI + DB sync.

### Why `order_index` matters

Everywhere we fetch exercises, we sort by `order_index`.

That means drag order is stable across app restarts and across users/devices.

### Dependency requirements for drag

For drag to work, we need:

- `GestureHandlerRootView` at app root
- Reanimated + gesture handler configured
- Stable item keys (`id`)

If any of these are missing, gestures can fail or throw runtime errors.

---

## 8) Live session flow internals (`app/sessions/[id].tsx`)

This is our most state-heavy screen.

### Local state overview

- `session`: session metadata row
- `setLogs`: detailed set entries joined with exercise info
- `notes`: editable session notes
- `remaining`: seconds for rest timer

### Data load strategy

`load()` fetches two things in parallel:

- session row
- set log rows with exercise fields

Then we normalize ordering by:

1. `exercises.order_index`
2. `set_number`

This guarantees exercise grouping and set ordering are deterministic.

### Grouping algorithm

We create a `Map<exercise_id, setLogs[]>` and convert to array.

That powers UI blocks where each exercise has its own card with multiple sets.

### Updating one set

`updateSet(setId, payload)`:

1. Persist partial update in Supabase
2. Patch matching set in local state

This avoids full re-fetch for small edits.

### Completion + haptic + timer sequence

On checkbox tap:

1. Toggle `completed`
2. Write DB update
3. Fire success haptic (`expo-haptics`)
4. Start countdown from exercise-specific rest or default 90 sec

### Timer lifecycle

When `remaining > 0`:

- Interval ticks every second
- State decrements until 0
- Cleanup clears interval when dependency changes/unmounts

This prevents orphan intervals.

### Dynamic set management

`addSet(exerciseId)`:

- Finds max existing set number for that exercise
- Inserts `max + 1` row into DB
- Appends inserted row to local state

`removeSet(setId)`:

- Deletes row in DB
- Removes row from local state

### Finish vs leave behavior

- **Finish Session** sets `ended_at` and routes to history
- **Leave Session** routes away without setting `ended_at` so session remains resumable

---

## 9) History screens

### `app/(tabs)/history.tsx`

- Loads completed sessions (`ended_at` not null)
- Loads recent set logs and groups by exercise name
- Renders simple progression table (date, weight, reps)

### `app/history/[id].tsx`

- Loads one session + all logged sets
- Shows target vs actuals for each set
- Supports delete with confirmation

---

## 10) Auth and session persistence

Auth context lives in `providers/auth-provider.tsx`.

It exposes:

- `signIn`
- `signUp`
- `signOut`
- current `session` and `user`

Supabase client is configured in `lib/supabase.ts` with safe storage behavior so auth can still work when native storage APIs are unavailable.

---

## 11) UI/platform details

### Safe area

Most top-level screens use `SafeAreaView edges={['top']}` to avoid clipping under iPhone Dynamic Island/notch.

### Gestures

Drag support depends on gesture-handler root wrapping and draggable list row gesture lifecycle.

### Haptics

Set completion gives tactile confirmation using `NotificationFeedbackType.Success`.

---

## 12) Common debugging map

If something breaks, we can check by symptom:

- **Cannot navigate to detail screen**
  - Check route file exists (`[id].tsx`) and push path is correct
- **Page opens but no data**
  - Verify `id` param exists and matches DB row
- **Drag does not work**
  - Verify app root has `GestureHandlerRootView`
  - Verify rows call `drag` on long press
  - Verify each row key is stable (`item.id`)
- **Session not resumable**
  - Check whether `ended_at` was set accidentally
- **Back arrow odd behavior**
  - Check header back fallback config in root stack options

---

## 13) End-to-end examples

### Example A: reorder exercises

1. Open workout builder detail `/workouts/{id}`
2. Long-press exercise row
3. Drag row to new position
4. Release (drop)
5. `onDragEnd` fires
6. Local list updates
7. `order_index` writes to DB
8. Future fetches show same order

### Example B: start and complete session

1. Tap Start Session in workouts list
2. Session row inserted
3. Set logs seeded
4. Navigate to `/sessions/{id}`
5. Enter actual weights/reps
6. Mark sets complete (haptic + timer)
7. Save notes
8. Finish session (`ended_at` set)
9. Session appears in history list

---

## 14) Glossary

- **Dynamic route**: route with params, e.g. `[id].tsx`
- **Route param**: value extracted from path, e.g. `id`
- **Optimistic UI**: update UI first, then sync backend
- **RLS**: Row-Level Security in Supabase
- **Auth session**: login/token state
- **Workout session row**: performed workout instance in `sessions`

---

If we want next, we can add a diagram section with ASCII flow charts for:

- navigation flow
- drag event lifecycle
- session data lifecycle from template → logs → history
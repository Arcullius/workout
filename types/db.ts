export type WorkoutRow = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  default_rest_seconds: number | null;
  created_at: string;
};

export type ExerciseRow = {
  id: string;
  workout_id: string;
  name: string;
  order_index: number;
  target_sets: number;
  target_reps: number | null;
  target_weight: number | null;
  superset_group: string | null;
  drop_set: boolean;
  rest_pause_notes: string | null;
  notes: string | null;
  rest_seconds: number | null;
};

export type SessionRow = {
  id: string;
  user_id: string;
  workout_id: string;
  name: string;
  session_notes: string | null;
  started_at: string;
  ended_at: string | null;
};

export type SetLogRow = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  target_reps: number | null;
  target_weight: number | null;
  actual_reps: number | null;
  actual_weight: number | null;
  completed: boolean;
  created_at: string;
};

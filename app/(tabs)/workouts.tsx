import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/palette';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { SessionRow, WorkoutRow } from '@/types/db';

export default function WorkoutsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [activeSessions, setActiveSessions] = useState<SessionRow[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    const [{ data: workoutsData, error: workoutsError }, { data: sessionsData, error: sessionsError }] = await Promise.all([
      supabase.from('workouts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false }),
    ]);

    if (workoutsError || sessionsError) {
      Alert.alert('Error', workoutsError?.message ?? sessionsError?.message ?? 'Could not load workouts.');
      setLoading(false);
      return;
    }

    setWorkouts((workoutsData as WorkoutRow[]) ?? []);
    setActiveSessions((sessionsData as SessionRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const createWorkout = async () => {
    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        name: 'New Workout',
        default_rest_seconds: 90,
      })
      .select('id')
      .single();

    if (error || !data) {
      Alert.alert('Create failed', error?.message ?? 'Could not create workout.');
      return;
    }

    // Navigate to the workout builder
    router.push(`/workouts/${data.id}`);
  };

  const startSession = async (workout: WorkoutRow) => {
    if (!user) {
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        workout_id: workout.id,
        name: workout.name,
      })
      .select('id')
      .single();

    if (sessionError || !sessionData) {
      Alert.alert('Start failed', sessionError?.message ?? 'Could not start session.');
      return;
    }

    const { data: exercises, error: exError } = await supabase
      .from('exercises')
      .select('*')
      .eq('workout_id', workout.id)
      .order('order_index', { ascending: true });

    if (exError) {
      Alert.alert('Warning', exError.message);
      router.push(`/sessions/${sessionData.id}`);
      return;
    }

    const seedLogs = (exercises ?? []).flatMap((exercise) => {
      const targetSets = Number(exercise.target_sets) || 0;
      return Array.from({ length: targetSets }, (_, idx) => ({
        session_id: sessionData.id,
        exercise_id: exercise.id,
        set_number: idx + 1,
        target_reps: exercise.target_reps,
        target_weight: exercise.target_weight,
        completed: false,
      }));
    });

    if (seedLogs.length) {
      const { error: logsError } = await supabase.from('set_logs').insert(seedLogs);
      if (logsError) {
        Alert.alert('Warning', logsError.message);
      }
    }

    router.push(`/sessions/${sessionData.id}`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Workout Builder</Text>

      <View style={styles.card}>
          <Pressable style={styles.primaryButton} onPress={createWorkout}>
          <Text style={styles.primaryText}>Create New Workout</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Active Sessions</Text>
      {activeSessions.length === 0 ? (
        <View style={styles.workoutCard}>
          <Text style={styles.workoutMeta}>No active sessions.</Text>
        </View>
      ) : (
        activeSessions.map((session) => (
          <View style={styles.workoutCard} key={session.id}>
            <Text style={styles.workoutTitle}>{session.name}</Text>
            <Text style={styles.workoutMeta}>Started {new Date(session.started_at).toLocaleString()}</Text>
            <View style={styles.row}>
              <Pressable style={styles.primaryButton} onPress={() => router.push(`/sessions/${session.id}`)}>
                <Text style={styles.primaryText}>Resume Session</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Your Templates</Text>
      {loading ? <ActivityIndicator color={palette.accent} /> : workouts.map((workout) => (
        <View style={styles.workoutCard} key={workout.id}>
          <Text style={styles.workoutTitle}>{workout.name}</Text>
          <View style={styles.row}>
            <Pressable style={styles.secondaryButton} onPress={() => router.push(`/workouts/${workout.id}`)}>
              <Text style={styles.secondaryText}>Edit Template</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => startSession(workout)}>
              <Text style={styles.primaryText}>Start Session</Text>
            </Pressable>
          </View>
        </View>
      ))}
        {!loading && workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySubtitle}>Create your first training template to get started.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.navy },
  content: { padding: 14, gap: 12, paddingBottom: 40 },
  heading: { color: '#fff', fontWeight: '800', fontSize: 28, marginBottom: 4 },
  card: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: palette.text },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: palette.text,
    backgroundColor: '#F6F9FC',
  },
  sectionTitle: { color: '#D0DBEB', fontSize: 16, fontWeight: '700', marginTop: 4 },
  workoutCard: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  workoutTitle: { color: palette.text, fontSize: 18, fontWeight: '800' },
  workoutMeta: { color: palette.muted, fontSize: 13 },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  primaryButton: {
    flex: 1,
    backgroundColor: palette.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  secondaryText: { color: palette.text, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#10203A',
    borderRadius: 12,
    padding: 16,
  },
  emptyEmoji: { fontSize: 30 },
  emptyTitle: { color: '#fff', fontWeight: '700', fontSize: 18, marginTop: 6 },
  emptySubtitle: { color: '#C0CEE3', textAlign: 'center', marginTop: 4 },
});

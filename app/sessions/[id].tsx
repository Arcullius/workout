import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '@/constants/palette';
import { supabase } from '@/lib/supabase';
import { SessionRow, SetLogRow } from '@/types/db';

type SetLogWithExercise = SetLogRow & {
  exercises: {
    id: string;
    name: string;
    order_index: number;
    superset_group: string | null;
    rest_seconds: number | null;
  } | null;
};

export default function SessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [session, setSession] = useState<SessionRow | null>(null);
  const [setLogs, setSetLogs] = useState<SetLogWithExercise[]>([]);
  const [notes, setNotes] = useState('');
  const [remaining, setRemaining] = useState(0);

  const load = useCallback(async () => {
    if (!id) {
      return;
    }
    const [{ data: sessionData, error: sessionError }, { data: logsData, error: logsError }] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', id).single(),
      supabase
        .from('set_logs')
        .select('*, exercises(id,name,order_index,superset_group,rest_seconds)')
        .eq('session_id', id)
        .order('set_number', { ascending: true }),
    ]);

    if (sessionError || logsError) {
      Alert.alert('Load failed', sessionError?.message ?? logsError?.message ?? 'Could not load session.');
      return;
    }

    setSession((sessionData as SessionRow) ?? null);
    setNotes(sessionData?.session_notes ?? '');
    const ordered = ((logsData as SetLogWithExercise[]) ?? []).sort((a, b) => {
      const aOrder = a.exercises?.order_index ?? 999;
      const bOrder = b.exercises?.order_index ?? 999;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.set_number - b.set_number;
    });
    setSetLogs(ordered);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!remaining) {
      return;
    }
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining]);

  const exerciseGroups = useMemo(() => {
    const map = new Map<string, SetLogWithExercise[]>();
    setLogs.forEach((row) => {
      const key = row.exercise_id;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(row);
    });
    return Array.from(map.values());
  }, [setLogs]);

  const updateSet = async (setId: string, payload: Partial<SetLogRow>) => {
    const { error } = await supabase.from('set_logs').update(payload).eq('id', setId);
    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    setSetLogs((prev) => prev.map((log) => (log.id === setId ? { ...log, ...payload } as SetLogWithExercise : log)));
  };

  const onCompleteToggle = async (row: SetLogWithExercise) => {
    const nextCompleted = !row.completed;
    await updateSet(row.id, { completed: nextCompleted });

    if (nextCompleted) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const rest = row.exercises?.rest_seconds ?? 90;
      setRemaining(rest);
    }
  };

  const addSet = async (exerciseId: string) => {
    const logsForExercise = setLogs.filter((log) => log.exercise_id === exerciseId);
    const maxSet = Math.max(...logsForExercise.map((log) => log.set_number), 0);
    const template = logsForExercise[0];

    const { data, error } = await supabase
      .from('set_logs')
      .insert({
        session_id: id,
        exercise_id: exerciseId,
        set_number: maxSet + 1,
        target_reps: template?.target_reps ?? null,
        target_weight: template?.target_weight ?? null,
        completed: false,
      })
      .select('*, exercises(id,name,order_index,superset_group,rest_seconds)')
      .single();

    if (error || !data) {
      Alert.alert('Add set failed', error?.message ?? 'Unable to add set.');
      return;
    }

    setSetLogs((prev) => [...prev, data as SetLogWithExercise]);
  };

  const removeSet = async (setId: string) => {
    const { error } = await supabase.from('set_logs').delete().eq('id', setId);
    if (error) {
      Alert.alert('Remove failed', error.message);
      return;
    }
    setSetLogs((prev) => prev.filter((log) => log.id !== setId));
  };

  const saveNotes = async () => {
    const { error } = await supabase.from('sessions').update({ session_notes: notes }).eq('id', id);
    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    Alert.alert('Saved', 'Session notes updated.');
  };

  const finishSession = () => {
    Alert.alert('Finish session', 'Mark this session complete?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          const { error } = await supabase.from('sessions').update({ ended_at: new Date().toISOString(), session_notes: notes }).eq('id', id);
          if (error) {
            Alert.alert('Finish failed', error.message);
            return;
          }
          router.replace('/(tabs)/history');
        },
      },
    ]);
  };

  const leaveSession = () => {
    router.replace('/(tabs)/workouts');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{session?.name ?? 'Live Session'}</Text>
      {remaining > 0 ? (
        <View style={styles.timer}>
          <Text style={styles.timerText}>Rest Timer: {remaining}s</Text>
        </View>
      ) : null}

      {exerciseGroups.map((group) => {
        const exercise = group[0]?.exercises;
        const superset = exercise?.superset_group;
        return (
          <View key={group[0]?.exercise_id} style={styles.card}>
            <Text style={styles.exerciseTitle}>{exercise?.name ?? 'Exercise'}</Text>
            <Text style={styles.meta}>Superset: {superset || 'None'}</Text>
            {group.map((set) => (
              <View key={set.id} style={styles.setRow}>
                <Pressable style={[styles.checkbox, set.completed && styles.checkboxDone]} onPress={() => onCompleteToggle(set)}>
                  <Text style={styles.checkboxText}>{set.completed ? '✓' : ''}</Text>
                </Pressable>
                <Text style={styles.setLabel}>Set {set.set_number}</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="decimal-pad"
                  value={set.actual_weight?.toString() ?? ''}
                  placeholder={set.target_weight?.toString() ?? 'wt'}
                  placeholderTextColor={palette.muted}
                  onChangeText={(value) => {
                    const parsed = value ? Number(value) : null;
                    setSetLogs((prev) => prev.map((row) => (row.id === set.id ? { ...row, actual_weight: parsed } : row)));
                  }}
                  onBlur={() => updateSet(set.id, { actual_weight: set.actual_weight ?? null })}
                />
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={set.actual_reps?.toString() ?? ''}
                  placeholder={set.target_reps?.toString() ?? 'reps'}
                  placeholderTextColor={palette.muted}
                  onChangeText={(value) => {
                    const parsed = value ? Number(value) : null;
                    setSetLogs((prev) => prev.map((row) => (row.id === set.id ? { ...row, actual_reps: parsed } : row)));
                  }}
                  onBlur={() => updateSet(set.id, { actual_reps: set.actual_reps ?? null })}
                />
                <Pressable onPress={() => removeSet(set.id)}>
                  <Text style={styles.remove}>✕</Text>
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addSetButton} onPress={() => addSet(group[0].exercise_id)}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </Pressable>
          </View>
        );
      })}

      <View style={styles.card}>
        <Text style={styles.exerciseTitle}>Session Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="How did this session feel?"
          placeholderTextColor={palette.muted}
          multiline
          style={[styles.smallInput, { minHeight: 80, textAlignVertical: 'top' }]}
        />
        <Pressable style={styles.addSetButton} onPress={saveNotes}>
          <Text style={styles.addSetText}>Save Notes</Text>
        </Pressable>
      </View>

      <Pressable style={styles.leaveButton} onPress={leaveSession}>
        <Text style={styles.leaveText}>Leave Session (Keep Active)</Text>
      </Pressable>

      <Pressable style={styles.finishButton} onPress={finishSession}>
        <Text style={styles.finishText}>Finish Session</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.navy },
  content: { padding: 12, gap: 10, paddingBottom: 40 },
  heading: { color: '#fff', fontSize: 24, fontWeight: '800' },
  timer: { backgroundColor: '#10203A', borderRadius: 10, padding: 10 },
  timerText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: palette.card, borderRadius: 12, padding: 10, gap: 8 },
  exerciseTitle: { color: palette.text, fontWeight: '800', fontSize: 17 },
  meta: { color: palette.muted, fontSize: 13 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: palette.success, borderColor: palette.success },
  checkboxText: { color: '#fff', fontWeight: '700' },
  setLabel: { color: palette.text, width: 50, fontWeight: '700' },
  smallInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: palette.text,
    backgroundColor: '#F6F9FC',
  },
  remove: { color: palette.danger, fontWeight: '700', fontSize: 18, paddingHorizontal: 6 },
  addSetButton: { backgroundColor: '#EAF3FF', borderRadius: 8, alignItems: 'center', paddingVertical: 8 },
  addSetText: { color: palette.accent, fontWeight: '700' },
  leaveButton: {
    backgroundColor: '#EAF3FF',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  leaveText: {
    color: palette.accent,
    fontWeight: '700',
  },
  finishButton: { backgroundColor: palette.accent, borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  finishText: { color: '#fff', fontWeight: '800' },
});

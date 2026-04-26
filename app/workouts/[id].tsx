import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/palette';
import { supabase } from '@/lib/supabase';
import { ExerciseRow, WorkoutRow } from '@/types/db';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutRow | null>(null);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [workoutName, setWorkoutName] = useState('');
  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('8');
  const [weight, setWeight] = useState('');
  const [supersetGroup, setSupersetGroup] = useState('');
  const [dropSet, setDropSet] = useState(false);
  const [restPauseNotes, setRestPauseNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      return;
    }

    const [{ data: workoutData, error: workoutError }, { data: exerciseData, error: exerciseError }] = await Promise.all([
      supabase.from('workouts').select('*').eq('id', id).single(),
      supabase.from('exercises').select('*').eq('workout_id', id).order('order_index', { ascending: true }),
    ]);

    if (workoutError || exerciseError) {
      Alert.alert('Load failed', workoutError?.message ?? exerciseError?.message ?? 'Could not load workout details.');
      return;
    }

    setWorkout((workoutData as WorkoutRow) ?? null);
    setWorkoutName((workoutData as WorkoutRow)?.name ?? '');
    setExercises((exerciseData as ExerciseRow[]) ?? []);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const addExercise = () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Exercise name is required.');
      return;
    }

    const newExercise: ExerciseRow = {
      id: `temp_${Date.now()}`,
      workout_id: id!,
      name: name.trim(),
      order_index: exercises.length,
      target_sets: Number(sets) || 3,
      target_reps: reps ? Number(reps) : null,
      target_weight: weight ? Number(weight) : null,
      superset_group: supersetGroup.trim() || null,
      drop_set: dropSet,
      rest_pause_notes: restPauseNotes.trim() || null,
      notes: notes.trim() || null,
      rest_seconds: 90,
    };

    setExercises([...exercises, newExercise]);

    setName('');
    setSets('3');
    setReps('8');
    setWeight('');
    setSupersetGroup('');
    setDropSet(false);
    setRestPauseNotes('');
    setNotes('');
  };

  const saveOrder = (items: ExerciseRow[]) => {
    setExercises(items);
  };

  const deleteExercise = (exerciseId: string) => {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId));
  };

  const deleteWorkout = () => {
    Alert.alert('Delete workout', 'Delete this workout and all exercises?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) {
            return;
          }
          const { error } = await supabase.from('workouts').delete().eq('id', id);
          if (error) {
            Alert.alert('Delete failed', error.message);
            return;
          }
          Alert.alert('Deleted', 'Workout removed. Go back to templates.');
        },
      },
    ]);
  };

  const saveWorkout = async () => {
    if (!id || !workoutName.trim()) {
      Alert.alert('Error', 'Workout name cannot be empty.');
      return;
    }

    setIsSaving(true);

    try {
      // Update workout name
      const { error: nameError } = await supabase
        .from('workouts')
        .update({ name: workoutName.trim() })
        .eq('id', id);

      if (nameError) {
        Alert.alert('Save failed', nameError.message);
        setIsSaving(false);
        return;
      }

      // Delete old exercises
      const { error: deleteError } = await supabase.from('exercises').delete().eq('workout_id', id);

      if (deleteError) {
        Alert.alert('Save failed', deleteError.message);
        setIsSaving(false);
        return;
      }

      // Insert new exercises (without temp IDs)
      if (exercises.length > 0) {
        const exercisesToInsert = exercises.map((ex, idx) => ({
          workout_id: id,
          name: ex.name,
          order_index: idx,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          target_weight: ex.target_weight,
          superset_group: ex.superset_group,
          drop_set: ex.drop_set,
          rest_pause_notes: ex.rest_pause_notes,
          notes: ex.notes,
          rest_seconds: ex.rest_seconds,
        }));

        const { error: insertError } = await supabase.from('exercises').insert(exercisesToInsert);

        if (insertError) {
          Alert.alert('Save failed', insertError.message);
          setIsSaving(false);
          return;
        }
      }

      // Reload to get fresh data from database
      await load();
      Alert.alert('Success', 'Workout saved!');
    } finally {
      setIsSaving(false);
    }
  };

  const renderExercise = ({ item, drag, isActive }: RenderItemParams<ExerciseRow>) => (
    <Pressable onLongPress={drag} disabled={isActive} style={[styles.exerciseCard, isActive && { opacity: 0.7 }]}> 
      <View style={styles.rowBetween}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Pressable onPress={() => deleteExercise(item.id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
      <Text style={styles.meta}>{item.target_sets} sets × {item.target_reps ?? '-'} reps @ {item.target_weight ?? '-'} lb</Text>
      <Text style={styles.meta}>Superset: {item.superset_group || 'None'} • Drop set: {item.drop_set ? 'Yes' : 'No'}</Text>
      <Text style={styles.meta}>Rest-pause: {item.rest_pause_notes || 'None'}</Text>
      <Text style={styles.meta}>Notes: {item.notes || 'None'}</Text>
      <Text style={styles.dragHint}>Long press and drag to reorder</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.headerRow}>
        <TextInput
          style={styles.headingInput}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="Workout name"
          placeholderTextColor={palette.muted}
        />
        <Pressable style={styles.saveButton} onPress={saveWorkout} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>
      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Add Exercise</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Exercise name" placeholderTextColor={palette.muted} />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.half]} value={sets} onChangeText={setSets} keyboardType="numeric" placeholder="Sets" placeholderTextColor={palette.muted} />
          <TextInput style={[styles.input, styles.half]} value={reps} onChangeText={setReps} keyboardType="numeric" placeholder="Reps" placeholderTextColor={palette.muted} />
          <TextInput style={[styles.input, styles.half]} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Weight" placeholderTextColor={palette.muted} />
        </View>
        <TextInput style={styles.input} value={supersetGroup} onChangeText={setSupersetGroup} placeholder="Superset group (e.g., A1)" placeholderTextColor={palette.muted} />
        <TextInput style={styles.input} value={restPauseNotes} onChangeText={setRestPauseNotes} placeholder="Rest-pause notes" placeholderTextColor={palette.muted} />
        <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Exercise notes / cues" placeholderTextColor={palette.muted} />

        <Pressable style={styles.toggle} onPress={() => setDropSet((prev) => !prev)}>
          <Text style={styles.toggleText}>Drop set: {dropSet ? 'Enabled' : 'Disabled'}</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={addExercise}>
          <Text style={styles.primaryText}>Add Exercise</Text>
        </Pressable>

        <Pressable style={styles.deleteWorkoutButton} onPress={deleteWorkout}>
          <Text style={styles.deleteWorkoutText}>Delete Workout</Text>
        </Pressable>
      </View>

      <View style={styles.listWrap}>
        <DraggableFlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExercise}
          onDragEnd={({ data }) => saveOrder(data)}
          contentContainerStyle={{ paddingBottom: 26, gap: 8 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.navy, padding: 12, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  headingInput: {
    flex: 1,
    color: '#fff',
    fontWeight: '800',
    fontSize: 22,
    padding: 0,
    margin: 0,
  },
  saveButton: {
    backgroundColor: palette.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  heading: { color: '#fff', fontWeight: '800', fontSize: 22 },
  formCard: { backgroundColor: palette.card, borderRadius: 12, padding: 10, gap: 8 },
  cardTitle: { color: palette.text, fontWeight: '800', fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: palette.text,
    backgroundColor: '#F6F9FC',
  },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  toggle: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 10 },
  toggleText: { color: palette.text, fontWeight: '700' },
  primaryButton: { backgroundColor: palette.accent, borderRadius: 10, alignItems: 'center', paddingVertical: 11 },
  primaryText: { color: '#fff', fontWeight: '700' },
  deleteWorkoutButton: { borderRadius: 10, borderWidth: 1, borderColor: palette.danger, alignItems: 'center', paddingVertical: 10 },
  deleteWorkoutText: { color: palette.danger, fontWeight: '700' },
  listWrap: { flex: 1 },
  exerciseCard: { backgroundColor: palette.card, borderRadius: 12, padding: 12, gap: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { color: palette.text, fontWeight: '800', fontSize: 16 },
  deleteText: { color: palette.danger, fontWeight: '700' },
  meta: { color: palette.muted, fontSize: 13 },
  dragHint: { color: palette.accent, fontSize: 12, marginTop: 4 },
});

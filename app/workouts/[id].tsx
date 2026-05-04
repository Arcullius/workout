import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/palette';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { ExerciseRow, WorkoutRow } from '@/types/db';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isNewWorkout = id === 'new';
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
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'sets' | 'reps' | 'weight' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadWorkout = useCallback(async () => {
    if (!id || isNewWorkout) {
      //doesnt call a new workout if its from a create new and not an edit
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

    setWorkoutName((workoutData as WorkoutRow)?.name ?? '');
    setExercises((exerciseData as ExerciseRow[]) ?? []);
  }, [id]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  const resetAddExerciseForm = () => {
    // Reset to common defaults so adding multiple exercises stays quick.
    setName('');
    setSets('3');
    setReps('8');
    setWeight('');
    setSupersetGroup('');
    setDropSet(false);
    setRestPauseNotes('');
    setNotes('');
  };

  const handleAddExercise = () => {
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

    setExercises((prev) => [...prev, newExercise]);
    resetAddExerciseForm();
  };

  const handleSaveOrder = (items: ExerciseRow[]) => {
    setExercises(items);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const handleStartEdit = (exerciseId: string, field: 'sets' | 'reps' | 'weight', currentValue: string | number | null) => {
    setEditingExercise(exerciseId);
    setEditingField(field);
    setEditValue(currentValue?.toString() || '');
  };

  const handleFinishEdit = () => {
    if (!editingExercise || !editingField) return;

    const value = editValue.trim();
    const numValue = value ? Number(value) : null;

    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === editingExercise
          ? {
              ...ex,
              target_sets: editingField === 'sets' ? (numValue || 3) : ex.target_sets,
              target_reps: editingField === 'reps' ? numValue : ex.target_reps,
              target_weight: editingField === 'weight' ? numValue : ex.target_weight,
            }
          : ex
      )
    );

    setEditingExercise(null);
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingExercise(null);
    setEditingField(null);
    setEditValue('');
  };

  const handleDeleteWorkout = () => {
    Alert.alert('Delete workout', 'Delete this workout and all exercises?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (isNewWorkout) {
            router.back();
            return;
          }

          if (!id) {
            return;
          }
          const { error } = await supabase.from('workouts').delete().eq('id', id);
          if (error) {
            Alert.alert('Delete failed', error.message);
            return;
          }

          router.back();
          Alert.alert('Deleted', 'Workout removed. Go back to templates.');
        },
      },
    ]);
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Workout name cannot be empty.');
      return;
    }

    if (isNewWorkout && !user) {
      Alert.alert('Error', 'You must be signed in to save a workout.');
      return;
    }

    setIsSaving(true);

    try {
      let workoutId = id;

      if (isNewWorkout) {
        const { data, error } = await supabase
          .from('workouts')
          .insert({
            user_id: user!.id,
            name: workoutName.trim(),
            default_rest_seconds: 90,
          })
          .select('id')
          .single();

        if (error || !data) {
          Alert.alert('Save failed', error?.message ?? 'Could not create workout.');
          setIsSaving(false);
          return;
        }

        workoutId = data.id;
      } else {
        const { error: nameError } = await supabase
          .from('workouts')
          .update({ name: workoutName.trim() })
          .eq('id', id);

        if (nameError) {
          Alert.alert('Save failed', nameError.message);
          setIsSaving(false);
          return;
        }
      }

      if (workoutId) {
        const { error: deleteError } = await supabase.from('exercises').delete().eq('workout_id', workoutId);

        if (deleteError) {
          Alert.alert('Save failed', deleteError.message);
          setIsSaving(false);
          return;
        }

        if (exercises.length > 0) {
          const exercisesToInsert = exercises.map((ex, idx) => ({
            workout_id: workoutId,
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

        if (isNewWorkout) {
          //replaces the route after first save
          router.replace(`/workouts/${workoutId}`);
        }
      }

      if (!isNewWorkout) {
        await loadWorkout();
      }

      Alert.alert('Success', 'Workout saved!');
    } finally {
      setIsSaving(false);
    }
  };

  const renderExercise = ({ item, drag, isActive }: RenderItemParams<ExerciseRow>) => (
    <Pressable onLongPress={drag} disabled={isActive} style={[styles.exerciseCard, isActive && { opacity: 0.7 }]}> 
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Pressable onPress={() => handleDeleteExercise(item.id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statsContainer}>
          <Pressable
            style={styles.statPill}
            onPress={() => handleStartEdit(item.id, 'sets', item.target_sets)}
          >
            <Text style={styles.statLabel}>Sets</Text>
            {editingExercise === item.id && editingField === 'sets' ? (
              <TextInput
                style={styles.editInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                autoFocus
                onBlur={handleFinishEdit}
                onSubmitEditing={handleFinishEdit}
              />
            ) : (
              <Text style={styles.statValue}>{item.target_sets}</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.statPill}
            onPress={() => handleStartEdit(item.id, 'reps', item.target_reps)}
          >
            <Text style={styles.statLabel}>Reps</Text>
            {editingExercise === item.id && editingField === 'reps' ? (
              <TextInput
                style={styles.editInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                autoFocus
                onBlur={handleFinishEdit}
                onSubmitEditing={handleFinishEdit}
              />
            ) : (
              <Text style={styles.statValue}>{item.target_reps ?? '-'}</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.statPill}
            onPress={() => handleStartEdit(item.id, 'weight', item.target_weight)}
          >
            <Text style={styles.statLabel}>Weight</Text>
            {editingExercise === item.id && editingField === 'weight' ? (
              <TextInput
                style={styles.editInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="decimal-pad"
                autoFocus
                onBlur={handleFinishEdit}
                onSubmitEditing={handleFinishEdit}
              />
            ) : (
              <Text style={styles.statValue}>{item.target_weight ?? '-'}</Text>
            )}
          </Pressable>
        </View>
        <View style={styles.indicatorsContainer}>
          {item.superset_group && (
            <View style={styles.indicatorBadge}>
              <Text style={styles.indicatorText}>{item.superset_group}</Text>
            </View>
          )}
          {item.drop_set && (
            <View style={styles.indicatorBadge}>
              <Text style={styles.indicatorText}>▼</Text>
            </View>
          )}
        </View>
      </View>

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
        <Pressable style={styles.saveButton} onPress={handleSaveWorkout} disabled={isSaving}>
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

        
        <Pressable style={styles.dropdownToggle} onPress={() => setShowAdvancedFields((prev) => !prev)}>
          <Text style={styles.dropdownToggleText}>
            {showAdvancedFields ? 'Hide advanced fields' : 'Show advanced fields'}
            {showAdvancedFields ? ' ▲' : ' ▼'}
          </Text>
        </Pressable>
        {showAdvancedFields && (
          <View style={styles.dropdownContent}>
            <TextInput style={styles.input} value={supersetGroup} onChangeText={setSupersetGroup} placeholder="Superset group (e.g., A1)" placeholderTextColor={palette.muted} />
            <TextInput style={styles.input} value={restPauseNotes} onChangeText={setRestPauseNotes} placeholder="Rest-pause notes" placeholderTextColor={palette.muted} />
            <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Exercise notes / cues" placeholderTextColor={palette.muted} />
            <Pressable style={styles.toggle} onPress={() => setDropSet((prev) => !prev)}>
              <Text style={styles.toggleText}>Drop set: {dropSet ? 'Enabled' : 'Disabled'}</Text>
            </Pressable>
          </View>
        )}

        

        <Pressable style={styles.primaryButton} onPress={handleAddExercise}>
          <Text style={styles.primaryText}>Add Exercise</Text>
        </Pressable>
      </View>

      <View style={styles.listWrap}>
        <DraggableFlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExercise}
          onDragEnd={({ data }) => handleSaveOrder(data)}
          contentContainerStyle={{ paddingBottom: 26, gap: 8 }}
        />
      </View>

      <View style={styles.footerButtonWrap}>
        <Pressable style={styles.deleteWorkoutButton} onPress={handleDeleteWorkout}>
          <Text style={styles.deleteWorkoutText}>Delete Workout</Text>
        </Pressable>
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
  dropdownToggle: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 10, backgroundColor: palette.background, alignItems: 'center' },
  dropdownToggleText: { color: palette.text, fontWeight: '700' },
  dropdownContent: { gap: 8, marginTop: 8 },
  deleteWorkoutButton: { borderRadius: 10, borderWidth: 1, borderColor: palette.danger, alignItems: 'center', paddingVertical: 10 },
  deleteWorkoutText: { color: palette.danger, fontWeight: '700' },
  listWrap: { flex: 1 },
  footerButtonWrap: { paddingVertical: 8 },
  exerciseCard: { backgroundColor: palette.card, borderRadius: 12, padding: 14, gap: 8 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, marginBottom: 8 },
  statsContainer: { flexDirection: 'row', gap: 8, flex: 1 },
  statPill: { flex: 1, flexBasis: 0, minWidth: 0, backgroundColor: '#E9EEF8', borderRadius: 12, paddingVertical: 2, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: palette.muted, fontSize: 10, marginBottom: 1 },
  statValue: { color: palette.text, fontWeight: '800', fontSize: 14 },
  editInput: { color: palette.text, fontWeight: '800', fontSize: 14, textAlign: 'center', minWidth: 30 },
  indicatorsContainer: { flexDirection: 'row', gap: 6 },
  indicatorBadge: { backgroundColor: '#F2F7FF', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center', justifyContent: 'center' },
  indicatorText: { color: palette.text, fontSize: 12, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { color: palette.text, fontWeight: '800', fontSize: 16, flex: 1 },
  deleteText: { color: palette.danger, fontWeight: '700' },
  meta: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  dragHint: { color: palette.accent, fontSize: 12, marginTop: 4 },
});

import { Picker } from '@react-native-picker/picker';
import { SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

const CATEGORIES = [
  { value: 'Chest', label: 'Chest' },
  { value: 'Back', label: 'Back' },
  { value: 'Shoulders', label: 'Shoulders' },
  { value: 'Bicep', label: 'Bicep' },
  { value: 'Tricep', label: 'Tricep' },
  { value: 'Legs', label: 'Legs' },
];

const CATEGORY_COLORS = {
  chest: '#f97316',
  back: '#0ea5e9',
  shoulders: '#8b5cf6',
  bicep: '#22c55e',
  tricep: '#ef4444',
  legs: '#f59e0b',
};

function getCategoryColor(category) {
  if (!category) {
    return '#6b7280';
  }

  const normalized = category.toLowerCase();
  return CATEGORY_COLORS[normalized] ?? '#6b7280';
}

export default function ExerciseDetails({ route, weightExercises, onUpdateWeightExercise }) {
  const { exerciseId, title } = route.params;
  const exercise = weightExercises.find((item) => item.id === exerciseId);

  return (
    <SafeAreaView style={styles.container}>
      {!exercise ? (
        <>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>This exercise no longer exists.</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Exercise Details</Text>
          <View style={styles.itemRow}>
            <View style={styles.topRow}>
              <View style={styles.titleRow}>
                <Text style={styles.itemText}>{exercise.name}</Text>
                <View
                  style={[
                    styles.categoryPill,
                    { backgroundColor: getCategoryColor(exercise.category) },
                  ]}
                >
                  <Text style={styles.categoryPillText}>
                    {exercise.category || 'Uncategorized'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.metricsRow}>
              <TextInput
                style={styles.metricInput}
                placeholder="sets"
                keyboardType="numeric"
                value={exercise.sets ?? ''}
                onChangeText={(value) =>
                  onUpdateWeightExercise(exercise.id, { sets: value })
                }
              />
              <TextInput
                style={styles.metricInput}
                placeholder="reps"
                keyboardType="numeric"
                value={exercise.reps ?? ''}
                onChangeText={(value) =>
                  onUpdateWeightExercise(exercise.id, { reps: value })
                }
              />
              <TextInput
                style={styles.metricInput}
                placeholder="weight (lb)"
                keyboardType="numeric"
                value={exercise.weightLb ?? ''}
                onChangeText={(value) =>
                  onUpdateWeightExercise(exercise.id, { weightLb: value })
                }
              />
            </View>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={exercise.category ?? ''}
              onValueChange={(value) =>
                onUpdateWeightExercise(exercise.id, { category: value })
              }
            >
              <Picker.Item label="Select category" value="" />
              {CATEGORIES.map((category) => (
                <Picker.Item
                  key={category.value}
                  label={category.label}
                  value={category.value}
                />
              ))}
            </Picker>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="notes"
            multiline
            value={exercise.notes ?? ''}
            onChangeText={(value) =>
              onUpdateWeightExercise(exercise.id, { notes: value })
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  itemRow: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
  },
  categoryPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  metricInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pickerWrapper: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  notesInput: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

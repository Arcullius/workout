import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const CATEGORY_COLORS = {
  chest: '#f97316',
  back: '#0ea5e9',
  shoulders: '#8b5cf6',
  bicep: '#22c55e',
  tricep: '#ef4444',
  legs: '#f59e0b',
};

const CATEGORY_LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  bicep: 'Bicep',
  tricep: 'Tricep',
  legs: 'Legs',
};

function normalizeCategory(category) {
  if (!category) {
    return '';
  }

  const normalized = category.toLowerCase();
  if (normalized === 'biceps') {
    return 'bicep';
  }
  if (normalized === 'triceps') {
    return 'tricep';
  }
  return normalized;
}

function getCategoryDisplay(category) {
  if (!category) {
    return { label: 'Uncategorized', color: '#6b7280' };
  }

  const normalized = normalizeCategory(category);
  return {
    label: CATEGORY_LABELS[normalized] ?? category,
    color: CATEGORY_COLORS[normalized] ?? '#6b7280',
  };
}

export default function Exercises({
  navigation,
  weightExercises,
  onAddWeightExercise,
  onDeleteWeightExercise,
  onUpdateWeightExercise,
}) {
  const [exerciseName, setExerciseName] = useState('');

  const handleAddExercise = () => {
    onAddWeightExercise(exerciseName);
    setExerciseName('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Exercises</Text>

      <View style={styles.formRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter exercise"
          value={exerciseName}
          onChangeText={setExerciseName}
          onSubmitEditing={handleAddExercise}
        />
        <Pressable style={styles.addButton} onPress={handleAddExercise}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={weightExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const categoryMeta = getCategoryDisplay(item.category);

          return (
            <View style={styles.itemRow}>
              <View style={styles.topRow}>
                <Pressable
                  style={styles.itemTitleButton}
                  onPress={() =>
                    navigation.navigate('ExerciseDetails', {
                      exerciseId: item.id,
                      title: item.name,
                    })
                  }
                >
                  <View style={styles.titleRow}>
                    <Text style={styles.itemText}>{item.name}</Text>
                    <View
                      style={[
                        styles.categoryPill,
                        { backgroundColor: categoryMeta.color },
                      ]}
                    >
                      <Text style={styles.categoryPillText}>{categoryMeta.label}</Text>
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => onDeleteWeightExercise(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
              <View style={styles.metricsRow}>
                <TextInput
                  style={styles.metricInput}
                  placeholder="sets"
                  keyboardType="numeric"
                  value={item.sets ?? ''}
                  onChangeText={(value) =>
                    onUpdateWeightExercise(item.id, { sets: value })
                  }
                />
                <TextInput
                  style={styles.metricInput}
                  placeholder="reps"
                  keyboardType="numeric"
                  value={item.reps ?? ''}
                  onChangeText={(value) =>
                    onUpdateWeightExercise(item.id, { reps: value })
                  }
                />
                <TextInput
                  style={styles.metricInput}
                  placeholder="weight (lb)"
                  keyboardType="numeric"
                  value={item.weightLb ?? ''}
                  onChangeText={(value) =>
                    onUpdateWeightExercise(item.id, { weightLb: value })
                  }
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No exercises yet.</Text>
        }
      />

      <StatusBar style="auto" />
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
    marginBottom: 12,
    color: '#111827',
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  addButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
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
  itemText: {
    fontSize: 16,
    color: '#111827',
  },
  itemTitleButton: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
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
  deleteButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
  },
});

import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function WorkoutList({ navigation, workouts, onAddWorkout, onDeleteWorkout }) {
  const [workoutName, setWorkoutName] = useState('');

  const handleAddWorkout = () => {
    onAddWorkout(workoutName);
    setWorkoutName('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Workouts</Text>

      <View style={styles.formRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter workout"
          value={workoutName}
          onChangeText={setWorkoutName}
          onSubmitEditing={handleAddWorkout}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={handleAddWorkout}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Pressable
              style={styles.itemTitleButton}
              onPress={() =>
                navigation.navigate('WorkoutDetails', {
                  workoutId: item.id,
                  title: item.name,
                })
              }
            >
              <Text style={styles.itemText}>{item.name}</Text>
            </Pressable>
            <Pressable
              style={styles.deleteButton}
              onPress={() => onDeleteWorkout(item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No workouts yet.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
  },
  itemTitleButton: {
    flex: 1,
    marginRight: 8,
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

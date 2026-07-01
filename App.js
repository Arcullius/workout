import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import WorkoutList from './src/screens/WorkoutList';
import WorkoutDetails from './src/screens/WorkoutDetails';
import Exercises from './src/screens/Exercises';
import ExerciseDetails from './src/screens/ExerciseDetails';

const Tab = createBottomTabNavigator();
const WorkoutStack = createNativeStackNavigator();
const WeightsStack = createNativeStackNavigator();

function WorkoutStackNavigator({
  workouts,
  weightExercises,
  onAddWorkout,
  onDeleteWorkout,
  onAddExerciseToWorkout,
  onDeleteExercise,
  onReorderWorkoutExercises,
  onUpdateWeightExercise,
}) {
  return (
    <WorkoutStack.Navigator>
      <WorkoutStack.Screen
        name="WorkoutList"
        options={{ title: 'Workouts' }}
      >
        {(props) => (
          <WorkoutList
            {...props}
            workouts={workouts}
            onAddWorkout={onAddWorkout}
            onDeleteWorkout={onDeleteWorkout}
          />
        )}
      </WorkoutStack.Screen>
      <WorkoutStack.Screen
        name="WorkoutDetails"
        options={{ title: 'Workouts' }}
      >
        {(props) => (
          <WorkoutDetails
            {...props}
            workouts={workouts}
            availableExercises={weightExercises}
            onAddExerciseToWorkout={onAddExerciseToWorkout}
            onDeleteExercise={onDeleteExercise}
            onReorderWorkoutExercises={onReorderWorkoutExercises}
            onUpdateWeightExercise={onUpdateWeightExercise}
          />
        )}
      </WorkoutStack.Screen>
      <WorkoutStack.Screen name="ExerciseDetails" options={{ title: 'Exercise Details' }}>
        {(props) => (
          <ExerciseDetails
            {...props}
            weightExercises={weightExercises}
            onUpdateWeightExercise={onUpdateWeightExercise}
          />
        )}
      </WorkoutStack.Screen>
    </WorkoutStack.Navigator>
  );
}

function WeightsStackNavigator({
  weightExercises,
  onAddWeightExercise,
  onDeleteWeightExercise,
  onUpdateWeightExercise,
}) {
  return (
    <WeightsStack.Navigator>
      <WeightsStack.Screen name="ExercisesList" options={{ title: 'Exercises' }}>
        {(props) => (
          <Exercises
            {...props}
            weightExercises={weightExercises}
            onAddWeightExercise={onAddWeightExercise}
            onDeleteWeightExercise={onDeleteWeightExercise}
            onUpdateWeightExercise={onUpdateWeightExercise}
          />
        )}
      </WeightsStack.Screen>
      <WeightsStack.Screen name="ExerciseDetails" options={{ title: 'Exercise Details' }}>
        {(props) => (
          <ExerciseDetails
            {...props}
            weightExercises={weightExercises}
            onUpdateWeightExercise={onUpdateWeightExercise}
          />
        )}
      </WeightsStack.Screen>
    </WeightsStack.Navigator>
  );
}

export default function App() {
  const [workouts, setWorkouts] = useState([]);
  const [weightExercises, setWeightExercises] = useState([]);

  const handleAddWorkout = (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    setWorkouts((currentWorkouts) => [
      { id: Date.now().toString(), name: trimmedName, exercises: [] },
      ...currentWorkouts,
    ]);
  };

  const handleDeleteWorkout = (id) => {
    setWorkouts((currentWorkouts) =>
      currentWorkouts.filter((workout) => workout.id !== id)
    );
  };

  const handleAddExerciseToWorkout = (workoutId, exerciseId) => {
    if (!exerciseId) {
      return;
    }

    const selectedExercise = weightExercises.find(
      (exercise) => exercise.id === exerciseId
    );
    if (!selectedExercise) {
      return;
    }

    setWorkouts((currentWorkouts) =>
      currentWorkouts.map((workout) => {
        if (workout.id !== workoutId) {
          return workout;
        }

        return {
          ...workout,
          exercises: [
            {
              id: Date.now().toString(),
              exerciseId: selectedExercise.id,
              name: selectedExercise.name,
              category: selectedExercise.category ?? '',
            },
            ...workout.exercises,
          ],
        };
      })
    );
  };

  const handleDeleteExercise = (workoutId, exerciseId) => {
    setWorkouts((currentWorkouts) =>
      currentWorkouts.map((workout) => {
        if (workout.id !== workoutId) {
          return workout;
        }

        return {
          ...workout,
          exercises: workout.exercises.filter(
            (exercise) => exercise.id !== exerciseId
          ),
        };
      })
    );
  };

  const handleReorderWorkoutExercises = (workoutId, reorderedExercises) => {
    setWorkouts((currentWorkouts) =>
      currentWorkouts.map((workout) => {
        if (workout.id !== workoutId) {
          return workout;
        }

        return {
          ...workout,
          exercises: reorderedExercises,
        };
      })
    );
  };

  const handleAddWeightExercise = (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return '';
    }

    const newId = Date.now().toString();
    setWeightExercises((currentExercises) => [
      {
        id: newId,
        name: trimmedName,
        sets: '',
        reps: '',
        weightLb: '',
        category: '',
        notes: '',
      },
      ...currentExercises,
    ]);

    return newId;
  };

  const handleDeleteWeightExercise = (exerciseId) => {
    setWeightExercises((currentExercises) =>
      currentExercises.filter((exercise) => exercise.id !== exerciseId)
    );
  };

  const handleUpdateWeightExercise = (exerciseId, updates) => {
    setWeightExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        return {
          ...exercise,
          ...updates,
        };
      })
    );
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#111827',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            height: 60,
            paddingTop: 6,
            paddingBottom: 8,
          },
        }}
      >
        <Tab.Screen
          name="WorkoutsTab"
          options={{ title: 'Workouts' }}
        >
          {() => (
            <WorkoutStackNavigator
              workouts={workouts}
              weightExercises={weightExercises}
              onAddWorkout={handleAddWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onAddExerciseToWorkout={handleAddExerciseToWorkout}
              onDeleteExercise={handleDeleteExercise}
              onReorderWorkoutExercises={handleReorderWorkoutExercises}
              onUpdateWeightExercise={handleUpdateWeightExercise}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="ExercisesTab" options={{ title: 'Exercises' }}>
          {() => (
            <WeightsStackNavigator
              weightExercises={weightExercises}
              onAddWeightExercise={handleAddWeightExercise}
              onDeleteWeightExercise={handleDeleteWeightExercise}
              onUpdateWeightExercise={handleUpdateWeightExercise}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

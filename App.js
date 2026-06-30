import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import WorkoutList from './src/screens/WorkoutList';
import WorkoutDetails from './src/screens/WorkoutDetails';
import Weights from './src/screens/Weights';

const Tab = createBottomTabNavigator();
const WorkoutStack = createNativeStackNavigator();

function WorkoutStackNavigator({
  workouts,
  onAddWorkout,
  onDeleteWorkout,
  onAddExercise,
  onDeleteExercise,
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
            onAddExercise={onAddExercise}
            onDeleteExercise={onDeleteExercise}
          />
        )}
      </WorkoutStack.Screen>
    </WorkoutStack.Navigator>
  );
}

export default function App() {
  const [workouts, setWorkouts] = useState([]);

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

  const handleAddExercise = (workoutId, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
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
            { id: Date.now().toString(), name: trimmedName },
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
              onAddWorkout={handleAddWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onAddExercise={handleAddExercise}
              onDeleteExercise={handleDeleteExercise}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Weights" component={Weights} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

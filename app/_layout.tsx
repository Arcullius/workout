// Import navigation and UI libraries
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { HeaderBackButton } from '@react-navigation/elements';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { palette } from '@/constants/palette';

// RootNavigator handles authentication and navigation logic for the app
function RootNavigator() {
  const router = useRouter(); // Used for navigation
  const segments = useSegments(); // Current navigation segments
  const { session, loading } = useAuth(); // Auth state

  // Redirect users based on authentication state and route
  useEffect(() => {
    if (loading) {
      // Wait for auth state to resolve
      return;
    }

    const isAuthRoute = segments[0] === '(auth)';

    if (!session && !isAuthRoute) {
      // If not logged in, redirect to sign-in
      router.replace('/(auth)/sign-in');
      return;
    }

    if (session && isAuthRoute) {
      // If logged in and on auth route, redirect to main tabs
      router.replace('/(tabs)');
    }
  }, [loading, router, segments, session]);

  // Define the navigation stack for the app
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.navy } }}>
        {/* Auth screens */}
        <Stack.Screen name="(auth)" />
        {/* Main tab screens */}
        <Stack.Screen name="(tabs)" />
        {/* Workout builder screen with custom back button logic */}
        <Stack.Screen
          name="workouts/[id]"
          options={{
            headerShown: true,
            title: 'Workout Builder',
            headerLeft: (props) => (
              <HeaderBackButton
                {...props}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                    return;
                  }
                  router.replace('/(tabs)/workouts');
                }}
              />
            ),
          }}
        />
        {/* Session details screen */}
        <Stack.Screen
          name="sessions/[id]"
          options={{
            headerShown: true,
            title: 'Live Session',
            headerLeft: (props) => (
              <HeaderBackButton
                {...props}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                    return;
                  }
                  router.replace('/(tabs)/workouts');
                }}
              />
            ),
          }}
        />
        <Stack.Screen
          name="history/[id]"
          options={{
            headerShown: true,
            title: 'Session Details',
            headerLeft: (props) => (
              <HeaderBackButton
                {...props}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                    return;
                  }
                  router.replace('/(tabs)/history');
                }}
              />
            ),
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

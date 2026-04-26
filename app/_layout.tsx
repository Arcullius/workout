import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { HeaderBackButton } from '@react-navigation/elements';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { palette } from '@/constants/palette';

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    const isAuthRoute = segments[0] === '(auth)';

    if (!session && !isAuthRoute) {
      router.replace('/(auth)/sign-in');
      return;
    }

    if (session && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [loading, router, segments, session]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.navy } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
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

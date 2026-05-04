import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { palette } from '@/constants/palette';

function buildTabIcon(iconName: React.ComponentProps<typeof Ionicons>['name']) {
  // Tiny helper so the screen config stays compact.
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={iconName} size={size} color={color} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: '#A9B7CD',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: palette.navy,
          borderTopColor: '#1E2D47',
          height: 66,
          paddingBottom: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: buildTabIcon('home'),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: buildTabIcon('barbell'),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: buildTabIcon('stats-chart'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: buildTabIcon('person'),
        }}
      />
    </Tabs>
  );
}

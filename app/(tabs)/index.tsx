import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/palette';
import { useAuth } from '@/providers/auth-provider';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Falcon FitPal</Text>
      <Text style={styles.subtitle}>Welcome back, {user?.email ?? 'Lifter'}.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today&apos;s Focus</Text>
        <Text style={styles.cardText}>Open Workouts to build your next training block, start sessions, and resume active lifts.</Text>
      </View>

      <View style={styles.quickRow}>
        <Link href="/(tabs)/workouts" style={styles.quickAction}>Create Workout</Link>
        <Link href="/(tabs)/workouts" style={styles.quickAction}>Start Session</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.navy,
    padding: 16,
    gap: 14,
  },
  title: {
    marginTop: 10,
    color: '#fff',
    fontWeight: '800',
    fontSize: 30,
  },
  subtitle: {
    color: '#D0DBEB',
    fontSize: 15,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 8,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
  },
  cardText: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 20,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    textAlign: 'center',
    backgroundColor: palette.accent,
    color: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    fontWeight: '700',
  },
});

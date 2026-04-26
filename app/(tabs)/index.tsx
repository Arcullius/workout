import { Link } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/palette';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

type DashboardStats = {
  streakDays: number;
  completedSessions: number;
  activeSessions: number;
  weeklySets: number;
  weeklyVolume: number;
  lastSessionAt: string | null;
};

const defaultStats: DashboardStats = {
  streakDays: 0,
  completedSessions: 0,
  activeSessions: 0,
  weeklySets: 0,
  weeklyVolume: 0,
  lastSessionAt: null,
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek() {
  const date = startOfToday();
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return date;
}

function calculateStreak(dateStrings: string[]) {
  if (!dateStrings.length) {
    return 0;
  }

  const uniqueDays = new Set(
    dateStrings.map((value) => {
      const date = new Date(value);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }),
  );

  let streak = 0;
  const cursor = startOfToday();

  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!uniqueDays.has(key)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);

    const weekStart = startOfWeek().toISOString();

    const [sessionsResult, activeResult, weekLogsResult] = await Promise.all([
      supabase
        .from('sessions')
        .select('id,ended_at')
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .order('ended_at', { ascending: false }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('ended_at', null),
      supabase
        .from('set_logs')
        .select('actual_reps,actual_weight,completed,sessions!inner(user_id,ended_at)')
        .eq('sessions.user_id', user.id)
        .gte('sessions.ended_at', weekStart)
        .eq('completed', true),
    ]);

    const completedSessions = sessionsResult.data ?? [];
    const weekLogs = (weekLogsResult.data ?? []) as Array<{
      actual_reps: number | null;
      actual_weight: number | null;
      completed: boolean;
    }>;

    const weeklySets = weekLogs.length;
    const weeklyVolume = weekLogs.reduce((sum, row) => {
      const reps = row.actual_reps ?? 0;
      const weight = row.actual_weight ?? 0;
      return sum + reps * weight;
    }, 0);

    setStats({
      streakDays: calculateStreak(completedSessions.map((session) => session.ended_at as string)),
      completedSessions: completedSessions.length,
      activeSessions: activeResult.count ?? 0,
      weeklySets,
      weeklyVolume,
      lastSessionAt: (completedSessions[0]?.ended_at as string | undefined) ?? null,
    });

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const motivation = useMemo(() => {
    if (stats.streakDays >= 7) {
      return 'Elite consistency. Keep the streak alive and push for progressive overload.';
    }
    if (stats.streakDays >= 3) {
      return 'Strong momentum. One more session keeps the habit locked in.';
    }
    if (stats.completedSessions > 0) {
      return 'You already proved you can do it. Start the next session and rebuild momentum.';
    }
    return 'Every PR starts with session one. Build your first workout and get after it.';
  }, [stats.completedSessions, stats.streakDays]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Falcon FitPal</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.email ?? 'Lifter'}.</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Session Streak</Text>
          <Text style={styles.heroValue}>{stats.streakDays} day{stats.streakDays === 1 ? '' : 's'}</Text>
          <Text style={styles.heroText}>{motivation}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={palette.accent} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Completed Sessions</Text>
              <Text style={styles.statValue}>{stats.completedSessions}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active Sessions</Text>
              <Text style={styles.statValue}>{stats.activeSessions}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Weekly Sets</Text>
              <Text style={styles.statValue}>{stats.weeklySets}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Weekly Volume</Text>
              <Text style={styles.statValue}>{Math.round(stats.weeklyVolume)}</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <Text style={styles.cardText}>
            {stats.lastSessionAt
              ? `Last completed session: ${new Date(stats.lastSessionAt).toLocaleString()}`
              : 'No completed sessions yet. Start your first workout from the Workouts tab.'}
          </Text>
        </View>

        <View style={styles.quickRow}>
          <Link href="/(tabs)/workouts" style={styles.quickAction}>
            Create Workout
          </Link>
          <Link href="/(tabs)/workouts" style={styles.quickAction}>
            Start Session
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.navy,
    padding: 16,
  },
  content: {
    gap: 14,
    paddingBottom: 30,
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 30,
  },
  subtitle: {
    color: '#D0DBEB',
    fontSize: 15,
  },
  heroCard: {
    backgroundColor: '#10203A',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#233858',
  },
  heroLabel: {
    color: '#A8C3E6',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroValue: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
  },
  heroText: {
    color: '#D0DBEB',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#D0DBEB',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '900',
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 16,
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

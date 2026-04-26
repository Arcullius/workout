import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/palette';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { SessionRow } from '@/types/db';

type ExerciseProgress = {
  exercise_name: string;
  actual_weight: number | null;
  actual_reps: number | null;
  created_at: string;
};

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [progressRows, setProgressRows] = useState<ExerciseProgress[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false });

    if (sessionError) {
      Alert.alert('History error', sessionError.message);
      setLoading(false);
      return;
    }

    setSessions((sessionData as SessionRow[]) ?? []);

    const { data: logsData } = await supabase
      .from('set_logs')
      .select('actual_weight,actual_reps,created_at,exercise_id,exercises(name),sessions!inner(user_id)')
      .eq('sessions.user_id', user.id)
      .not('actual_weight', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    const normalized = (logsData ?? []).map((row: any) => ({
      exercise_name: row.exercises?.name ?? 'Exercise',
      actual_weight: row.actual_weight,
      actual_reps: row.actual_reps,
      created_at: row.created_at,
    }));

    setProgressRows(normalized);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const groupedProgress = useMemo(() => {
    const map = new Map<string, ExerciseProgress[]>();
    progressRows.forEach((row) => {
      if (!map.has(row.exercise_name)) {
        map.set(row.exercise_name, []);
      }
      map.get(row.exercise_name)?.push(row);
    });
    return Array.from(map.entries()).slice(0, 3);
  }, [progressRows]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>History</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Past Sessions</Text>
        {loading ? <ActivityIndicator color={palette.accent} /> : null}
        {!loading && sessions.length === 0 ? <Text style={styles.muted}>No completed sessions yet.</Text> : null}
        {sessions.map((session) => (
          <Pressable key={session.id} style={styles.sessionRow} onPress={() => router.push(`/history/${session.id}`)}>
            <Text style={styles.itemTitle}>{session.name}</Text>
            <Text style={styles.muted}>{new Date(session.ended_at ?? session.started_at).toLocaleString()}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Per-Exercise Progress (Table)</Text>
        {groupedProgress.length === 0 ? <Text style={styles.muted}>No logged sets yet.</Text> : null}
        {groupedProgress.map(([exerciseName, rows]) => (
          <View key={exerciseName} style={styles.tableBlock}>
            <Text style={styles.tableHeading}>{exerciseName}</Text>
            {rows.slice(0, 5).map((row, idx) => (
              <View key={`${exerciseName}-${idx}-${row.created_at}`} style={styles.tableRow}>
                <Text style={styles.tableCell}>{new Date(row.created_at).toLocaleDateString()}</Text>
                <Text style={styles.tableCell}>{row.actual_weight ?? '-'} lb</Text>
                <Text style={styles.tableCell}>{row.actual_reps ?? '-'} reps</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.navy },
  content: { padding: 14, gap: 12, paddingBottom: 40 },
  heading: { color: '#fff', fontWeight: '800', fontSize: 28 },
  card: { backgroundColor: palette.card, borderRadius: 12, padding: 12, gap: 10 },
  cardTitle: { color: palette.text, fontSize: 18, fontWeight: '800' },
  muted: { color: palette.muted },
  sessionRow: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 10, gap: 4 },
  itemTitle: { color: palette.text, fontWeight: '700', fontSize: 16 },
  tableBlock: { marginTop: 8, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 8 },
  tableHeading: { color: palette.text, fontWeight: '800', marginBottom: 4 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  tableCell: { color: palette.muted, fontSize: 13 },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/palette';
import { supabase } from '@/lib/supabase';
import { SessionRow } from '@/types/db';

type LoggedSet = {
  id: string;
  set_number: number;
  target_weight: number | null;
  target_reps: number | null;
  actual_weight: number | null;
  actual_reps: number | null;
  completed: boolean;
  exercises: { name: string } | null;
};

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [logs, setLogs] = useState<LoggedSet[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }

      const [{ data: sessionData, error: sessionError }, { data: logsData, error: logsError }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).single(),
        supabase.from('set_logs').select('*, exercises(name)').eq('session_id', id).order('created_at', { ascending: true }),
      ]);

      if (sessionError || logsError) {
        Alert.alert('Load failed', sessionError?.message ?? logsError?.message ?? 'Could not load session details.');
        return;
      }

      setSession((sessionData as SessionRow) ?? null);
      setLogs((logsData as LoggedSet[]) ?? []);
    };

    load();
  }, [id]);

  const deleteSession = () => {
    Alert.alert('Delete session', 'This will permanently remove the session logs.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('sessions').delete().eq('id', id);
          if (error) {
            Alert.alert('Delete failed', error.message);
            return;
          }
          router.replace('/(tabs)/history');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{session?.name ?? 'Session'}</Text>
      <Text style={styles.subheading}>{session?.ended_at ? new Date(session.ended_at).toLocaleString() : 'In progress'}</Text>

      <View style={styles.card}>
        {logs.length === 0 ? <Text style={styles.muted}>No set logs available.</Text> : null}
        {logs.map((log) => (
          <View key={log.id} style={styles.row}>
            <Text style={styles.exercise}>{log.exercises?.name ?? 'Exercise'} • Set {log.set_number}</Text>
            <Text style={styles.meta}>Target: {log.target_weight ?? '-'} lb × {log.target_reps ?? '-'} reps</Text>
            <Text style={styles.meta}>Actual: {log.actual_weight ?? '-'} lb × {log.actual_reps ?? '-'} reps {log.completed ? '✓' : ''}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.deleteButton} onPress={deleteSession}>
        <Text style={styles.deleteText}>Delete Session</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.navy },
  content: { padding: 14, gap: 12, paddingBottom: 40 },
  heading: { color: '#fff', fontWeight: '800', fontSize: 26 },
  subheading: { color: '#C6D2E6' },
  card: { backgroundColor: palette.card, borderRadius: 12, padding: 12, gap: 8 },
  row: { borderBottomWidth: 1, borderBottomColor: palette.border, paddingBottom: 8, gap: 2 },
  exercise: { color: palette.text, fontWeight: '700' },
  meta: { color: palette.muted, fontSize: 13 },
  muted: { color: palette.muted },
  deleteButton: { backgroundColor: palette.danger, borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  deleteText: { color: '#fff', fontWeight: '700' },
});

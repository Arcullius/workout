
// Import UI components and hooks
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/palette';
import { useAuth } from '@/providers/auth-provider';

// Main component for the Profile tab
export default function ProfileScreen() {
  const { user, signOut } = useAuth(); // Get user info and sign out handler

  // Handler for signing out the user
  const onSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Profile heading */}
      <Text style={styles.heading}>Profile</Text>
      {/* Card displaying user info */}
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? 'Unknown'}</Text>
        <Text style={styles.label}>User ID</Text>
        <Text style={styles.value}>{user?.id ?? 'Unknown'}</Text>
      </View>

      {/* Sign out button with confirmation dialog */}
      <Pressable
        style={styles.signOut}
        onPress={() => {
          Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: onSignOut },
          ]);
        }}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// Styles for the Profile screen
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.navy, padding: 14, gap: 12 },
  heading: { color: '#fff', fontWeight: '800', fontSize: 28 },
  card: { backgroundColor: palette.card, borderRadius: 12, padding: 12, gap: 6 },
  label: { color: palette.muted, fontSize: 12 },
  value: { color: palette.text, fontWeight: '700', fontSize: 15 },
  signOut: {
    marginTop: 8,
    backgroundColor: palette.danger,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signOutText: { color: '#fff', fontWeight: '700' },
});

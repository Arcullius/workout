// Import navigation and styling utilities
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Simple modal screen with a title and a link back to home
export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Modal title */}
      <ThemedText type="title">This is a modal</ThemedText>
      {/* Link to go back to the home screen */}
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

// Styles for the modal layout
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});

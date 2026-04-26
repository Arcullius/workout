import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '@/constants/palette';
import { useAuth } from '@/providers/auth-provider';

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    const result = isSignup ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
    setLoading(false);

    if (result.error) {
      Alert.alert('Auth Error', result.error);
      return;
    }

    if (isSignup) {
      Alert.alert('Success', 'Account created. Check email if confirmation is required, then sign in.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Falcon FitPal</Text>
        <Text style={styles.subtitle}>Train hard. Log smarter.</Text>

        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor={palette.muted}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor={palette.muted}
        />

        <Pressable style={styles.button} onPress={submit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}</Text>
        </Pressable>

        <Pressable onPress={() => setIsSignup((prev) => !prev)}>
          <Text style={styles.link}>{isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.navy,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: palette.muted,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: palette.text,
    backgroundColor: '#F6F9FC',
  },
  button: {
    backgroundColor: palette.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: palette.accent,
    fontWeight: '600',
    marginTop: 8,
  },
});

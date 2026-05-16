import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/utils/colors';

export default function SignUpScreen() {
  const router = useRouter();
  const signUp = useAuthStore(s => s.signUp);
  const signInWithApple = useAuthStore(s => s.signInWithApple);
  const signInWithGoogle = useAuthStore(s => s.signInWithGoogle);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const handleSignUp = async () => {
    if (password.length < 8) {
      setConfirmError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setConfirmError('Passwords do not match');
      return;
    }
    setConfirmError('');
    await signUp(email, password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.appleButton}
          onPress={signInWithApple}
        />
      )}

      <TouchableOpacity
        style={styles.googleButton}
        onPress={signInWithGoogle}
        accessibilityLabel="Sign up with Google"
      >
        <Text style={styles.googleButtonText}>Sign up with Google</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Password"
      />
      <TextInput
        style={[styles.input, confirmError ? styles.inputError : null]}
        placeholder="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        accessibilityLabel="Confirm password"
      />
      {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

      <Text style={styles.consent} accessibilityLabel="Consent notice">
        By creating an account you agree to our Terms of Service and Privacy Policy, including
        syncing your data to our servers.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSignUp}
        accessibilityLabel="Create account"
      >
        <Text style={styles.primaryButtonText}>Create account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} accessibilityLabel="Sign in">
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  appleButton: { height: 48 },
  googleButton: {
    backgroundColor: Colors.googleBlue,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputError: { borderColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: 13 },
  primaryButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
  consent: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginTop: 4 },
});

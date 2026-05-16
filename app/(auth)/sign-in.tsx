import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { Colors } from '@/utils/colors';

export default function SignInScreen() {
  const router = useRouter();
  const signIn = useAuthStore(s => s.signIn);
  const signInWithApple = useAuthStore(s => s.signInWithApple);
  const signInWithGoogle = useAuthStore(s => s.signInWithGoogle);
  const sendPasswordReset = useAuthStore(s => s.sendPasswordReset);

  const showToast = useToastStore(s => s.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleForgotPassword() {
    if (!email.trim()) {
      showToast('Enter your email first', 'error');
      return;
    }
    sendPasswordReset(email);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>

      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.appleButton}
          onPress={signInWithApple}
        />
      )}

      <TouchableOpacity
        style={styles.googleButton}
        onPress={signInWithGoogle}
        accessibilityLabel="Sign in with Google"
      >
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
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

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => signIn(email, password)}
        accessibilityLabel="Sign in"
      >
        <Text style={styles.primaryButtonText}>Sign in</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleForgotPassword} accessibilityLabel="Forgot password">
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/sign-up')}
        accessibilityLabel="Create account"
      >
        <Text style={styles.link}>Don't have an account? Create one</Text>
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
  primaryButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
});

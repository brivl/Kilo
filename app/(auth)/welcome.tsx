import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/utils/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const signInWithApple = useAuthStore(s => s.signInWithApple);
  const signInWithGoogle = useAuthStore(s => s.signInWithGoogle);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Kilo</Text>
        <Text style={styles.subtitle}>Track food, lifts, and progress.</Text>
      </View>

      <View style={styles.buttons}>
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

        <TouchableOpacity
          style={styles.emailButton}
          onPress={() => router.push('/(auth)/sign-up')}
          accessibilityLabel="Create account"
        >
          <Text style={styles.emailButtonText}>Create account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/sign-in')}
          accessibilityLabel="Sign in with email"
        >
          <Text style={styles.signInLink}>Sign in with email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'space-between',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  hero: { alignItems: 'center', gap: 8 },
  title: { fontSize: 48, fontWeight: '700' },
  subtitle: { fontSize: 16, color: Colors.textSecondary },
  buttons: { gap: 12 },
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
  emailButton: {
    borderWidth: 1,
    borderColor: Colors.textPrimary,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonText: { fontSize: 16, fontWeight: '600' },
  signInLink: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
});

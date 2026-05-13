import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/utils/colors';

function getInitials(name: string | undefined, email: string | undefined): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
    return (parts[0]![0] ?? '?').toUpperCase();
  }
  if (email) return email[0]!.toUpperCase();
  return '?';
}

export function ProfileAvatar() {
  const router = useRouter();
  const session = useAuthStore(s => s.session);
  const name = session?.user.user_metadata?.full_name as string | undefined;
  const email = session?.user.email;

  return (
    <Pressable
      onPress={() => router.push('/(protected)/settings')}
      style={s.avatar}
      accessibilityLabel="Open settings"
      accessibilityRole="button"
      hitSlop={8}
    >
      <Text style={s.initials}>{getInitials(name, email)}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  initials: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});

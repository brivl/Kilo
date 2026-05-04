import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '@/store/toastStore';

export function Toast() {
  const { message, kind, dismissToast } = useToastStore();
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <Pressable
      onPress={dismissToast}
      style={[s.container, { bottom: insets.bottom + 16 }, kind === 'error' ? s.error : s.info]}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Text style={s.text}>{message}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    zIndex: 999,
  },
  info: { backgroundColor: '#1e293b' },
  error: { backgroundColor: '#7f1d1d' },
  text: { color: '#fff', fontSize: 14, textAlign: 'center' },
});

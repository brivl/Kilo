import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function JournalScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Journal</ThemedText>
      <ThemedText>Phase 2 — Gym Journal coming soon</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

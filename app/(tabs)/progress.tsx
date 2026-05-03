import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Progress</ThemedText>
      <ThemedText>Phase 4 — Progress Charts coming soon</ThemedText>
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

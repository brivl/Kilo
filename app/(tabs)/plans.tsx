import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function PlansScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Plans</ThemedText>
      <ThemedText>Phase 3 — Training Plans coming soon</ThemedText>
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

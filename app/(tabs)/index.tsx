import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function FoodLogScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Food Log</ThemedText>
      <ThemedText>Phase 1 — Food Log coming soon</ThemedText>
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

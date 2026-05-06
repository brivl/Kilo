import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { Toast } from '@/components/Toast';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="session/new"
            options={{ title: 'New workout', presentation: 'modal' }}
          />
          <Stack.Screen name="session/[id]" options={{ title: 'Workout' }} />
          <Stack.Screen name="plan/new" options={{ title: 'New plan', presentation: 'modal' }} />
          <Stack.Screen name="plan/[id]" options={{ title: 'Plan' }} />
        </Stack>
        <StatusBar style="auto" />
        <Toast />
      </View>
    </ThemeProvider>
  );
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/store/authStore';

export default function ProtectedLayout() {
  const session = useAuthStore(s => s.session);
  const isLoading = useAuthStore(s => s.isLoading);
  const skipAuth = process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    if (skipAuth) return;
    AsyncStorage.getItem('onboardingComplete').then(val => {
      setOnboardingComplete(val === 'true');
      setOnboardingChecked(true);
    });
  }, [skipAuth]);

  if (skipAuth) {
    return (
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="session/new"
          options={{ title: 'New workout', presentation: 'modal' }}
        />
        <Stack.Screen name="session/[id]" options={{ title: 'Workout' }} />
        <Stack.Screen name="plan/new" options={{ title: 'New plan', presentation: 'modal' }} />
        <Stack.Screen name="plan/[id]" options={{ title: 'Plan' }} />
        <Stack.Screen
          name="food/search"
          options={{ title: 'Search food', presentation: 'modal' }}
        />
        <Stack.Screen name="food/add" options={{ title: 'Add food', presentation: 'modal' }} />
      </Stack>
    );
  }

  if (isLoading || !onboardingChecked) return null;
  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!onboardingComplete) return <Redirect href="/(onboarding)/goal" />;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="session/new" options={{ title: 'New workout', presentation: 'modal' }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Workout' }} />
      <Stack.Screen name="plan/new" options={{ title: 'New plan', presentation: 'modal' }} />
      <Stack.Screen name="plan/[id]" options={{ title: 'Plan' }} />
      <Stack.Screen name="food/search" options={{ title: 'Search food', presentation: 'modal' }} />
      <Stack.Screen name="food/add" options={{ title: 'Add food', presentation: 'modal' }} />
    </Stack>
  );
}

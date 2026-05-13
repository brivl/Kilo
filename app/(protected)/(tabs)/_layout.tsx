import { Tabs } from 'expo-router';
import React from 'react';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors as ThemeColors } from '@/constants/theme';
import { Colors } from '@/utils/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ThemeColors.light.tint,
        tabBarButton: HapticTab,
        headerShown: true,
        headerStyle: { backgroundColor: Colors.background },
        headerTitleStyle: {
          color: Colors.textPrimary,
          fontWeight: '700' as const,
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerRight: () => <ProfileAvatar />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Food Log',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="fork.knife" color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="dumbbell.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

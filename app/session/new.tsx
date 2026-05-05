import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';
import { createSession } from '@/store/workoutStore';

export default function NewSessionScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const selectedDate = useSettingsStore(s => s.selectedDate);
  const sessionDate = date ?? selectedDate;

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const id = await createSession({
      date: sessionDate,
      name: name.trim(),
      notes: notes.trim() || undefined,
    });
    router.replace(`/session/${id}`);
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'New workout' }} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.label}>Workout name</Text>
        <TextInput
          style={[s.input, nameError && s.inputError]}
          placeholder="e.g. Push day, Leg day…"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={t => {
            setName(t);
            setNameError(false);
          }}
          autoFocus
          returnKeyType="next"
          accessibilityLabel="Workout name"
        />
        {nameError && <Text style={s.error}>Name is required</Text>}

        <Text style={s.label}>Notes (optional)</Text>
        <TextInput
          style={[s.input, s.inputMulti]}
          placeholder="Any notes…"
          placeholderTextColor="#94a3b8"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          accessibilityLabel="Notes"
        />

        <Pressable
          onPress={handleCreate}
          style={s.saveBtn}
          accessibilityLabel="Start workout"
          accessibilityRole="button"
        >
          <Text style={s.saveTxt}>Start workout</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  label: { color: '#64748b', fontSize: 13, marginBottom: 4, marginTop: 16 },
  input: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  inputError: { borderColor: '#ef4444' },
  error: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  saveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    minHeight: 44,
  },
  saveTxt: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});

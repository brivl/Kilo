import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createPlan } from '@/store/trainingPlanStore';

export default function NewPlanScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const id = await createPlan(trimmed);
      router.replace(`/plan/${id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'New plan', presentation: 'modal' }} />
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.form}>
          <Text style={s.label}>Plan name</Text>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="e.g. Push / Pull / Legs"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
            accessibilityLabel="Plan name"
          />
          <Pressable
            style={[s.btn, (!name.trim() || saving) && s.btnDisabled]}
            onPress={handleSave}
            disabled={!name.trim() || saving}
            accessibilityLabel="Create plan"
            accessibilityRole="button"
          >
            <Text style={s.btnTxt}>{saving ? 'Creating…' : 'Create plan'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  form: { padding: 16, gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569' },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
    minHeight: 44,
  },
  btn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
  },
  btnDisabled: { backgroundColor: '#c7d2fe' },
  btnTxt: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});

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
import { Colors } from '@/utils/colors';

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
            placeholderTextColor={Colors.textMuted}
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
  root: { flex: 1, backgroundColor: Colors.background },
  form: { padding: 16, gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textLabel },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  btn: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
  },
  btnDisabled: { backgroundColor: Colors.brandDisabled },
  btnTxt: { color: Colors.surface, fontSize: 16, fontWeight: '700' },
});

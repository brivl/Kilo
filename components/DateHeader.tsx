import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/store/settingsStore';
import { Colors } from '@/utils/colors';
import { addDaysISO, parseISO, todayISO, toISO } from '@/utils/date';

export function DateHeader() {
  const { selectedDate, setSelectedDate, resetToToday } = useSettingsStore();
  const [showPicker, setShowPicker] = useState(false);
  const { top } = useSafeAreaInsets();
  const isToday = selectedDate === todayISO();

  const formatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parseISO(selectedDate));

  return (
    <View style={[s.row, { paddingTop: top + 8 }]}>
      <Pressable
        onPress={() => setSelectedDate(addDaysISO(selectedDate, -1))}
        style={s.arrow}
        accessibilityLabel="Previous day"
        hitSlop={8}
      >
        <Text style={s.arrowText}>‹</Text>
      </Pressable>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={s.dateBtn}
        accessibilityLabel={`Selected date ${formatted}, tap to change`}
      >
        <Text style={s.dateText}>{formatted}</Text>
      </Pressable>
      <Pressable
        onPress={() => setSelectedDate(addDaysISO(selectedDate, 1))}
        style={s.arrow}
        accessibilityLabel="Next day"
        hitSlop={8}
      >
        <Text style={s.arrowText}>›</Text>
      </Pressable>
      {!isToday && (
        <Pressable onPress={resetToToday} style={s.todayBtn} accessibilityLabel="Go to today">
          <Text style={s.todayText}>Today</Text>
        </Pressable>
      )}
      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={s.backdrop} onPress={() => setShowPicker(false)}>
          <View style={s.pickerCard}>
            <DateTimePicker
              value={parseISO(selectedDate)}
              mode="date"
              display="inline"
              onChange={(_, date) => {
                setShowPicker(false);
                if (date) setSelectedDate(toISO(date));
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 24, color: Colors.textPrimary },
  dateBtn: { flex: 1, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  dateText: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  todayBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  todayText: { fontSize: 13, color: Colors.brandSecondary },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
});

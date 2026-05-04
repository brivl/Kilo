import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { FoodEntry } from '@/db/models/FoodEntry';
import { observeRecentFoods } from '@/db/queries/foodEntries';
import { OffNetworkError, searchFoods, type OffFood } from '@/services/openFoodFacts';
import { useToastStore } from '@/store/toastStore';

interface ListItem {
  type: 'recent' | 'result';
  key: string;
  label: string;
  sub: string;
  data: FoodEntry | OffFood;
}

export default function FoodSearchScreen() {
  const router = useRouter();
  const { mealType = 'breakfast' } = useLocalSearchParams<{ mealType: string }>();

  const [query, setQuery] = useState('');
  const [recentFoods, setRecentFoods] = useState<FoodEntry[]>([]);
  const [results, setResults] = useState<OffFood[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const sub = observeRecentFoods().subscribe(setRecentFoods);
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const foods = await searchFoods(query.trim(), abortRef.current.signal);
        setResults(foods);
      } catch (err) {
        if (err instanceof OffNetworkError && err.message.includes('aborted')) return;
        useToastStore
          .getState()
          .showToast("Couldn't reach server. Check your connection.", 'error');
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSelectOff(food: OffFood) {
    router.push({
      pathname: '/food/add',
      params: {
        mealType,
        foodName: food.name,
        calories: String(Math.round(food.kcalPer100g)),
        protein: String(food.proteinPer100g),
        carbs: String(food.carbsPer100g),
        fat: String(food.fatPer100g),
        quantity: '100',
        unit: 'g',
        source: 'open_food_facts',
      },
    });
  }

  function handleSelectRecent(entry: FoodEntry) {
    router.push({
      pathname: '/food/add',
      params: {
        mealType,
        foodName: entry.foodName,
        calories: String(entry.calories),
        protein: String(entry.proteinG),
        carbs: String(entry.carbsG),
        fat: String(entry.fatG),
        quantity: String(entry.quantity),
        unit: entry.unit,
        source: 'manual',
      },
    });
  }

  const items: ListItem[] = query.trim()
    ? results.map(r => ({
        type: 'result' as const,
        key: `result-${r.id}`,
        label: r.name,
        sub: r.brand ? `${r.brand} · ${r.kcalPer100g} kcal/100g` : `${r.kcalPer100g} kcal/100g`,
        data: r,
      }))
    : recentFoods
        .filter((e, i, arr) => arr.findIndex(x => x.foodName === e.foodName) === i)
        .slice(0, 10)
        .map(e => ({
          type: 'recent' as const,
          key: `recent-${e.id}`,
          label: e.foodName,
          sub: `${e.calories} kcal · ${e.quantity} ${e.unit}`,
          data: e,
        }));

  return (
    <View style={s.screen}>
      <View style={s.searchBar}>
        <TextInput
          style={s.input}
          placeholder="Search foods…"
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Search foods"
        />
        {loading && <ActivityIndicator style={s.spinner} color="#6366f1" />}
      </View>

      {!query.trim() && recentFoods.length > 0 && <Text style={s.sectionLabel}>Recent</Text>}

      <FlatList
        data={items}
        keyExtractor={item => item.key}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={s.row}
            accessibilityLabel={item.label}
            onPress={() =>
              item.type === 'result'
                ? handleSelectOff(item.data as OffFood)
                : handleSelectRecent(item.data as FoodEntry)
            }
          >
            <Text style={s.label}>{item.label}</Text>
            <Text style={s.sub}>{item.sub}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading && query.trim() ? <Text style={s.empty}>No results for "{query}"</Text> : null
        }
      />

      <Pressable
        style={s.manualBtn}
        onPress={() => router.push({ pathname: '/food/add', params: { mealType } })}
        accessibilityLabel="Add food manually"
        accessibilityRole="button"
      >
        <Text style={s.manualTxt}>+ Add manually</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  input: { flex: 1, color: '#f1f5f9', fontSize: 16, paddingVertical: 10 },
  spinner: { marginLeft: 8 },
  sectionLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    minHeight: 44,
    justifyContent: 'center',
  },
  label: { color: '#f1f5f9', fontSize: 15 },
  sub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  empty: { color: '#4b5563', fontSize: 14, textAlign: 'center', marginTop: 32 },
  manualBtn: {
    margin: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  manualTxt: { color: '#6366f1', fontSize: 14 },
});

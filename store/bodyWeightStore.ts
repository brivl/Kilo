import { database } from '@/db/database';
import type { BodyWeightEntry } from '@/db/models/BodyWeightEntry';

import { useToastStore } from './toastStore';

export async function logWeight(
  date: string,
  weightKg: number,
  notes: string | null,
): Promise<void> {
  try {
    await database.write(async () => {
      await database.collections.get<BodyWeightEntry>('body_weight_entries').create(r => {
        r.date = date;
        r.weightKg = weightKg;
        r.notes = notes;
      });
    });
  } catch (e) {
    console.error('bodyWeightStore.logWeight failed', e);
    useToastStore.getState().showToast("Couldn't save weight", 'error');
    throw e;
  }
}

export async function deleteWeightEntry(id: string): Promise<void> {
  try {
    await database.write(async () => {
      const entry = await database.collections.get<BodyWeightEntry>('body_weight_entries').find(id);
      await entry.destroyPermanently();
    });
  } catch (e) {
    console.error('bodyWeightStore.deleteWeightEntry failed', e);
    useToastStore.getState().showToast("Couldn't delete entry", 'error');
  }
}

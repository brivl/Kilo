import { database } from '@/db/database';
import type { BodyWeightEntry } from '@/db/models/BodyWeightEntry';
import { serializeBodyWeightEntry } from '@/db/sync/serializers';

import { syncDelete, syncUpsert } from './syncStore';
import { useToastStore } from './toastStore';

export async function logWeight(
  date: string,
  weightKg: number,
  notes: string | null,
): Promise<void> {
  try {
    let created: BodyWeightEntry | undefined;
    await database.write(async () => {
      created = await database.collections.get<BodyWeightEntry>('body_weight_entries').create(r => {
        r.date = date;
        r.weightKg = weightKg;
        r.notes = notes;
      });
    });
    if (created)
      syncUpsert(
        'body_weight_entries',
        serializeBodyWeightEntry(created) as unknown as Record<string, unknown>,
      );
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
    syncDelete('body_weight_entries', id);
  } catch (e) {
    console.error('bodyWeightStore.deleteWeightEntry failed', e);
    useToastStore.getState().showToast("Couldn't delete entry", 'error');
  }
}

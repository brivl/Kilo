import { Q } from '@nozbe/watermelondb';

import { database } from '@/db/database';
import type { BodyWeightEntry } from '@/db/models/BodyWeightEntry';

export function observeAllWeightEntries() {
  return database.collections
    .get<BodyWeightEntry>('body_weight_entries')
    .query(Q.sortBy('date', Q.desc))
    .observe();
}

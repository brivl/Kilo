import { addDaysISO, parseISO, substractDaysISO, todayISO, toISO } from '@/utils/date';

describe('date utils', () => {
  it('todayISO is YYYY-MM-DD', () => expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/));
  it('addDaysISO +1', () => expect(addDaysISO('2026-05-03', 1)).toBe('2026-05-04'));
  it('substractDaysISO -1', () => expect(substractDaysISO('2026-05-01', 1)).toBe('2026-04-30'));
  it('addDaysISO year boundary', () => expect(addDaysISO('2025-12-31', 1)).toBe('2026-01-01'));
  it('parseISO → toISO roundtrip', () => expect(toISO(parseISO('2026-05-03'))).toBe('2026-05-03'));
});

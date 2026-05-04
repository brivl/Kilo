export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseISO(s: string): Date {
  return new Date(`${s}T12:00:00Z`);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = parseISO(dateISO);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

export function substractDaysISO(dateISO: string, days: number): string {
  const d = parseISO(dateISO);
  d.setUTCDate(d.getUTCDate() - days);
  return toISO(d);
}

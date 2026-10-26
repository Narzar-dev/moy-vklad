import type { Occurrence } from './types';

export function localDayKey(date = new Date()): string {
  const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isWithinTimeWindow(start: string | undefined, end: string | undefined, date = new Date()): boolean {
  if (!start && !end) return true;
  const current = date.getHours() * 60 + date.getMinutes();
  const parse = (value: string | undefined, fallback: number) => {
    if (!value || !/^\d{2}:\d{2}$/.test(value)) return fallback;
    const [hour, minute] = value.split(':').map(Number);
    return hour <= 23 && minute <= 59 ? hour * 60 + minute : fallback;
  };
  const from = parse(start, 0); const to = parse(end, 1439);
  return from <= to ? current >= from && current <= to : current >= from || current <= to;
}

export function isPastTimeWindow(start: string | undefined, end: string | undefined, date = new Date()): boolean {
  if (!end || !/^\d{2}:\d{2}$/.test(end)) return false;
  const [endHour, endMinute] = end.split(':').map(Number);
  if (endHour > 23 || endMinute > 59) return false;
  const current = date.getHours() * 60 + date.getMinutes();
  const endAt = endHour * 60 + endMinute;
  if (start && /^\d{2}:\d{2}$/.test(start)) {
    const [startHour, startMinute] = start.split(':').map(Number);
    if (startHour <= 23 && startMinute <= 59 && startHour * 60 + startMinute > endAt) return false;
  }
  return current > endAt;
}

/** Return active tasks in their display order. */
export function selectAvailable(occurrences: ReadonlyArray<Occurrence>): Occurrence[] {
  return occurrences.filter((item) => item.status === 'planned' || item.status === 'started')
    .sort((a, b) => b.priority - a.priority || (a.preferredTime ?? '99:99').localeCompare(b.preferredTime ?? '99:99'));
}

/** Keep the first screen focused on three tasks. */
export function selectToday(occurrences: ReadonlyArray<Occurrence>): Occurrence[] {
  return selectAvailable(occurrences).slice(0, 3);
}

import type { Occurrence } from './types';
export function generateDates(start: string, days: number, weekdays: number[] = [1,2,3,4,5,6,7]): string[] { const out: string[] = []; const d = new Date(`${start}T12:00:00Z`); for (let i=0;i<days;i++){ const day = new Date(d); day.setUTCDate(d.getUTCDate()+i); const weekday = day.getUTCDay() || 7; if (weekdays.includes(weekday)) out.push(day.toISOString().slice(0,10)); } return out; }
export function occurrenceId(taskId: string, date: string) { return `${taskId}:${date}`; }

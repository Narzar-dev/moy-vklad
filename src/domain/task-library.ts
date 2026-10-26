import type { TaskTemplate } from '@/src/domain/types';
import type { StoredTask } from '@/src/infrastructure/storage';

export const DAILY_STAR_SIZE = 50;

export function taskFromTemplate(template: TaskTemplate, categoryId?: string): StoredTask {
  return {
    id: template.id,
    title: template.title,
    icon: template.icon,
    xp: template.baseXp,
    steps: [...template.steps],
    enabled: true,
    categoryId,
    timeStart: template.timeStart,
    timeEnd: template.timeEnd,
  };
}

export function normalizeTaskXp(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(100, Math.max(1, Math.round(parsed)));
}

export function xpToNextStar(xp: number): number {
  const remainder = Math.max(0, xp) % DAILY_STAR_SIZE;
  return remainder === 0 ? DAILY_STAR_SIZE : DAILY_STAR_SIZE - remainder;
}

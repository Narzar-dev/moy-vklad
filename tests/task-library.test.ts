import { describe, expect, it } from 'vitest';
import { normalizeTaskXp, taskFromTemplate, xpToNextStar } from '../src/domain/task-library';

describe('task library helpers', () => {
  it('keeps template task data editable in storage', () => {
    const task = taskFromTemplate({ id: 'water', title: 'Полить цветы', icon: '🪴', baseXp: 10, steps: ['Полить'], supervision: 'none' });
    expect(task).toMatchObject({ id: 'water', xp: 10, enabled: true });
    expect(task.steps).not.toBeUndefined();
  });

  it('normalizes custom experience to a safe range', () => {
    expect(normalizeTaskXp('12')).toBe(12);
    expect(normalizeTaskXp('')).toBe(5);
    expect(normalizeTaskXp(200)).toBe(100);
  });

  it('calculates the experience remaining to the next star', () => {
    expect(xpToNextStar(0)).toBe(50);
    expect(xpToNextStar(17)).toBe(33);
    expect(xpToNextStar(50)).toBe(50);
  });
});

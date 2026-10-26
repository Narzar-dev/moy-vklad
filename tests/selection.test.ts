import { describe, expect, it } from 'vitest';
import { selectToday } from '../src/domain/selection';
import type { Occurrence } from '../src/domain/types';
const template = { id: 't', title: 'T', icon: '•', baseXp: 5 as const, steps: ['one', 'two'], supervision: 'none' as const };
describe('today selection', () => {
  it('shows three cards at most and prioritizes parent priority then time', () => {
    const items = [4, 1, 3, 2].map((priority) => ({ id: String(priority), template, stage: 'learning' as const, priority, preferredTime: '10:00', status: 'planned' as const }));
    expect(selectToday(items as Occurrence[]).map((x) => x.priority)).toEqual([4, 3, 2]);
  });
  it('does not show completed or skipped occurrences', () => expect(selectToday([{ id: '1', template, stage: 'learning', priority: 1, status: 'completed' }])).toHaveLength(0));
});

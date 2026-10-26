import { describe, expect, it } from 'vitest';
import { advanceMastery } from '../src/domain/mastery';
import type { MasteryState } from '../src/domain/mastery';

const empty = { stage: 'learning' as const, successCount: 5, recent: [] };
describe('mastery policy', () => {
  it('moves from learning to practice after six successes', () => expect(advanceMastery(empty, 'success', 'independent').state).toMatchObject({ stage: 'practice', successCount: 0 }));
  it('graduates only with four successes and three independent completions in five', () => {
    let state: MasteryState = { stage: 'independence_check', successCount: 0, recent: [] };
    for (const assistance of ['independent', 'independent', 'independent', 'reminder', 'needs_help'] as const) state = advanceMastery(state, assistance === 'needs_help' ? 'needs_help' : 'success', assistance).state;
    expect(state.stage).toBe('graduated');
  });
  it('never regresses or changes a graduated skill', () => expect(advanceMastery({ stage: 'graduated', successCount: 0, recent: [] }, 'not_completed', 'not_completed').state.stage).toBe('graduated'));
});

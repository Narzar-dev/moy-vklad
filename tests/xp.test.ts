import { describe, expect, it } from 'vitest';
import { calculateXp, roundToAllowedStep } from '../src/domain/xp';

const base = { baseXp: 10, assistance: 'independent' as const, outcome: 'success' as const, startedWithoutReminder: false, newStepAttempted: false, earnedToday: 0 };
describe('XP policy', () => {
  it('gives full XP in learning', () => expect(calculateXp({ ...base, stage: 'learning' }).awarded).toBe(10));
  it('halves XP in practice on five-point scale', () => expect(calculateXp({ ...base, baseXp: 15, stage: 'practice' }).awarded).toBe(5));
  it('does not award XP during independence check', () => expect(calculateXp({ ...base, stage: 'independence_check', startedWithoutReminder: true }).awarded).toBe(0));
  it('awards all earned XP even after passing the former daily cap', () => expect(calculateXp({ ...base, stage: 'learning', earnedToday: 500, startedWithoutReminder: true })).toMatchObject({ raw: 15, awarded: 15, capReduction: 0 }));
  it('does not reward a request for help', () => expect(calculateXp({ ...base, stage: 'learning', assistance: 'needs_help', outcome: 'needs_help' }).awarded).toBe(0));
  it('rounds down to the supported step', () => expect(roundToAllowedStep(7.5)).toBe(5));
});

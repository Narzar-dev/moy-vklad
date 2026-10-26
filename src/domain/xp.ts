import type { AssistanceLevel, MasteryStage, Outcome } from './types';

export interface XpInput {
  baseXp: number;
  stage: MasteryStage;
  assistance: AssistanceLevel;
  outcome: Outcome;
  startedWithoutReminder: boolean;
  newStepAttempted: boolean;
  earnedToday: number;
}

export interface XpAward { raw: number; bonus: number; awarded: number; capReduction: number }

const multiplier: Record<MasteryStage, number> = {
  learning: 1,
  practice: 0.5,
  independence_check: 0,
  graduated: 0,
};

/** Rounds down to the supported five-point reward scale. */
export function roundToAllowedStep(value: number): number {
  return Math.floor(value / 5) * 5;
}

export function calculateXp(input: XpInput): XpAward {
  if (input.outcome !== 'success' || input.assistance === 'needs_help' || input.assistance === 'not_completed') {
    return { raw: 0, bonus: 0, awarded: 0, capReduction: 0 };
  }
  const factor = multiplier[input.stage];
  const bonus = factor > 0 && (input.startedWithoutReminder || input.newStepAttempted) ? 5 : 0;
  const raw = roundToAllowedStep(input.baseXp * factor) + bonus;
  const awarded = Math.max(0, raw);
  return { raw, bonus, awarded, capReduction: raw - awarded };
}

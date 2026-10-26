import type { AssistanceLevel, MasteryStage, Outcome } from './types';

export interface MasteryState { stage: MasteryStage; successCount: number; recent: ReadonlyArray<{ outcome: Outcome; assistance: AssistanceLevel }> }
export interface MasteryUpdate { state: MasteryState; graduated: boolean }

export function advanceMastery(state: MasteryState, outcome: Outcome, assistance: AssistanceLevel): MasteryUpdate {
  if (state.stage === 'graduated') return { state, graduated: false };
  const success = outcome === 'success' && assistance !== 'needs_help' && assistance !== 'not_completed';
  const recent = [...state.recent, { outcome, assistance }].slice(-5);
  const successCount = success ? state.successCount + 1 : state.successCount;
  if (state.stage === 'learning' && successCount >= 6) return { state: { stage: 'practice', successCount: 0, recent }, graduated: false };
  if (state.stage === 'practice' && successCount >= 6) return { state: { stage: 'independence_check', successCount: 0, recent }, graduated: false };
  if (state.stage === 'independence_check' && recent.length === 5) {
    const successes = recent.filter((item) => item.outcome === 'success').length;
    const independent = recent.filter((item) => item.outcome === 'success' && item.assistance === 'independent').length;
    if (successes >= 4 && independent >= 3) return { state: { stage: 'graduated', successCount, recent }, graduated: true };
  }
  return { state: { ...state, successCount, recent }, graduated: false };
}

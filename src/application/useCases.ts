import { calculateXp } from '@/src/domain/xp';
import { advanceMastery } from '@/src/domain/mastery';
import type { AssistanceLevel, MasteryStage, Outcome } from '@/src/domain/types';
export function completeTaskUseCase(input: { baseXp: number; stage: MasteryStage; assistance: AssistanceLevel; outcome: Outcome; earnedToday: number; startedWithoutReminder?: boolean; newStepAttempted?: boolean }) { return calculateXp({ ...input, startedWithoutReminder: !!input.startedWithoutReminder, newStepAttempted: !!input.newStepAttempted }); }
export function updateMasteryUseCase(stage: MasteryStage, successCount: number, recent: ReadonlyArray<{ outcome: Outcome; assistance: AssistanceLevel }>, outcome: Outcome, assistance: AssistanceLevel) { return advanceMastery({ stage, successCount, recent }, outcome, assistance); }
export function canAwardInitiative(_earnedToday: number) { return 10; }

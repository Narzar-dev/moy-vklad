import type { Gender } from './types';
export type InitiativeCategory = 'noticed' | 'helped' | 'tidied' | 'fixed' | 'improved' | 'learned';
export interface Initiative { id: string; category: InitiativeCategory; benefit: string; status: 'pending' | 'safe' | 'unsafe'; xp: number; localDate: string; }
export const initiativeLabels: Record<InitiativeCategory, (gender: Gender) => string> = {
  noticed: (g) => g === 'male' ? 'Заметил и сделал' : 'Заметила и сделала', helped: (g) => g === 'male' ? 'Помог' : 'Помогла', tidied: (g) => g === 'male' ? 'Навёл порядок' : 'Навела порядок', fixed: (g) => g === 'male' ? 'Исправил ошибку' : 'Исправила ошибку', improved: (g) => g === 'male' ? 'Придумал, как лучше' : 'Придумала, как лучше', learned: (g) => g === 'male' ? 'Научился сам' : 'Научилась сама',
};
export function reviewInitiative(i: Initiative, safe: boolean, _earnedToday: number) { return { ...i, status: safe ? 'safe' as const : 'unsafe' as const, xp: safe ? 10 : 0 }; }

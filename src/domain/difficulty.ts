import { DAILY_STAR_SIZE } from './task-library';

export type Difficulty = 'easy' | 'medium' | 'hard';

export const difficultyOptions: ReadonlyArray<{ value: Difficulty; label: string; stars: number }> = [
  { value: 'easy', label: 'Лёгкий', stars: 3 },
  { value: 'medium', label: 'Средний', stars: 4 },
  { value: 'hard', label: 'Сложный', stars: 5 },
];

export function normalizeDifficulty(value: unknown): Difficulty {
  return value === 'medium' || value === 'hard' ? value : 'easy';
}

export function dailyStarProgress(earnedXp: number, difficulty: Difficulty) {
  const stars = difficultyOptions.find((option) => option.value === difficulty)!.stars;
  const xp = Math.max(0, earnedXp);
  const earned = Math.floor(xp / DAILY_STAR_SIZE);
  const complete = earned >= stars * 3;
  return {
    stars,
    filled: Math.min(stars, earned),
    decorated: Math.min(stars, Math.max(0, earned - stars)),
    premium: Math.min(stars, Math.max(0, earned - stars * 2)),
    complete,
    progressPercent: complete ? 100 : (xp % DAILY_STAR_SIZE) / DAILY_STAR_SIZE * 100,
    xpToNext: complete ? 0 : DAILY_STAR_SIZE - (xp % DAILY_STAR_SIZE),
  };
}

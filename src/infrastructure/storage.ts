import AsyncStorage from '@react-native-async-storage/async-storage';
import importedFamily from '@/src/infrastructure/imported-family.json';
import { catalog } from '@/src/content/catalog';
import { normalizeDifficulty, type Difficulty } from '@/src/domain/difficulty';
import { DEFAULT_SECOND_STAR_DESIGN, DEFAULT_THIRD_STAR_DESIGN, normalizeStarDesign } from '@/src/domain/star-designs';
export type ChildTheme = 'sunny' | 'ocean' | 'forest' | 'berry' | 'lavender' | 'mint' | 'coral' | 'space' | 'rainbow' | 'lemon' | 'rose' | 'sky' | 'meadow' | 'candy' | 'peach' | 'custom';

export interface StoredTask {
  id: string;
  title: string;
  icon: string;
  xp: number;
  steps: string[];
  enabled: boolean;
  categoryId?: string;
  timeStart?: string;
  timeEnd?: string;
}

export interface StoredCategory { id: string; title: string; icon: string }
export interface TaskHistoryEntry { date: string; time: string; taskId: string; title: string; icon: string; result: string; xp: number }

const catalogById = new Map(catalog.map((task) => [task.id, task]));
const previousSchoolTaskStarts: Record<string, string> = {
  'school-backpack': '16:00', 'school-homework': '13:00', 'school-pencilcase': '16:00', 'school-notebooks': '16:00',
  'school-words': '14:00', 'school-math': '14:00', 'school-desk': '16:00', 'school-project': '14:00',
};
export function applyRecommendedTaskTimes(tasks: StoredTask[]): StoredTask[] {
  return tasks.map((task) => {
    const template = catalogById.get(task.id);
    if (!template) return task;
    const schoolStartNeedsUpdate = task.timeStart === previousSchoolTaskStarts[task.id];
    return { ...task, timeStart: schoolStartNeedsUpdate ? template.timeStart : task.timeStart ?? template.timeStart, timeEnd: task.timeEnd ?? template.timeEnd };
  });
}

export interface FamilyState {
  onboarded: boolean;
  name: string;
  gender: 'male' | 'female';
  language: 'ru' | 'en' | 'es' | 'fr';
  ageBand: 'age_5_6' | 'age_7_8' | 'age_9';
  pin: string;
  xp: number;
  difficulty: Difficulty;
  secondStarDesign: string;
  thirdStarDesign: string;
  theme: ChildTheme;
  customColors?: { background: string; surface: string; primary: string; soft: string; text: string; muted: string };
  taskLibrary: StoredTask[];
  completed: string[];
  taskDay: string;
  history: TaskHistoryEntry[];
  customCategories: StoredCategory[];
  deletedCategoryIds: string[];
  taskTimeRecommendationsVersion: number;
  initiatives: { id: string; text: string; status: 'pending' | 'safe' | 'unsafe'; xp: number }[];
  markers: string[];
}

export const defaultState: FamilyState = {
  ...importedFamily,
  gender: importedFamily.gender as FamilyState['gender'],
  language: 'ru',
  ageBand: importedFamily.ageBand as FamilyState['ageBand'],
  theme: importedFamily.theme as ChildTheme,
  difficulty: 'easy',
  secondStarDesign: DEFAULT_SECOND_STAR_DESIGN,
  thirdStarDesign: DEFAULT_THIRD_STAR_DESIGN,
  taskLibrary: applyRecommendedTaskTimes(importedFamily.taskLibrary as StoredTask[]),
  history: importedFamily.history as TaskHistoryEntry[],
  customCategories: importedFamily.customCategories as StoredCategory[],
  deletedCategoryIds: [],
  taskTimeRecommendationsVersion: 2,
  initiatives: [],
  markers: [],
};
const KEY = 'moy-vklad-family-v1';
export async function loadFamily(): Promise<FamilyState> { try { const raw = await AsyncStorage.getItem(KEY); if (!raw) return defaultState; const saved = JSON.parse(raw); delete saved.initialXp; const needsTaskTimeMigration = saved.taskTimeRecommendationsVersion !== 2; return { ...defaultState, ...saved, language: ['ru', 'en', 'es', 'fr'].includes(saved.language) ? saved.language : 'ru', taskLibrary: needsTaskTimeMigration ? applyRecommendedTaskTimes(saved.taskLibrary ?? defaultState.taskLibrary) : saved.taskLibrary ?? defaultState.taskLibrary, taskTimeRecommendationsVersion: 2, difficulty: normalizeDifficulty(saved.difficulty), secondStarDesign: normalizeStarDesign(saved.secondStarDesign, 2), thirdStarDesign: normalizeStarDesign(saved.thirdStarDesign, 3), deletedCategoryIds: saved.deletedCategoryIds ?? [] }; } catch { return defaultState; } }
export async function saveFamily(state: FamilyState) { await AsyncStorage.setItem(KEY, JSON.stringify(state)); }
export async function deleteFamily() { await AsyncStorage.removeItem(KEY); }

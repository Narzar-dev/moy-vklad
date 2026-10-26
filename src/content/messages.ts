import type { Gender } from '@/src/domain/types';
import { genderTr, tr, type Language } from '@/src/content/i18n';

export function initiativeTitle(gender: Gender, language: Language = 'ru'): string { return genderTr(language, 'tasks.initiative', gender); }
export function completedMessage(gender: Gender, assistance: string, language: Language = 'ru'): string {
  if (assistance === 'independent') return genderTr(language, 'result.help', gender);
  return tr(language, 'result.assistance');
}

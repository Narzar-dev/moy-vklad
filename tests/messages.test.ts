import { describe, expect, it } from 'vitest';
import { completedMessage, initiativeTitle } from '../src/content/messages';

describe('gender-aware copy', () => {
  it('uses a complete masculine phrase', () => expect(initiativeTitle('male')).toBe('✨ Я сам придумал'));
  it('uses a complete feminine phrase', () => expect(initiativeTitle('female')).toBe('✨ Я сама придумала'));
  it('does not shame when help was requested', () => expect(completedMessage('female', 'needs_help')).toContain('Просить помощь'));
});

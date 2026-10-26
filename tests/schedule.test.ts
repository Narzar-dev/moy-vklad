import { describe, expect, it } from 'vitest';
import { generateDates, occurrenceId } from '../src/domain/schedule';
describe('schedule generation', () => { it('generates only selected weekdays', () => expect(generateDates('2026-08-24', 7, [1,3,5])).toEqual(['2026-08-24','2026-08-26','2026-08-28'])); it('creates stable occurrence ids', () => expect(occurrenceId('task','2026-08-26')).toBe('task:2026-08-26')); });

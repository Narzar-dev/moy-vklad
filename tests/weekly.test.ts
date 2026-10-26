import { describe, expect, it } from 'vitest';
import { buildWeeklyReview } from '../src/domain/weekly';
describe('weekly review', () => { it('aggregates neutral family metrics', () => expect(buildWeeklyReview([{ outcome:'success', assistance:'independent' }, { outcome:'needs_help', assistance:'needs_help', initiative:true }])).toEqual({ planned:2, completed:1, independent:1, askedForHelp:1, initiatives:1 })); });

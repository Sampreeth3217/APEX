import { describe, it, expect } from 'vitest';
import { inferNeeds, inferNeedsFromCatalog } from '../src/features/profile.js';

describe('free-text need matching (question 10)', () => {
  it('maps plain words to areas', () => {
    expect(inferNeeds('we keep missing phone calls after hours')).toContain('ai_receptionist');
    expect(inferNeeds('chasing unpaid invoices takes forever')).toContain('bookkeeping');
    expect(inferNeeds('staff shifts and payroll')).toContain('workforce');
  });
  it('returns nothing for empty text', () => { expect(inferNeeds('')).toEqual([]); });
  it('falls back to the catalog', () => {
    const tools = [{ name: 'X', category: 'scheduling', summary: 'grooming salon calendar tool' }, { name: 'Y', category: 'bookkeeping', summary: 'ledger' }];
    expect(inferNeedsFromCatalog('help with grooming', tools)).toEqual(['scheduling']);
  });
});

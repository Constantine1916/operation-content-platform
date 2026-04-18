import assert from 'node:assert/strict';
import test from 'node:test';

const { getBeijingDateRange } = await import(
  new URL('./beijing-date-range.ts', import.meta.url).href
);

test('builds a UTC range for a Beijing calendar day', () => {
  const range = getBeijingDateRange('2026-04-18');

  assert.deepEqual(range, {
    startIso: '2026-04-17T16:00:00.000Z',
    endIso: '2026-04-18T16:00:00.000Z',
  });
});

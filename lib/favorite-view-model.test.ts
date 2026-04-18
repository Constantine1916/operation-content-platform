import assert from 'node:assert/strict';
import test from 'node:test';

const { getFavoriteButtonState } = await import(
  new URL('./favorite-view-model.ts', import.meta.url).href
);

test('builds favorite button state from favorite and pending ids', () => {
  assert.deepEqual(
    getFavoriteButtonState('img-1', new Set(['img-1']), new Set()),
    { isFavorite: true, isPending: false }
  );
  assert.deepEqual(
    getFavoriteButtonState('img-2', new Set(['img-1']), new Set(['img-2'])),
    { isFavorite: false, isPending: true }
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

const {
  FAVORITE_CONTENT_TYPES,
  isFavoriteContentType,
  parseFavoriteIdsParam,
  toggleFavoriteState,
} = await import(new URL('./favorites.ts', import.meta.url).href);

test('recognizes supported favorite content types', () => {
  assert.deepEqual(FAVORITE_CONTENT_TYPES, ['image', 'video', 'hotspot', 'article']);
  assert.equal(isFavoriteContentType('image'), true);
  assert.equal(isFavoriteContentType('video'), true);
  assert.equal(isFavoriteContentType('hotspot'), true);
  assert.equal(isFavoriteContentType('article'), true);
  assert.equal(isFavoriteContentType('course'), false);
});

test('parses comma separated ids into a unique trimmed list', () => {
  assert.deepEqual(
    parseFavoriteIdsParam('  a1, b2 ,,a1, c3  '),
    ['a1', 'b2', 'c3'],
  );
  assert.deepEqual(parseFavoriteIdsParam(''), []);
  assert.deepEqual(parseFavoriteIdsParam(null), []);
});

test('toggles optimistic favorite state in memory', () => {
  const initial = new Set(['img-1', 'img-2']);

  const added = toggleFavoriteState(initial, 'img-3', true);
  assert.deepEqual(Array.from(added).sort(), ['img-1', 'img-2', 'img-3']);
  assert.deepEqual(Array.from(initial).sort(), ['img-1', 'img-2']);

  const removed = toggleFavoriteState(added, 'img-2', false);
  assert.deepEqual(Array.from(removed).sort(), ['img-1', 'img-3']);

  const unchanged = toggleFavoriteState(removed, 'img-9', false);
  assert.deepEqual(Array.from(unchanged).sort(), ['img-1', 'img-3']);
});

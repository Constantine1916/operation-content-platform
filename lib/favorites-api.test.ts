import assert from 'node:assert/strict';
import test from 'node:test';

const {
  parseFavoriteMutationInput,
  parseFavoriteListParams,
  parseFavoriteStatusParams,
  orderFavoriteItems,
} = await import(new URL('./favorites-api.ts', import.meta.url).href);

test('parses favorite mutation input and rejects invalid values', () => {
  assert.deepEqual(
    parseFavoriteMutationInput({ content_type: 'image', content_id: 'img-1' }),
    { contentType: 'image', contentId: 'img-1' },
  );

  assert.throws(
    () => parseFavoriteMutationInput({ content_type: 'unknown', content_id: 'img-1' }),
    /content_type/,
  );
  assert.throws(
    () => parseFavoriteMutationInput({ content_type: 'image', content_id: '' }),
    /content_id/,
  );
});

test('parses favorite list params with sane pagination defaults', () => {
  const params = new URLSearchParams({ type: 'video', page: '0', limit: '999' });

  assert.deepEqual(parseFavoriteListParams(params), {
    contentType: 'video',
    page: 1,
    limit: 100,
    from: 0,
    to: 99,
  });
});

test('parses favorite status params into type and unique ids', () => {
  const params = new URLSearchParams({ type: 'article', ids: 'a1,a2,a1' });

  assert.deepEqual(parseFavoriteStatusParams(params), {
    contentType: 'article',
    ids: ['a1', 'a2'],
  });

  assert.throws(() => parseFavoriteStatusParams(new URLSearchParams()), /type/);
});

test('orders favorite items by favorite record order and drops missing items', () => {
  const items = [
    { id: 'img-2', title: 'two' },
    { id: 'img-1', title: 'one' },
  ];
  const favorites = [
    { content_id: 'img-1' },
    { content_id: 'img-3' },
    { content_id: 'img-2' },
  ];

  assert.deepEqual(orderFavoriteItems(items, favorites), [
    { id: 'img-1', title: 'one' },
    { id: 'img-2', title: 'two' },
  ]);
});

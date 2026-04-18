import assert from 'node:assert/strict';
import test from 'node:test';

const { getProfileTabCount } = await import(
  new URL('./profile-tab-count.ts', import.meta.url).href
);

test('returns tab counts only when they are positive', () => {
  assert.equal(
    getProfileTabCount('images', { totalImages: 12, totalVideos: 3 }),
    12
  );
  assert.equal(
    getProfileTabCount('videos', { totalImages: 12, totalVideos: 3 }),
    3
  );
  assert.equal(
    getProfileTabCount('images', { totalImages: 0, totalVideos: 3 }),
    null
  );
  assert.equal(
    getProfileTabCount('videos', { totalImages: 12, totalVideos: 0 }),
    null
  );
  assert.equal(
    getProfileTabCount('courses', { totalImages: 12, totalVideos: 3 }),
    null
  );
});

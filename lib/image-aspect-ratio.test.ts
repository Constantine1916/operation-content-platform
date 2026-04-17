import assert from 'node:assert/strict';
import test from 'node:test';

const { getImageAspectRatio } = await import(
  new URL('./image-aspect-ratio.ts', import.meta.url).href
);
const { getStableImageFrameStyles } = await import(
  new URL('./image-aspect-ratio.ts', import.meta.url).href
);

test('returns a CSS aspect ratio string from valid image dimensions', () => {
  assert.equal(getImageAspectRatio(1024, 1536), '1024 / 1536');
});

test('falls back to a square ratio when dimensions are missing or invalid', () => {
  assert.equal(getImageAspectRatio(0, 1536), '1 / 1');
  assert.equal(getImageAspectRatio(1024, 0), '1 / 1');
  assert.equal(getImageAspectRatio(undefined, 1536), '1 / 1');
  assert.equal(getImageAspectRatio(1024, undefined), '1 / 1');
});

test('builds stable frame styles that do not depend on antd root sizing', () => {
  const styles = getStableImageFrameStyles(1024, 1536);

  assert.deepEqual(styles.frame, {
    aspectRatio: '1024 / 1536',
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  });
  assert.deepEqual(styles.root, {
    position: 'absolute',
    inset: 0,
    display: 'block',
    width: '100%',
    height: '100%',
  });
  assert.deepEqual(styles.image, {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  });
});

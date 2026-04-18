import assert from 'node:assert/strict';
import test from 'node:test';

const {
  isTouchFirstViewport,
  getPreviewPanelMode,
} = await import(new URL('./mobile-viewport.ts', import.meta.url).href);

test('treats narrow or non-hover viewports as touch-first', () => {
  assert.equal(isTouchFirstViewport(390, false), true);
  assert.equal(isTouchFirstViewport(820, false), true);
  assert.equal(isTouchFirstViewport(1280, true), false);
});

test('stacks the preview panel below 1024px or when hover is unavailable', () => {
  assert.equal(getPreviewPanelMode(390, false), 'stacked');
  assert.equal(getPreviewPanelMode(1023, true), 'sidebar');
  assert.equal(getPreviewPanelMode(820, false), 'stacked');
  assert.equal(getPreviewPanelMode(1280, true), 'sidebar');
});

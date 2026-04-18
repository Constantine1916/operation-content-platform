import assert from 'node:assert/strict';
import test from 'node:test';

const { getImagePreviewLayout } = await import(
  new URL('./image-preview-layout.ts', import.meta.url).href
);

test('uses a scrollable stacked layout for touch-sized preview panels', () => {
  const layout = getImagePreviewLayout('stacked');

  assert.equal(layout.overlayClassName.includes('overflow-y-auto'), true);
  assert.equal(layout.shellClassName.includes('min-h-full'), true);
  assert.equal(layout.stageClassName.includes('min-h-[44vh]'), true);
  assert.equal(layout.imageClassName.includes('max-h-[min(48vh,420px)]'), true);
  assert.equal(layout.metaGridClassName.includes('grid-cols-1'), true);
  assert.equal(layout.headerActionsClassName.includes('grid-cols-[minmax(0,1fr)_44px]'), true);
  assert.equal(layout.floatingControlClassName.includes('z-20'), true);
  assert.equal(layout.counterClassName.includes('z-20'), true);
  assert.equal(layout.favoriteButtonClassName.includes('h-11'), true);
  assert.equal(layout.favoriteButtonClassName.includes('w-11'), true);
});

test('keeps the desktop sidebar layout for wide hover-capable previews', () => {
  const layout = getImagePreviewLayout('sidebar');

  assert.equal(layout.overlayClassName.includes('overflow-y-auto'), false);
  assert.equal(layout.shellClassName.includes('h-full'), true);
  assert.equal(layout.shellClassName.includes('lg:flex-row'), true);
  assert.equal(layout.stageClassName.includes('flex-1'), true);
  assert.equal(layout.metaGridClassName.includes('grid-cols-2'), true);
  assert.equal(layout.floatingControlClassName.includes('z-20'), true);
  assert.equal(layout.favoriteButtonClassName.includes('h-11'), false);
});

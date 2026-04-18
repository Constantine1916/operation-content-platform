import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const overviewPageUrl = new URL('./page.tsx', import.meta.url);

test('overview resource cards define destination routes', async () => {
  const source = await readFile(overviewPageUrl, 'utf8');

  assert.match(source, /href:\s*'\/hotspots'/);
  assert.match(source, /href:\s*'\/articles'/);
  assert.match(source, /href:\s*'\/ai-gallery'/);
  assert.match(source, /href:\s*'\/ai-video'/);
});

test('overview resource cards render as links', async () => {
  const source = await readFile(overviewPageUrl, 'utf8');

  assert.match(source, /import Link from 'next\/link';/);
  assert.match(source, /<Link[\s\S]*?href=\{href\}/);
});

test('overview uses a two-column resource grid on mobile', async () => {
  const source = await readFile(overviewPageUrl, 'utf8');

  assert.match(source, /grid-cols-2 gap-3 xl:grid-cols-4/);
  assert.doesNotMatch(source, /grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4/);
});

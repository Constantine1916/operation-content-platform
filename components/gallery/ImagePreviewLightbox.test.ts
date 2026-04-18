import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('close preview button keeps an explicit z-index above the image stage', async () => {
  const source = await readFile(new URL('./ImagePreviewLightbox.tsx', import.meta.url), 'utf8');

  const closeButtonMatch = source.match(
    /aria-label="关闭预览"[\s\S]*?className="([^"]+)"/
  );

  assert.ok(closeButtonMatch, 'expected to find the close preview button');
  assert.match(
    closeButtonMatch[1],
    /\bz-\[[^\]]+\]|\bz-\d+\b/,
    'expected close preview button to declare an explicit z-index class'
  );
});

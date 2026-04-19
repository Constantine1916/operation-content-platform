import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('media preview shell owns the shared overlay z-index and auth-aware download guard', async () => {
  const source = await readFile(new URL('./MediaPreviewShell.tsx', import.meta.url), 'utf8');

  assert.match(source, /className="fixed inset-0 z-\[1000\]/);
  assert.match(source, /beforeDownload/);
  assert.match(source, /if \(beforeDownload && !\(await beforeDownload\(item\)\)\) return/);
  assert.match(source, /复制提示词/);
});

test('media preview shell keeps shared keyboard navigation and creator card chrome', async () => {
  const source = await readFile(new URL('./MediaPreviewShell.tsx', import.meta.url), 'utf8');

  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /event\.key === 'ArrowLeft'/);
  assert.match(source, /event\.key === 'ArrowRight'/);
  assert.match(source, /创作者/);
});


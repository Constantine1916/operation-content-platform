import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('NSFW placeholder renders an explicit NSFW label', async () => {
  const source = await readFile(new URL('./NsfwPlaceholder.tsx', import.meta.url), 'utf8');
  assert.match(source, /NSFW/);
  assert.match(source, /不适宜公开展示/);
});

test('admin moderation actions expose restore hide and nsfw controls', async () => {
  const source = await readFile(new URL('./AdminModerationActions.tsx', import.meta.url), 'utf8');
  assert.match(source, /恢复/);
  assert.match(source, /隐藏/);
  assert.match(source, /标记 NSFW/);
  assert.match(source, /window.confirm/);
});

test('preview shell disables download for NSFW media', async () => {
  const source = await readFile(new URL('../gallery/MediaPreviewShell.tsx', import.meta.url), 'utf8');
  assert.match(source, /moderation_status/);
  assert.match(source, /isNsfw/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('public ai gallery keeps admin listing display identical while exposing card management', async () => {
  const source = await readFile(new URL('./PublicAiGalleryPage.tsx', import.meta.url), 'utf8');

  assert.match(source, /useAdminModeration/);
  assert.match(source, /AdminModerationActions/);
  assert.match(source, /adminModerationAction/);
  assert.match(source, /NsfwPlaceholder/);
  assert.doesNotMatch(source, /AdminModerationFilter/);
  assert.doesNotMatch(source, /setModerationFilter/);
  assert.doesNotMatch(source, /params\.set\('moderation'/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('public ai gallery exposes admin moderation filters and NSFW rendering', async () => {
  const source = await readFile(new URL('./PublicAiGalleryPage.tsx', import.meta.url), 'utf8');
  assert.match(source, /useAdminModeration/);
  assert.match(source, /moderationFilter/);
  assert.match(source, /AdminModerationActions/);
  assert.match(source, /NsfwPlaceholder/);
});

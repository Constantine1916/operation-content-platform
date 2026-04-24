import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function read(relativePath: string) {
  return readFile(path.join(process.cwd(), relativePath), 'utf8');
}

test('gallery API accepts moderation filters through shared parsing', async () => {
  const source = await read('app/api/gallery/route.ts');
  assert.match(source, /parseModerationFilter/);
  assert.match(source, /requireAdminUser/);
  assert.match(source, /getPublicGalleryImages/);
});

test('ai video API uses shared public content query and moderation filtering', async () => {
  const source = await read('app/api/ai-video/route.ts');
  assert.match(source, /getPublicVideos/);
  assert.match(source, /getPublicVideoModels/);
  assert.match(source, /parseModerationFilter/);
  assert.match(source, /requireAdminUser/);
});

test('owner asset API requires auth and includes hidden plus nsfw statuses', async () => {
  const source = await read('app/api/profile/assets/route.ts');
  assert.match(source, /authRequiredResponse/);
  assert.match(source, /requireUser/);
  assert.match(source, /moderation_status/);
  assert.match(source, /maskModeratedMedia/);
});

test('favorites API filters hidden moderated media and masks nsfw media', async () => {
  const source = await read('app/api/favorites/route.ts');
  assert.match(source, /moderation_status/);
  assert.match(source, /active', 'nsfw/);
  assert.match(source, /maskModeratedMedia/);
});

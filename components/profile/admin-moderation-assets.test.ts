import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function read(relativePath: string) {
  return readFile(path.join(process.cwd(), relativePath), 'utf8');
}

test('private assets use owner asset API and show moderation badges', async () => {
  const panel = await read('components/profile/MyAssetsPanel.tsx');
  const cards = await read('components/profile/ProfileContentCards.tsx');
  assert.match(panel, /\/api\/profile\/assets/);
  assert.match(panel, /Authorization/);
  assert.match(cards, /NsfwPlaceholder/);
  assert.match(cards, /已隐藏/);
  assert.match(cards, /NSFW/);
});

test('public profile image and video grids preserve public moderation behavior', async () => {
  const page = await read('app/profile/[username]/page.tsx');
  const imageGrid = await read('app/profile/[username]/ImageGrid.tsx');
  const profileTabs = await read('app/profile/[username]/ProfileTabs.tsx');
  assert.match(page, /moderation_status/);
  assert.match(imageGrid, /NsfwPlaceholder/);
  assert.match(profileTabs, /NsfwPlaceholder/);
});

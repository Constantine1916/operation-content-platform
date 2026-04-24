import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./route.ts', import.meta.url), 'utf8');
const adminAuthSource = await readFile(new URL('../../../../../lib/server/admin-auth.ts', import.meta.url), 'utf8');

test('admin moderation route uses shared auth and admin role guard', () => {
  assert.match(source, /authRequiredResponse/);
  assert.match(source, /requireAdminUser/);
  assert.match(adminAuthSource, /profiles/);
  assert.match(adminAuthSource, /role/);
});

test('admin moderation route supports image and video tables', () => {
  assert.match(source, /contentType === 'image'/);
  assert.match(source, /ai_images/);
  assert.match(source, /ai_videos/);
});

test('admin moderation route records moderation audit fields', () => {
  assert.match(source, /moderation_status/);
  assert.match(source, /moderated_by/);
  assert.match(source, /moderated_at/);
});

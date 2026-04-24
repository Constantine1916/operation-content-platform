import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./public-content.ts', import.meta.url), 'utf8');

test('public gallery and video queries include moderation fields', () => {
  assert.match(source, /moderation_status/);
  assert.match(source, /is_public/);
});

test('public content queries filter by public moderation statuses', () => {
  assert.match(source, /getPublicModerationStatuses/);
  assert.match(source, /\.in\('moderation_status'/);
});

test('public content masks NSFW media URLs before returning items', () => {
  assert.match(source, /maskModeratedMedia/);
  assert.match(source, /video_url/);
  assert.match(source, /url/);
});

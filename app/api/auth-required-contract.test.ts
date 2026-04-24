import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const ROUTE_FILES = [
  'app/api/admin/content/moderate/route.ts',
  'app/api/favorites/route.ts',
  'app/api/favorites/status/route.ts',
  'app/api/profile/route.ts',
  'app/api/profile/avatar/route.ts',
  'app/api/profile/assets/route.ts',
  'app/api/profile/images/upload/route.ts',
  'app/api/generate-image/submit/route.ts',
  'app/api/generate-image/poll/route.ts',
  'app/api/generate-image/images/route.ts',
  'app/api/generate-image/history/route.ts',
  'app/api/generate-image/delete/route.ts',
] as const;

test('protected API routes use the shared auth required response contract', async () => {
  for (const relativePath of ROUTE_FILES) {
    const source = await readFile(path.join(process.cwd(), relativePath), 'utf8');

    assert.match(
      source,
      /authRequiredResponse/,
      `${relativePath} should use the shared authRequiredResponse helper`,
    );
    assert.doesNotMatch(
      source,
      /NextResponse\.json\(\{ error: '(?:未登录|Unauthorized|Invalid token|无效登录态)' \}, \{ status: 401 \}\)/,
      `${relativePath} should not hand-roll auth 401 payloads`,
    );
  }
});

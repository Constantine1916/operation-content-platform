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

test('preview keeps a beforeDownload guard for auth-controlled downloads', async () => {
  const source = await readFile(new URL('./ImagePreviewLightbox.tsx', import.meta.url), 'utf8');

  assert.match(source, /beforeDownload/);
  assert.match(source, /if \(beforeDownload && !\(await beforeDownload\(\)\)\) return/);
});

test('public gallery and public profile grid gate downloads through auth action hooks', async () => {
  const gallerySource = await readFile(new URL('../public/PublicAiGalleryPage.tsx', import.meta.url), 'utf8');
  const profileGridSource = await readFile(new URL('../../app/profile/[username]/ImageGrid.tsx', import.meta.url), 'utf8');

  assert.match(gallerySource, /useAuthActionGate/);
  assert.match(gallerySource, /beforeDownload=\{\(\) => requireAuthForAction\(\{ kind: 'download' \}\)\.then\(Boolean\)\}/);
  assert.match(profileGridSource, /useAuthActionGate/);
  assert.match(profileGridSource, /beforeDownload=\{\(\) => requireAuthForAction\(\{ kind: 'download' \}\)\.then\(Boolean\)\}/);
});

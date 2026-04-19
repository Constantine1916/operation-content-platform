import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('image preview delegates shared chrome to the media preview shell and keeps image transform controls', async () => {
  const source = await readFile(new URL('./ImagePreviewLightbox.tsx', import.meta.url), 'utf8');

  assert.match(source, /from '\.\/MediaPreviewShell'/);
  assert.match(source, /mediaLabel="图片预览"/);
  assert.match(source, /水平镜像/);
  assert.match(source, /垂直镜像/);
  assert.match(source, /重置视图/);
});

test('preview keeps a beforeDownload guard for auth-controlled downloads', async () => {
  const source = await readFile(new URL('./MediaPreviewShell.tsx', import.meta.url), 'utf8');

  assert.match(source, /beforeDownload/);
  assert.match(source, /if \(beforeDownload && !\(await beforeDownload\(item\)\)\) return/);
});

test('public gallery and public profile grid gate downloads through auth action hooks', async () => {
  const gallerySource = await readFile(new URL('../public/PublicAiGalleryPage.tsx', import.meta.url), 'utf8');
  const profileGridSource = await readFile(new URL('../../app/profile/[username]/ImageGrid.tsx', import.meta.url), 'utf8');

  assert.match(gallerySource, /useAuthActionGate/);
  assert.match(gallerySource, /beforeDownload=\{\(\) => requireAuthForAction\(\{ kind: 'download' \}\)\.then\(Boolean\)\}/);
  assert.match(profileGridSource, /useAuthActionGate/);
  assert.match(profileGridSource, /beforeDownload=\{\(\) => requireAuthForAction\(\{ kind: 'download' \}\)\.then\(Boolean\)\}/);
});

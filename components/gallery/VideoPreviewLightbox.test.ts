import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('video preview lightbox composes the shared media preview shell', async () => {
  const source = await readFile(new URL('./VideoPreviewLightbox.tsx', import.meta.url), 'utf8');

  assert.match(source, /from '\.\/MediaPreviewShell'/);
  assert.match(source, /mediaLabel="视频预览"/);
  assert.match(source, /renderStage=\{\(\{ item \}\) => \(/);
  assert.match(source, /<video/);
});

test('video preview lightbox exposes video metadata and keeps the download button path', async () => {
  const source = await readFile(new URL('./VideoPreviewLightbox.tsx', import.meta.url), 'utf8');

  assert.match(source, /label: '模型'/);
  assert.match(source, /label: '平台'/);
  assert.match(source, /defaultDownloadExtension="mp4"/);
  assert.doesNotMatch(source, /水平镜像|垂直镜像|重置视图/);
});


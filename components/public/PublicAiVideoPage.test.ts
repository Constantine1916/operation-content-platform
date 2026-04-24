import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('public ai video page opens the shared preview lightbox from video cards', async () => {
  const source = await readFile(new URL('./PublicAiVideoPage.tsx', import.meta.url), 'utf8');

  assert.match(source, /const \[selectedPreviewIndex, setSelectedPreviewIndex\] = useState<number \| null>\(null\)/);
  assert.match(source, /<VideoPreviewLightbox/);
  assert.match(source, /selectedIndex=\{selectedPreviewIndex\}/);
  assert.match(source, /onOpenPreview=\{\(\) => setSelectedPreviewIndex\(index\)\}/);
});

test('public ai video page gates preview downloads through the auth action hook', async () => {
  const source = await readFile(new URL('./PublicAiVideoPage.tsx', import.meta.url), 'utf8');

  assert.match(source, /useAuthActionGate/);
  assert.match(source, /beforeDownload=\{\(\) => requireAuthForAction\(\{ kind: 'download' \}\)\.then\(Boolean\)\}/);
});

test('public ai video exposes admin moderation filters and NSFW rendering', async () => {
  const source = await readFile(new URL('./PublicAiVideoPage.tsx', import.meta.url), 'utf8');
  assert.match(source, /useAdminModeration/);
  assert.match(source, /moderationFilter/);
  assert.match(source, /AdminModerationActions/);
  assert.match(source, /NsfwPlaceholder/);
});

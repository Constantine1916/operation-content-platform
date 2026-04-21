import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('auth dialog renders the shared brand logo and branded support copy', async () => {
  const source = await readFile(new URL('./AuthDialog.tsx', import.meta.url), 'utf8');

  assert.match(source, /logo\.png/);
  assert.match(source, /继续登录后即可同步收藏、下载与个人中心/);
});

test('auth dialog and forms use dedicated motion hooks for overlay, panel, and content transitions', async () => {
  const dialogSource = await readFile(new URL('./AuthDialog.tsx', import.meta.url), 'utf8');
  const globalSource = await readFile(new URL('../../app/globals.css', import.meta.url), 'utf8');

  assert.match(dialogSource, /auth-dialog-overlay/);
  assert.match(dialogSource, /auth-dialog-panel/);
  assert.match(dialogSource, /auth-dialog-form-enter/);
  assert.match(globalSource, /@keyframes auth-dialog-overlay-in/);
  assert.match(globalSource, /@keyframes auth-dialog-panel-in/);
  assert.match(globalSource, /@keyframes auth-dialog-form-in/);
});

test('auth dialog can grow to the viewport height budget before relying on internal scroll', async () => {
  const source = await readFile(new URL('./AuthDialog.tsx', import.meta.url), 'utf8');
  const globalSource = await readFile(new URL('../../app/globals.css', import.meta.url), 'utf8');

  assert.match(source, /max-h-\[calc\(100svh-2rem\)\]/);
  assert.match(source, /sm:max-h-\[calc\(100svh-4rem\)\]/);
  assert.doesNotMatch(source, /max-h-\[min\(90svh,44rem\)\]/);
  assert.match(source, /overflow-y-auto/);
  assert.match(source, /auth-dialog-scrollbar-hidden/);
  assert.match(globalSource, /\.auth-dialog-scrollbar-hidden\s*\{/);
  assert.match(globalSource, /scrollbar-width:\s*none/);
  assert.match(globalSource, /\.auth-dialog-scrollbar-hidden::-webkit-scrollbar\s*\{/);
  assert.match(globalSource, /display:\s*none/);
});

test('auth dialog overlay stays above the image preview lightbox overlay', async () => {
  const authDialogSource = await readFile(new URL('./AuthDialog.tsx', import.meta.url), 'utf8');
  const previewSource = await readFile(new URL('../gallery/MediaPreviewShell.tsx', import.meta.url), 'utf8');

  const authOverlayZIndex = authDialogSource.match(/auth-dialog-overlay[\s\S]*?z-\[(\d+)\]/);
  const previewOverlayZIndex = previewSource.match(/className="fixed inset-0 z-\[(\d+)\]/);

  assert.ok(authOverlayZIndex, 'expected auth dialog overlay to declare an explicit z-index');
  assert.ok(previewOverlayZIndex, 'expected image preview overlay to declare an explicit z-index');
  assert.ok(
    Number(authOverlayZIndex[1]) > Number(previewOverlayZIndex[1]),
    'expected auth dialog overlay to sit above the image preview lightbox overlay'
  );
});

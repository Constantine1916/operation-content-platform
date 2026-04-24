import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('auth dialog keeps the shared brand logo without the legacy heading and support copy', async () => {
  const source = await readFile(new URL('./AuthDialog.tsx', import.meta.url), 'utf8');

  assert.match(source, /logo\.png/);
  assert.doesNotMatch(source, /auth-dialog-title/);
  assert.doesNotMatch(source, /登录后继续浏览/);
  assert.doesNotMatch(source, /注册后开始使用/);
  assert.doesNotMatch(source, /继续登录后即可同步收藏、下载与个人中心/);
  assert.match(source, /aria-label=\{activeTab === 'register' \? '注册弹窗' : '登录弹窗'\}/);
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

test('auth dialog lets register mode scroll when the viewport is short', async () => {
  const source = await readFile(new URL('./AuthDialog.tsx', import.meta.url), 'utf8');
  const globalSource = await readFile(new URL('../../app/globals.css', import.meta.url), 'utf8');

  assert.match(source, /max-h-\[calc\(100svh-2rem\)\]/);
  assert.match(source, /sm:max-h-\[calc\(100svh-4rem\)\]/);
  assert.doesNotMatch(source, /max-h-\[min\(90svh,44rem\)\]/);
  assert.doesNotMatch(source, /activeTab === 'register'[\s\S]*\?\s*'[^']*overflow-y-hidden/);
  assert.match(source, /activeTab === 'register'[\s\S]*\?\s*'[^']*overflow-y-auto/);
  assert.doesNotMatch(source, /auth-dialog-scrollbar-hidden/);
  assert.doesNotMatch(globalSource, /auth-dialog-scrollbar-hidden/);
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

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

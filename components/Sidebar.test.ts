import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sidebarUrl = new URL('./Sidebar.tsx', import.meta.url);

test('sidebar exposes the agent menu entry', async () => {
  const source = await readFile(sidebarUrl, 'utf8');

  assert.match(source, /title:\s*'Agent 智能体'/);
  assert.match(source, /href:\s*'\/agent'/);
  assert.match(source, /access:\s*'public'/);
});

test('sidebar marks md2image as a private item while keeping public items navigable', async () => {
  const source = await readFile(sidebarUrl, 'utf8');

  assert.match(source, /title:\s*'概览'[\s\S]*access:\s*'public'/);
  assert.match(source, /title:\s*'MD转图片'[\s\S]*access:\s*'private'/);
});

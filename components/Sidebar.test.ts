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

test('sidebar places the agent menu item after AI 图片', async () => {
  const source = await readFile(sidebarUrl, 'utf8');

  const imageIndex = source.indexOf("title: 'AI 图片'");
  const agentIndex = source.indexOf("title: 'Agent 智能体'");

  assert.notEqual(imageIndex, -1, 'expected AI 图片 menu item');
  assert.notEqual(agentIndex, -1, 'expected Agent 智能体 menu item');
  assert.ok(agentIndex > imageIndex, 'expected Agent 智能体 to appear after AI 图片');
});

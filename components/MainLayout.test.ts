import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layoutUrl = new URL('./MainLayout.tsx', import.meta.url);

test('main layout can hide the sidebar shell while keeping the navbar', async () => {
  const source = await readFile(layoutUrl, 'utf8');

  assert.match(source, /showSidebar\?: boolean/);
  assert.match(source, /showSidebar = true/);
  assert.match(source, /showSidebar && sidebarOpen/);
  assert.match(source, /showSidebar && \(/);
  assert.match(source, /<Navbar(?:.|\n)*onMenuClick=\{showSidebar \? \(\) => setSidebarOpen\(!sidebarOpen\) : undefined\}/);
});

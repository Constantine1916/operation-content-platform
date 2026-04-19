import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

test('root layout installs the shared auth modal provider', async () => {
  const source = await read('./layout.tsx');

  assert.match(source, /AuthModalProvider/);
  assert.match(source, /<AuthModalProvider>[\s\S]*\{children\}[\s\S]*<\/AuthModalProvider>/);
});

test('/login delegates to AuthRouteLauncher with the login tab', async () => {
  const source = await read('./login/page.tsx');

  assert.doesNotMatch(source, /^'use client';?/m);
  assert.match(source, /AuthRouteLauncher/);
  assert.match(source, /defaultTab="login"/);
});

test('/register delegates to AuthRouteLauncher with the register tab', async () => {
  const source = await read('./register/page.tsx');

  assert.doesNotMatch(source, /^'use client';?/m);
  assert.match(source, /AuthRouteLauncher/);
  assert.match(source, /defaultTab="register"/);
});

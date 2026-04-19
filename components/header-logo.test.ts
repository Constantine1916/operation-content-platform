import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('signed-in navbar uses a larger logo size', async () => {
  const source = await readFile(new URL('./Navbar.tsx', import.meta.url), 'utf8');

  assert.match(source, /className="h-14 w-auto flex-shrink-0 object-contain sm:h-\[60px\]"/);
});

test('public auth header uses a larger logo size', async () => {
  const source = await readFile(new URL('./AuthLayout.tsx', import.meta.url), 'utf8');

  assert.match(source, /className="h-14 w-auto flex-shrink-0 object-contain sm:h-\[60px\]"/);
});

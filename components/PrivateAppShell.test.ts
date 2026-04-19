import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const privateShellUrl = new URL('./PrivateAppShell.tsx', import.meta.url);

test('private auth shell delegates guest blocking to the shared auth layout', async () => {
  const source = await readFile(privateShellUrl, 'utf8');

  assert.match(source, /AuthLayout/);
  assert.doesNotMatch(source, /router\.(replace|push)\('\/'\)/);
});

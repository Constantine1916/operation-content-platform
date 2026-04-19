import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const privateShellUrl = new URL('./PrivateAppShell.tsx', import.meta.url);

test('private auth shell redirects guests to the home page and renders MainLayout for signed-in users', async () => {
  const source = await readFile(privateShellUrl, 'utf8');

  assert.match(source, /router\.(replace|push)\('\/'\)/);
  assert.match(source, /<MainLayout>/);
  assert.match(source, /supabase\.auth\.getSession/);
});

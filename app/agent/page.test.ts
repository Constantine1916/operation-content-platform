import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const agentPageUrl = new URL('./page.tsx', import.meta.url);

test('agent page stays behind the private app shell', async () => {
  const source = await readFile(agentPageUrl, 'utf8');

  assert.match(source, /PrivateAppShell/);
});

test('agent page renders the coming soon placeholder copy', async () => {
  const source = await readFile(agentPageUrl, 'utf8');

  assert.match(source, /Agent 智能体/);
  assert.match(source, /即将上线，敬请期待！/);
});

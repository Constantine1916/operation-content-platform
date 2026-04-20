import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navbarUrl = new URL('./Navbar.tsx', import.meta.url);

test('navbar derives a session-backed fallback profile while the profile API is still loading', async () => {
  const source = await readFile(navbarUrl, 'utf8');

  assert.match(source, /function buildSessionProfile\(session: Session \| null\)/);
  assert.match(source, /const \[sessionProfile, setSessionProfile\] = useState<Profile \| null>\(null\)/);
  assert.match(source, /const displayProfile = profile \?\? sessionProfile/);
});

test('navbar renders authenticated chrome from the display profile instead of waiting only on the profile response', async () => {
  const source = await readFile(navbarUrl, 'utf8');

  assert.match(source, /\{displayProfile \?\s*\(/);
  assert.doesNotMatch(source, /\{profile \?\s*\(/);
});

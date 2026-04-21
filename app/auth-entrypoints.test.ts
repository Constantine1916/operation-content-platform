import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('public landing page opens auth modal instead of linking to legacy auth pages', async () => {
  const source = await readFile(new URL('../components/public/PublicLandingPage.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /href="\/login"/);
  assert.doesNotMatch(source, /href="\/register"/);
  assert.match(source, /AuthModalButton/);
});

test('public landing page matches the shared gray page background while keeping a brighter header', async () => {
  const source = await readFile(new URL('../components/public/PublicLandingPage.tsx', import.meta.url), 'utf8');

  assert.match(source, /min-h-screen bg-gray-50/);
  assert.match(source, /nav className="fixed inset-x-0 top-0 z-50 bg-white\/95/);
  assert.doesNotMatch(source, /min-h-screen bg-white/);
  assert.doesNotMatch(source, /bg-\[#f8f7f4\]/);
});

test('generate image page no longer redirects guests to the legacy login page', async () => {
  const source = await readFile(new URL('./generate-img/page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /router\.replace\('\/login'\)/);
});

test('public landing page opts out of the left sidebar shell', async () => {
  const source = await readFile(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.match(source, /<AuthLayout showSidebar=\{false\}>/);
});

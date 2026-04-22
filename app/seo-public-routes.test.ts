import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

test('root layout no longer imports AuthLayout and defines a metadataBase', async () => {
  const source = await read('./layout.tsx');

  assert.doesNotMatch(source, /AuthLayout/);
  assert.match(source, /metadataBase:/);
});

test('private pages opt into the local private auth shell', async () => {
  const privatePages = [
    './generate-img/page.tsx',
    './md2image/page.tsx',
    './profile/page.tsx',
  ];

  for (const pagePath of privatePages) {
    const source = await read(pagePath);
    assert.match(source, /PrivateAppShell/);
  }
});

test('public routes are server entries with route metadata', async () => {
  const publicPages = [
    './page.tsx',
    './articles/page.tsx',
    './hotspots/page.tsx',
    './ai-video/page.tsx',
    './ai-gallery/page.tsx',
  ];

  for (const pagePath of publicPages) {
    const source = await read(pagePath);
    assert.doesNotMatch(source, /^'use client';?/m);
    assert.match(source, /export const metadata/);
  }
});

test('data-backed public listing pages opt out of static html caching', async () => {
  const dataBackedPages = [
    './articles/page.tsx',
    './hotspots/page.tsx',
    './ai-video/page.tsx',
    './ai-gallery/page.tsx',
  ];

  for (const pagePath of dataBackedPages) {
    const source = await read(pagePath);
    assert.match(source, /export const dynamic = 'force-dynamic'/);
  }
});

test('overview and agent are public pages that use the shared auth layout', async () => {
  const publicClientPages = [
    './overview/page.tsx',
    './agent/page.tsx',
  ];

  for (const pagePath of publicClientPages) {
    const source = await read(pagePath);
    assert.match(source, /AuthLayout/);
    assert.doesNotMatch(source, /PrivateAppShell/);
  }
});

test('public profile stays a server entry', async () => {
  const source = await read('./profile/[username]/page.tsx');

  assert.doesNotMatch(source, /^'use client';?/m);
});

test('public routes opt into the session-aware auth shell to preserve signed-in chrome', async () => {
  const publicPages = [
    './page.tsx',
    './overview/page.tsx',
    './agent/page.tsx',
    './articles/page.tsx',
    './hotspots/page.tsx',
    './ai-video/page.tsx',
    './ai-gallery/page.tsx',
    './profile/[username]/page.tsx',
  ];

  for (const pagePath of publicPages) {
    const source = await read(pagePath);
    assert.match(source, /AuthLayout/);
  }
});

test('public routes delegate interactivity to components/public client modules', async () => {
  const routeChecks = [
    { path: './page.tsx', importPattern: /components\/public\/PublicLandingPage/ },
    { path: './articles/page.tsx', importPattern: /components\/public\/PublicArticlesPage/ },
    { path: './hotspots/page.tsx', importPattern: /components\/public\/PublicHotspotsPage/ },
    { path: './ai-video/page.tsx', importPattern: /components\/public\/PublicAiVideoPage/ },
    { path: './ai-gallery/page.tsx', importPattern: /components\/public\/PublicAiGalleryPage/ },
  ];

  for (const check of routeChecks) {
    const source = await read(check.path);
    assert.match(source, check.importPattern);
  }
});

test('robots and sitemap files define the public crawl surface', async () => {
  const robotsSource = await read('./robots.ts');
  const sitemapSource = await read('./sitemap.ts');

  assert.match(robotsSource, /User-Agent|rules|allow/i);
  assert.match(sitemapSource, /['"]\/['"]/);
  assert.match(sitemapSource, /['"]\/articles['"]/);
  assert.match(sitemapSource, /['"]\/hotspots['"]/);
  assert.match(sitemapSource, /['"]\/ai-video['"]/);
  assert.match(sitemapSource, /['"]\/ai-gallery['"]/);
});

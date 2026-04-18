import assert from 'node:assert/strict';
import test from 'node:test';

const { getProfileCenterSecondaryTabs, PROFILE_CENTER_PRIMARY_TABS } = await import(
  new URL('./profile-center-tabs.ts', import.meta.url).href
);

test('exposes expected primary tabs for profile center', () => {
  assert.deepEqual(
    PROFILE_CENTER_PRIMARY_TABS.map((tab: { key: string }) => tab.key),
    ['assets', 'uploads', 'favorites', 'settings']
  );
});

test('returns expected secondary tabs for assets, uploads, and favorites', () => {
  assert.deepEqual(getProfileCenterSecondaryTabs('assets').map((tab: { key: string }) => tab.key), [
    'images',
    'videos',
    'courses',
  ]);
  assert.deepEqual(getProfileCenterSecondaryTabs('uploads').map((tab: { key: string }) => tab.key), [
    'images',
  ]);
  assert.deepEqual(getProfileCenterSecondaryTabs('favorites').map((tab: { key: string }) => tab.key), [
    'images',
    'videos',
    'hotspots',
    'articles',
  ]);
  assert.deepEqual(getProfileCenterSecondaryTabs('settings'), []);
});

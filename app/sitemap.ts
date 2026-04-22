import type { MetadataRoute } from 'next';
import { getPublicProfileUsernames, getSiteUrl } from '@/lib/server/public-content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const publicRoutes = ['/', '/overview', '/agent', '/articles', '/hotspots', '/ai-video', '/ai-gallery'];
  const usernames = await getPublicProfileUsernames();

  const staticEntries: MetadataRoute.Sitemap = publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'daily',
    priority: path === '/' ? 1 : 0.8,
  }));

  const profileEntries: MetadataRoute.Sitemap = usernames.map((username) => ({
    url: `${siteUrl}/profile/${username}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...profileEntries];
}

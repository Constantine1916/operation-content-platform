import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/server/public-content';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const publicRoutes = ['/', '/articles', '/hotspots', '/ai-video', '/ai-gallery'];

  return publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'daily',
    priority: path === '/' ? 1 : 0.8,
  }));
}

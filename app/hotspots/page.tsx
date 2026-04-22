import type { Metadata } from 'next';
import AuthLayout from '@/components/AuthLayout';
import PublicHotspotsPage from '@/components/public/PublicHotspotsPage';
import { getPublicHotspots } from '@/lib/server/public-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI 资讯',
  description: '公开浏览 AI 热点资讯，按来源查看最新站点资讯与社交媒体热点。',
  alternates: {
    canonical: '/hotspots',
  },
};

export default async function HotspotsPage() {
  const initial = await getPublicHotspots({ page: 1, limit: 100, sourceType: 'all' });

  return (
    <AuthLayout>
      <PublicHotspotsPage initialHotspots={initial.items} initialHasMore={initial.hasMore} />
    </AuthLayout>
  );
}

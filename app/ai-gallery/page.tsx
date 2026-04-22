import type { Metadata } from 'next';
import AuthLayout from '@/components/AuthLayout';
import PublicAiGalleryPage from '@/components/public/PublicAiGalleryPage';
import { getPublicGalleryImages } from '@/lib/server/public-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI 图片',
  description: '公开浏览 AI 图片画廊，查看创作者发布的公开 AI 生成作品。',
  alternates: {
    canonical: '/ai-gallery',
  },
};

export default async function AiGalleryPage() {
  const initial = await getPublicGalleryImages({ page: 1, limit: 50 });

  return (
    <AuthLayout>
      <PublicAiGalleryPage initialImages={initial.items} initialHasMore={initial.hasMore} />
    </AuthLayout>
  );
}

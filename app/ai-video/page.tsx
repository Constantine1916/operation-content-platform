import type { Metadata } from 'next';
import AuthLayout from '@/components/AuthLayout';
import PublicAiVideoPage from '@/components/public/PublicAiVideoPage';
import { getPublicVideoModels, getPublicVideos } from '@/lib/server/public-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI 视频',
  description: '公开浏览 AI 视频合集，按模型筛选最新 AI 创作视频内容。',
  alternates: {
    canonical: '/ai-video',
  },
};

export default async function AiVideoPage() {
  const [initialVideos, initialModels] = await Promise.all([
    getPublicVideos({ page: 1, limit: 20 }),
    getPublicVideoModels(),
  ]);

  return (
    <AuthLayout>
      <PublicAiVideoPage
        initialVideos={initialVideos.items}
        initialModels={initialModels}
        initialHasMore={initialVideos.hasMore}
      />
    </AuthLayout>
  );
}

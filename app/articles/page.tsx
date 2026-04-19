import type { Metadata } from 'next';
import AuthLayout from '@/components/AuthLayout';
import PublicArticlesPage from '@/components/public/PublicArticlesPage';
import { getPublicArticles } from '@/lib/server/public-content';

export const metadata: Metadata = {
  title: 'AI 文章',
  description: '公开浏览 AI 文章聚合内容，按平台与作者筛选最新文章。',
  alternates: {
    canonical: '/articles',
  },
};

export default async function ArticlesPage() {
  const initial = await getPublicArticles({ page: 1, limit: 20 });

  return (
    <AuthLayout>
      <PublicArticlesPage initialArticles={initial.items} initialHasMore={initial.hasMore} />
    </AuthLayout>
  );
}

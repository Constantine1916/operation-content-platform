import type { Metadata } from 'next';
import AuthLayout from '@/components/AuthLayout';
import PublicLandingPage from '@/components/public/PublicLandingPage';

export const metadata: Metadata = {
  title: '首页',
  description: '发现 AI 时代最好的原创内容，浏览 AI 资讯、文章、图片、视频与课程。',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <AuthLayout>
      <PublicLandingPage />
    </AuthLayout>
  );
}

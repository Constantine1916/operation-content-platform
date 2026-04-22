// app/profile/[username]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AuthLayout from '@/components/AuthLayout';
import { getPublicProfileByUsername } from '@/lib/server/public-content';
import { ProfileImage } from './ImageGrid';
import ProfileTabs from './ProfileTabs';

export const dynamic = 'force-dynamic';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const PAGE_LIMIT = 20;

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const profile = await getPublicProfileByUsername(params.username);

  if (!profile) {
    return {
      title: '用户不存在',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${profile.username} 的主页`;
  const description = profile.bio?.trim()
    || `浏览 ${profile.username} 在 AI树洞发布的公开 AI 图片与视频内容。`;

  return {
    title,
    description,
    alternates: {
      canonical: `/profile/${profile.username}`,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;
  const db = serviceClient();
  const profile = await getPublicProfileByUsername(username);

  if (!profile) return notFound();

  // 2. Fetch public images and total videos
  const [
    { data: images, error: imagesError, count: imageCount },
    { error: videosError, count: videoCount },
  ] = await Promise.all([
    db
      .from('ai_images')
      .select('id, task_id, prompt, url, width, height, index, created_at, user_id', { count: 'exact' })
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(0, PAGE_LIMIT - 1),
    db
      .from('ai_videos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id),
  ]);

  if (imagesError) throw imagesError;
  if (videosError) throw videosError;

  const totalImages = imageCount ?? 0;
  const totalVideos = videoCount ?? 0;
  const initialImages: ProfileImage[] = (images ?? []).map((img: any) => ({
    id: img.id,
    task_id: img.task_id,
    prompt: img.prompt,
    url: img.url,
    width: img.width,
    height: img.height,
    index: img.index,
    created_at: img.created_at,
    user_id: img.user_id,
    username: profile.username,
    avatar_url: profile.avatar_url,
  }));

  const hasMore = totalImages > PAGE_LIMIT;
  const displayName = profile.username ?? profile.id;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="mb-8 border-b border-gray-100 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover ring-1 ring-gray-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center ring-1 ring-gray-200">
                  <span className="text-xl font-semibold text-white leading-none">{initial}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-gray-900">{profile.username}</h1>
              {profile.bio && (
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Images / Videos / Courses */}
        <ProfileTabs
          initialImages={initialImages}
          hasMore={hasMore}
          userId={profile.id}
          totalImages={totalImages}
          totalVideos={totalVideos}
        />
      </div>
    </AuthLayout>
  );
}

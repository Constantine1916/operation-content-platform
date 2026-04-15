// app/profile/[username]/page.tsx
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ImageGrid, { ProfileImage } from './ImageGrid';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const PAGE_LIMIT = 20;

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;
  const db = serviceClient();

  // 1. Fetch profile
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio')
    .eq('username', username)
    .single();

  if (profileError || !profile) return notFound();

  // 2. Fetch first page of public images (fetch PAGE_LIMIT + 1 to detect hasMore)
  const { data: tasks, error: tasksError } = await db
    .from('generate_tasks')
    .select('task_id, prompt, images, created_at, user_id')
    .eq('status', 3)
    .eq('user_id', profile.id)
    .filter('images', 'cs', '[{"is_public":true}]')
    .order('created_at', { ascending: false });

  if (tasksError) throw tasksError;

  // 3. Flatten all public images, then slice for the first page
  const allImages: ProfileImage[] = (tasks ?? []).flatMap((task: any) =>
    (task.images ?? [])
      .filter((img: any) => img.is_public === true)
      .map((img: any) => ({
        task_id: task.task_id,
        prompt: task.prompt as string,
        url: img.url as string,
        width: img.width as number,
        height: img.height as number,
        index: img.index as number,
        created_at: task.created_at as string,
        user_id: task.user_id as string,
        username: profile.username,
        avatar_url: profile.avatar_url,
      }))
  );

  const totalImages = allImages.length;
  const initialImages = allImages.slice(0, PAGE_LIMIT);
  const hasMore = totalImages > PAGE_LIMIT;
  const initial = (profile.username ?? profile.id).charAt(0).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="mb-8 flex items-start gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={initial}
              className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-gray-100">
              <span className="text-3xl font-semibold text-gray-400">{initial}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
          {profile.bio && (
            <p className="text-sm text-gray-500 mt-1 max-w-md">{profile.bio}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">{totalImages} 张公开图片</p>
        </div>
      </div>

      {/* Image Grid */}
      <ImageGrid
        initialImages={initialImages}
        hasMore={hasMore}
        userId={profile.id}
      />
    </div>
  );
}

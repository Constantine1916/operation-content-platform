// app/profile/[username]/page.tsx
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ProfileImage } from './ImageGrid';
import ProfileTabs from './ProfileTabs';

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
    .select('id, username, avatar_url, bio')
    .eq('username', username)
    .single();

  if (profileError || !profile) return notFound();

  // 2. Fetch public images
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
  const displayName = profile.username ?? profile.id;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="mb-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
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
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{profile.username}</h1>
            {profile.bio && (
              <p className="text-sm text-gray-500 mt-0.5 max-w-md leading-relaxed">{profile.bio}</p>
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
      />
    </div>
  );
}

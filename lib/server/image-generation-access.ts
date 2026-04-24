import { createClient } from '@supabase/supabase-js';

export const NORMAL_USER_HOURLY_TASK_LIMIT = 20;
export const NORMAL_USER_RATE_WINDOW_MS = 60 * 60 * 1000;

export type ImageGenerationUser = {
  userId: string;
  vipLevel: number;
};

export function isUnlimitedImageGenerationUser(vipLevel: number) {
  return vipLevel >= 1;
}

export async function requireImageGenerationUser(token: string): Promise<ImageGenerationUser> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('vip_level')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);

  return {
    userId: user.id,
    vipLevel: Math.max(0, Number(profile?.vip_level ?? 0)),
  };
}

export async function enforceImageGenerationSubmitLimit(
  db: any,
  user: ImageGenerationUser,
  taskCount: number,
  now = new Date(),
) {
  if (isUnlimitedImageGenerationUser(user.vipLevel)) return;

  const cutoff = new Date(now.getTime() - NORMAL_USER_RATE_WINDOW_MS).toISOString();
  const { count, error } = await db
    .from('generate_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.userId)
    .gte('created_at', cutoff);

  if (error) throw new Error(error.message);

  const used = count ?? 0;
  const remaining = Math.max(0, NORMAL_USER_HOURLY_TASK_LIMIT - used);
  if (taskCount > remaining) {
    throw Object.assign(
      new Error(`由于资源有限，每个用户每小时最多生成${NORMAL_USER_HOURLY_TASK_LIMIT}个任务，当前剩余额度 ${remaining} 个。`),
      { status: 429 }
    );
  }
}

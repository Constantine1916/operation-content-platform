import { createClient } from '@supabase/supabase-js';
import { isAdminRole } from '@/lib/moderation';

function getUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SVC_KEY!,
  );
}

export async function requireAdminUser(token: string) {
  const userClient = getUserClient(token);
  const { data: { user }, error } = await userClient.auth.getUser(token);

  if (error || !user) {
    throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });
  }

  const serviceClient = getServiceClient();
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !isAdminRole(profile?.role)) {
    throw Object.assign(new Error('需要管理员权限'), { status: 403 });
  }

  return { userId: user.id, user, serviceClient };
}

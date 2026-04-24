import { NextRequest, NextResponse } from 'next/server';
import { actionToModerationStatus, parseModerationRequest } from '@/lib/moderation';
import { requireAdminUser } from '@/lib/server/admin-auth';
import { authRequiredResponse } from '@/lib/server/auth-required-response';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return authRequiredResponse();

    const { userId, serviceClient } = await requireAdminUser(token);
    const body = await request.json();
    const { contentType, contentId, action } = parseModerationRequest(body);
    const table = contentType === 'image' ? 'ai_images' : 'ai_videos';
    const moderationStatus = actionToModerationStatus(action);

    const { data, error } = await serviceClient
      .from(table)
      .update({
        moderation_status: moderationStatus,
        moderated_by: userId,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', contentId)
      .select('id, moderation_status, moderated_at, moderated_by')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error?.status === 401) return authRequiredResponse();

    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: error.status ?? 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { parseModerationFilter } from '@/lib/moderation';
import { authRequiredResponse } from '@/lib/server/auth-required-response';
import { requireAdminUser } from '@/lib/server/admin-auth';
import { getPublicVideoModels, getPublicVideos } from '@/lib/server/public-content';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moderation = parseModerationFilter(searchParams.get('moderation'));

    if (moderation) {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) return authRequiredResponse();
      await requireAdminUser(token);
    }

    if (searchParams.get('models') === 'true') {
      const models = await getPublicVideoModels();
      return NextResponse.json({ success: true, models });
    }

    const userIdRaw = searchParams.get('user_id');
    const userId = userIdRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdRaw) ? userIdRaw : null;
    const dateRaw = searchParams.get('date');
    const date = dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const result = await getPublicVideos({
      page,
      limit,
      platform: searchParams.get('platform'),
      model: searchParams.get('model'),
      sort: searchParams.get('sort') === 'oldest' ? 'oldest' : 'latest',
      date,
      userId,
      moderation,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    if (error?.status === 401) return authRequiredResponse();
    return NextResponse.json({ success: false, error: error.message }, { status: error.status ?? 500 });
  }
}

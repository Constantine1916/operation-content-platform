import { NextRequest, NextResponse } from 'next/server';
import { parseModerationFilter } from '@/lib/moderation';
import { authRequiredResponse } from '@/lib/server/auth-required-response';
import { requireAdminUser } from '@/lib/server/admin-auth';
import { getPublicGalleryImages } from '@/lib/server/public-content';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gallery
 * 返回公开图片，分页
 * Query: page (default 1), limit (default 50), user_id (optional), date (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userIdRaw = searchParams.get('user_id');
    const userId = userIdRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdRaw) ? userIdRaw : null;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
    const dateRaw = searchParams.get('date');
    const date = dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : null;
    const moderation = parseModerationFilter(searchParams.get('moderation'));

    if (moderation) {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) return authRequiredResponse();
      await requireAdminUser(token);
    }

    const result = await getPublicGalleryImages({ page, limit, userId, date, moderation });

    return NextResponse.json({
      success: true,
      items: result.items,
      hasMore: result.hasMore,
      total: result.total,
    });
  } catch (error: any) {
    if (error?.status === 401) return authRequiredResponse();

    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

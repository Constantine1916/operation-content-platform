// 1.4 GET /api/xhs/creators — 创作者列表
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    // 获取所有用户
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(limit);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // 获取每个用户的笔记互动统计
    const { data: snapshots, error: snapError } = await supabase
      .from('xhs_notes_with_engagement')
      .select('user_id, nickname, likes, collects, comments, note_id');

    if (snapError) {
      return NextResponse.json({ error: snapError.message }, { status: 500 });
    }

    // 聚合
    const creatorMap = new Map<string, {
      user_id: string;
      nickname: string;
      avatar_url: string | null;
      noteCount: number;
      totalLikes: number;
      totalCollects: number;
      totalComments: number;
      noteIds: Set<string>;
    }>();

    for (const s of snapshots || []) {
      if (!s.user_id) continue;
      const existing = creatorMap.get(s.user_id);
      if (existing) {
        if (!existing.noteIds.has(s.note_id)) {
          existing.noteCount++;
          existing.noteIds.add(s.note_id);
        }
        existing.totalLikes += s.likes || 0;
        existing.totalCollects += s.collects || 0;
        existing.totalComments += s.comments || 0;
      } else {
        const user = (users || []).find(u => u.user_id === s.user_id);
        creatorMap.set(s.user_id, {
          user_id: s.user_id,
          nickname: s.nickname || user?.nickname || '未知',
          avatar_url: user?.avatar_url || null,
          noteCount: 1,
          totalLikes: s.likes || 0,
          totalCollects: s.collects || 0,
          totalComments: s.comments || 0,
          noteIds: new Set([s.note_id]),
        });
      }
    }

    const creators = Array.from(creatorMap.values())
      .map(({ noteIds, ...rest }) => rest)
      .sort((a, b) => b.totalLikes - a.totalLikes);

    return NextResponse.json({
      success: true,
      data: creators,
      total: creators.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 1.1 GET /api/xhs/keywords — 所有搜索过的关键词 + 统计
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // 用 RPC 或直接 SQL — Supabase JS 不支持 GROUP BY，改用 view
    // 先获取所有 snapshots，在服务端聚合
    const { data, error } = await supabase
      .from('engagement_snapshots')
      .select('keyword, snapshot_at, likes, collects, comments')
      .not('keyword', 'is', null)
      .order('snapshot_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 按关键词聚合
    const keywordMap = new Map<string, {
      keyword: string;
      noteCount: number;
      totalLikes: number;
      totalCollects: number;
      totalComments: number;
      avgLikes: number;
      lastSearched: string;
    }>();

    for (const row of data || []) {
      if (!row.keyword) continue;
      const existing = keywordMap.get(row.keyword);
      if (existing) {
        existing.noteCount++;
        existing.totalLikes += row.likes || 0;
        existing.totalCollects += row.collects || 0;
        existing.totalComments += row.comments || 0;
        if (row.snapshot_at > existing.lastSearched) {
          existing.lastSearched = row.snapshot_at;
        }
      } else {
        keywordMap.set(row.keyword, {
          keyword: row.keyword,
          noteCount: 1,
          totalLikes: row.likes || 0,
          totalCollects: row.collects || 0,
          totalComments: row.comments || 0,
          avgLikes: 0,
          lastSearched: row.snapshot_at,
        });
      }
    }

    const keywords = Array.from(keywordMap.values()).map(k => ({
      ...k,
      avgLikes: Math.round(k.totalLikes / k.noteCount),
    }));

    // 按笔记数降序
    keywords.sort((a, b) => b.noteCount - a.noteCount);

    return NextResponse.json({
      success: true,
      data: keywords,
      total: keywords.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

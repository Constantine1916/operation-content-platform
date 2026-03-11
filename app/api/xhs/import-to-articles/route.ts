// 1.5 POST /api/xhs/import-to-articles — 精选笔记同步到 articles
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseRead = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const supabaseWrite = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_SECRET = process.env.API_SECRET_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // Token 验证
    if (API_SECRET) {
      const token = request.headers.get('x-api-token');
      if (token !== API_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { noteIds, author = 'xiaohongshu-1' } = body; // string[], string

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return NextResponse.json({ error: 'noteIds array is required' }, { status: 400 });
    }

    // 从 view 获取笔记详情
    const { data: notes, error: fetchError } = await supabaseRead
      .from('xhs_notes_with_engagement')
      .select('*')
      .in('note_id', noteIds);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json({ error: 'No notes found' }, { status: 404 });
    }

    // 去重（同一 note_id 可能有多个 snapshot，取最新的）
    const uniqueNotes = new Map();
    for (const n of notes) {
      const existing = uniqueNotes.get(n.note_id);
      if (!existing || (n.snapshot_at && n.snapshot_at > existing.snapshot_at)) {
        uniqueNotes.set(n.note_id, n);
      }
    }

    // 转换为 articles 格式（匹配 Supabase 实际表结构）
    const articles = Array.from(uniqueNotes.values()).map(n => ({
      platform: 'xiaohongshu',
      author: author,  // 传入的作者标识 (xiaohongshu-1 或 xiaohongshu-2)
      title: n.title || '无标题',
      filename: n.title || '无标题',
      content: n.body || '',
      metadata: {
        note_id: n.note_id,
        source_url: n.url || `https://www.xiaohongshu.com/explore/${n.note_id}`,
        author: n.nickname,
        user_id: n.user_id,
        cover_url: n.cover_url,
        likes: n.likes,
        collects: n.collects,
        comments: n.comments,
        shares: n.shares,
        hashtags: n.hashtags,
        keyword: n.keyword,
        imported_at: new Date().toISOString(),
      },
    }));

    // 批量插入
    const { data: inserted, error: insertError } = await supabaseWrite
      .from('articles')
      .insert(articles)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: (inserted || []).length,
      data: inserted,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

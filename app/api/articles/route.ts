import { NextRequest, NextResponse } from 'next/server';
import { supabase, Article } from '@/lib/supabase';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * GET /api/articles
 * 获取文章列表，支持分页和筛选
 * 
 * Query参数:
 * - platform: 平台筛选 (xiaohongshu|zhihu|wechat|x|reddit)
 * - tag: 标签筛选
 * - page: 页码 (默认1)
 * - limit: 每页数量 (默认20)
 * - sort: 排序方式 (latest|热度, 默认latest)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'latest';

    // 构建查询
    let query = supabase.from('articles').select('*', { count: 'exact' });

    // 平台筛选
    if (platform) {
      query = query.eq('source_platform', platform);
    }

    // 标签筛选
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // 排序
    if (sort === '热度') {
      query = query.order('热度', { ascending: false });
    } else {
      query = query.order('published_at', { ascending: false, nullsFirst: false });
    }

    // 分页
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch articles', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles
 * 创建新文章
 * 
 * Body:
 * {
 *   title: string (必填)
 *   content?: string
 *   source_platform: string (必填)
 *   source_url?: string
 *   author?: string
 *   published_at?: string (ISO 8601)
 *   tags?: string[]
 *   热度?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必填字段
    if (!body.title || !body.source_platform) {
      return NextResponse.json(
        { error: 'Missing required fields: title and source_platform' },
        { status: 400 }
      );
    }

    // 验证平台
    const validPlatforms = ['xiaohongshu', 'zhihu', 'wechat', 'x', 'reddit'];
    if (!validPlatforms.includes(body.source_platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // 准备插入数据
    const articleData: Partial<Article> = {
      title: body.title,
      content: body.content,
      source_platform: body.source_platform,
      source_url: body.source_url,
      author: body.author,
      published_at: body.published_at,
      tags: body.tags || [],
      热度: body.热度 || 0,
    };

    const { data, error } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create article', details: error.message },
        { status: 500 }
      );
    }

    // 更新标签计数
    if (body.tags && body.tags.length > 0) {
      for (const tagName of body.tags) {
        await supabase.rpc('increment_tag_count', { tag_name: tagName });
      }
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

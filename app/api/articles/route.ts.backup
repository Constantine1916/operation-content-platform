import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/articles
 * 获取文章列表，支持分页和筛选
 * 
 * Query参数:
 * - platform: 平台筛选 (xiaohongshu|zhihu|wechat|x|reddit)
 * - page: 页码 (默认1)
 * - limit: 每页数量 (默认20)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 构建查询
    let query = supabase.from('articles').select('*', { count: 'exact' });

    // 平台筛选
    if (platform) {
      query = query.eq('platform', platform);
    }

    // 排序：按创建时间倒序
    query = query.order('created_at', { ascending: false });

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
 * 创建新文章（供agents调用）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必填字段
    if (!body.title || !body.platform) {
      return NextResponse.json(
        { error: 'Missing required fields: title and platform' },
        { status: 400 }
      );
    }

    // 验证平台
    const validPlatforms = ['xiaohongshu', 'zhihu', 'wechat', 'x', 'reddit'];
    if (!validPlatforms.includes(body.platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    const article = {
      platform: body.platform,
      title: body.title,
      content: body.content || '',
      filename: body.filename,
      published_to_feishu: body.published_to_feishu || false,
      published_to_telegram: body.published_to_telegram || false,
      metadata: body.metadata || {},
    };

    const { data, error } = await supabase
      .from('articles')
      .insert(article)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create article', details: error.message },
        { status: 500 }
      );
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// 获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_SECRET = process.env.API_SECRET_TOKEN;

// 两个客户端：只读用 anon key，写入用 service role key
const supabaseRead = createClient(supabaseUrl, supabaseAnonKey);
const supabaseWrite = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/hotspots
 * 获取热点资讯列表（公开访问）
 * 
 * Query参数:
 * - category: 分类筛选
 * - date: 日期筛选 (YYYY-MM-DD)
 * - page: 页码 (默认1)
 * - limit: 每页数量 (默认20)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const date = searchParams.get('date');
    const source_type = searchParams.get('source_type'); // 'web' | 'twitter' | null
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 构建查询
    let query = supabaseRead.from('hotspots').select('*', { count: 'exact' });

    // 分类筛选
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // 来源类型筛选
    if (source_type === 'twitter') {
      query = query.or('source.ilike.%twitter%,source.ilike.%@%');
    } else if (source_type === 'web') {
      query = query.not('source', 'ilike', '%twitter%').not('source', 'ilike', '%@%');
    }

    // 日期筛选
    if (date) {
      query = query.eq('collected_date', date);
    }

    // 排序：按日期和时间倒序
    query = query
      .order('collected_date', { ascending: false })
      .order('collected_time', { ascending: false, nullsFirst: false });

    // 分页
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hotspots', details: error.message },
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
 * POST /api/hotspots
 * 创建热点资讯（需要 API token 认证）
 * 
 * Headers:
 * - x-api-token: API 密钥（来自环境变量 API_SECRET_TOKEN）
 * 
 * Body:
 * - title: 标题（必填）
 * - collected_date: 采集日期（必填，YYYY-MM-DD）
 * - category: 分类
 * - source: 来源
 * - summary: 摘要
 * - url: 链接
 * - 热度: 热度值
 * - collected_time: 采集时间
 * - metadata: 元数据对象
 */
export async function POST(request: NextRequest) {
  try {
    // API Token 验证（仅当配置了 API_SECRET 时启用）
    if (API_SECRET) {
      const token = request.headers.get('x-api-token');
      if (token !== API_SECRET) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid API token' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();

    // 验证必填字段
    if (!body.title || !body.collected_date) {
      return NextResponse.json(
        { error: 'Missing required fields: title and collected_date' },
        { status: 400 }
      );
    }

    const hotspot = {
      title: body.title,
      category: body.category,
      source: body.source,
      summary: body.summary,
      url: body.url,
      热度: body.热度,
      collected_date: body.collected_date,
      collected_time: body.collected_time,
      metadata: body.metadata || {},
    };

    // 使用 service role key 进行写操作
    const { data, error } = await supabaseWrite
      .from('hotspots')
      .insert(hotspot)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create hotspot', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

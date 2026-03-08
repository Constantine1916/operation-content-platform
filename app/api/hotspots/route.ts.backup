import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hotspots
 * 获取热点资讯列表
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 构建查询
    let query = supabase.from('hotspots').select('*', { count: 'exact' });

    // 分类筛选
    if (category) {
      query = query.eq('category', category);
    }

    // 日期筛选
    if (date) {
      query = query.eq('collected_date', date);
    }

    // 排序：按日期和时间倒序
    query = query.order('collected_date', { ascending: false })
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
 * 创建热点资讯（供agents调用）
 */
export async function POST(request: NextRequest) {
  try {
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

    const { data, error } = await supabase
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

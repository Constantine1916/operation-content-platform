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
 * GET /api/articles
 * 获取文章列表（公开访问）
 * 
 * Query参数:
 * - platform: 平台筛选 (xiaohongshu|zhihu|wechat|x|reddit)
 * - author: 作者筛选 (xiaohongshu-1|xiaohongshu-2|zhihu-1|...)
 * - page: 页码 (默认1)
 * - limit: 每页数量 (默认20)
 * - stats: 是否返回统计信息 (true)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const author = searchParams.get('author');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const stats = searchParams.get('stats');

    // 统计模式
    if (stats === 'true') {
      // 获取总数
      const { count: total } = await supabaseRead
        .from('articles')
        .select('*', { count: 'exact', head: true });

      // 获取今日新增数量
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabaseRead
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // 获取各平台数量
      const { data: platformCounts } = await supabaseRead
        .from('articles')
        .select('platform')
        .not('platform', 'is', null);

      const byPlatform: Record<string, number> = {
        xiaohongshu: 0,
        zhihu: 0,
        wechat: 0,
        x: 0,
        reddit: 0,
      };
      platformCounts?.forEach((item: any) => {
        if (byPlatform[item.platform] !== undefined) {
          byPlatform[item.platform]++;
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          total: total || 0,
          today_count: todayCount || 0,
          by_platform: byPlatform,
        },
      });
    }

    // 构建查询
    let query = supabaseRead.from('articles').select('*', { count: 'exact' });

    // 平台筛选
    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }

    // 作者筛选
    if (author && author !== 'all') {
      query = query.eq('author', author);
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
 * 创建新文章（需要 API token 认证）
 * 
 * Headers:
 * - x-api-token: API 密钥（来自环境变量 API_SECRET_TOKEN）
 * 
 * Body:
 * - platform: 平台（必填，xiaohongshu|zhihu|wechat|x|reddit）
 * - author: 作者（可选，xiaohongshu-1|xiaohongshu-2|zhihu-1|...）
 * - title: 标题（必填）
 * - content: 内容
 * - filename: 文件名
 * - published_to_feishu: 是否已发布到飞书
 * - published_to_telegram: 是否已发布到 Telegram
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
    if (!body.platform || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: platform and title' },
        { status: 400 }
      );
    }

    // 验证平台枚举值
    const validPlatforms = ['xiaohongshu', 'zhihu', 'wechat', 'x', 'reddit'];
    if (!validPlatforms.includes(body.platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    const article = {
      platform: body.platform,
      author: body.author || null,  // 新增：作者字段
      title: body.title,
      content: body.content || '',
      filename: body.filename,
      published_to_feishu: body.published_to_feishu || false,
      published_to_telegram: body.published_to_telegram || false,
      metadata: body.metadata || {},
    };

    // 使用 service role key 进行写操作
    const { data, error } = await supabaseWrite
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

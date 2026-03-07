import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * GET /api/sources
 * 获取所有来源平台列表
 * 
 * Query参数:
 * - enabled: 只返回启用的平台 (true|false)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get('enabled') === 'true';

    let query = supabase
      .from('sources')
      .select('*')
      .order('platform');

    if (enabledOnly) {
      query = query.eq('enabled', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sources', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

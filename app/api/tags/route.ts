import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * GET /api/tags
 * 获取所有标签及其使用次数
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('count', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tags', details: error.message },
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

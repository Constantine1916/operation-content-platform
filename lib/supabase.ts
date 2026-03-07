import { createClient } from '@supabase/supabase-js';

// 延迟初始化，避免构建时错误
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  }
});

// Type definitions
export interface Article {
  id: string;
  title: string;
  content?: string;
  source_platform: 'xiaohongshu' | 'zhihu' | 'wechat' | 'x' | 'reddit';
  source_url?: string;
  author?: string;
  published_at?: string;
  collected_at: string;
  tags?: string[];
  热度: number;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  platform: string;
  name: string;
  icon_url?: string;
  enabled: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  count: number;
  created_at: string;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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


-- 运营内容管理平台数据库表结构

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  source_platform TEXT NOT NULL, -- xiaohongshu, zhihu, wechat, x, reddit
  source_url TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[],
  热度 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 来源平台表
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE, -- xiaohongshu, zhihu, wechat, x, reddit
  name TEXT NOT NULL,
  icon_url TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_articles_platform ON articles(source_platform);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);

-- 插入初始数据
INSERT INTO sources (platform, name, icon_url) VALUES
  ('xiaohongshu', '小红书', '/icons/xhs.png'),
  ('zhihu', '知乎', '/icons/zhihu.png'),
  ('wechat', '微信公众号', '/icons/wechat.png'),
  ('x', 'X (Twitter)', '/icons/x.png'),
  ('reddit', 'Reddit', '/icons/reddit.png')
ON CONFLICT (platform) DO NOTHING;

COMMENT ON TABLE articles IS '聚合的运营内容文章';
COMMENT ON TABLE sources IS '内容来源平台配置';
COMMENT ON TABLE tags IS '文章标签';

-- ============================================================
-- 用户资料表
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  email TEXT,
  vip_level INTEGER NOT NULL DEFAULT 0, -- 0=普通, 1=VIP, 2=SVIP
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 迁移：已存在的表补加 vip_level 字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_level INTEGER NOT NULL DEFAULT 0;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger：注册时自动创建空 profile（需 Supabase Auth 开启 "Confirm email" 才触发，
-- 未开启邮件确认时由前端 /api/profile/create 兜底）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Storage: 头像
-- ============================================================
-- 需要在 Supabase Dashboard > Storage > New bucket > 手动创建
-- Bucket name: avatars
-- Public: true
-- 或者用下面的 SQL（部分 Supabase 版本支持）:
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('avatars', 'avatars', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_own_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (name.split('/'))[1]);

CREATE POLICY "avatars_own_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (name.split('/'))[1]);


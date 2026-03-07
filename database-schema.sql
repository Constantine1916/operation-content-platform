
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

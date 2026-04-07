-- AI Videos 表
CREATE TABLE IF NOT EXISTS ai_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  author TEXT,
  author_url TEXT,
  platform TEXT DEFAULT 'awesomevideoprompts',
  model TEXT,
  duration TEXT,
  tags TEXT[],
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE ai_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_videos_all" ON ai_videos FOR ALL USING (true) WITH CHECK (true);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ai_videos_created_at ON ai_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_videos_platform ON ai_videos(platform);
CREATE INDEX IF NOT EXISTS idx_ai_videos_model ON ai_videos(model);

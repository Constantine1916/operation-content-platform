# AI树洞 · aicave.cn

AI 时代的原创内容平台。聚合资讯、文章、图片、视频，由创作者与 AI 共同生产。

## 功能

**内容消费**
- 📡 AI 资讯 — 全网热点每 2 小时自动采集
- 📝 AI 文章 — 多平台聚合（小红书、知乎、微信、X、Reddit）
- 🖼️ AI 图片 — 创作者上传的 AI 生成作品，瀑布流展示
- 🎬 AI 视频 — AI 生成视频合集

**创作工具**
- 🎨 AI 图片生成 — 文生图，支持公开/私有管理
- 🖼️ Markdown 转图片 — md2image 工具

**平台**
- 用户注册 / 登录 / 个人资料
- 概览 Dashboard — 各资源类型实时统计

## 技术栈

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 Supabase 配置

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端操作密钥（API Routes 使用） |
| `API_SECRET_TOKEN` | 保护内部 POST 端点的令牌 |

## 数据库

在 Supabase SQL Editor 执行 `database-schema.sql` 初始化表结构。

## 项目结构

```
app/
├── page.tsx              # 未登录首页
├── overview/             # Dashboard 概览
├── hotspots/             # AI 资讯
├── articles/             # AI 文章
├── ai-gallery/           # AI 图片画廊
├── ai-video/             # AI 视频
├── generate-img/         # AI 图片生成工具
├── md2image/             # Markdown 转图片
├── profile/              # 个人资料
└── api/                  # API Routes

components/
├── MainLayout.tsx        # 登录后主布局
├── AuthLayout.tsx        # 登录/注册布局
├── Sidebar.tsx
└── Navbar.tsx

lib/
├── supabase.ts           # Supabase 客户端
└── vip-cache.ts          # VIP 状态缓存
```

## API 文档

详见 `API_DOCS.md`。

## 部署

通过 GitHub 连接 Vercel 自动部署，在 Vercel Dashboard 配置上述环境变量即可。

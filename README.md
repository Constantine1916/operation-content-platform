# 运营内容管理平台

聚合多平台热点内容的一站式管理系统

## 功能特性

- 📱 多平台内容聚合（小红书、知乎、微信、X、Reddit）
- 🔍 智能搜索和筛选
- 📊 数据可视化统计
- 🎨 现代化UI设计

## 技术栈

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填入 Supabase 配置：

```bash
cp .env.example .env.local
```

### 3. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 数据库设置

在 Supabase 执行 `database-schema.sql` 创建表结构：

```sql
-- 在 Supabase SQL Editor 运行
-- 文件位于项目根目录
```

## API 文档

查看 `API_DOCS.md` 了解完整 API 端点和使用方法。

## 部署

### Vercel (推荐)

```bash
vercel --prod
```

或通过 GitHub 集成自动部署。

### 环境变量配置

在 Vercel Dashboard 配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 项目结构

```
├── app/                # Next.js App Router
│   ├── api/           # API Routes
│   ├── articles/      # 文章页面
│   ├── manage/        # 管理页面
│   └── page.tsx       # 首页
├── components/        # React 组件
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   └── MainLayout.tsx
├── lib/               # 工具库
│   └── supabase.ts    # Supabase 客户端
└── database-schema.sql # 数据库表结构
```

## License

MIT

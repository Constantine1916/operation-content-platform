# API Routes 文档

## 已实现的 API 端点

### 1. GET /api/articles
获取文章列表，支持分页和筛选

**Query 参数:**
- `platform`: 平台筛选 (xiaohongshu|zhihu|wechat|x|reddit)
- `tag`: 标签筛选
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20)
- `sort`: 排序方式 (latest|热度, 默认latest)

**示例请求:**
```bash
# 获取所有文章
curl http://localhost:3000/api/articles

# 获取小红书文章，按热度排序
curl http://localhost:3000/api/articles?platform=xiaohongshu&sort=热度

# 分页获取
curl http://localhost:3000/api/articles?page=2&limit=10

# 按标签筛选
curl http://localhost:3000/api/articles?tag=AI
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "文章标题",
      "content": "文章内容",
      "source_platform": "xiaohongshu",
      "source_url": "https://...",
      "author": "作者名",
      "published_at": "2026-03-07T12:00:00Z",
      "tags": ["AI", "技术"],
      "热度": 100,
      "created_at": "2026-03-07T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 2. POST /api/articles
创建新文章

**Request Body:**
```json
{
  "title": "文章标题",           // 必填
  "content": "文章内容",
  "source_platform": "xiaohongshu",  // 必填
  "source_url": "https://...",
  "author": "作者名",
  "published_at": "2026-03-07T12:00:00Z",
  "tags": ["AI", "技术"],
  "热度": 100
}
```

**示例请求:**
```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ChatGPT 使用技巧",
    "content": "这是一篇关于 ChatGPT 的文章...",
    "source_platform": "xiaohongshu",
    "source_url": "https://xiaohongshu.com/explore/123",
    "author": "AI爱好者",
    "tags": ["AI", "ChatGPT"],
    "热度": 50
  }'
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "ChatGPT 使用技巧",
    "content": "这是一篇关于 ChatGPT 的文章...",
    "source_platform": "xiaohongshu",
    "tags": ["AI", "ChatGPT"],
    "热度": 50,
    "created_at": "2026-03-07T12:00:00Z"
  }
}
```

### 3. GET /api/sources
获取所有来源平台列表

**Query 参数:**
- `enabled`: 只返回启用的平台 (true|false)

**示例请求:**
```bash
# 获取所有平台
curl http://localhost:3000/api/sources

# 只获取启用的平台
curl http://localhost:3000/api/sources?enabled=true
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "platform": "xiaohongshu",
      "name": "小红书",
      "icon_url": "/icons/xhs.png",
      "enabled": true,
      "created_at": "2026-03-07T12:00:00Z"
    },
    {
      "id": "uuid",
      "platform": "zhihu",
      "name": "知乎",
      "icon_url": "/icons/zhihu.png",
      "enabled": true,
      "created_at": "2026-03-07T12:00:00Z"
    }
  ]
}
```

### 4. GET /api/tags
获取所有标签列表（额外实现）

**Query 参数:**
- `limit`: 返回数量 (默认50)
- `sort`: 排序方式 (count|name, 默认count)

**示例请求:**
```bash
# 获取热门标签
curl http://localhost:3000/api/tags

# 按名称排序
curl http://localhost:3000/api/tags?sort=name&limit=100
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "AI",
      "count": 50,
      "created_at": "2026-03-07T12:00:00Z"
    },
    {
      "id": "uuid",
      "name": "技术",
      "count": 30,
      "created_at": "2026-03-07T12:00:00Z"
    }
  ]
}
```

## 错误处理

所有 API 都使用统一的错误响应格式：

```json
{
  "error": "错误描述",
  "details": "详细错误信息"
}
```

**常见错误码:**
- 400: 请求参数错误
- 500: 服务器内部错误

## 环境变量配置

复制 `.env.local.example` 为 `.env.local` 并填写 Supabase 配置：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 API
# http://localhost:3000/api/articles
# http://localhost:3000/api/sources
# http://localhost:3000/api/tags
```

## TypeScript 类型定义

类型定义位于 `lib/supabase.ts`:

```typescript
interface Article {
  id: string;
  title: string;
  content?: string;
  source_platform: 'xiaohongshu' | 'zhihu' | 'wechat' | 'x' | 'reddit';
  source_url?: string;
  author?: string;
  published_at?: string;
  tags?: string[];
  热度: number;
  created_at: string;
  updated_at: string;
}

interface Source {
  id: string;
  platform: string;
  name: string;
  icon_url?: string;
  enabled: boolean;
  created_at: string;
}

interface Tag {
  id: string;
  name: string;
  count: number;
  created_at: string;
}
```

## 下一步

- [ ] 添加单篇文章获取 API: GET /api/articles/[id]
- [ ] 添加文章更新 API: PUT /api/articles/[id]
- [ ] 添加文章删除 API: DELETE /api/articles/[id]
- [ ] 添加批量导入 API: POST /api/articles/batch
- [ ] 添加 API 认证中间件
- [ ] 添加 Rate Limiting

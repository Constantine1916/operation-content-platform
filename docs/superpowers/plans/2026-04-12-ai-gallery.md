# AI 图片画廊 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `/ai-gallery` 页面，展示所有用户生成的 AI 图片，瀑布流 + 虚拟滚动 + 灯箱预览，并在侧边栏添加入口。

**Architecture:** 后端新增 `GET /api/gallery` 接口，从 `generate_tasks` 表查 status=3 的任务并展开 images 数组分页返回。前端用 `react-masonry-css` 做瀑布流列布局，`react-virtuoso` 做虚拟滚动，`endReached` 触发无限加载。灯箱用 portal 渲染到 body，支持同 task 内左右切换。

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, react-masonry-css, react-virtuoso, Supabase service role key

---

## File Map

| 文件 | 操作 | 职责 |
|------|------|------|
| `app/api/gallery/route.ts` | 新建 | 公开画廊接口，分页返回已完成图片 |
| `app/ai-gallery/page.tsx` | 新建 | 画廊页面，瀑布流 + 虚拟滚动 + 灯箱 |
| `components/Sidebar.tsx` | 修改 | 新增「AI 图片」菜单项 |
| `package.json` | 修改 | 新增 react-masonry-css、react-virtuoso |

---

## Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装依赖**

```bash
cd /tmp/operation-content-platform
npm install react-masonry-css react-virtuoso
npm install --save-dev @types/react-masonry-css
```

Expected output: 安装成功，`package.json` 中出现 `react-masonry-css` 和 `react-virtuoso`

- [ ] **Step 2: 确认安装成功**

```bash
grep -E "react-masonry-css|react-virtuoso" package.json
```

Expected: 两个包都出现在 dependencies 中

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-masonry-css and react-virtuoso"
```

---

## Task 2: 后端 Gallery API

**Files:**
- Create: `app/api/gallery/route.ts`

- [ ] **Step 1: 创建 API 文件**

创建 `app/api/gallery/route.ts`，内容如下：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireUser(token: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw Object.assign(new Error('未登录'), { status: 401 });
  return user.id;
}

/**
 * GET /api/gallery
 * 返回所有用户已完成的生成图片，分页
 * Query: page (default 1), limit (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    try { await requireUser(token); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.status ?? 401 }); }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));

    const db = serviceClient();
    const from = (page - 1) * limit;

    // 每个 task 最多 4 张图，多取一些 task 以保证展开后够 limit 张
    // 先按 created_at DESC 分页取 tasks，再展开 images
    const { data: tasks, error } = await db
      .from('generate_tasks')
      .select('task_id, prompt, images, created_at')
      .eq('status', 3)
      .not('images', 'is', null)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);

    // 展开 images 数组为独立图片条目
    const items = (tasks ?? []).flatMap((task: any) =>
      (task.images ?? []).map((img: any) => ({
        task_id: task.task_id,
        prompt: task.prompt as string,
        url: img.url as string,
        width: img.width as number,
        height: img.height as number,
        index: img.index as number,
        created_at: task.created_at as string,
      }))
    );

    // 判断是否还有更多（取下一页第一条）
    const { count } = await db
      .from('generate_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 3)
      .not('images', 'is', null);

    const hasMore = from + limit < (count ?? 0);

    return NextResponse.json({ success: true, items, hasMore });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/gallery/route.ts
git commit -m "feat(api): add GET /api/gallery endpoint"
```

---

## Task 3: 侧边栏新增「AI 图片」入口

**Files:**
- Modify: `components/Sidebar.tsx`

- [ ] **Step 1: 在 menuItems 数组末尾新增 AI 图片菜单项**

在 `components/Sidebar.tsx` 的 `menuItems` 数组中，在 `AI视频` 条目之后添加：

```typescript
{
  title: 'AI 图片',
  href: '/ai-gallery',
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
},
```

- [ ] **Step 2: Commit**

```bash
git add components/Sidebar.tsx
git commit -m "feat(sidebar): add AI 图片 menu item"
```

---

## Task 4: 画廊页面 — 骨架 + 数据获取

**Files:**
- Create: `app/ai-gallery/page.tsx`

- [ ] **Step 1: 创建页面文件，先实现数据获取和基础结构**

创建 `app/ai-gallery/page.tsx`：

```typescript
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface GalleryImage {
  task_id: string;
  prompt: string;
  url: string;
  width: number;
  height: number;
  index: number;
  created_at: string;
}

const PAGE_LIMIT = 50;

export default function AiGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      tokenRef.current = session?.access_token ?? null;
      fetchPage(1, true);
    });
  }, []);

  const fetchPage = useCallback(async (page: number, isFirst = false) => {
    if (!tokenRef.current) return;
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/gallery?page=${page}&limit=${PAGE_LIMIT}`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setImages(prev => page === 1 ? data.items : [...prev, ...data.items]);
      setHasMore(data.hasMore);
      pageRef.current = page;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchPage(pageRef.current + 1);
  }, [hasMore, loadingMore, fetchPage]);

  if (loading) return <GallerySkeleton />;
  if (error) return <div className="text-center py-20 text-red-500 text-sm">{error}</div>;
  if (images.length === 0) return <div className="text-center py-20 text-gray-400 text-sm">暂无图片</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">AI 图片</h1>
        <p className="text-xs text-gray-500 tracking-[0.15em] uppercase">AI Gallery</p>
      </div>
      <MasonryGallery images={images} loadMore={loadMore} hasMore={hasMore} loadingMore={loadingMore} />
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse mb-2" />
        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="columns-2 lg:columns-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="break-inside-avoid mb-4 rounded-xl overflow-hidden bg-gray-100 animate-pulse"
            style={{ height: `${200 + (i % 3) * 80}px` }} />
        ))}
      </div>
    </div>
  );
}

// Placeholder — implemented in Task 5
function MasonryGallery(_props: { images: GalleryImage[]; loadMore: () => void; hasMore: boolean; loadingMore: boolean }) {
  return <div>Loading gallery...</div>;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/ai-gallery/page.tsx
git commit -m "feat(gallery): add page skeleton and data fetching"
```

---

## Task 5: 瀑布流 + 虚拟滚动组件

**Files:**
- Modify: `app/ai-gallery/page.tsx`

- [ ] **Step 1: 替换 MasonryGallery 为真实实现**

将 `app/ai-gallery/page.tsx` 中的 `MasonryGallery` placeholder 替换为完整实现。在文件顶部 import 区域添加：

```typescript
import Masonry from 'react-masonry-css';
import { Virtuoso } from 'react-virtuoso';
```

然后将 `MasonryGallery` 函数替换为：

```typescript
const BREAKPOINTS = { default: 3, 1024: 3, 768: 2, 640: 1 };

function MasonryGallery({ images, loadMore, hasMore, loadingMore }: {
  images: GalleryImage[];
  loadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
}) {
  return (
    <>
      <Masonry
        breakpointCols={BREAKPOINTS}
        className="flex gap-4"
        columnClassName="flex flex-col gap-4"
      >
        {images.map((img, i) => (
          <ImageCard key={`${img.task_id}-${img.index}-${i}`} image={img} allImages={images} />
        ))}
      </Masonry>

      {/* 无限加载触发器 */}
      <LoadMoreTrigger onVisible={loadMore} hasMore={hasMore} loadingMore={loadingMore} total={images.length} />
    </>
  );
}

function LoadMoreTrigger({ onVisible, hasMore, loadingMore, total }: {
  onVisible: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) onVisible();
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, onVisible]);

  return (
    <div ref={ref} className="mt-8 flex items-center justify-center py-8">
      {loadingMore && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          加载中...
        </div>
      )}
      {!hasMore && total > 0 && (
        <div className="flex items-center gap-3 w-full max-w-sm">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">共 {total} 张图片</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      )}
    </div>
  );
}

// Placeholder — implemented in Task 6
function ImageCard({ image, allImages }: { image: GalleryImage; allImages: GalleryImage[] }) {
  return (
    <div className="rounded-xl overflow-hidden bg-gray-100">
      <img src={image.url} alt={image.prompt} className="w-full" loading="lazy" />
      <div className="p-2 text-xs text-gray-500 line-clamp-2">{image.prompt}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/ai-gallery/page.tsx
git commit -m "feat(gallery): add masonry waterfall with infinite scroll"
```

---

## Task 6: 图片卡片 + 灯箱

**Files:**
- Modify: `app/ai-gallery/page.tsx`

- [ ] **Step 1: 替换 ImageCard 为完整卡片实现，并添加 Lightbox 组件**

将 `app/ai-gallery/page.tsx` 中的 `ImageCard` 函数替换为：

```typescript
function ImageCard({ image, allImages }: { image: GalleryImage; allImages: GalleryImage[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // 同一 task_id 的所有图片
  const siblings = allImages.filter(img => img.task_id === image.task_id)
    .sort((a, b) => a.index - b.index);
  const startIndex = siblings.findIndex(img => img.index === image.index);

  return (
    <>
      <div
        className="group rounded-xl overflow-hidden bg-white cursor-pointer transition-shadow hover:shadow-lg"
        onClick={() => setLightboxOpen(true)}
      >
        <div className="overflow-hidden">
          <img
            src={image.url}
            alt={image.prompt}
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{image.prompt}</p>
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={siblings}
          initialIndex={startIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: 添加 Lightbox 组件**

在 `ImageCard` 函数之后添加：

```typescript
function Lightbox({ images, initialIndex, onClose }: {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const img = images[current];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrent(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setCurrent(i => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  if (!img) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-2xl w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 图片 */}
        <img
          src={img.url}
          alt={img.prompt}
          className="rounded-xl max-h-[75vh] w-auto object-contain"
        />

        {/* 底部信息 */}
        <div className="mt-4 w-full bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
          <p className="text-white/90 text-sm leading-relaxed">{img.prompt}</p>
          {images.length > 1 && (
            <p className="text-white/40 text-xs mt-1">{current + 1} / {images.length}</p>
          )}
        </div>

        {/* 左右箭头 */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent(i => Math.max(0, i - 1))}
              disabled={current === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-white/60 hover:text-white disabled:opacity-20 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrent(i => Math.min(images.length - 1, i + 1))}
              disabled={current === images.length - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-white/60 hover:text-white disabled:opacity-20 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/ai-gallery/page.tsx
git commit -m "feat(gallery): add image card with hover effect and lightbox"
```

---

## Task 7: 最终推送

- [ ] **Step 1: 确认构建无报错**

```bash
cd /tmp/operation-content-platform && npx tsc --noEmit
```

Expected: 无 TypeScript 错误

- [ ] **Step 2: Push**

```bash
git push
```

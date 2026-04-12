# AI 图片画廊 — 设计文档

Date: 2026-04-12

## 概述

新增「AI 图片」页面，展示所有用户通过 AI 生图功能生成的图片，采用瀑布流 + 虚拟滚动布局，支持灯箱预览。页面公开（所有登录用户可访问），不限制 VIP 等级。

---

## 后端

### `GET /api/gallery`

- **路径**：`app/api/gallery/route.ts`
- **权限**：需登录（Bearer token 验证用户身份，但不限制 VIP 等级）
- **数据源**：`generate_tasks` 表，过滤 `status = 3`（已完成），展开 `images` JSONB 数组

**Query 参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 50 | 每页条数（图片张数） |

**返回结构**

```json
{
  "success": true,
  "items": [
    {
      "task_id": "xxx",
      "prompt": "a girl in anime style...",
      "url": "https://...",
      "width": 828,
      "height": 1472,
      "index": 0,
      "created_at": "2026-04-12T10:00:00Z"
    }
  ],
  "hasMore": true
}
```

**实现逻辑**

1. 查询 `generate_tasks` where `status = 3`，按 `created_at DESC` 分页
2. 在应用层展开每条记录的 `images[]` 数组为独立图片条目
3. 每个 task 最多 4 张图，展开后每张带 `prompt`、`task_id`、`created_at`

---

## 前端

### 路由

- 路径：`/ai-gallery`
- 文件：`app/ai-gallery/page.tsx`
- 权限：需登录，不限 VIP

### 依赖

```
react-masonry-css    # 瀑布流布局
react-virtuoso       # 虚拟滚动（MasonryScroller）
```

### 布局

- 3 列瀑布流（`lg`），2 列（`sm`），1 列（移动端）
- `react-masonry-css` 处理列分配（选最短列插入）
- `react-virtuoso` 只渲染可见区域，`endReached` 触发下一页加载

### 卡片设计

```
┌─────────────────┐
│                 │
│    图片主体      │   ← 宽度 100%，高度按 828:1472 自适应
│  （保持宽高比）   │   ← object-fit: cover
│                 │
├─────────────────┤
│ prompt 文字     │   ← text-xs text-gray-500，2 行省略
└─────────────────┘
```

- 背景：白色，`rounded-xl`，`overflow-hidden`
- 无阴影，hover 时 `shadow-md`
- 图片 hover：`scale-105`（transition，overflow hidden 裁切）

### 灯箱

- 点击卡片打开全屏遮罩（黑色半透明背景）
- 居中显示大图，左右箭头切换同一 `task_id` 下的其他图片（最多 4 张）
- 底部显示完整 prompt 文字
- ESC 键 / 点击遮罩关闭
- 显示当前图片序号（如 `2 / 4`）

### 侧边栏

在 `components/Sidebar.tsx` 的 SVIP 区块的「AI 生图」下方新增「AI 图片」菜单项，放入主菜单（非 SVIP 限制区），所有登录用户可见。

---

## 数据流

```
用户进入页面
  → fetchPage(1) → GET /api/gallery?page=1&limit=50
  → 返回 50 张图片
  → react-masonry-css 分配到 3 列
  → react-virtuoso 只渲染可见区域

用户滚动到底部
  → endReached 触发 fetchPage(n+1)
  → 追加图片到列表
  → 继续虚拟滚动
```

---

## 文件变更清单

1. `app/api/gallery/route.ts` — 新建后端接口
2. `app/ai-gallery/page.tsx` — 新建画廊页面
3. `components/Sidebar.tsx` — 新增「AI 图片」菜单项
4. `package.json` — 新增 `react-masonry-css`、`react-virtuoso` 依赖

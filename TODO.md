# 小红书数据集成 TODO

## Phase 1: 后端 API（/api/xhs/*）
- [ ] 1.1 `GET /api/xhs/keywords` — 获取所有搜索过的关键词 + 统计
- [ ] 1.2 `GET /api/xhs/search-history` — 按关键词查搜索历史（笔记列表 + 互动数据）
- [ ] 1.3 `GET /api/xhs/top-notes` — 跨关键词 TOP 笔记排行
- [ ] 1.4 `GET /api/xhs/creators` — 创作者列表 + 笔记数
- [ ] 1.5 `POST /api/xhs/import-to-articles` — 精选笔记同步到 articles 表

## Phase 2: 前端页面
- [ ] 2.1 侧边栏加「小红书研究」导航入口
- [ ] 2.2 `/xhs` 主页面 — 关键词概览卡片 + 统计数字
- [ ] 2.3 `/xhs/search/[keyword]` — 单关键词详情（笔记列表、排行、互动指标）
- [ ] 2.4 `/xhs/creators` — 创作者排行榜
- [ ] 2.5 笔记卡片组件（标题、封面、互动数据、一键导入按钮）

## Phase 3: 增强
- [ ] 3.1 数据库 view：`xhs_notes_with_engagement`（notes JOIN engagement_snapshots）
- [ ] 3.2 趋势图：同一关键词多次搜索的排名/互动变化
- [ ] 3.3 导入到 articles 时自动打 tag + 设置 platform=xiaohongshu

## AI 视频
- [x] 3.1 侧边栏添加「AI视频」导航入口
- [x] 3.2 创建 /ai-video 页面框架 + /api/ai-video 接口
- [ ] 3.3 爬取 video prompt 网站内容入库
- [ ] 3.4 创建 ai_videos 数据库表

'use client'

import { useEffect, useState } from 'react'

interface Article {
  id: string
  title: string
  source_platform: string
  author: string
  published_at: string
  热度: number
  tags: string[]
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [platform, setPlatform] = useState<string>('all')

  useEffect(() => {
    fetchArticles()
  }, [platform])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '20',
        ...(platform !== 'all' && { platform })
      })
      
      const res = await fetch(`/api/articles?${params}`)
      const data = await res.json()
      setArticles(data.data || [])
    } catch (error) {
      console.error('获取文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const platforms = [
    { value: 'all', label: '全部平台', icon: '🌐' },
    { value: 'xiaohongshu', label: '小红书', icon: '📕' },
    { value: 'zhihu', label: '知乎', icon: '💡' },
    { value: 'wechat', label: '微信', icon: '📱' },
    { value: 'x', label: 'X', icon: '🐦' },
    { value: 'reddit', label: 'Reddit', icon: '🤖' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">热点资讯</h1>
        
        {/* 平台筛选 */}
        <div className="flex gap-2 flex-wrap">
          {platforms.map(p => (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                platform === p.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="mr-1">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 文章列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 mb-2">暂无内容</p>
          <p className="text-sm text-gray-400">请先导入历史数据或等待采集</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}

function ArticleCard({ article }: { article: Article }) {
  const platformInfo: Record<string, { name: string; icon: string; color: string }> = {
    xiaohongshu: { name: '小红书', icon: '📕', color: 'bg-red-100 text-red-700' },
    zhihu: { name: '知乎', icon: '💡', color: 'bg-blue-100 text-blue-700' },
    wechat: { name: '微信', icon: '📱', color: 'bg-green-100 text-green-700' },
    x: { name: 'X', icon: '🐦', color: 'bg-sky-100 text-sky-700' },
    reddit: { name: 'Reddit', icon: '🤖', color: 'bg-orange-100 text-orange-700' },
  }

  const info = platformInfo[article.source_platform] || { name: article.source_platform, icon: '📄', color: 'bg-gray-100 text-gray-700' }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
          {article.title}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${info.color}`}>
          {info.icon} {info.name}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <span>👤 {article.author || '匿名'}</span>
        <span>📅 {new Date(article.published_at).toLocaleDateString('zh-CN')}</span>
        <span>🔥 {article.热度}</span>
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {article.tags.map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

interface Article {
  id: string
  title: string
  source_platform: string
  author: string
  published_at: string
  tags: string[]
}

export default function ManagePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/articles?limit=50')
      const data = await res.json()
      setArticles(data.data || [])
    } catch (error) {
      console.error('获取文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.author?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black mb-4">文章管理</h1>
        
        {/* 搜索框 */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索文章标题或作者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          />
          <button className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
            搜索
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="gray-800 text-sm">总文章数</p>
          <p className="text-2xl font-bold text-text-gray-800">{articles.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="gray-800 text-sm">搜索结果</p>
          <p className="text-2xl font-bold text-text-gray-800">{filteredArticles.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="gray-800 text-sm">平台数</p>
          <p className="text-2xl font-bold text-text-gray-800">5</p>
        </div>
      </div>

      {/* 文章表格 */}
      {loading ? (
        <div className="text-center py-12 text-gray-700">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                  平台
                </th>
                <th className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                  作者
                </th>
                <th className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                  发布时间
                </th>
                <th className="px-6 py-3 text-left text-lg font-medium text-gray-700 uppercase tracking-wider">
                  标签
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-700">
                    {searchQuery ? '没有找到匹配的文章' : '暂无文章数据'}
                  </td>
                </tr>
              ) : (
                filteredArticles.map(article => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-lg font-medium text-black max-w-md truncate">
                        {article.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-lg leading-5 font-semibold rounded-full bg-gray-100 black border border-gray-200">
                        {article.source_platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-text-gray-800">
                      {article.author || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">
                      {new Date(article.published_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {article.tags?.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-lg border border-gray-200">
                            {tag}
                          </span>
                        ))}
                        {article.tags?.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-lg border border-gray-200">
                            +{article.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

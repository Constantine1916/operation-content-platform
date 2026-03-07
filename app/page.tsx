export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">运营内容管理平台</h1>
        <p className="text-gray-600">聚合多平台热点内容，一站式管理</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 平台统计卡片 */}
        <StatCard title="小红书" count={0} icon="📕" color="bg-red-50" />
        <StatCard title="知乎" count={0} icon="💡" color="bg-blue-50" />
        <StatCard title="微信公众号" count={0} icon="📱" color="bg-green-50" />
        <StatCard title="X (Twitter)" count={0} icon="🐦" color="bg-sky-50" />
        <StatCard title="Reddit" count={0} icon="🤖" color="bg-orange-50" />
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">快速开始</h2>
        <ul className="space-y-2 text-gray-600">
          <li>• 点击侧边栏"热点资讯"查看最新内容</li>
          <li>• 使用"文章管理"进行内容管理</li>
          <li>• 多平台聚合，统一浏览</li>
        </ul>
      </div>
    </div>
  )
}

function StatCard({ title, count, icon, color }: { title: string; count: number; icon: string; color: string }) {
  return (
    <div className={`${color} rounded-lg p-6 border border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-gray-900">{count}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">篇文章</p>
    </div>
  )
}

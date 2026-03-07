/** @type {import('next').NextConfig} */
const nextConfig = {
  // 跳过 API routes 的构建时数据收集
  experimental: {
    skipTrailingSlashRedirect: true,
  },
  // 强制所有页面为动态
  output: 'standalone',
}

module.exports = nextConfig

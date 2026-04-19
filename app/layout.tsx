import type { Metadata } from 'next'
import './globals.css'
import { getSiteUrl } from '@/lib/server/public-content'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AI树洞',
    template: '%s | AI树洞',
  },
  description: '汇聚 AI 原创内容，连接创作者与用户',
  openGraph: {
    title: 'AI树洞',
    description: '汇聚 AI 原创内容，连接创作者与用户',
    url: siteUrl,
    siteName: 'AI树洞',
    locale: 'zh_CN',
    type: 'website',
  },
  icons: {
    icon: '/assets/aicave_icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

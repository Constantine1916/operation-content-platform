import type { Metadata } from 'next'
import './globals.css'
import AuthLayout from '@/components/AuthLayout'

export const metadata: Metadata = {
  title: 'AI树洞',
  description: '汇聚 AI 原创内容，连接创作者与用户',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthLayout>{children}</AuthLayout>
      </body>
    </html>
  )
}

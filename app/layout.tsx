import type { Metadata } from 'next'
import './globals.css'
import AuthLayout from '@/components/AuthLayout'

export const metadata: Metadata = {
  title: '运营内容管理平台',
  description: '聚合小红书/知乎/微信/X/Reddit的热点内容',
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

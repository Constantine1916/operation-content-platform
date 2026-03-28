'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import html2canvas from 'html2canvas'
import Link from 'next/link'

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1440
const CARD_PAD = 48

function parseBlocks(md: string): string[] {
  const lines = md.split('\n')
  const blocks: string[] = []
  let currentPara = ''
  let inCodeBlock = false
  let codeContent = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || /^---+$/.test(trimmed)) {
      if (currentPara) { blocks.push(currentPara); currentPara = '' }
      continue
    }
    if (trimmed.startsWith('```')) {
      if (currentPara) { blocks.push(currentPara); currentPara = '' }
      if (inCodeBlock) {
        blocks.push(`<pre class="code-block"><code>${codeContent.trimEnd()}</code></pre>`)
        codeContent = ''
      }
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) { codeContent += line + '\n'; continue }

    const hm = trimmed.match(/^(#{1,6})\s+(.+)/)
    if (hm) {
      if (currentPara) { blocks.push(currentPara); currentPara = '' }
      const lvl = hm[1]!.length
      const size = lvl === 1 ? '1.5em' : lvl === 2 ? '1.2em' : '1em'
      blocks.push(`<h${lvl} class="heading" style="font-size:${size}">${hm[2]}</h${lvl}>`)
      continue
    }

    if (trimmed.startsWith('>')) {
      if (currentPara) { blocks.push(currentPara); currentPara = '' }
      blocks.push(`<p class="quote">${trimmed.replace(/^>\s?/, '')}</p>`)
      continue
    }

    if (/^[-*+]\s/.test(trimmed)) {
      if (currentPara) { blocks.push(currentPara); currentPara = '' }
      blocks.push(`<li>${trimmed.replace(/^[-*+]\s/, '')}</li>`)
      continue
    }

    if (currentPara) currentPara += ' '
    currentPara += trimmed
  }
  if (currentPara) blocks.push(currentPara)
  return blocks
}

function renderInline(text: string): string {
  let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
  s = s.replace(/`(.+?)`/g, '<code>$1</code>')
  return s
}

function buildHtml(blocks: string[], avatarUrl: string, displayName: string, date: string): string {
  const contentHtml = blocks.map(b => {
    if (b.startsWith('<li')) return `  <ul class="list"><li>${b.replace(/<\/?li>/g, '')}</li></ul>`
    if (b.startsWith('<pre')) return `  ${b}`
    return `  <p class="para">${renderInline(b)}</p>`
  }).join('\n')

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: ${CARD_WIDTH}px; background: #fff; font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; color: #1a1a1a; }
.card { width: ${CARD_WIDTH}px; height: ${CARD_HEIGHT}px; background: #fff; display: flex; flex-direction: column; padding: ${CARD_PAD}px ${CARD_PAD}px 40px; }
.header { display: flex; align-items: center; gap: 16px; margin-bottom: 48px; flex-shrink: 0; }
.avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.avatar-placeholder { width: 96px; height: 96px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #999; flex-shrink: 0; }
.meta { display: flex; flex-direction: column; gap: 6px; }
.name-row { display: flex; align-items: center; gap: 8px; }
.name { font-size: 40px; font-weight: 600; color: #1a1a1a; line-height: 1.2; }
.verified { width: 36px; height: 36px; flex-shrink: 0; }
.date { font-size: 32px; color: #999; line-height: 1.2; }
.content { flex: 1; }
.para { font-size: 36px; line-height: 1.8; }
.heading { font-weight: 700; line-height: 1.4; }
h1 { font-size: 1.5em; } h2 { font-size: 1.2em; } h3 { font-size: 1em; }
.quote { font-size: 36px; color: #555; line-height: 1.8; }
.list { list-style: none; padding: 0; font-size: 36px; line-height: 1.8; }
.list li { padding-left: 1.2em; position: relative; }
.list li::before { content: "•"; position: absolute; left: 0; }
code { font-family: monospace; font-size: 28px; background: #f5f5f5; border-radius: 4px; padding: 2px 6px; }
pre { font-size: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px; overflow-x: auto; line-height: 1.5; }
strong { font-weight: 700; }
</style>
</head><body>
<div class="card">
  <div class="header">
    ${avatarUrl
      ? `<img class="avatar" src="${avatarUrl}" crossOrigin="anonymous" />`
      : `<div class="avatar-placeholder">${(displayName || '?').charAt(0).toUpperCase()}</div>`}
    <div class="meta">
      <div class="name-row">
        <span class="name">${displayName || '未设置昵称'}</span>
        <svg class="verified" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#1890ff"/>
          <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="date">${date}</span>
    </div>
  </div>
  <div class="content">
${contentHtml}
  </div>
</div>
</body></html>`
}

export default function Md2ImagePage() {
  const [mdContent, setMdContent] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
  })
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileMissing, setProfileMissing] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [converting, setConverting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.data) {
        const { username, avatar_url } = data.data
        if (username) { setDisplayName(username); setHasProfile(true) }
        if (avatar_url) setAvatarUrl(avatar_url)
        if (!username || !avatar_url) setProfileMissing(true)
      } else {
        setProfileMissing(true)
      }
    }
    loadProfile()
  }, [])

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.md')) { alert('请上传 .md 文件'); return }
    const reader = new FileReader()
    reader.onload = e => setMdContent(e.target?.result as string)
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleConvert = async () => {
    if (!mdContent) { alert('请先上传 MD 文件'); return }
    if (!displayName) { alert('请填写显示名称'); return }

    setConverting(true)
    setImages([])

    try {
      const blocks = parseBlocks(mdContent)
      const html = buildHtml(blocks, avatarUrl, displayName, date)

      const container = document.createElement('div')
      container.style.cssText = `position:fixed;left:-9999px;top:0;width:${CARD_WIDTH}px;overflow:hidden;`
      container.innerHTML = html
      document.body.appendChild(container)

      await new Promise(r => setTimeout(r, 800))

      const canvas = await html2canvas(container as HTMLElement, {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: CARD_WIDTH,
        windowHeight: CARD_HEIGHT,
      })

      document.body.removeChild(container)

      const dataUrl = canvas.toDataURL('image/png', 1.0)
      setImages([dataUrl])
    } catch (err) {
      console.error(err)
      alert('转换失败: ' + (err as Error).message)
    } finally {
      setConverting(false)
    }
  }

  const downloadImage = (dataUrl: string, i: number) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `md-card-${String(i + 1).padStart(2, '0')}.png`
    a.click()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-normal text-gray-900">MD转小红书图片</h1>
        <p className="text-lg text-gray-900">上传 Markdown，生成小红书风格卡片图片</p>
      </div>

      {/* 未设置 profile 提示 */}
      {profileMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-lg text-gray-900 mb-3">
            👋 请先完善你的个人资料，才能自动填充昵称和头像
          </p>
          <Link
            href="/profile"
            className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-base font-medium hover:bg-gray-800 transition-colors"
          >
            去设置头像和昵称 →
          </Link>
        </div>
      )}

      {/* 配置区 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-900 tracking-widest uppercase">配置</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">显示名称</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="小红书昵称"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">日期</label>
            <input
              type="text"
              value={date}
              onChange={e => setDate(e.target.value)}
              placeholder="2026年03月28日"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">头像 URL</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* 上传区 */}
      <div
        className={`bg-white border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${dragOver ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept=".md" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        <div className="text-4xl mb-3">📄</div>
        <p className="text-lg text-gray-900 font-medium">
          {mdContent ? '✅ 已加载 MD 文件' : '点击或拖拽上传 .md 文件'}
        </p>
        {mdContent && (
          <p className="text-sm text-gray-900 mt-2">{mdContent.split('\n').length} 行</p>
        )}
      </div>

      {/* 预览 */}
      {mdContent && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-medium text-gray-900 tracking-widest uppercase mb-4">效果预览（缩放50%）</h2>
          <div
            dangerouslySetInnerHTML={{ __html: buildHtml(parseBlocks(mdContent), avatarUrl, displayName, date) }}
            style={{ width: '540px', height: '720px', overflow: 'hidden', transform: 'scale(0.5)', transformOrigin: 'top left', pointerEvents: 'none' }}
          />
        </div>
      )}

      {/* 转换按钮 */}
      <button
        onClick={handleConvert}
        disabled={converting || !mdContent || !displayName}
        className="w-full bg-gray-900 text-white py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {converting ? '转换中...' : '转换为图片'}
      </button>

      {/* 结果下载 */}
      {images.map((img, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <img src={img} alt={`card-${i + 1}`} className="w-full max-w-sm mx-auto rounded-xl" />
          <button
            onClick={() => downloadImage(img, i)}
            className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-base font-medium hover:bg-gray-800 transition-colors"
          >
            下载图片 {i + 1}
          </button>
        </div>
      ))}
    </div>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import html2canvas from 'html2canvas'
import Link from 'next/link'

// Card: 1080 x 1440 (3:4 ratio)
const CARD_W = 1080
const CARD_H = 1440
const PAD = 48

// ── Markdown block parser ───────────────────────────────────────────────
type Block =
  | { kind: 'h'; level: number; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'li'; text: string }
  | { kind: 'code'; text: string }

function parseMd(text: string): Block[] {
  const blocks: Block[] = []
  const lines = text.split('\n')
  let i = 0
  let codeBuf = ''
  let inCode = false

  while (i < lines.length) {
    const raw = lines[i]!
    const l = raw.trim()

    if (!l || /^---+$/.test(l)) { i++; continue }

    // Code fence
    if (l.startsWith('```')) {
      if (!inCode && codeBuf) { blocks.push({ kind: 'code', text: codeBuf.trimEnd() }); codeBuf = '' }
      inCode = !inCode
      i++; continue
    }
    if (inCode) { codeBuf += raw + '\n'; i++; continue }

    // Heading: leading #+
    const hm = l.match(/^(#{1,6})\s+(.+)/)
    if (hm) {
      blocks.push({ kind: 'h', level: hm[1]!.length, text: hm[2]! })
      i++; continue
    }

    // Blockquote
    if (l.startsWith('>')) {
      blocks.push({ kind: 'quote', text: l.slice(1).trim() })
      i++; continue
    }

    // List
    if (/^[-*+]\s/.test(l)) {
      blocks.push({ kind: 'li', text: l.replace(/^[-*+]\s/, '') })
      i++; continue
    }

    // Paragraph — accumulate until blank
    if (l) {
      let para = l
      while (i + 1 < lines.length && lines[i + 1]!.trim() && !/^#{1,6}\s/.test(lines[i + 1]!) && !lines[i + 1]!.trim().startsWith('>') && !/^[-*+]\s/.test(lines[i + 1]!) && !lines[i + 1]!.trim().startsWith('```')) {
        i++
        para += ' ' + lines[i]!.trim()
      }
      blocks.push({ kind: 'p', text: para })
    }
    i++
  }
  if (codeBuf.trim()) blocks.push({ kind: 'code', text: codeBuf.trimEnd() })
  return blocks
}

// ── Inline markdown renderer ───────────────────────────────────────────
function ri(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

// ── Block → HTML ─────────────────────────────────────────────────────
function b2html(b: Block): string {
  switch (b.kind) {
    case 'h': {
      const size = b.level === 1 ? '1.5em' : b.level === 2 ? '1.2em' : '1em'
      return `<h${b.level} class="hd" style="font-size:${size}">${ri(b.text)}</h${b.level}>`
    }
    case 'p': return `<p class="para">${ri(b.text)}</p>`
    case 'quote': return `<p class="qt">${ri(b.text)}</p>`
    case 'li': return `<li>${ri(b.text)}</li>`
    case 'code': return `<pre class="code"><code>${ri(b.text)}</code></pre>`
  }
}

// ── Build full card HTML ──────────────────────────────────────────────
function cardHtml(blocks: Block[], avatar: string, name: string, date: string): string {
  const listGroups: string[] = []
  const nonList: { i: number; html: string }[] = []
  const nonListHtml = blocks.map((b, i) => {
    if (b.kind === 'li') return null
    return { i, html: b2html(b) }
  }).filter(Boolean) as { i: number; html: string }[]

  let curList: string[] = []
  let curListIdx = -1
  blocks.forEach((b, i) => {
    if (b.kind === 'li') {
      if (curList.length === 0) curListIdx = i
      curList.push(b2html(b))
    } else {
      if (curList.length > 0) {
        listGroups.push(`<ul class="lst">${curList.join('')}</ul>`)
        curList = []
        curListIdx = -1
      }
      nonList.push({ i, html: b2html(b) })
    }
  })
  if (curList.length > 0) listGroups.push(`<ul class="lst">${curList.join('')}</ul>`)

  const contentParts: string[] = []
  let li = 0
  let nl = 0
  blocks.forEach(b => {
    if (b.kind === 'li') {
      contentParts.push(listGroups[li++])
    } else {
      contentParts.push(nonList[nl++].html)
    }
  })

  const avatarEl = avatar
    ? `<img class="av" src="${avatar}" crossorigin="anonymous" />`
    : `<div class="av av-ph">${(name || '?').charAt(0).toUpperCase()}</div>`

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${CARD_W}px;background:#fff;font-family:-apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;color:#1a1a1a}
.c{width:${CARD_W}px;height:${CARD_H}px;background:#fff;display:flex;flex-direction:column;padding:${PAD}px ${PAD}px 40px}
.hdr{display:flex;align-items:center;gap:16px;margin-bottom:48px;flex-shrink:0}
.av{width:96px;height:96px;border-radius:50%;object-fit:cover;flex-shrink:0}
.av-ph{background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:48px;color:#999}
.mt{display:flex;flex-direction:column;gap:6px}
.nm{font-size:40px;font-weight:600;color:#1a1a1a;line-height:1.2}
.nr{display:flex;align-items:center;gap:8px}
.vf{width:36px;height:36px;flex-shrink:0}
.dt{font-size:32px;color:#999;line-height:1.2}
.ct{flex:1}
.para{font-size:36px;line-height:1.8;margin-bottom:0}
.hd{font-weight:700;line-height:1.4}
.hd+*,.para+*{margin-top:8px}
.lst{list-style:none;padding:0;font-size:36px;line-height:1.8}
.lst li{padding-left:1.2em;position:relative}
.lst li::before{content:"•";position:absolute;left:0}
.qt{font-size:36px;color:#555;line-height:1.8}
pre,code{font-family:monospace}
code{font-size:28px;background:#f5f5f5;border-radius:4px;padding:2px 6px}
pre{font-size:24px;padding:16px;background:#f5f5f5;border-radius:8px;overflow-x:auto;line-height:1.5;white-space:pre-wrap;word-break:break-all}
strong{font-weight:700}
</style>
</head><body>
<div class="c">
<div class="hdr">
${avatarEl}
<div class="mt">
<div class="nr">
<span class="nm">${name || '未设置'}</span>
<svg class="vf" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1890ff"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
</div>
<span class="dt">${date}</span>
</div>
</div>
<div class="ct">${contentParts.join('\n')}</div>
</div>
</body></html>`
}

// ── Page component ────────────────────────────────────────────────────
export default function Md2ImagePage() {
  const [md, setMd] = useState('')
  const [name, setName] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
  })
  const [avatar, setAvatar] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [profileOk, setProfileOk] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [converting, setConverting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Load profile on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase.auth.getUser(session.access_token).then(({ data: { user } }) => {
        if (!user) return
        fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }).then(r => r.json()).then(d => {
          if (d.success && d.data) {
            if (d.data.username) setName(d.data.username)
            if (d.data.avatar_url) setAvatar(d.data.avatar_url)
            setProfileOk(true)
          }
        }).catch(() => setProfileOk(false))
      })
    })
  }, [])

  // Parse MD when content changes
  useEffect(() => {
    if (md) setBlocks(parseMd(md))
    else setBlocks([])
  }, [md])

  const onFile = useCallback((file: File) => {
    if (!file.name.endsWith('.md')) { setError('请上传 .md 文件'); return }
    setError('')
    const r = new FileReader()
    r.onload = e => setMd(e.target?.result as string)
    r.readAsText(file)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  const onConvert = async () => {
    if (!md) { setError('请先上传 MD 文件'); return }
    if (!name) { setError('请填写显示名称'); return }
    setError('')
    setConverting(true)
    setImages([])

    try {
      const html = cardHtml(blocks, avatar, name, date)

      // Render in hidden container
      const root = document.createElement('div')
      root.style.cssText = `position:fixed;left:-9999px;top:0;width:${CARD_W}px;height:${CARD_H}px;overflow:hidden;background:#fff;`
      root.innerHTML = html
      document.body.appendChild(root)
      await new Promise(r => setTimeout(r, 1000))

      const canvas = await html2canvas(root as HTMLElement, {
        width: CARD_W,
        height: CARD_H,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: CARD_W,
        windowHeight: CARD_H,
      })

      document.body.removeChild(root)
      setImages([canvas.toDataURL('image/png', 1.0)])
    } catch (e: unknown) {
      setError('转换失败: ' + (e as Error).message)
    } finally {
      setConverting(false)
    }
  }

  const download = (url: string, n: number) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `md-card-${String(n).padStart(2, '0')}.png`
    a.click()
  }

  const previewHtml = blocks.length > 0 ? cardHtml(blocks, avatar, name, date) : ''

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-normal text-gray-900">MD转小红书图片</h1>
        <p className="text-lg text-gray-900">上传 Markdown，生成小红书风格卡片图片</p>
      </div>

      {/* 提示设置 profile */}
      {!profileOk && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between gap-4">
          <p className="text-base text-gray-900">👋 请先完善个人资料，自动填充昵称和头像</p>
          <Link href="/profile" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex-shrink-0">
            去设置 →
          </Link>
        </div>
      )}

      {/* 配置 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-widest">配置</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">显示名称</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="小红书昵称"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">日期</label>
            <input value={date} onChange={e => setDate(e.target.value)} placeholder="2026年03月28日"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">头像 URL</label>
            <input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
          </div>
        </div>
      </div>

      {/* 上传 */}
      <div
        className={`bg-white border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${dragOver ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".md" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
        <div className="text-4xl mb-3">📄</div>
        <p className="text-lg text-gray-900 font-medium">
          {md ? '✅ 已加载 MD 文件' : '点击或拖拽上传 .md 文件'}
        </p>
        {md && <p className="text-sm text-gray-900 mt-2">{md.split('\n').length} 行 · {blocks.length} 个内容块</p>}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-base text-red-600">{error}</div>
      )}

      {/* 预览 */}
      {previewHtml && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">效果预览（缩放50%）</h2>
          <div
            dangerouslySetInnerHTML={{ __html: previewHtml }}
            style={{
              width: CARD_W / 2,
              height: CARD_H / 2,
              overflow: 'hidden',
              transform: 'scale(1)',
              transformOrigin: 'top left',
              pointerEvents: 'none',
              border: '1px solid #e5e7eb',
            }}
          />
        </div>
      )}

      {/* 转换按钮 */}
      <button
        onClick={onConvert}
        disabled={converting || !md || !name}
        className="w-full bg-gray-900 text-white py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {converting ? '转换中...' : '转换为图片'}
      </button>

      {/* 结果下载 */}
      {images.map((img, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <img src={img} alt={`card-${i + 1}`} className="w-full rounded-xl" style={{ maxWidth: CARD_W / 2 }} />
          <button
            onClick={() => download(img, i + 1)}
            className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-base font-medium hover:bg-gray-800 transition-colors"
          >
            下载图片 {i + 1}
          </button>
        </div>
      ))}
    </div>
  )
}

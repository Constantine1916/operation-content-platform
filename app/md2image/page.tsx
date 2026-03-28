'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import html2canvas from 'html2canvas'

const CARD_W = 1080
const CARD_H = 1440
const PAD = 48
const BLOCK_GAP = 42

// ── Block types ─────────────────────────────────────────────────────────
type Block =
  | { kind: 'h'; level: number; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'li'; items: string[] }

// ── Parser (identical to skill) ─────────────────────────────────────────
function parseMd(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const l = lines[i]!.trim()
    if (!l || /^---+$/.test(l)) { i++; continue }
    const hm = l.match(/^(#{1,6})\s+(.+)/)
    if (hm) { blocks.push({ kind: 'h', level: hm[1]!.length, text: hm[2]! }); i++; continue }
    if (l.startsWith('>')) {
      const parts: string[] = []
      while (i < lines.length && lines[i]!.trim().startsWith('>')) {
        parts.push(lines[i]!.trim().replace(/^>\s?/, '')); i++
      }
      blocks.push({ kind: 'quote', text: parts.join(' ') }); continue
    }
    if (/^[-*+]\s/.test(l)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i]!)) {
        items.push(lines[i]!.trim().replace(/^[-*+]\s/, '')); i++
      }
      blocks.push({ kind: 'li', items }); continue
    }
    blocks.push({ kind: 'p', text: l }); i++
  }
  return blocks
}

// ── Inline renderer (identical to skill) ────────────────────────────────
function ri(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

// ── Block → inner HTML (identical to skill) ─────────────────────────────
function b2html(b: Block): string {
  switch (b.kind) {
    case 'h': {
      const size = b.level <= 2 ? '1.15em' : '1em'
      return `<p class="block heading" style="font-size:${size};font-weight:700;">${ri(b.text)}</p>`
    }
    case 'p': return `<p class="block para">${ri(b.text)}</p>`
    case 'quote': return `<p class="block para" style="color:#555;">${ri(b.text)}</p>`
    case 'li': return `<ul class="block list">${b.items.map(t => `<li>${ri(t)}</li>`).join('')}</ul>`
  }
}

// ── CSS (identical to skill, with isLastPage support) ────────────────────
function cardCss(fixedH?: number, isLast?: boolean): string {
  const hCss = fixedH ? `height:${fixedH}px;` : 'height:auto;'
  return `*{margin:0;padding:0;box-sizing:border-box}
body{width:${CARD_W}px;background:#fff;font-family:-apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;color:#1a1a1a}
.card{width:${CARD_W}px;${hCss}background:#fff;display:flex;flex-direction:column;padding:${PAD}px ${PAD}px 40px}
.header{display:flex;align-items:center;gap:16px;margin-bottom:36px;flex-shrink:0}
.avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;flex-shrink:0}
.meta{display:flex;flex-direction:column;gap:6px}
.name-row{display:flex;align-items:center;gap:8px}
.name{font-size:40px;font-weight:600;color:#1a1a1a;line-height:1.2}
.verified{width:36px;height:36px;flex-shrink:0}
.date{font-size:32px;color:#999;line-height:1.2}
.content{flex:1;color:#1a1a1a;font-size:36px;${!isLast ? 'display:flex;flex-direction:column;justify-content:space-between;' : ''}}
.block{margin-bottom:0}
.para{font-size:36px;line-height:1.8}
.heading{line-height:1.5}
.list{list-style:none;padding:0;font-size:36px;line-height:1.8}
.list li{padding-left:1.2em;margin-bottom:8px;position:relative}
.list li::before{content:"•";position:absolute;left:0;color:#1a1a1a}
strong{font-weight:700}`
}

// ── Full card HTML (identical to skill) ─────────────────────────────────
function cardHtml(blocks: Block[], avatar: string, name: string, date: string, fixedH?: number, isLast?: boolean): string {
  const contentHtml = blocks.map(b => b2html(b)).join('\n')
  const avatarEl = avatar
    ? `<img class="avatar" src="${avatar}" crossorigin="anonymous" />`
    : `<div class="avatar" style="background:#eee;"></div>`
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${cardCss(fixedH, isLast)}</style>
</head><body>
<div class="card">
  <div class="header">${avatarEl}
    <div class="meta">
      <div class="name-row">
        <span class="name">${name || '未设置'}</span>
        <svg class="verified" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#1890ff"/>
          <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="date">${date}</span>
    </div>
  </div>
  <div class="content">${contentHtml}</div>
</div>
</body></html>`
}

// ── Measurement HTML (for Pass 0) ────────────────────────────────────────
function measureHtml(blocks: Block[], avatar: string, name: string, date: string): string {
  const avatarEl = avatar
    ? `<img class="avatar" src="${avatar}" crossorigin="anonymous" />`
    : `<div class="avatar" style="background:#eee;"></div>`
  const CONTENT_W = CARD_W - PAD * 2
  const blocksHtml = blocks.map((b, i) =>
    `<div id="b${i}" style="width:${CONTENT_W}px;">${b2html(b)}</div>`
  ).join(`<div style="height:${BLOCK_GAP}px"></div>`)
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${cardCss()}</style>
</head><body>
<div class="card" id="chrome-card">
  <div class="header">${avatarEl}
    <div class="meta">
      <div class="name-row">
        <span class="name">${name || '未设置'}</span>
        <svg class="verified" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#1890ff"/>
          <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="date">${date}</span>
    </div>
  </div>
  <div class="content" style="flex:0;height:0;"></div>
</div>
<div id="measure-blocks" style="padding:0;">${blocksHtml}</div>
</body></html>`
}

// ── Pagination (identical to skill) ─────────────────────────────────────
function paginate(blocks: Block[], heights: number[], available: number): Block[][] {
  const pages: Block[][] = []
  let cur: Block[] = []
  let used = 0
  for (let i = 0; i < blocks.length; i++) {
    const bh = heights[i]!
    const needed = cur.length === 0 ? bh : used + BLOCK_GAP + bh
    if (needed > available && cur.length > 0) { pages.push(cur); cur = []; used = 0 }
    cur.push(blocks[i]!)
    used = used === 0 ? bh : used + BLOCK_GAP + bh
  }
  if (cur.length > 0) pages.push(cur)
  return pages
}

// ── html2canvas capture ──────────────────────────────────────────────────
async function capture(html: string, w: number, h: number): Promise<string> {
  const root = document.createElement('div')
  root.style.cssText = `position:fixed;left:-9999px;top:0;width:${w}px;height:${h}px;overflow:hidden;background:#fff;`
  root.innerHTML = html
  document.body.appendChild(root)
  await new Promise(r => setTimeout(r, 1000))
  const canvas = await html2canvas(root as HTMLElement, {
    width: w, height: h, scale: 1,
    useCORS: true, allowTaint: true, backgroundColor: '#ffffff',
    windowWidth: w, windowHeight: h,
  })
  document.body.removeChild(root)
  return canvas.toDataURL('image/png', 1.0)
}

// ── Page ─────────────────────────────────────────────────────────────────
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
  const [pages, setPages] = useState<Block[][]>([])
  const [images, setImages] = useState<string[]>([])
  const [converting, setConverting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Load profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }).then(r => r.json()).then(d => {
        if (d.success && d.data) {
          if (d.data.username) setName(d.data.username)
          if (d.data.avatar_url) setAvatar(d.data.avatar_url)
          setProfileOk(true)
        }
      }).catch(() => {})
    })
  }, [])

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

  // Parse + do Pass 0 (measure) + paginate when md changes
  useEffect(() => {
    if (!md) { setBlocks([]); setPages([]); return }
    const bs = parseMd(md)
    setBlocks(bs)
    setImages([])

    let cancelled = false
    ;(async () => {
      // Build measure HTML and render to measure each block
      const mhtml = measureHtml(bs, avatar, name || '未设置', date)
      const root = document.createElement('div')
      root.style.cssText = `position:fixed;left:-9999px;top:0;width:${CARD_W}px;`
      root.innerHTML = mhtml
      document.body.appendChild(root)
      await new Promise(r => setTimeout(r, 600))

      if (cancelled) { document.body.removeChild(root); return }

      // Get header height
      const headerEl = root.querySelector('#chrome-card') as HTMLElement | null
      const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0

      // Get each block's height
      const heights: number[] = []
      for (let i = 0; i < bs.length; i++) {
        const el = root.querySelector(`#b${i}`) as HTMLElement | null
        heights.push(el ? el.getBoundingClientRect().height + BLOCK_GAP : 0)
      }

      document.body.removeChild(root)

      if (cancelled) return

      const availableH = CARD_H - Math.ceil(headerH)
      const pg = paginate(bs, heights, availableH)
      setPages(pg)
    })()
    return () => { cancelled = true }
  }, [md, avatar, date])

  const onConvert = async () => {
    if (!md) { setError('请先上传 MD 文件'); return }
    if (!name) setError('提示：显示名称未填写，将使用"未设置"代替')
    setError('')
    setConverting(true)
    setImages([])

    try {
      const bs = parseMd(md)

      // Re-measure if not done yet (same logic as useEffect)
      const mhtml = measureHtml(bs, avatar, name, date)
      const root = document.createElement('div')
      root.style.cssText = `position:fixed;left:-9999px;top:0;width:${CARD_W}px;`
      root.innerHTML = mhtml
      document.body.appendChild(root)
      await new Promise(r => setTimeout(r, 600))

      const headerEl = root.querySelector('#chrome-card') as HTMLElement | null
      const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0
      const heights: number[] = []
      for (let i = 0; i < bs.length; i++) {
        const el = root.querySelector(`#b${i}`) as HTMLElement | null
        heights.push(el ? el.getBoundingClientRect().height + BLOCK_GAP : 0)
      }
      document.body.removeChild(root)

      const availableH = CARD_H - Math.ceil(headerH)
      const pg = paginate(bs, heights, availableH)

      // Pass 1: measure natural heights of each page at fixed cardHeight
      const naturalHeights: number[] = []
      for (let i = 0; i < pg.length; i++) {
        const pHtml = cardHtml(pg[i]!, avatar, name, date, CARD_H, i === pg.length - 1)
        const pRoot = document.createElement('div')
        pRoot.style.cssText = `position:fixed;left:-9999px;top:0;width:${CARD_W}px;overflow:hidden;`
        pRoot.innerHTML = pHtml
        document.body.appendChild(pRoot)
        await new Promise(r => setTimeout(r, 400))
        const scrollH = (pRoot.querySelector('.card') as HTMLElement | null)?.scrollHeight ?? CARD_H
        naturalHeights.push(scrollH)
        document.body.removeChild(pRoot)
      }

      // Unified height: at least CARD_H, expand if any overflows
      const unifiedH = Math.max(CARD_H, ...naturalHeights)
      console.log(`Pages: ${pg.length}, header: ${Math.ceil(headerH)}, unifiedH: ${unifiedH}`)

      // Pass 2: render final images
      const imgs: string[] = []
      for (let i = 0; i < pg.length; i++) {
        const fHtml = cardHtml(pg[i]!, avatar, name, date, unifiedH, i === pg.length - 1)
        const url = await capture(fHtml, CARD_W, unifiedH)
        imgs.push(url)
        setImages([...imgs])
      }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-normal text-gray-900">MD转小红书图片</h1>
        <p className="text-lg text-gray-900">上传 Markdown，生成小红书风格卡片图片（自动分页）</p>
      </div>

      {!profileOk && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between gap-4">
          <p className="text-base text-gray-900">👋 请先完善个人资料，自动填充昵称和头像</p>
          <a href="/profile" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex-shrink-0">
            去设置 →
          </a>
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-base text-red-600">{error}</div>
      )}

      {/* 预览区域 */}
      {pages.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">
            效果预览（{pages.length} 张卡片，1080×1440px）
          </h2>
          <div className="space-y-4">
            {pages.map((pg, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="text-xs text-gray-400 px-3 py-1 bg-gray-50 border-b border-gray-100">第 {i + 1} 张</div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: cardHtml(pg, avatar, name || '未设置', date, CARD_H, i === pages.length - 1)
                  }}
                  style={{ width: '540px', height: '720px', overflow: 'hidden', transform: 'scale(1)', transformOrigin: 'top left', pointerEvents: 'none' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 转换按钮 */}
      <button
        onClick={onConvert}
        disabled={converting || !md}
        className="w-full bg-gray-900 text-white py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {converting ? '转换中...' : `转换为图片${pages.length > 0 ? `（${pages.length} 张）` : ''}`}
      </button>

      {/* 最终结果下载 */}
      {images.map((img, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="text-sm text-gray-500 text-center">第 {i + 1} 张</div>
          <img src={img} alt={`card-${i + 1}`} className="w-full rounded-xl" style={{ maxWidth: '540px', margin: '0 auto', display: 'block' }} />
          <button
            onClick={() => download(img, i + 1)}
            className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-base font-medium hover:bg-gray-800 transition-colors"
          >
            下载第 {i + 1} 张
          </button>
        </div>
      ))}
    </div>
  )
}

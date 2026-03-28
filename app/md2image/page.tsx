'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import html2canvas from 'html2canvas'

const CARD_W = 1080
const CARD_H = 1440
const PAD = 48

// ── Block types ─────────────────────────────────────────────────────────
type Block =
  | { kind: 'h'; level: number; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'li'; items: string[] }

// ── Markdown parser ─────────────────────────────────────────────────────
function parseMd(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const l = lines[i]!.trim()
    if (!l || /^---+$/.test(l)) { i++; continue }

    // Heading
    const hm = l.match(/^(#{1,6})\s+(.+)/)
    if (hm) { blocks.push({ kind: 'h', level: hm[1]!.length, text: hm[2]! }); i++; continue }

    // Blockquote
    if (l.startsWith('>')) {
      const parts: string[] = []
      while (i < lines.length && lines[i]!.trim().startsWith('>')) {
        parts.push(lines[i]!.trim().replace(/^>\s?/, '')); i++
      }
      blocks.push({ kind: 'quote', text: parts.join(' ') }); continue
    }

    // List
    if (/^[-*+]\s/.test(l)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i]!)) {
        items.push(lines[i]!.trim().replace(/^[-*+]\s/, '')); i++
      }
      blocks.push({ kind: 'li', items }); continue
    }

    // Paragraph
    blocks.push({ kind: 'p', text: l }); i++
  }
  return blocks
}

// ── Inline renderer ─────────────────────────────────────────────────────
function ri(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

// ── Block → HTML ───────────────────────────────────────────────────────
function b2html(b: Block): string {
  switch (b.kind) {
    case 'h': {
      const size = b.level === 1 ? '1.5em' : b.level === 2 ? '1.2em' : '1em'
      return `<p class="block hd" style="font-size:${size};font-weight:700;line-height:1.4;">${ri(b.text)}</p>`
    }
    case 'p': return `<p class="block para">${ri(b.text)}</p>`
    case 'quote': return `<p class="block qt">${ri(b.text)}</p>`
    case 'li': return `<ul class="block lst">${b.items.map(t => `<li>${ri(t)}</li>`).join('')}</ul>`
  }
}

const BLOCK_GAP = 24

// ── CSS for card ────────────────────────────────────────────────────────
function cardCss(): string {
  return `*{margin:0;padding:0;box-sizing:border-box}
body{width:${CARD_W}px;background:#fff;font-family:-apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;color:#1a1a1a}
.card{width:${CARD_W}px;height:${CARD_H}px;background:#fff;display:flex;flex-direction:column;padding:${PAD}px ${PAD}px 40px}
.header{display:flex;align-items:center;gap:16px;margin-bottom:36px;flex-shrink:0}
.av{width:96px;height:96px;border-radius:50%;object-fit:cover;flex-shrink:0}
.av-ph{background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:48px;color:#999}
.mt{display:flex;flex-direction:column;gap:6px}
.nr{display:flex;align-items:center;gap:8px}
.nm{font-size:40px;font-weight:600;color:#1a1a1a;line-height:1.2}
.vf{width:36px;height:36px;flex-shrink:0}
.dt{font-size:32px;color:#999;line-height:1.2}
.ct{flex:1;display:flex;flex-direction:column;justify-content:flex-start}
.block{margin-bottom:${BLOCK_GAP}px}
.para{font-size:36px;line-height:1.8}
.hd{line-height:1.4}
.lst{list-style:none;padding:0;font-size:36px;line-height:1.8}
.lst li{padding-left:1.2em;position:relative}
.lst li::before{content:"•";position:absolute;left:0}
.qt{font-size:36px;color:#555;line-height:1.8}
code{font-size:28px;background:#f5f5f5;border-radius:4px;padding:2px 6px;font-family:monospace}
strong{font-weight:700}`
}

// ── Build full card HTML ────────────────────────────────────────────────
function cardHtml(blocks: Block[], avatar: string, name: string, date: string): string {
  const contentHtml = blocks.map(b => b2html(b)).join('\n')
  const avatarEl = avatar
    ? `<img class="av" src="${avatar}" crossorigin="anonymous" />`
    : `<div class="av av-ph">${(name || '?').charAt(0).toUpperCase()}</div>`

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${cardCss()}</style>
</head><body>
<div class="card">
  <div class="header">
    ${avatarEl}
    <div class="mt">
      <div class="nr">
        <span class="nm">${name || '未设置'}</span>
        <svg class="vf" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#1890ff"/>
          <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="dt">${date}</span>
    </div>
  </div>
  <div class="ct">${contentHtml}</div>
</div>
</body></html>`
}

// ── Measure blocks in browser ───────────────────────────────────────────
async function measureBlocks(blocks: Block[], avatar: string, name: string, date: string): Promise<number[]> {
  const blocksHtml = blocks.map((b, i) =>
    `<div id="b${i}">${b2html(b)}</div>`
  ).join(`<div style="height:${BLOCK_GAP}px"></div>`)

  const avatarEl = avatar
    ? `<img class="av" src="${avatar}" crossorigin="anonymous" />`
    : `<div class="av av-ph">${(name || '?').charAt(0).toUpperCase()}</div>`

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${cardCss()}</style>
</head><body>
<div style="padding:${PAD}px ${PAD}px 40px;width:${CARD_W}px;">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:36px;">
    ${avatarEl}
    <div class="mt">
      <div class="nr"><span class="nm">${name || '未设置'}</span>
        <svg class="vf" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#1890ff"/>
          <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="dt">${date}</span>
    </div>
  </div>
  <div style="height:${BLOCK_GAP}px"></div>
  ${blocksHtml}
</div>
</body></html>`

  const root = document.createElement('div')
  root.style.cssText = `position:fixed;left:-9999px;top:0;width:${CARD_W}px;`
  root.innerHTML = html
  document.body.appendChild(root)
  await new Promise(r => setTimeout(r, 500))

  const heights: number[] = []
  for (let i = 0; i < blocks.length; i++) {
    const el = root.querySelector(`#b${i}`)
    heights.push(el ? (el as HTMLElement).offsetHeight : 0)
  }

  document.body.removeChild(root)
  return heights.map(h => h + BLOCK_GAP)
}

// ── Paginate by pixel height ────────────────────────────────────────────
function paginate(blocks: Block[], heights: number[], headerH: number, available: number): Block[][] {
  const pages: Block[][] = []
  let cur: Block[] = []
  let used = 0

  for (let i = 0; i < blocks.length; i++) {
    const needed = used === 0 ? heights[i]! : used + BLOCK_GAP + heights[i]!
    if (needed > available && cur.length > 0) {
      pages.push(cur); cur = []; used = 0
    }
    cur.push(blocks[i]!)
    used = used === 0 ? heights[i]! : used + BLOCK_GAP + heights[i]!
  }
  if (cur.length > 0) pages.push(cur)
  return pages
}

// ── Capture card HTML → data URL ───────────────────────────────────────
async function captureCard(blocks: Block[], avatar: string, name: string, date: string): Promise<string> {
  const html = cardHtml(blocks, avatar, name, date)
  const root = document.createElement('div')
  root.style.cssText = `position:fixed;left:-9999px;top:0;width:${CARD_W}px;height:${CARD_H}px;overflow:hidden;background:#fff;`
  root.innerHTML = html
  document.body.appendChild(root)
  await new Promise(r => setTimeout(r, 800))

  const canvas = await html2canvas(root as HTMLElement, {
    width: CARD_W, height: CARD_H,
    scale: 1, useCORS: true, allowTaint: true,
    backgroundColor: '#ffffff',
    windowWidth: CARD_W, windowHeight: CARD_H,
  })
  document.body.removeChild(root)
  return canvas.toDataURL('image/png', 1.0)
}

// ── Page ────────────────────────────────────────────────────────────────
export default function Md2ImagePage() {
  const [md, setMd] = useState('')
  const [name, setName] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
  })
  const [avatar, setAvatar] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [pages, setPages] = useState<Block[][]>([])
  const [profileOk, setProfileOk] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [previewImgs, setPreviewImgs] = useState<string[]>([])
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

  // Parse + paginate when md changes
  useEffect(() => {
    if (!md) { setBlocks([]); setPages([]); setPreviewImgs([]); return }
    const bs = parseMd(md)
    setBlocks(bs)
    setImages([])
    // Paginate immediately using heuristics
    // We'll do proper pixel measurement before convert
    // For preview, group ~3 blocks at a time as placeholder
    const chunkSize = 5
    const pg: Block[][] = []
    for (let i = 0; i < bs.length; i += chunkSize) {
      pg.push(bs.slice(i, i + chunkSize))
    }
    setPages(pg)
  }, [md])

  // Generate preview images (lightweight approximation)
  useEffect(() => {
    if (pages.length === 0 || !name) { setPreviewImgs([]); return }
    let cancelled = false
    ;(async () => {
      const imgs: string[] = []
      for (const pg of pages) {
        if (cancelled) break
        try {
          const url = await captureCard(pg, avatar, name, date)
          if (!cancelled) imgs.push(url)
          setPreviewImgs([...imgs])
        } catch {}
      }
    })()
    return () => { cancelled = true }
  }, [pages, avatar, name, date])

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
      // 1. Measure each block
      const heights = await measureBlocks(blocks, avatar, name, date)

      // 2. Header height estimate (avatar row + margin)
      const headerH = 96 + 36 + 36 + PAD * 2

      // 3. Paginate
      const pg = paginate(blocks, heights, headerH, CARD_H - headerH)
      console.log(`Pages: ${pg.length}, blocks: ${blocks.length}`)

      // 4. Capture each page
      const imgs: string[] = []
      for (let i = 0; i < pg.length; i++) {
        const url = await captureCard(pg[i]!, avatar, name, date)
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

      {/* 效果预览（每张卡片独立展示，可滚动） */}
      {previewImgs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">
            效果预览（{previewImgs.length} 张卡片）
          </h2>
          <div className="space-y-4">
            {previewImgs.map((img, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <img
                  src={img}
                  alt={`预览${i + 1}`}
                  className="w-full"
                  style={{ maxWidth: '540px', display: 'block', margin: '0 auto' }}
                />
                <p className="text-center text-sm text-gray-500 py-1">第 {i + 1} 张</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 转换按钮 */}
      <button
        onClick={onConvert}
        disabled={converting || !md || !name}
        className="w-full bg-gray-900 text-white py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {converting ? '转换中...' : `转换为图片${pages.length > 0 ? `（预计 ${pages.length} 张）` : ''}`}
      </button>

      {/* 最终结果下载 */}
      {images.map((img, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
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

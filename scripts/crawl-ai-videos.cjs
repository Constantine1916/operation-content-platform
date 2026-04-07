// crawl-ai-videos.cjs
// 使用 Puppeteer 爬取 awesomevideoprompts.com 视频+Prompt
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BASE_URL = 'https://awesomevideoprompts.com';
const LIMIT = 20;

async function crawl() {
  console.log('🚀 启动爬虫...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. 获取列表页前 LIMIT 个详情链接
  console.log('📄 抓取列表页...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const promptLinks = await page.evaluate(() => {
    const seen = new Set();
    const result = [];
    const links = document.querySelectorAll('a[href*="/prompts/2026-04/"]');
    for (const a of links) {
      const href = a.href;
      if (!seen.has(href) && /\/prompts\/2026-04\/\d+/.test(href)) {
        seen.add(href);
        result.push(href);
      }
    }
    return result.slice(0, 20);
  });

  console.log(`找到 ${promptLinks.length} 个链接`);
  const results = [];

  // 2. 逐个抓取详情页
  for (let i = 0; i < promptLinks.length; i++) {
    const link = promptLinks[i];
    console.log(`\n[${i + 1}/${promptLinks.length}] ${link}`);

    try {
      await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));

      const data = await page.evaluate(() => {
        const result = {
          title: '', prompt: '', author: '', authorUrl: '',
          model: '', tags: [], sourceUrl: window.location.href, videoUrl: ''
        };

        // 1. 标题
        const h1 = document.querySelector('h1');
        result.title = h1 ? h1.textContent.trim() : '';

        // 2. 视频URL：构造 {origin}/prompts/.../video.mp4
        const pathname = window.location.pathname;
        if (pathname.includes('/prompts/')) {
          result.videoUrl = window.location.origin + pathname.replace(/\/$/, '') + '/video.mp4';
        }

        // 3. 模型：class=pd-chips 下的 a[href*="/models/"]
        const chips = document.querySelectorAll('.pd-chips a[href*="/models/"]');
        for (const a of chips) {
          const parent = a.parentElement;
          if (parent && parent.classList.contains('pd-chips')) {
            result.model = a.textContent.trim().replace(/\s*\d+$/, '');
            break;
          }
        }


        // 4. Prompt：找最长的 pre 标签内容（排除 "Copy prompt"）
        const pres = document.querySelectorAll('pre');
        let bestPre = null;
        let bestLen = 0;
        for (const pre of pres) {
          const text = pre.textContent.trim();
          if (text.length > bestLen && text.length > 50 && !text.startsWith('Copy prompt')) {
            bestLen = text.length;
            bestPre = text;
          }
        }
        result.prompt = bestPre || '';

        // 备选 prompt 策略
        if (!result.prompt) {
          const allText = document.querySelectorAll('pre, code, [class*="prompt"]');
          for (const el of allText) {
            const text = el.textContent.trim();
            if (text.length > 80 && (text.includes('quality:') || text.includes('timeline:') || text.includes('SHOT ') || text.includes('秒') || text.includes('s:'))) {
              result.prompt = text;
              break;
            }
          }
        }

        // 6. 作者
        const twitterLinks = document.querySelectorAll('a[href*="twitter.com"], a[href*="x.com"]');
        for (const a of twitterLinks) {
          const text = a.textContent.trim();
          if (text && !text.startsWith('@') && text.length > 0 && text.length < 50) {
            result.author = text;
            result.authorUrl = a.href;
            break;
          }
        }

        return result;
      });

      console.log(`  标题: ${data.title}`);
      console.log(`  模型: ${data.model}`);
      console.log(`  视频: ${data.videoUrl}`);
      console.log(`  Prompt: ${(data.prompt || '未找到').slice(0, 60)}...`);

      results.push(data);

    } catch (err) {
      console.error(`  ❌ ${err.message}`);
    }
  }

  await browser.close();

  // 3. 入库
  console.log('\n\n💾 写入数据库...');
  for (const r of results) {
    const { error } = await supabase.from('ai_videos').insert({
      title: r.title || '无标题',
      prompt: r.prompt || '',
      video_url: r.videoUrl || null,
      author: r.author || 'Anonymous',
      author_url: r.authorUrl || null,
      model: r.model || null,
      tags: r.tags.length > 0 ? r.tags : [],
      platform: 'awesomevideoprompts',
      source_url: r.sourceUrl,
    });

    if (error) {
      console.log(`  ❌ ${r.title}: ${error.message}`);
    } else {
      console.log(`  ✅ ${r.title} [${r.videoUrl ? '有视频' : '无视频'}] [${r.model || 'unknown'}]`);
    }
  }

  console.log('\n✨ 完成!');
  process.exit(0);
}

crawl().catch(e => { console.error(e); process.exit(1); });

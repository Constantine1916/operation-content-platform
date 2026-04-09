// Hotspot collection script - 2026-04-06 12:00 UTC (20:00 Beijing)
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATE = '2026-04-06';
const TIME = '12:00:00';
const TZ = 'Asia/Shanghai';

const items = [];
let itemId = 1;

function addItem(title, url, source, category, summary, hotness) {
  if (!title || !url) return;
  items.push({
    id: `hn-${String(itemId).padStart(3,'0')}`,
    title,
    url,
    source,
    category,
    summary: summary || '',
    published_at: DATE,
    hotness: hotness || '中'
  });
  itemId++;
}

function fetch(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetch(res.headers.location, timeoutMs));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.setTimeout(timeoutMs);
  });
}

async function collectHN() {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/beststories.json');
    const ids = JSON.parse(res).slice(0, 25);
    const stories = await Promise.allSettled(ids.map(async id => {
      const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      return JSON.parse(r);
    }));
    stories.forEach(s => {
      if (s.status === 'fulfilled' && s.value) {
        const story = s.value;
        addItem(
          story.title,
          story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          'Hacker News',
          '科技',
          story.text ? story.text.replace(/<[^>]+>/g,'').substring(0,200) : '',
          story.score >= 300 ? '极高' : story.score >= 100 ? '高' : '中'
        );
      }
    });
    console.log('HN: collected', items.length, 'items so far');
  } catch (e) {
    console.error('HN error:', e.message);
  }
}

async function collectAIBase() {
  try {
    const res = await fetch('https://aibase.com/zh/news', 10000);
    const titleMatch = res.match(/<h3[^>]*class="[^"]*news-item[^"]*"[^>]*>([\s\S]*?)<\/h3>/gi) || [];
    const linkMatch = res.match(/href="(\/zh\/news\/[^"]+)"/g) || [];
    const summaryMatch = res.match(/<p[^>]*>([\s\S]{10,200}?)<\/p>/gi) || [];
    const count = Math.min(titleMatch.length, 8);
    for (let i = 0; i < count; i++) {
      const title = titleMatch[i] ? titleMatch[i].replace(/<[^>]+>/g,'').trim() : '';
      const link = linkMatch[i] ? 'https://aibase.com' + linkMatch[i].match(/href="([^"]+)"/)[1] : '';
      const summary = summaryMatch[i] ? summaryMatch[i].replace(/<[^>]+>/g,'').trim().substring(0,150) : '';
      if (title && link) addItem(title, link, 'AIBase', 'AI', summary, '高');
    }
    console.log('AIBase: added', count);
  } catch (e) {
    console.error('AIBase error:', e.message);
  }
}

async function collectTwitter(screenName) {
  // Placeholder - real collection would need Twitter API
  console.log(`Twitter ${screenName}: skipped (no API)`);
}

async function main() {
  console.log(`[${TIME} UTC] Starting hotspot collection for ${DATE}...`);
  await collectHN();
  await collectAIBase();
  await collectTwitter('Khazix0918');
  await collectTwitter('op7418');
  await collectTwitter('oran_ge');

  const cats = {};
  for (const it of items) {
    cats[it.category] = (cats[it.category] || 0) + 1;
  }

  const data = {
    date: DATE,
    collected_time: TIME,
    timezone: TZ,
    sources: ['hackernews/best', 'aibase/news', 'twitter/Khazix0918', 'twitter/op7418', 'twitter/oran_ge'],
    items: items,
    hotspots_count: items.length,
    top_categories: cats
  };

  const outPath = `/root/.openclaw/workspace/coding-agent-team/agents/pm/operation-content-platform/data/daily_hotspots/${DATE}_12.json`;
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Done: ${items.length} items → ${outPath}`);
}

main().catch(console.error);

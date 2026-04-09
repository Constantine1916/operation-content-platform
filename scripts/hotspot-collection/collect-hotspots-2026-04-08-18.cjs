// Hotspot collection script - 2026-04-08 18:00 UTC (2026-04-09 02:00 Beijing)
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATE = '2026-04-08';
const TIME = '18:00:00';
const TZ = 'Asia/Shanghai';

const items = [];
let itemId = 1;

function addItem(title, url, source, category, summary, hotness, score) {
  if (!title || !url) return;
  items.push({
    id: `hn-${String(itemId).padStart(3,'0')}`,
    title,
    url,
    source,
    category,
    summary: summary || '',
    published_at: DATE,
    hotness: hotness || '中',
    score: score || 0
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
          story.score >= 300 ? '极高' : story.score >= 100 ? '高' : '中',
          story.score || 0
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
    // Try to extract news items
    const titleMatches = res.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];
    const linkMatches = res.match(/href="(\/zh\/news\/[^"]+)"/g) || [];
    const summaryMatches = res.match(/<p[^>]*class="[^"]*desc[^"]*"[^>]*>([\s\S]{10,200}?)<\/p>/gi) || [];
    
    let count = 0;
    for (let i = 0; i < Math.min(10, linkMatches.length); i++) {
      const link = linkMatches[i]?.replace('href="','').replace('"','') || '';
      const rawTitle = titleMatches[i] || '';
      const title = rawTitle.replace(/<[^>]+>/g,'').trim();
      const summaryRaw = summaryMatches[i] || '';
      const summary = summaryRaw.replace(/<[^>]+>/g,'').trim().substring(0, 200);
      if (title && link && !link.includes('aibase.com')) {
        addItem(
          title,
          'https://aibase.com' + link,
          'AIBase',
          'AI',
          summary,
          '中',
          0
        );
        count++;
      }
    }
    // Fallback: try RSS
    if (count === 0) {
      try {
        const rss = await fetch('https://aibase.com/zh/news/rss', 8000);
        const rssTitles = rss.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/gi) || [];
        const rssLinks = rss.match(/<link>([\s\S]*?)<\/link>/gi) || [];
        for (let i = 1; i < Math.min(11, rssTitles.length); i++) {
          const t = rssTitles[i]?.replace(/<title><!\[CDATA\[/,'').replace(/\]\]><\/title>/,'').trim() || '';
          const l = rssLinks[i]?.replace(/<link>[\s\S]*?<!/,'').replace(/]]><\/link>/,'').trim() || '';
          if (t && l) {
            addItem(t, l, 'AIBase', 'AI', '', '中', 0);
            count++;
          }
        }
      } catch (e) { console.error('AIBase RSS error:', e.message); }
    }
    console.log('AIBase: done, total items:', items.length);
  } catch (e) {
    console.error('AIBase error:', e.message);
  }
}

async function collectTwitter() {
  const twitterAccounts = [
    { account: 'Khazix0918', name: '数字生命卡兹克' },
    { account: 'op7418', name: '宝玉' },
    { account: 'oran_ge', name: '歸藏' },
  ];
  
  for (const acct of twitterAccounts) {
    try {
      const res = await fetch(`https://rsshub.app/twitter/search/recombine/Tech OR AI OR DeepSeek OR Claude OR OpenAI?tab=top&accounts=${acct.account}`, 8000);
      const tweetMatches = res.match(/<item>[\s\S]*?<\/item>/gi) || [];
      for (let i = 0; i < Math.min(3, tweetMatches.length); i++) {
        const titleMatch = tweetMatches[i].match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
        const linkMatch = tweetMatches[i].match(/<link>([\s\S]*?)<\/link>/);
        const title = titleMatch ? titleMatch[1] : '';
        const link = linkMatch ? linkMatch[1].replace('<![CDATA[','').replace(']]>','') : '';
        if (title && !title.includes('RssHub')) {
          addItem(
            `[${acct.name}] ${title}`.substring(0, 150),
            link || `https://twitter.com/${acct.account}`,
            `Twitter@${acct.name}`,
            '社媒',
            '',
            '中',
            0
          );
        }
      }
    } catch (e) {
      console.error(`Twitter ${acct.account} error:`, e.message);
    }
  }
  console.log('Twitter: done, total items:', items.length);
}

async function main() {
  console.log('Starting hotspot collection for', DATE, TIME, '...');
  
  await collectHN();
  await new Promise(r => setTimeout(r, 500));
  await collectAIBase();
  await new Promise(r => setTimeout(r, 500));
  await collectTwitter();

  const data = {
    date: DATE,
    collected_time: TIME,
    beijing_time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    timezone: TZ,
    sources: ['hackernews/best', 'aibase/news', 'twitter/Khazix0918', 'twitter/op7418', 'twitter/oran_ge'],
    items
  };

  const outDir = '/root/.openclaw/workspace/coding-agent-team/agents/pm/operation-content-platform/data/daily_hotspots';
  const outFile = path.join(outDir, `${DATE}_18.json`);
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Saved ${items.length} items to ${outFile}`);
  console.log(`File size: ${fs.statSync(outFile).size} bytes`);
}

main().catch(console.error);

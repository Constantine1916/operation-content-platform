#!/usr/bin/env node
// Hotspot collection script - 2026-04-09 02:00 UTC (10:00 Beijing)
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATE = '2026-04-09';
const TIME = '02:00:00';
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
    console.log('HN: collected, total items:', items.length);
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
    
    for (let i = 0; i < Math.min(10, linkMatch.length); i++) {
      const link = linkMatch[i]?.replace('href="','').replace('"','') || '';
      const title = titleMatch[i]?.replace(/<[^>]+>/g,'').trim() || '';
      const summary = summaryMatch[i]?.replace(/<[^>]+>/g,'').trim() || '';
      if (title && link) {
        addItem(
          title,
          'https://aibase.com' + link,
          'AIBase',
          'AI',
          summary.substring(0, 200),
          '中'
        );
      }
    }
    console.log('AIBase: done, total items:', items.length);
  } catch (e) {
    console.error('AIBase error:', e.message);
  }
}

async function collectTwitter() {
  const RSSHUB = 'http://101.32.243.232:1200';
  const twitterAccounts = [
    { account: 'Khazix0918', name: '数字生命卡兹克' },
    { account: 'op7418', name: '宝玉' },
    { account: 'oran_ge', name: '歸藏' },
    { account: 'berryxia', name: '神佬' },
    { account: 'ZHO_ZHO_ZHO', name: 'ZHO' },
    { account: 'stark_nico99', name: 'Nicolechan' },
    { account: 'songguoxiansen', name: '松果先森' },
    { account: 'ttmouse', name: '豆爸' },
    { account: 'zstmfhy', name: 'AI奶爸' },
    { account: 'joshesye', name: '行者' },
    { account: 'yyyole', name: '沐阳' },
    { account: 'GoSailGlobal', name: 'Jason Zhu' },
    { account: 'AI_Jasonyu', name: '鱼总聊AI' },
    { account: 'servasyy_ai', name: '黄总' },
    { account: 'gkxspace', name: '余温' },
    { account: 'canghe', name: '苍何' },
    { account: 'binghe', name: '冰河' },
    { account: 'cellinlab', name: 'Cell 细胞' },
  ];
  
  for (const acct of twitterAccounts) {
    try {
      const res = await fetch(`${RSSHUB}/twitter/user/${acct.account}`, 8000);
      const tweetMatches = res.match(/<item>[\s\S]*?<\/item>/gi) || [];
      for (let i = 0; i < Math.min(3, tweetMatches.length); i++) {
        // Support both CDATA and plain text formats
        const titleMatch = tweetMatches[i].match(/<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|(.*?))<\/title>/);
        const linkMatch = tweetMatches[i].match(/<link>([\s\S]*?)<\/link>/);
        const descMatch = tweetMatches[i].match(/<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|(.*?))<\/description>/);
        const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : '';
        const link = linkMatch ? linkMatch[1] : '';
        const desc = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]+>/g,'').trim().substring(0,200) : '';
        if (title && !title.includes('RssHub') && !title.startsWith('http://x.com/i/article')) {
          addItem(
            `[${acct.name}] ${title}`.substring(0, 150),
            link || `https://x.com/${acct.account}`,
            `Twitter@${acct.name}`,
            '社媒',
            desc,
            '中'
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
  console.log('Starting hotspot collection for', DATE, TIME, '(10:00 Beijing)...');
  
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
    sources: ['hackernews/best', 'aibase/news', 'twitter/Khazix0918', 'twitter/op7418', 'twitter/oran_ge', 'twitter/berryxia', 'twitter/ZHO_ZHO_ZHO', 'twitter/stark_nico99', 'twitter/songguoxiansen', 'twitter/ttmouse', 'twitter/zstmfhy', 'twitter/joshesye', 'twitter/yyyole', 'twitter/GoSailGlobal', 'twitter/AI_Jasonyu', 'twitter/servasyy_ai', 'twitter/gkxspace', 'twitter/canghe', 'twitter/binghe', 'twitter/cellinlab'],
    items
  };

  const outDir = '/root/.openclaw/workspace/coding-agent-team/agents/pm/operation-content-platform/data/daily_hotspots';
  const outFile = path.join(outDir, `${DATE}_02.json`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Saved ${items.length} items to ${outFile}`);
  console.log(`File size: ${fs.statSync(outFile).size} bytes`);

  // Also save to radar workspace
  const radarDir = '/root/.openclaw/workspace-radar/data/daily_hotspots';
  if (fs.existsSync(radarDir)) {
    fs.writeFileSync(path.join(radarDir, `${DATE}_02.json`), JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Synced to radar: ${path.join(radarDir, `${DATE}_02.json`)}`);
  }
}

main().catch(console.error);
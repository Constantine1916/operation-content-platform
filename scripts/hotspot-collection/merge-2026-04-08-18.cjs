// Merge hotspots from 14:00, 16:00, and 18:00 windows for 2026-04-08 18:00 UTC run
const fs = require('fs');
const path = require('path');

const DATA_DIR = '/opt/openclaw/agent-b/workspace/data/daily_hotspots';
const OUT_FILE = path.join(DATA_DIR, '2026-04-08_18.json');

const DATE = '2026-04-08';
const TIME = '18:00:00';

// Load windows
function loadWindow(filename) {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
    const data = JSON.parse(raw);
    return data.items || [];
  } catch (e) {
    console.error('Failed to load', filename, ':', e.message);
    return [];
  }
}

const windows = [
  '2026-04-08_14.json',  // merged 06+08+10+12
  '2026-04-08_16.json',  // merged 14+16
  '2026-04-08_18.json',  // fresh 18:00 collection
];

// Deduplicate by title
function dedupe(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Score-based ranking
function scoreItem(item) {
  const hotnessScores = { '极高': 100, '高': 70, '中': 40, '低': 10 };
  const score = hotnessScores[item.hotness] || 30;
  const extraScore = (item.score || 0) / 10;
  return score + extraScore;
}

const allItems = [];
for (const w of windows) {
  const items = loadWindow(w);
  console.log(`Loaded ${items.length} items from ${w}`);
  allItems.push(...items);
}

const deduped = dedupe(allItems);
console.log(`Total after dedup: ${deduped.length}`);

// Sort by score
deduped.sort((a, b) => scoreItem(b) - scoreItem(a));

// Take top 40
const top40 = deduped.slice(0, 40);

// Re-number IDs
top40.forEach((item, i) => {
  item.id = `hn-${String(i + 1).padStart(3, '0')}`;
});

const data = {
  date: DATE,
  collected_time: TIME,
  beijing_time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
  timezone: 'Asia/Shanghai',
  windows_merged: ['06', '08', '10', '12', '14', '16', '18'],
  sources_collected: ['hackernews/best', 'aibase/news', 'twitter/Khazix0918', 'twitter/op7418', 'twitter/oran_ge'],
  total_raw: allItems.length,
  total_deduped: deduped.length,
  items: top40
};

fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
console.log(`✅ Saved merged ${top40.length} items to ${OUT_FILE}`);

// Print top 10
console.log('\n--- Top 10 Hotspots ---');
top40.slice(0, 10).forEach((item, i) => {
  console.log(`${i+1}. [${item.category || 'N/A'}] ${item.title.substring(0, 80)} (${item.hotness || '?'})`);
});

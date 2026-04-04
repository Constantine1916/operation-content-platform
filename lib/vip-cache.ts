/**
 * 客户端 vip_level 缓存
 * - 立即返回缓存值（避免页面闪烁）
 * - 异步刷新并写回缓存
 * - key 绑定 user_id，防止多账号串数据
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟

interface CacheEntry {
  vip_level: number;
  expires_at: number;
}

function cacheKey(userId: string) {
  return `vip_level:${userId}`;
}

export function readVipCache(userId: string): number | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() > entry.expires_at) return null; // 已过期
    return entry.vip_level;
  } catch {
    return null;
  }
}

export function writeVipCache(userId: string, vip_level: number) {
  try {
    const entry: CacheEntry = { vip_level, expires_at: Date.now() + CACHE_TTL_MS };
    localStorage.setItem(cacheKey(userId), JSON.stringify(entry));
  } catch {
    // localStorage 不可用时静默忽略
  }
}

/**
 * 从 /api/profile 获取最新 vip_level 并写入缓存
 * 返回最新值，失败时返回 null
 */
export async function refreshVipCache(userId: string, token: string): Promise<number | null> {
  try {
    const res = await fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success && typeof data.data?.vip_level === 'number') {
      writeVipCache(userId, data.data.vip_level);
      return data.data.vip_level;
    }
    return null;
  } catch {
    return null;
  }
}

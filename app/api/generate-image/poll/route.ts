import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const HAIYI_BASE = 'https://www.haiyi.art/api/v1';
const CF_PROXY = 'https://haiyi-proxy.constantine1916.workers.dev';
const COOKIE = process.env.HAIYI_COOKIE!;

function proxyUrl(path: string): string {
  return `${CF_PROXY}?target=${encodeURIComponent(`${HAIYI_BASE}${path}`)}`;
}

const COMMON_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'accept-encoding': 'identity',
  'content-type': 'application/json',
  'origin': 'https://www.haiyi.art',
  'referer': 'https://www.haiyi.art/models/detail/d34fe800504g5d28bbhaiyiycanimeimg',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'priority': 'u=1, i',
  'x-app-id': 'web_global_seaart',
  'x-browser-id': process.env.HAIYI_BROWSER_ID ?? crypto.randomUUID(),
  'x-device-id': process.env.HAIYI_DEVICE_ID ?? crypto.randomUUID(),
  'x-page-id': crypto.randomUUID(),
  'x-platform': 'web',
  'x-timezone': 'Asia/Shanghai',
  'Cookie': COOKIE,
};

async function requireSVIP(token: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw Object.assign(new Error('未登录'), { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('vip_level').eq('id', user.id).single();
  if (!profile || profile.vip_level < 2)
    throw Object.assign(new Error('需要 SVIP 权限'), { status: 403 });
}

/**
 * POST /api/generate-image/poll
 * Body: { task_ids: string[] }
 * Response: { success: true, items: [{ task_id, status, process, images }] }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    try { await requireSVIP(token); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.status ?? 403 }); }

    const body = await request.json();
    const task_ids: string[] = body.task_ids;
    if (!Array.isArray(task_ids) || task_ids.length === 0)
      return NextResponse.json({ error: 'task_ids must be a non-empty array' }, { status: 400 });

    const res = await fetch(proxyUrl('/task/batch-progress'), {
      method: 'POST',
      headers: { ...COMMON_HEADERS, 'x-request-id': crypto.randomUUID() },
      body: JSON.stringify({ task_ids, ss: 52 }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`pollBatch HTTP ${res.status}: ${errText.substring(0, 200)}`);
    }

    const json = await res.json();
    if (json.status?.code !== 10000) throw new Error(`pollBatch error: ${json.status?.msg}`);

    const items = (json.data?.items ?? []).map((item: any) => ({
      task_id: item.task_id,
      status: item.status,   // 1=pending 2=processing 3=finish 4=failed
      process: item.process,
      images: (item.img_uris ?? []).map((u: any) => ({
        url: u.url,
        width: u.width,
        height: u.height,
        index: u.index,
      })),
    }));

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

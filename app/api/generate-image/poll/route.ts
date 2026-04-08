import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

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

async function requireSVIP(token: string): Promise<string> {
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
  return user.id;
}

async function submitTask(prompt: string): Promise<string> {
  const body = {
    model_no: 'd34fe800504g5d28bbhaiyiycanimeimg',
    model_ver_no: 'e45g335365865c5aa2haiyiycanimeimg',
    meta: {
      n_iter: 4, lora_models: null, embeddings: null,
      original_translated_meta_prompt: '', extra_prompt: '',
      prompt, local_prompt: '', width: 828, height: 1472,
      steps: 0, init_images: null, seed: 0, hi_res_arg: null,
      smart_edit: null, guidance_scale: 0, left_margin: 0, up_margin: 0,
      image: '', images: null, vae: 'None', refiner_mode: 0, lcm_mode: 0,
      generate: { anime_enhance: 2, mode: 0, prompt_magic_mode: 2, gen_mode: 0 },
    },
    ss: 52,
  };

  // 最多重试 4 次，指数退避：2s → 4s → 8s → 16s
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));

    const res = await fetch(proxyUrl('/task/v2/text-to-img'), {
      method: 'POST',
      headers: { ...COMMON_HEADERS, 'x-request-id': crypto.randomUUID() },
      body: JSON.stringify(body),
    });

    if (res.status === 403) {
      if (attempt < 3) continue;
      const errText = await res.text();
      throw new Error(`submitTask HTTP 403: ${errText.substring(0, 200)}`);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`submitTask HTTP ${res.status}: ${errText.substring(0, 200)}`);
    }

    const json = await res.json();
    if (json.status?.code !== 10000) throw new Error(`submitTask error: ${json.status?.msg}`);
    return json.data.id as string;
  }

  throw new Error('submitTask: max retries exceeded');
}

/**
 * POST /api/generate-image/poll
 * Body: { task_ids: string[] }
 * Response: { success: true, items: [...], promoted: [...] }
 *   promoted: tasks that were queued (status=0) and just submitted
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    let userId: string;
    try { userId = await requireSVIP(token); }
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

    const db = serviceClient();
    const items = await Promise.all(
      (json.data?.items ?? []).map(async (item: any) => {
        const images = (item.img_uris ?? []).map((u: any) => ({
          url: u.url,
          width: u.width,
          height: u.height,
          index: u.index,
        }));

        // Persist status updates for finished/failed/in-progress tasks
        if (item.status === 3 || item.status === 4 || item.status === 2) {
          await db.from('generate_tasks')
            .update({
              status: item.status,
              process: item.process ?? 0,
              images: item.status === 3 ? images : undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('task_id', item.task_id);
        }

        return {
          task_id: item.task_id,
          status: item.status,   // 1=pending 2=processing 3=finish 4=failed
          process: item.process,
          images,
        };
      })
    );

    // 统计当前进行中任务数，把 status=0 的队列任务补提
    const { count: activeCount } = await db
      .from('generate_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', [1, 2]);
    const slots = Math.max(0, 10 - (activeCount ?? 0));

    const promoted: { task_id: string; db_id: string; prompt: string }[] = [];
    if (slots > 0) {
      const { data: queued } = await db
        .from('generate_tasks')
        .select('id, prompt')
        .eq('user_id', userId)
        .eq('status', 0)
        .order('created_at', { ascending: true })
        .limit(slots);

      for (const row of queued ?? []) {
        try {
          const task_id = await submitTask(row.prompt);
          await db.from('generate_tasks')
            .update({ task_id, status: 1, updated_at: new Date().toISOString() })
            .eq('id', row.id);
          promoted.push({ task_id, db_id: row.id, prompt: row.prompt });
        } catch (e: any) {
          await db.from('generate_tasks')
            .update({ status: 4, error: e?.message ?? 'submit failed', updated_at: new Date().toISOString() })
            .eq('id', row.id);
        }
        if ((queued ?? []).indexOf(row) < (queued ?? []).length - 1) {
          await new Promise(r => setTimeout(r, 800));
        }
      }
    }

    return NextResponse.json({ success: true, items, promoted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

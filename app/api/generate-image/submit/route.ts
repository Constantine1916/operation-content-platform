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
  'x-browser-id': process.env.HAIYI_BROWSER_ID ?? '4871c1c16db94c2122bee5b31279ce92',
  'x-device-id': process.env.HAIYI_DEVICE_ID ?? '8bb73c95-4b79-4efc-9f20-14e1bb0bf435',
  'x-page-id': '3bb73daf-2802-4bd8-af23-6f39f33acb21',
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

  const res = await fetch(proxyUrl('/task/v2/text-to-img'), {
    method: 'POST',
    headers: { ...COMMON_HEADERS, 'x-request-id': crypto.randomUUID() },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`submitTask HTTP ${res.status}: ${errText.substring(0, 200)}`);
  }
  const json = await res.json();
  if (json.status?.code !== 10000) throw new Error(`submitTask error: ${json.status?.msg}`);
  return json.data.id as string;
}

/**
 * POST /api/generate-image/submit
 * Body: { prompts: string[] }
 * Response: { success: true, tasks: [{ prompt, task_id, error? }] }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    try { await requireSVIP(token); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.status ?? 403 }); }

    if (!COOKIE) return NextResponse.json({ error: 'HAIYI_COOKIE not set' }, { status: 500 });

    const body = await request.json();
    const prompts: string[] = body.prompts;
    if (!Array.isArray(prompts) || prompts.length === 0)
      return NextResponse.json({ error: 'prompts must be a non-empty array' }, { status: 400 });

    const submissions = await Promise.allSettled(prompts.map(submitTask));

    const tasks = prompts.map((prompt, i) => {
      const result = submissions[i];
      if (result.status === 'fulfilled') return { prompt, task_id: result.value };
      return { prompt, task_id: null, error: result.reason?.message ?? 'submit failed' };
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

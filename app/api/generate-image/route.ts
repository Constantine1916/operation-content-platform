import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const HAIYI_BASE = 'https://www.haiyi.art/api/v1';
const COOKIE = process.env.HAIYI_COOKIE!;

const COMMON_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
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

/** 验证 token 并检查是否为 SVIP，返回 user id 或抛出错误 */
async function requireSVIP(token: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw Object.assign(new Error('未登录'), { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('vip_level')
    .eq('id', user.id)
    .single();

  if (!profile || profile.vip_level < 2) {
    throw Object.assign(new Error('需要 SVIP 权限'), { status: 403 });
  }

  return user.id;
}

/** 提交单个生图任务，返回 task_id */
async function submitTask(prompt: string): Promise<string> {
  const body = {
    model_no: 'd34fe800504g5d28bbhaiyiycanimeimg',
    model_ver_no: 'e45g335365865c5aa2haiyiycanimeimg',
    meta: {
      n_iter: 4,
      lora_models: null,
      embeddings: null,
      original_translated_meta_prompt: '',
      extra_prompt: '',
      prompt,
      local_prompt: '',
      width: 828,
      height: 1472,
      steps: 0,
      init_images: null,
      seed: 0,
      hi_res_arg: null,
      smart_edit: null,
      guidance_scale: 0,
      left_margin: 0,
      up_margin: 0,
      image: '',
      images: null,
      vae: 'None',
      refiner_mode: 0,
      lcm_mode: 0,
      generate: { anime_enhance: 2, mode: 0, prompt_magic_mode: 2, gen_mode: 0 },
    },
    ss: 52,
  };

  const res = await fetch(`${HAIYI_BASE}/task/v2/text-to-img`, {
    method: 'POST',
    headers: { ...COMMON_HEADERS, 'x-request-id': crypto.randomUUID() },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`submitTask HTTP ${res.status}`);
  const json = await res.json();
  if (json.status?.code !== 10000) throw new Error(`submitTask error: ${json.status?.msg}`);
  return json.data.id as string;
}

interface ImgUri { url: string; width: number; height: number; index: number }
interface PollResult { task_id: string; status: number; process: number; img_uris: ImgUri[] }

/** 批量轮询，返回已完成任务的结果 */
async function pollBatch(taskIds: string[]): Promise<PollResult[]> {
  const res = await fetch(`${HAIYI_BASE}/task/batch-progress`, {
    method: 'POST',
    headers: { ...COMMON_HEADERS, 'x-request-id': crypto.randomUUID() },
    body: JSON.stringify({ task_ids: taskIds, ss: 52 }),
  });

  if (!res.ok) throw new Error(`pollBatch HTTP ${res.status}`);
  const json = await res.json();
  if (json.status?.code !== 10000) throw new Error(`pollBatch error: ${json.status?.msg}`);

  return (json.data?.items ?? []).map((item: any) => ({
    task_id: item.task_id,
    status: item.status,      // 3 = finish, 4 = failed
    process: item.process,
    img_uris: (item.img_uris ?? []).map((u: any) => ({
      url: u.url,
      width: u.width,
      height: u.height,
      index: u.index,
    })),
  }));
}

/**
 * POST /api/generate-image
 *
 * Body: { prompts: string[] }
 *
 * Response:
 * {
 *   success: true,
 *   results: [
 *     { prompt: string, task_id: string, images: { url, width, height, index }[] },
 *     ...
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 鉴权：必须登录且是 SVIP
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    try {
      await requireSVIP(token);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: e.status ?? 403 });
    }

    const body = await request.json();
    const prompts: string[] = body.prompts;

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ error: 'prompts must be a non-empty array' }, { status: 400 });
    }

    if (!COOKIE) {
      return NextResponse.json({ error: 'HAIYI_COOKIE env variable is not set' }, { status: 500 });
    }

    // 1. 并发提交所有任务
    const submissions = await Promise.allSettled(prompts.map(submitTask));

    // 记录 task_id -> prompt 的映射；提交失败的直接记录错误
    const taskMap = new Map<string, string>(); // task_id -> prompt
    const errors: { prompt: string; error: string }[] = [];

    submissions.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        taskMap.set(result.value, prompts[i]);
      } else {
        errors.push({ prompt: prompts[i], error: result.reason?.message ?? 'submit failed' });
      }
    });

    const pendingIds = [...taskMap.keys()];

    // 2. 轮询，直到全部完成或超时（最多 120 次，每次 3s = 6 分钟）
    const finished = new Map<string, ImgUri[]>(); // task_id -> img_uris
    const failed = new Map<string, string>();     // task_id -> reason

    const MAX_POLLS = 120;
    const POLL_INTERVAL = 3000;

    for (let i = 0; i < MAX_POLLS && pendingIds.length > 0; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL));

      const results = await pollBatch(pendingIds);

      for (const item of results) {
        if (item.status === 3) {
          finished.set(item.task_id, item.img_uris);
          pendingIds.splice(pendingIds.indexOf(item.task_id), 1);
        } else if (item.status === 4) {
          failed.set(item.task_id, 'task failed on server');
          pendingIds.splice(pendingIds.indexOf(item.task_id), 1);
        }
      }
    }

    // 超时的剩余任务
    for (const id of pendingIds) {
      failed.set(id, 'timeout');
    }

    // 3. 组装返回
    const results = prompts.map(prompt => {
      // 找到对应的 task_id
      const taskId = [...taskMap.entries()].find(([, p]) => p === prompt)?.[0];
      if (!taskId) {
        const err = errors.find(e => e.prompt === prompt);
        return { prompt, task_id: null, images: [], error: err?.error ?? 'submit failed' };
      }
      if (failed.has(taskId)) {
        return { prompt, task_id: taskId, images: [], error: failed.get(taskId) };
      }
      return {
        prompt,
        task_id: taskId,
        images: finished.get(taskId) ?? [],
      };
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('generate-image error:', error);
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

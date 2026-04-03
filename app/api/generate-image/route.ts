import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 分钟，等待生图完成

const HAIYI_BASE = 'https://www.haiyi.art/api/v1';
const COOKIE = process.env.HAIYI_COOKIE!;

const COMMON_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'zhCN',
  'content-type': 'application/json',
  'origin': 'https://www.haiyi.art',
  'x-app-id': 'web_global_seaart',
  'x-browser-id': process.env.HAIYI_BROWSER_ID ?? '4871c1c16db94c2122bee5b31279ce92',
  'x-device-id': process.env.HAIYI_DEVICE_ID ?? '8bb73c95-4b79-4efc-9f20-14e1bb0bf435',
  'x-platform': 'web',
  'x-timezone': 'Asia/Shanghai',
  'Cookie': COOKIE,
};

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

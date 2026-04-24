import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authRequiredResponse } from '@/lib/server/auth-required-response';

export const dynamic = 'force-dynamic';

const IMAGE_MODEL = 'gpt-image-2';
const IMAGE_SIZE = '1024x1024';
const IMAGE_QUALITY = 'medium';
const IMAGE_FORMAT = 'png';
const MAX_PROMPTS_PER_REQUEST = 100;

type GeneratedImage = {
  url: string;
  width: number;
  height: number;
  index: number;
  is_public?: boolean;
};

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function getProviderConfig() {
  const baseUrl = process.env.IMAGE_GENERATION_BASE_URL?.replace(/\/+$/, '');
  const apiKey = process.env.IMAGE_GENERATION_API_KEY;

  if (!baseUrl || !apiKey) {
    throw Object.assign(new Error('Image generation provider is not configured'), { status: 500 });
  }

  return { baseUrl, apiKey };
}

function getImageDimensions(size: string) {
  const [widthRaw, heightRaw] = size.split('x');
  const width = Number(widthRaw);
  const height = Number(heightRaw);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return { width: 1024, height: 1024 };
  }

  return { width, height };
}

async function requireSVIP(token: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('vip_level').eq('id', user.id).single();
  if (!profile || profile.vip_level < 2)
    throw Object.assign(new Error('需要 SVIP 权限'), { status: 403 });
  return user.id;
}

async function generateImage(prompt: string): Promise<GeneratedImage> {
  const { baseUrl, apiKey } = getProviderConfig();
  const res = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      size: IMAGE_SIZE,
      quality: IMAGE_QUALITY,
      output_format: IMAGE_FORMAT,
      response_format: 'url',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`generateImage HTTP ${res.status}: ${errText.substring(0, 200)}`);
  }

  const json = await res.json();
  const url = json?.data?.[0]?.url;
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('generateImage response missing data[0].url');
  }

  return {
    url,
    ...getImageDimensions(IMAGE_SIZE),
    index: 0,
  };
}

function normalizePrompts(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

/**
 * POST /api/generate-image/submit
 * Body: { prompts: string[] }
 * Response: { success: true, tasks: [{ prompt, task_id, status, images, error? }] }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return authRequiredResponse();

    let userId: string;
    try { userId = await requireSVIP(token); }
    catch (e: any) {
      if (e?.status === 401) return authRequiredResponse();
      return NextResponse.json({ error: e.message }, { status: e.status ?? 403 });
    }

    const body = await request.json();
    const prompts = normalizePrompts(body.prompts);
    if (prompts.length === 0) {
      return NextResponse.json({ error: 'prompts must be a non-empty array' }, { status: 400 });
    }
    if (prompts.length > MAX_PROMPTS_PER_REQUEST) {
      return NextResponse.json({ error: `prompts cannot exceed ${MAX_PROMPTS_PER_REQUEST} items` }, { status: 400 });
    }

    const db = serviceClient();
    const tasks: {
      prompt: string;
      task_id: string;
      status: number;
      process: number;
      images: GeneratedImage[];
      error?: string;
    }[] = [];

    for (const prompt of prompts) {
      const task_id = crypto.randomUUID();
      let taskRowInserted = false;

      try {
        const image = await generateImage(prompt);
        const images = [{ ...image, is_public: true }];

        const { error: taskError } = await db.from('generate_tasks').insert({
          user_id: userId,
          prompt,
          task_id,
          status: 3,
          process: 100,
          images,
        });
        if (taskError) throw new Error(taskError.message);
        taskRowInserted = true;

        const { error: imageError } = await db.from('ai_images').upsert(
          images.map(img => ({
            url: img.url,
            prompt,
            width: img.width,
            height: img.height,
            index: img.index,
            is_public: img.is_public,
            source: 'generate',
            task_id,
            user_id: userId,
          })),
          { onConflict: 'task_id,index' }
        );
        if (imageError) throw new Error(imageError.message);

        tasks.push({ prompt, task_id, status: 3, process: 100, images });
      } catch (e: any) {
        const errorMsg = e?.message ?? 'submit failed';
        if (taskRowInserted) {
          await db.from('generate_tasks')
            .update({ status: 4, process: 0, images: [], error: errorMsg, updated_at: new Date().toISOString() })
            .eq('task_id', task_id)
            .eq('user_id', userId);
        } else {
          await db.from('generate_tasks').insert({
            user_id: userId,
            prompt,
            task_id,
            status: 4,
            process: 0,
            images: [],
            error: errorMsg,
          });
        }
        tasks.push({ prompt, task_id, status: 4, process: 0, images: [], error: errorMsg });
      }
    }

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: error?.status ?? 500 });
  }
}

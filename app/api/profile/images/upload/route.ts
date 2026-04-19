import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBeijingDateRange } from '@/lib/beijing-date-range';
import { authRequiredResponse } from '@/lib/server/auth-required-response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const IMAGE_BUCKET = 'gallery-images';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DAILY_UPLOAD_LIMITS: Record<number, number> = {
  0: 5,
  1: 10,
  2: 500,
};

function createUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SVC_KEY!,
  );
}

function sanitizeFileStem(fileName: string) {
  const stem = fileName.replace(/\.[^/.]+$/, '');
  const sanitized = stem.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return sanitized.slice(0, 48) || 'upload';
}

function getBeijingToday() {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().slice(0, 10);
}

function parseNumberList(value: FormDataEntryValue | null): number[] | null {
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.map(item => Number(item));
  } catch {
    return null;
  }
}

function parseStringList(value: FormDataEntryValue | null): string[] | null {
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.map(item => String(item));
  } catch {
    return null;
  }
}

async function ensureImageBucket(serviceClient: ReturnType<typeof createServiceClient>) {
  const { error } = await serviceClient.storage.createBucket(IMAGE_BUCKET, {
    public: true,
    allowedMimeTypes: ['image/*'],
    fileSizeLimit: '10MB',
  });

  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return authRequiredResponse();
    }

    const userClient = createUserClient(token);
    const serviceClient = createServiceClient();

    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return authRequiredResponse();
    }

    const formData = await request.formData();
    const files = formData.getAll('files').filter((item): item is File => item instanceof File);
    const prompts = parseStringList(formData.get('prompts'));
    const widths = parseNumberList(formData.get('widths'));
    const heights = parseNumberList(formData.get('heights'));

    if (files.length === 0) {
      return NextResponse.json({ error: '请选择至少一张图片' }, { status: 400 });
    }

    if (!prompts || !widths || !heights || prompts.length !== files.length || widths.length !== files.length || heights.length !== files.length) {
      return NextResponse.json({ error: '上传参数不完整' }, { status: 400 });
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > files.length * MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: `本次批量上传总大小不能超过 ${files.length * 10}MB` }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: '仅支持 JPG/PNG/WebP/GIF 格式' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: `单张图片大小不能超过 10MB：${file.name}` }, { status: 400 });
      }
    }

    for (let i = 0; i < files.length; i += 1) {
      const width = widths[i];
      const height = heights[i];
      const prompt = prompts[i]?.trim();

      if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
        return NextResponse.json({ error: `第 ${i + 1} 张图片尺寸无效` }, { status: 400 });
      }

      if (!prompt) {
        return NextResponse.json({ error: `第 ${i + 1} 张图片缺少提示词` }, { status: 400 });
      }
    }

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('vip_level')
      .eq('id', user.id)
      .single();

    const vipLevel = Math.max(0, Number(profile?.vip_level ?? 0));
    const dailyLimit = DAILY_UPLOAD_LIMITS[vipLevel] ?? DAILY_UPLOAD_LIMITS[2];
    const beijingToday = getBeijingToday();
    const { startIso, endIso } = getBeijingDateRange(beijingToday);

    const { count: usedToday, error: countError } = await serviceClient
      .from('ai_images')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('source', 'upload')
      .gte('created_at', startIso)
      .lt('created_at', endIso);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const currentUsed = usedToday ?? 0;
    if (currentUsed + files.length > dailyLimit) {
      const remaining = Math.max(0, dailyLimit - currentUsed);
      return NextResponse.json({
        error: `今日上传额度不足，当前会员今日最多上传 ${dailyLimit} 张，已上传 ${currentUsed} 张，还可上传 ${remaining} 张`,
        quota: {
          vip_level: vipLevel,
          daily_limit: dailyLimit,
          used_today: currentUsed,
          remaining_today: remaining,
        },
      }, { status: 400 });
    }

    await ensureImageBucket(serviceClient);

    const uploadedPaths: string[] = [];
    const timestamp = Date.now();
    const imagePayloads: Array<{
      url: string;
      prompt: string;
      width: number;
      height: number;
      index: number;
      is_public: boolean;
      source: string;
      task_id: string;
      user_id: string;
    }> = [];

    try {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeStem = sanitizeFileStem(file.name);
        const objectPath = `${user.id}/${timestamp}-${i + 1}-${safeStem}.${ext}`;
        const taskId = `upload_${user.id}_${timestamp}_${i}_${Math.random().toString(36).slice(2, 8)}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await serviceClient.storage
          .from(IMAGE_BUCKET)
          .upload(objectPath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(objectPath);

        const { data: publicUrlData } = serviceClient.storage
          .from(IMAGE_BUCKET)
          .getPublicUrl(objectPath);

        imagePayloads.push({
          url: publicUrlData.publicUrl,
          prompt: prompts[i]!.trim(),
          width: Math.round(widths[i]!),
          height: Math.round(heights[i]!),
          index: 0,
          is_public: true,
          source: 'upload',
          task_id: taskId,
          user_id: user.id,
        });
      }
    } catch (error: any) {
      if (uploadedPaths.length > 0) {
        await serviceClient.storage.from(IMAGE_BUCKET).remove(uploadedPaths);
      }
      return NextResponse.json({ error: error.message ?? '上传图片失败' }, { status: 500 });
    }

    const { data: imageRows, error: insertError } = await serviceClient
      .from('ai_images')
      .insert(imagePayloads)
      .select('id, url, prompt, width, height, "index", created_at, user_id');

    if (insertError) {
      if (uploadedPaths.length > 0) {
        await serviceClient.storage.from(IMAGE_BUCKET).remove(uploadedPaths);
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: imageRows ?? [],
      quota: {
        vip_level: vipLevel,
        daily_limit: dailyLimit,
        used_today: currentUsed + files.length,
        remaining_today: Math.max(0, dailyLimit - currentUsed - files.length),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? '上传失败' }, { status: 500 });
  }
}

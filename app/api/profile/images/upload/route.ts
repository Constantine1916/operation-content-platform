import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const IMAGE_BUCKET = 'gallery-images';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userClient = createUserClient(token);
    const serviceClient = createServiceClient();

    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: '无效登录态' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const promptRaw = formData.get('prompt');
    const widthRaw = formData.get('width');
    const heightRaw = formData.get('height');

    if (!file) {
      return NextResponse.json({ error: '请选择图片文件' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 JPG/PNG/WebP/GIF 格式' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: '图片大小不能超过 10MB' }, { status: 400 });
    }

    const width = Number(widthRaw);
    const height = Number(heightRaw);
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      return NextResponse.json({ error: '图片尺寸无效' }, { status: 400 });
    }

    const prompt =
      (typeof promptRaw === 'string' && promptRaw.trim()) ||
      sanitizeFileStem(file.name).replace(/[-_]+/g, ' ') ||
      '用户上传图片';

    await ensureImageBucket(serviceClient);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeStem = sanitizeFileStem(file.name);
    const objectPath = `${user.id}/${Date.now()}-${safeStem}.${ext}`;
    const taskId = `upload_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await serviceClient.storage
      .from(IMAGE_BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = serviceClient.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(objectPath);

    const imagePayload = {
      url: publicUrlData.publicUrl,
      prompt,
      width: Math.round(width),
      height: Math.round(height),
      index: 0,
      is_public: true,
      source: 'upload',
      task_id: taskId,
      user_id: user.id,
    };

    const { data: imageRow, error: insertError } = await serviceClient
      .from('ai_images')
      .insert(imagePayload)
      .select('id, url, prompt, width, height, "index", created_at, user_id')
      .single();

    if (insertError) {
      await serviceClient.storage.from(IMAGE_BUCKET).remove([objectPath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: imageRow,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? '上传失败' }, { status: 500 });
  }
}

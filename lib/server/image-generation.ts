const IMAGE_MODEL = 'gpt-image-2';
const IMAGE_SIZE = '1024x1024';
const IMAGE_QUALITY = 'medium';
const IMAGE_FORMAT = 'png';
const DEFAULT_IMAGE_GENERATION_TIMEOUT_MS = 285_000;

export type GeneratedImage = {
  url: string;
  width: number;
  height: number;
  index: number;
  is_public?: boolean;
};

function getProviderConfig() {
  const baseUrl = process.env.IMAGE_GENERATION_BASE_URL?.replace(/\/+$/, '');
  const apiKey = process.env.IMAGE_GENERATION_API_KEY;

  if (!baseUrl || !apiKey) {
    throw Object.assign(new Error('Image generation provider is not configured'), { status: 500 });
  }

  return { baseUrl, apiKey };
}

function getProviderTimeoutMs() {
  const raw = Number(process.env.IMAGE_GENERATION_TIMEOUT_MS);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return DEFAULT_IMAGE_GENERATION_TIMEOUT_MS;
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

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const { baseUrl, apiKey } = getProviderConfig();
  const timeoutMs = getProviderTimeoutMs();
  const res = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
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

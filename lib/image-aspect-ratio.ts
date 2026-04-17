const FALLBACK_IMAGE_ASPECT_RATIO = '1 / 1';

export function getImageAspectRatio(
  width?: number | null,
  height?: number | null,
): string {
  if (
    typeof width === 'number' &&
    Number.isFinite(width) &&
    width > 0 &&
    typeof height === 'number' &&
    Number.isFinite(height) &&
    height > 0
  ) {
    return `${width} / ${height}`;
  }

  return FALLBACK_IMAGE_ASPECT_RATIO;
}

export function getStableImageFrameStyles(
  width?: number | null,
  height?: number | null,
) {
  return {
    frame: {
      aspectRatio: getImageAspectRatio(width, height),
      position: 'relative' as const,
      width: '100%',
      overflow: 'hidden' as const,
    },
    root: {
      position: 'absolute' as const,
      inset: 0,
      display: 'block',
      width: '100%',
      height: '100%',
    },
    image: {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
  };
}

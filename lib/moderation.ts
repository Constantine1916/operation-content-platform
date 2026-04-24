export const MODERATION_STATUSES = ['active', 'hidden', 'nsfw'] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const MODERATION_ACTIONS = ['restore', 'hide', 'nsfw'] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export const MODERATED_CONTENT_TYPES = ['image', 'video'] as const;
export type ModeratedContentType = (typeof MODERATED_CONTENT_TYPES)[number];

export type ModerationFilter = ModerationStatus | 'all';

export interface ModerationRequest {
  contentType: ModeratedContentType;
  contentId: string;
  action: ModerationAction;
}

function isOneOf<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

export function normalizeModerationStatus(value: unknown): ModerationStatus {
  return isOneOf(value, MODERATION_STATUSES) ? value : 'active';
}

export function parseModerationFilter(value: string | null): ModerationFilter | null {
  if (!value) return null;
  if (value === 'all') return 'all';
  return isOneOf(value, MODERATION_STATUSES) ? value : null;
}

export function parseModerationRequest(input: unknown): ModerationRequest {
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const contentType = body.content_type;
  const contentId = body.content_id;
  const action = body.action;

  if (!isOneOf(contentType, MODERATED_CONTENT_TYPES)) {
    throw Object.assign(new Error('content_type must be image or video'), { status: 400 });
  }

  if (typeof contentId !== 'string' || contentId.trim().length === 0) {
    throw Object.assign(new Error('content_id is required'), { status: 400 });
  }

  if (!isOneOf(action, MODERATION_ACTIONS)) {
    throw Object.assign(new Error('action must be restore, hide, or nsfw'), { status: 400 });
  }

  return { contentType, contentId: contentId.trim(), action };
}

export function actionToModerationStatus(action: ModerationAction): ModerationStatus {
  if (action === 'restore') return 'active';
  if (action === 'hide') return 'hidden';
  return 'nsfw';
}

export function getPublicModerationStatuses(filter: ModerationFilter | null): ModerationStatus[] {
  if (filter === 'all') return ['active', 'hidden', 'nsfw'];
  if (filter) return [filter];
  return ['active', 'nsfw'];
}

export function maskModeratedMedia<T extends Record<string, unknown>, K extends keyof T>(
  item: T,
  mediaKey: K,
): T {
  if (normalizeModerationStatus(item.moderation_status) !== 'nsfw') {
    return item;
  }

  return { ...item, [mediaKey]: null } as T;
}

export function isAdminRole(role: unknown) {
  return role === 'admin';
}

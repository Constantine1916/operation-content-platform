import type { ModeratedContentType, ModerationAction, ModerationStatus } from '@/lib/moderation';

const ACTIONS: Array<{ action: ModerationAction; label: string; confirmText: string }> = [
  { action: 'restore', label: '恢复', confirmText: '确认恢复这条内容为正常展示？' },
  { action: 'hide', label: '隐藏', confirmText: '确认从社区隐藏这条内容？作者仍可在个人中心看到原内容。' },
  { action: 'nsfw', label: '标记 NSFW', confirmText: '确认将这条内容替换为 NSFW 占位？原媒体不会公开展示。' },
];

export default function AdminModerationActions({
  contentType,
  contentId,
  status,
  pending,
  onModerate,
}: {
  contentType: ModeratedContentType;
  contentId: string;
  status?: ModerationStatus;
  pending?: boolean;
  onModerate: (input: { contentType: ModeratedContentType; contentId: string; action: ModerationAction }) => Promise<void> | void;
}) {
  return (
    <div className="grid gap-2">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
        当前审核状态：<span className="font-semibold">{status ?? 'active'}</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {ACTIONS.map(item => (
          <button
            key={item.action}
            type="button"
            disabled={pending || (item.action === 'restore' && status === 'active')}
            onClick={() => {
              if (!window.confirm(item.confirmText)) return;
              void onModerate({ contentType, contentId, action: item.action });
            }}
            className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

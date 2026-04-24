'use client';

import { useState } from 'react';
import { Button, Modal } from 'antd';
import type { ModeratedContentType, ModerationAction, ModerationStatus } from '@/lib/moderation';

const ACTIONS: Array<{ action: ModerationAction; label: string; danger?: boolean }> = [
  { action: 'hide', label: '隐藏' },
  { action: 'nsfw', label: '删除', danger: true },
];

export default function AdminModerationActions({
  contentType,
  contentId,
  status,
  pending,
  onModerate,
  className = '',
}: {
  contentType: ModeratedContentType;
  contentId: string;
  status?: ModerationStatus;
  pending?: boolean;
  onModerate: (input: { contentType: ModeratedContentType; contentId: string; action: ModerationAction }) => Promise<boolean | void> | boolean | void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  async function handleModerate(action: ModerationAction) {
    const result = await onModerate({ contentType, contentId, action });
    if (result !== false) setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={`rounded-lg bg-black/45 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/65 ${className}`}
      >
        管理
      </button>

      <Modal
        title="内容管理"
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        centered
        destroyOnHidden
      >
        <div className="space-y-3 pt-2" onClick={event => event.stopPropagation()}>
          <p className="text-sm leading-6 text-gray-500">
            当前状态：<span className="font-medium text-gray-900">{status ?? 'active'}</span>
          </p>
          {ACTIONS.map(item => (
            <Button
              key={item.action}
              block
              danger={item.danger}
              loading={pending}
              disabled={pending || status === (item.action === 'hide' ? 'hidden' : 'nsfw')}
              onClick={(event) => {
                event.stopPropagation();
                void handleModerate(item.action);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </Modal>
    </>
  );
}

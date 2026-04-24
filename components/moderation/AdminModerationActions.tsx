'use client';

import { useState } from 'react';
import { Button, Modal } from 'antd';
import type { ModeratedContentType, ModerationAction, ModerationStatus } from '@/lib/moderation';

const ACTIONS: Array<{
  action: ModerationAction;
  label: string;
  eyebrow: string;
  description: string;
  danger?: boolean;
}> = [
  {
    action: 'hide',
    label: '隐藏',
    eyebrow: '从社区隐藏',
    description: '这条内容会从 AI 图片/视频社区移除，作者资产仍可见。',
  },
  {
    action: 'nsfw',
    label: '删除',
    eyebrow: '替换为 NSFW 占位',
    description: '不物理删除记录，公开展示时只保留 NSFW 占位。',
    danger: true,
  },
];

const STATUS_LABELS: Record<ModerationStatus, string> = {
  active: '正常展示',
  hidden: '已隐藏',
  nsfw: 'NSFW',
};

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

  const normalizedStatus = status ?? 'active';

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={`rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_28px_-18px_rgba(0,0,0,0.75)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-black/70 hover:shadow-[0_16px_34px_-18px_rgba(0,0,0,0.85)] ${className}`}
      >
        管理
      </button>

      <Modal
        title={null}
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        centered
        destroyOnHidden
        width={420}
      >
        <div className="space-y-5 pt-1" onClick={event => event.stopPropagation()}>
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-gray-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
              Admin
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-gray-950">管理内容</h3>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                选择审核动作后会立即应用到这条内容。
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
              当前状态
              <span className="font-semibold text-gray-950">{STATUS_LABELS[normalizedStatus]}</span>
            </div>
          </div>

          <div className="grid gap-3">
          {ACTIONS.map(item => (
            <div
              key={item.action}
              className={`rounded-2xl border p-4 ${
                item.danger ? 'border-red-100 bg-red-50/70' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="mb-3">
                <p className={`text-sm font-semibold ${item.danger ? 'text-red-700' : 'text-gray-950'}`}>
                  {item.eyebrow}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{item.description}</p>
              </div>
              <Button
                block
                danger={item.danger}
                type={item.danger ? 'primary' : 'default'}
                loading={pending}
                disabled={pending || normalizedStatus === (item.action === 'hide' ? 'hidden' : 'nsfw')}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleModerate(item.action);
                }}
              >
                {item.label}
              </Button>
            </div>
          ))}
          </div>
        </div>
      </Modal>
    </>
  );
}

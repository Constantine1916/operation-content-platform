// app/profile/[username]/ProfileTabs.tsx
'use client';

import { useState } from 'react';
import ImageGrid, { ProfileImage } from './ImageGrid';

interface ProfileTabsProps {
  initialImages: ProfileImage[];
  hasMore: boolean;
  userId: string;
  totalImages: number;
}

const TABS = [
  { key: 'images', label: 'AI 图片' },
  { key: 'videos', label: '视频' },
  { key: 'courses', label: '课程' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function ProfileTabs({ initialImages, hasMore, userId, totalImages }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('images');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-100 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {tab.key === 'images' && totalImages > 0 && (
              <span className="ml-1.5 text-xs text-gray-400 tabular-nums">{totalImages}</span>
            )}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'images' && (
        <ImageGrid initialImages={initialImages} hasMore={hasMore} userId={userId} />
      )}
      {activeTab === 'videos' && (
        <EmptyState text="暂无视频" />
      )}
      {activeTab === 'courses' && (
        <EmptyState text="暂无课程" />
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-20 text-gray-400 text-sm">{text}</div>
  );
}

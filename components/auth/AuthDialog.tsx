'use client';

import { useEffect } from 'react';
import type { AuthModalTab } from '@/lib/route-access';
import type { ResumeAuthAction } from './AuthModalProvider';
import AuthForms from './AuthForms';

interface AuthDialogProps {
  isOpen: boolean;
  activeTab: AuthModalTab;
  redirectTo: string | null;
  resumeAction: ResumeAuthAction;
  onClose: () => void;
  onTabChange: (tab: AuthModalTab) => void;
}

export default function AuthDialog({
  isOpen,
  activeTab,
  redirectTo,
  resumeAction,
  onClose,
  onTabChange,
}: AuthDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-6 pb-5 pt-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                AI树洞
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-950">
                {activeTab === 'login' ? '登录您的账户' : '创建您的账户'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
              aria-label="关闭登录弹窗"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => onTabChange('login')}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'bg-white text-gray-950 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => onTabChange('register')}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'bg-white text-gray-950 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              注册
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
          <AuthForms
            activeTab={activeTab}
            redirectTo={redirectTo}
            resumeAction={resumeAction}
            onClose={onClose}
            onTabChange={onTabChange}
          />
        </div>
      </div>
    </div>
  );
}

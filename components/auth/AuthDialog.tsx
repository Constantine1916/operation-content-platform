'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { AuthModalTab } from '@/lib/route-access';
import type { ResumeAuthAction } from './AuthModalProvider';
import AuthForms from './AuthForms';

const AUTH_DIALOG_EXIT_MS = 220;

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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }

    if (!shouldRender) {
      setIsBusy(false);
      return;
    }

    setIsClosing(true);
    const closeTimer = window.setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
      setIsBusy(false);
    }, AUTH_DIALOG_EXIT_MS);

    return () => {
      window.clearTimeout(closeTimer);
    };
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isBusy && !isClosing) {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => {
      if (isOpen) {
        closeButtonRef.current?.focus();
      }
    });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBusy, isClosing, isOpen, onClose, shouldRender]);

  useEffect(() => {
    if (!shouldRender) {
      setIsBusy(false);
    }
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`auth-dialog-overlay fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),rgba(17,17,17,0.72))] px-4 py-4 backdrop-blur-xl sm:items-center sm:py-8 ${
        isClosing ? 'auth-dialog-overlay-exit' : 'auth-dialog-overlay-enter'
      }`}
      onClick={isBusy || isClosing ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className={`auth-dialog-panel relative flex max-h-[min(90svh,44rem)] w-full max-w-[30rem] flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,248,247,0.98))] shadow-[0_50px_140px_-56px_rgba(15,23,42,0.65)] ${
          isClosing ? 'auth-dialog-panel-exit' : 'auth-dialog-panel-enter'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(17,17,17,0.08),rgba(255,255,255,0)_68%)]" />
        <div className="pointer-events-none absolute inset-x-10 bottom-0 h-24 rounded-full bg-black/[0.035] blur-3xl" />

        <div className="relative shrink-0 border-b border-black/6 px-6 pb-5 pt-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full border border-black/8 bg-white/80 px-3 py-1 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
                <Image
                  src="/assets/logo.png"
                  alt="AI树洞"
                  width={155}
                  height={60}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
                {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
              </p>
              <h2 id="auth-dialog-title" className="mt-2 text-[1.95rem] font-semibold tracking-[-0.03em] text-gray-950">
                {activeTab === 'login' ? '登录后继续浏览' : '注册后开始使用'}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                继续登录后即可同步收藏、下载与个人中心。
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              disabled={isBusy || isClosing}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white/80 text-gray-500 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.55)] transition-all duration-200 hover:-translate-y-px hover:border-black/15 hover:text-gray-900 disabled:translate-y-0 disabled:opacity-50"
              aria-label={activeTab === 'register' ? '关闭注册弹窗' : '关闭登录弹窗'}
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-2 rounded-[1.15rem] border border-black/6 bg-black/[0.04] p-1.5">
            <div
              aria-hidden="true"
              className={`absolute bottom-1.5 left-1.5 top-1.5 w-[calc(50%-0.375rem)] rounded-[0.95rem] bg-white shadow-[0_16px_34px_-26px_rgba(15,23,42,0.45)] transition-transform duration-300 ease-out ${
                activeTab === 'login' ? 'translate-x-0' : 'translate-x-full'
              }`}
            />
            <button
              type="button"
              aria-pressed={activeTab === 'login'}
              disabled={isBusy || isClosing}
              onClick={() => onTabChange('login')}
              className={`relative z-10 rounded-[0.95rem] px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'login'
                  ? 'text-gray-950'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'register'}
              disabled={isBusy || isClosing}
              onClick={() => onTabChange('register')}
              className={`relative z-10 rounded-[0.95rem] px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'register'
                  ? 'text-gray-950'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              注册
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
          <div key={activeTab} className="auth-dialog-form-enter">
            <AuthForms
              activeTab={activeTab}
              redirectTo={redirectTo}
              resumeAction={resumeAction}
              onClose={onClose}
              onBusyChange={setIsBusy}
              onTabChange={onTabChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

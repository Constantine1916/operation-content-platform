'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthModalTab } from '@/lib/route-access';
import AuthDialog from './AuthDialog';

export type ResumeAuthAction = (() => void | Promise<void>) | null;

interface AuthModalOpenOptions {
  defaultTab?: AuthModalTab;
  redirectTo?: string | null;
  resumeAction?: ResumeAuthAction;
}

interface AuthModalContextValue {
  isOpen: boolean;
  activeTab: AuthModalTab;
  redirectTo: string | null;
  resumeAction: ResumeAuthAction;
  openAuthModal: (options?: AuthModalOpenOptions) => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: AuthModalTab) => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }

  return context;
}

export default function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthModalTab>('login');
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [resumeAction, setResumeAction] = useState<ResumeAuthAction>(null);

  function openAuthModal(options: AuthModalOpenOptions = {}) {
    setActiveTab(options.defaultTab ?? 'login');
    setRedirectTo(options.redirectTo ?? null);
    setResumeAction(() => options.resumeAction ?? null);
    setIsOpen(true);
  }

  function closeAuthModal() {
    setIsOpen(false);
    setRedirectTo(null);
    setResumeAction(null);
  }

  function setAuthModalTab(tab: AuthModalTab) {
    setActiveTab(tab);
  }

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        activeTab,
        redirectTo,
        resumeAction,
        openAuthModal,
        closeAuthModal,
        setAuthModalTab,
      }}
    >
      {children}
      <AuthDialog
        isOpen={isOpen}
        activeTab={activeTab}
        redirectTo={redirectTo}
        resumeAction={resumeAction}
        onClose={closeAuthModal}
        onTabChange={setAuthModalTab}
      />
    </AuthModalContext.Provider>
  );
}

'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { AuthModalTab } from '@/lib/route-access';
import { useAuthModal } from './AuthModalProvider';

export default function AuthModalButton({
  children,
  className,
  defaultTab,
  redirectTo,
  type = 'button',
}: {
  children: ReactNode;
  className?: string;
  defaultTab: AuthModalTab;
  redirectTo?: string | null;
  type?: 'button' | 'submit' | 'reset';
}) {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();

  return (
    <button
      type={type}
      className={className}
      onClick={() => openAuthModal({
        defaultTab,
        redirectTo: redirectTo ?? pathname,
      })}
    >
      {children}
    </button>
  );
}

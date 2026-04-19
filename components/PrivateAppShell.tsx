'use client';

import AuthLayout from '@/components/AuthLayout';

export default function PrivateAppShell({ children }: { children: React.ReactNode }) {
  return <AuthLayout access="private">{children}</AuthLayout>;
}

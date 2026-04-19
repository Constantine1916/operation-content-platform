import { Suspense } from 'react';
import AuthRouteLauncher from '@/components/auth/AuthRouteLauncher';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthRouteLauncher defaultTab="login" />
    </Suspense>
  );
}

import { Suspense } from 'react';
import AuthRouteLauncher from '@/components/auth/AuthRouteLauncher';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthRouteLauncher defaultTab="register" />
    </Suspense>
  );
}

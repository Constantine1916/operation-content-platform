'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  getFriendlyRegisterErrorMessage,
  isExistingEmailSignUpResult,
} from '@/lib/register-auth-errors';
import type { AuthModalTab } from '@/lib/route-access';
import type { ResumeAuthAction } from './AuthModalProvider';
import { completePostAuthSuccess } from './auth-route-launcher-utils';

const USERNAME_RE = /^[\w.-]{2,30}$/;

interface AuthFormsProps {
  activeTab: AuthModalTab;
  redirectTo: string | null;
  resumeAction: ResumeAuthAction;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
  onTabChange: (tab: AuthModalTab) => void;
}

interface SharedFormProps {
  redirectTo: string | null;
  resumeAction: ResumeAuthAction;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
  onTabChange: (tab: AuthModalTab) => void;
}

const INPUT_CLASSNAME =
  'w-full rounded-2xl border border-black/8 bg-black/[0.02] px-4 py-3.5 text-[15px] text-gray-950 outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 placeholder:text-gray-400 focus:border-black/20 focus:bg-white focus:shadow-[0_0_0_4px_rgba(17,17,17,0.08)]';
const PRIMARY_BUTTON_CLASSNAME =
  'relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gray-950 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_22px_48px_-28px_rgba(17,17,17,0.52)] transition-all duration-200 hover:-translate-y-px hover:bg-black disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50';

export default function AuthForms({
  activeTab,
  redirectTo,
  resumeAction,
  onClose,
  onBusyChange,
  onTabChange,
}: AuthFormsProps) {
  if (activeTab === 'register') {
    return (
      <RegisterForm
        redirectTo={redirectTo}
        resumeAction={resumeAction}
        onClose={onClose}
        onBusyChange={onBusyChange}
        onTabChange={onTabChange}
      />
    );
  }

  return (
    <LoginForm
      redirectTo={redirectTo}
      resumeAction={resumeAction}
      onClose={onClose}
      onBusyChange={onBusyChange}
      onTabChange={onTabChange}
    />
  );
}

function LoginForm({ redirectTo, resumeAction, onClose, onBusyChange, onTabChange }: SharedFormProps) {
  const router = useRouter();
  const requestTokenRef = useRef(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      requestTokenRef.current += 1;
      onBusyChange(false);
    };
  }, [onBusyChange]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const requestToken = requestTokenRef.current + 1;
    requestTokenRef.current = requestToken;
    onBusyChange(true);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (requestTokenRef.current !== requestToken) {
        return;
      }

      if (signInError) {
        setError(signInError.message);
        return;
      }

      await completePostAuthSuccess({
        redirectTo,
        resumeAction,
        onClose,
        push: (target) => router.push(target),
        refresh: () => router.refresh(),
      });
    } catch (err: any) {
      if (requestTokenRef.current !== requestToken) {
        return;
      }

      setError(err.message || '登录失败');
    } finally {
      if (requestTokenRef.current === requestToken) {
        setLoading(false);
        onBusyChange(false);
      }
    }
  }

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="auth-login-email" className="mb-2 block text-sm font-medium tracking-[-0.01em] text-gray-900">
            邮箱
          </label>
          <input
            id="auth-login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASSNAME}
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="auth-login-password" className="mb-2 block text-sm font-medium tracking-[-0.01em] text-gray-900">
            密码
          </label>
          <input
            id="auth-login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT_CLASSNAME}
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASSNAME}>
          <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/35" />
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        还没有账户？{' '}
        <button
          type="button"
          onClick={() => onTabChange('register')}
          className="font-medium text-gray-900 underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          注册
        </button>
      </p>
    </>
  );
}

function RegisterForm({ redirectTo, resumeAction, onClose, onBusyChange, onTabChange }: SharedFormProps) {
  const router = useRouter();
  const requestTokenRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    return () => {
      requestTokenRef.current += 1;
      onBusyChange(false);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [onBusyChange]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!USERNAME_RE.test(username)) {
      setError('用户名需 2-30 个字符，只能包含字母、数字、下划线、点和连字符');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    const requestToken = requestTokenRef.current + 1;
    requestTokenRef.current = requestToken;
    onBusyChange(true);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (requestTokenRef.current !== requestToken) {
        return;
      }

      if (signUpError) {
        setError(getFriendlyRegisterErrorMessage(signUpError));
        return;
      }

      if (!data.user) {
        setError('注册失败，请重试');
        return;
      }

      if (isExistingEmailSignUpResult(data.user, data.session)) {
        setError('该邮箱已注册，请直接登录，或使用找回密码继续。');
        return;
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, email, username }),
      });
      const result = await response.json();

      if (requestTokenRef.current !== requestToken) {
        return;
      }

      if (!result.success) {
        setError(result.error || '用户名保存失败');
        return;
      }

      if (data.session) {
        await completePostAuthSuccess({
          redirectTo,
          resumeAction,
          onClose,
          push: (target) => router.push(target),
          refresh: () => router.refresh(),
        });
        return;
      }

      setSuccess('注册成功！请前往邮箱验证链接（如果已配置邮件），或直接登录');

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setSuccess('');
        onTabChange('login');
      }, 2000);
    } catch (err: any) {
      if (requestTokenRef.current !== requestToken) {
        return;
      }

      setError(getFriendlyRegisterErrorMessage(err));
    } finally {
      if (requestTokenRef.current === requestToken) {
        setLoading(false);
        onBusyChange(false);
      }
    }
  }

  return (
    <>
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label htmlFor="auth-register-email" className="mb-2 block text-sm font-medium tracking-[-0.01em] text-gray-900">
            邮箱
          </label>
          <input
            id="auth-register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASSNAME}
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="auth-register-username" className="mb-2 block text-sm font-medium tracking-[-0.01em] text-gray-900">
            用户名
          </label>
          <input
            id="auth-register-username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className={INPUT_CLASSNAME}
            placeholder="2-30个字符，字母数字下划线"
            maxLength={30}
            required
          />
        </div>

        <div>
          <label htmlFor="auth-register-password" className="mb-2 block text-sm font-medium tracking-[-0.01em] text-gray-900">
            密码
          </label>
          <input
            id="auth-register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT_CLASSNAME}
            placeholder="至少6位"
            required
          />
        </div>

        <div>
          <label
            htmlFor="auth-register-confirm-password"
            className="mb-2 block text-sm font-medium tracking-[-0.01em] text-gray-900"
          >
            确认密码
          </label>
          <input
            id="auth-register-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={INPUT_CLASSNAME}
            placeholder="再次输入密码"
            required
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-center text-sm text-emerald-600">
            {success}
          </div>
        )}

        <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASSNAME}>
          <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/35" />
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        已有账户？{' '}
        <button
          type="button"
          onClick={() => onTabChange('login')}
          className="font-medium text-gray-900 underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          登录
        </button>
      </p>
    </>
  );
}

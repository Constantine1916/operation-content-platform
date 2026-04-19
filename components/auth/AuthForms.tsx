'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { AuthModalTab } from '@/lib/route-access';
import type { ResumeAuthAction } from './AuthModalProvider';

const USERNAME_RE = /^[\w.-]{2,30}$/;

interface AuthFormsProps {
  activeTab: AuthModalTab;
  redirectTo: string | null;
  resumeAction: ResumeAuthAction;
  onClose: () => void;
  onTabChange: (tab: AuthModalTab) => void;
}

interface SharedFormProps {
  redirectTo: string | null;
  resumeAction: ResumeAuthAction;
  onClose: () => void;
  onTabChange: (tab: AuthModalTab) => void;
}

const INPUT_CLASSNAME =
  'w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-gray-900';
const PRIMARY_BUTTON_CLASSNAME =
  'w-full rounded-lg bg-gray-900 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50';

export default function AuthForms({
  activeTab,
  redirectTo,
  resumeAction,
  onClose,
  onTabChange,
}: AuthFormsProps) {
  if (activeTab === 'register') {
    return (
      <RegisterForm
        redirectTo={redirectTo}
        resumeAction={resumeAction}
        onClose={onClose}
        onTabChange={onTabChange}
      />
    );
  }

  return (
    <LoginForm
      redirectTo={redirectTo}
      resumeAction={resumeAction}
      onClose={onClose}
      onTabChange={onTabChange}
    />
  );
}

function LoginForm({ redirectTo, resumeAction, onClose, onTabChange }: SharedFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      onClose();

      if (resumeAction) {
        try {
          await resumeAction();
        } catch {}
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else if (!resumeAction) {
        router.push('/overview');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="auth-login-email" className="mb-2 block text-sm font-medium text-gray-900">
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
          <label htmlFor="auth-login-password" className="mb-2 block text-sm font-medium text-gray-900">
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
          <div className="rounded-lg bg-red-50 py-2 text-center text-sm text-red-500">{error}</div>
        )}

        <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASSNAME}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        还没有账户？{' '}
        <button
          type="button"
          onClick={() => onTabChange('register')}
          className="font-medium text-gray-900 underline underline-offset-2"
        >
          注册
        </button>
      </p>
    </>
  );
}

function RegisterForm({ onTabChange }: SharedFormProps) {
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
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError('注册失败，请重试');
        return;
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, email, username }),
      });
      const result = await response.json();

      if (!result.success) {
        setError(result.error || '用户名保存失败');
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
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleRegister} className="space-y-6">
        <div>
          <label htmlFor="auth-register-email" className="mb-2 block text-sm font-medium text-gray-900">
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
          <label htmlFor="auth-register-username" className="mb-2 block text-sm font-medium text-gray-900">
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
          <label htmlFor="auth-register-password" className="mb-2 block text-sm font-medium text-gray-900">
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
            className="mb-2 block text-sm font-medium text-gray-900"
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
          <div className="rounded-lg bg-red-50 py-2 text-center text-sm text-red-500">{error}</div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 py-2 text-center text-sm text-green-500">
            {success}
          </div>
        )}

        <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASSNAME}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        已有账户？{' '}
        <button
          type="button"
          onClick={() => onTabChange('login')}
          className="font-medium text-gray-900 underline underline-offset-2"
        >
          登录
        </button>
      </p>
    </>
  );
}

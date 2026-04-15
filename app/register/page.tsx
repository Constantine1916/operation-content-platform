'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const USERNAME_RE = /^[\w.-]{2,30}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Save username — use the session token if available (no email confirmation),
      // otherwise fall back to the service-role API route which accepts user_id directly.
      const token = data.session?.access_token;
      if (token) {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
        });
      } else if (data.user) {
        // Email confirmation required — profile row may not exist yet.
        // Username will be saved when the user logs in for the first time.
        // Store it in sessionStorage so the post-login flow can pick it up.
        sessionStorage.setItem('pending_username', username);
      }

      setSuccess('注册成功！请前往邮箱验证链接（如果已配置邮件），或直接登录');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">AI树洞</h1>
          <p className="gray-700">创建您的账户</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-lg font-medium black mb-2">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-lg font-medium black mb-2">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                placeholder="2-30个字符，字母数字下划线"
                maxLength={30}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-lg font-medium black mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                placeholder="至少6位"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-lg font-medium black mb-2">
                确认密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                placeholder="再次输入密码"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-lg text-center bg-red-50 py-2 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-500 text-lg text-center bg-green-50 py-2 rounded-lg">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>
          
          {/* Login Link */}
          <p className="text-center text-gray-900 text-lg mt-6">
            已有账户？{' '}
            <a href="/login" className="text-gray-600 underline hover:text-gray-900">
              登录
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-900 text-lg mt-8">
          © 2026 AI树洞. All rights reserved.
        </p>
      </div>
    </div>
  );
}

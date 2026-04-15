'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 编辑字段
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const token = session.access_token;
    const res = await fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success && data.data) {
      setProfile(data.data);
      setUsername(data.data.username || '');
      setFullName(data.data.full_name || '');
      setBio(data.data.bio || '');
      setAvatarUrl(data.data.avatar_url || '');
    }
    setLoading(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setAvatarUrl(data.url);
        // 同时更新 profile
        const updateRes = await fetch('/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ avatar_url: data.url }),
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          setProfile(prev => prev ? { ...prev, avatar_url: data.url } : null);
          setMessage({ type: 'success', text: '头像上传成功' });
          try { localStorage.setItem('xhs_profile', JSON.stringify({ username, avatar_url: data.url })); } catch {}
        } else {
          setMessage({ type: 'error', text: data.error || '上传失败' });
        }
      }
    } catch {
      setMessage({ type: 'error', text: '上传失败，请重试' });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (username && !/^[\w.-]{2,30}$/.test(username)) {
      setMessage({ type: 'error', text: '用户名需 2-30 个字符，只能包含字母、数字、下划线、点和连字符' });
      setSaving(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ username: username || null, full_name: fullName || null, bio: bio || null }),
      });

      const data = await res.json();
      if (data.success) {
        setProfile(prev => prev ? { ...prev, username, full_name: fullName, bio } : null);
        setMessage({ type: 'success', text: '保存成功' });
        try { localStorage.setItem('xhs_profile', JSON.stringify({ username, avatar_url: avatarUrl })); } catch {}
      } else {
        setMessage({ type: 'error', text: data.error || '保存失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-normal text-gray-900">个人资料</h1>
          <p className="text-lg text-gray-900">{profile?.email}</p>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 tracking-widest uppercase">头像</h2>
        <div className="flex items-center gap-6">
          {/* 头像预览 */}
          <div
            className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingAvatar ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
            ) : avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-400">
                {username ? username.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {uploadingAvatar ? '上传中...' : '上传新头像'}
            </button>
            <p className="text-sm text-gray-900 mt-2">支持 JPG/PNG/WebP/GIF，不超过 2MB</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 tracking-widest uppercase">基本信息</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-gray-900 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="设置用户名（2-30字符）"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-900 mb-1">姓名</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="真实姓名（可选）"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-900 mb-1">邮箱</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 cursor-not-allowed"
            />
            <p className="text-sm text-gray-900 mt-1">邮箱不可修改</p>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-900 mb-1">简介</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="个人简介（可选）"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {message && (
            <div className={`text-lg text-center py-2 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gray-900 text-white py-3 rounded-lg text-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </form>
      </div>
    </div>
  );
}

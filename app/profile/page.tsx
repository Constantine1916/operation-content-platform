'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import MyAssetsPanel from '@/components/profile/MyAssetsPanel';
import MyFavoritesPanel from '@/components/profile/MyFavoritesPanel';
import ProfileSettingsPanel from '@/components/profile/ProfileSettingsPanel';
import {
  PROFILE_CENTER_PRIMARY_TABS,
  type ProfileCenterPrimaryTab,
} from '@/components/profile/profile-center-tabs';

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
  const [activePrimaryTab, setActivePrimaryTab] = useState<ProfileCenterPrimaryTab>('assets');

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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Profile Center</div>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">个人中心</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理我的资产、我的收藏和个人资料
            </p>
          </div>
          <div className="text-sm text-gray-400">{profile?.email}</div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {PROFILE_CENTER_PRIMARY_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActivePrimaryTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activePrimaryTab === tab.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {profile && activePrimaryTab === 'assets' && (
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <MyAssetsPanel userId={profile.id} />
        </div>
      )}

      {activePrimaryTab === 'favorites' && (
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <MyFavoritesPanel />
        </div>
      )}

      {activePrimaryTab === 'settings' && (
        <ProfileSettingsPanel
          username={username}
          fullName={fullName}
          bio={bio}
          avatarUrl={avatarUrl}
          email={profile?.email || ''}
          uploadingAvatar={uploadingAvatar}
          saving={saving}
          message={message}
          fileInputRef={fileInputRef}
          onAvatarChange={handleAvatarChange}
          onAvatarClick={() => fileInputRef.current?.click()}
          onUsernameChange={setUsername}
          onFullNameChange={setFullName}
          onBioChange={setBio}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}

'use client';

interface ProfileSettingsPanelProps {
  username: string;
  fullName: string;
  bio: string;
  avatarUrl: string;
  email: string;
  uploadingAvatar: boolean;
  saving: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarClick: () => void;
  onUsernameChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export default function ProfileSettingsPanel({
  username,
  fullName,
  bio,
  avatarUrl,
  email,
  uploadingAvatar,
  saving,
  message,
  fileInputRef,
  onAvatarChange,
  onAvatarClick,
  onUsernameChange,
  onFullNameChange,
  onBioChange,
  onSubmit,
}: ProfileSettingsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-gray-900 tracking-widest uppercase">头像</h2>
        <div className="flex items-center gap-6">
          <div
            className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-100 transition-colors hover:border-gray-400"
            onClick={onAvatarClick}
          >
            {uploadingAvatar ? (
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-600" />
            ) : avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
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
              onChange={onAvatarChange}
            />
            <button
              type="button"
              onClick={onAvatarClick}
              disabled={uploadingAvatar}
              className="rounded-lg bg-gray-900 px-4 py-2 text-lg text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {uploadingAvatar ? '上传中...' : '上传新头像'}
            </button>
            <p className="mt-2 text-sm text-gray-900">支持 JPG/PNG/WebP/GIF，不超过 2MB</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-gray-900 tracking-widest uppercase">基本信息</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-lg font-medium text-gray-900">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => onUsernameChange(e.target.value)}
              placeholder="设置用户名（2-30字符）"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-gray-900"
              maxLength={30}
            />
          </div>

          <div>
            <label className="mb-1 block text-lg font-medium text-gray-900">姓名</label>
            <input
              type="text"
              value={fullName}
              onChange={e => onFullNameChange(e.target.value)}
              placeholder="真实姓名（可选）"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-lg font-medium text-gray-900">邮箱</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
            />
            <p className="mt-1 text-sm text-gray-900">邮箱不可修改</p>
          </div>

          <div>
            <label className="mb-1 block text-lg font-medium text-gray-900">简介</label>
            <textarea
              value={bio}
              onChange={e => onBioChange(e.target.value)}
              placeholder="个人简介（可选）"
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {message && (
            <div className={`rounded-lg py-2 text-center text-lg ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-gray-900 py-3 text-lg font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </form>
      </div>
    </div>
  );
}

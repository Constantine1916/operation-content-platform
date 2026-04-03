'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ImageResult {
  url: string;
  width: number;
  height: number;
  index: number;
}

interface TaskResult {
  prompt: string;
  task_id: string | null;
  images: ImageResult[];
  error?: string;
}

export default function GenerateImgPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [error, setError] = useState('');
  const tokenRef = useRef<string>('');

  // 路由拦截：检查登录 + SVIP
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      tokenRef.current = session.access_token;

      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!data.success || data.data?.vip_level < 2) {
        router.replace('/overview');
        return;
      }
      setChecking(false);
    });
  }, [router]);

  const addPrompt = () => setPrompts(p => [...p, '']);
  const removePrompt = (i: number) => setPrompts(p => p.filter((_, idx) => idx !== i));
  const updatePrompt = (i: number, val: string) =>
    setPrompts(p => p.map((v, idx) => (idx === i ? val : v)));

  const handleSubmit = async () => {
    const valid = prompts.map(p => p.trim()).filter(Boolean);
    if (valid.length === 0) { setError('请至少输入一个 Prompt'); return; }
    setError('');
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({ prompts: valid }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '生图失败'); return; }
      setResults(data.results ?? []);
    } catch (e: any) {
      setError(e.message ?? '网络错误');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">AI 生图</h1>
        <p className="text-xs text-gray-500 tracking-[0.15em] uppercase">Image Generation · SVIP</p>
      </div>

      {/* Prompt 输入区 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-900">Prompt 列表</span>
          <button
            onClick={addPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加 Prompt
          </button>
        </div>

        <div className="space-y-3">
          {prompts.map((prompt, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2.5 text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}</span>
              <textarea
                value={prompt}
                onChange={e => updatePrompt(i, e.target.value)}
                placeholder="输入生图 Prompt，支持中英文..."
                rows={3}
                className="flex-1 px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
              />
              {prompts.length > 1 && (
                <button
                  onClick={() => removePrompt(i)}
                  className="mt-2 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-gray-400">每个 Prompt 生成 4 张图，预计等待 30-90 秒</span>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                开始生图
              </>
            )}
          </button>
        </div>
      </div>

      {/* 生成中占位 */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">正在生成图片，请耐心等待...</p>
          <p className="text-xs text-gray-400 mt-1">已提交 {prompts.filter(p => p.trim()).length} 个任务</p>
        </div>
      )}

      {/* 结果展示 */}
      {results.length > 0 && (
        <div className="space-y-8">
          {results.map((result, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {/* Prompt 标题 */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">{result.prompt}</p>
                {result.error && (
                  <span className="flex-shrink-0 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
                    {result.error}
                  </span>
                )}
              </div>

              {/* 图片网格 */}
              {result.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
                  {result.images.map((img, j) => (
                    <a
                      key={j}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block aspect-[9/16] rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`生成图片 ${j + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <div className="absolute bottom-2 right-2 text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded-full">
                        {img.width}×{img.height}
                      </div>
                    </a>
                  ))}
                </div>
              ) : !result.error ? (
                <div className="p-8 text-center text-sm text-gray-400">暂无图片</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

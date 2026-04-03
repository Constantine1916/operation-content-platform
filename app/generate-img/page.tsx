'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ImageResult { url: string; width: number; height: number; index: number }

interface TaskState {
  prompt: string;
  task_id: string | null;
  status: number; // 0=未提交 1=排队 2=生成中 3=完成 4=失败
  process: number;
  images: ImageResult[];
  error?: string;
}

const STATUS_LABEL: Record<number, string> = {
  0: '等待提交',
  1: '排队中',
  2: '生成中',
  3: '完成',
  4: '失败',
};

export default function GenerateImgPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [tasks, setTasks] = useState<TaskState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');
  const tokenRef = useRef<string>('');
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, [router]);

  const addPrompt = () => setPrompts(p => [...p, '']);
  const removePrompt = (i: number) => setPrompts(p => p.filter((_, idx) => idx !== i));
  const updatePrompt = (i: number, val: string) =>
    setPrompts(p => p.map((v, idx) => (idx === i ? val : v)));

  // 轮询函数
  const startPolling = (initialTasks: TaskState[]) => {
    const pendingTasks = initialTasks.filter(t => t.task_id && t.status !== 3 && t.status !== 4);
    if (pendingTasks.length === 0) { setPolling(false); return; }

    setPolling(true);
    const doPoll = async (currentTasks: TaskState[]) => {
      const pendingIds = currentTasks
        .filter(t => t.task_id && t.status !== 3 && t.status !== 4)
        .map(t => t.task_id as string);

      if (pendingIds.length === 0) { setPolling(false); return; }

      try {
        const res = await fetch('/api/generate-image/poll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({ task_ids: pendingIds }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const updatedTasks = currentTasks.map(task => {
          if (!task.task_id) return task;
          const item = data.items?.find((i: any) => i.task_id === task.task_id);
          if (!item) return task;
          return {
            ...task,
            status: item.status,
            process: item.process,
            images: item.images?.length ? item.images : task.images,
          };
        });

        setTasks(updatedTasks);

        const stillPending = updatedTasks.filter(t => t.task_id && t.status !== 3 && t.status !== 4);
        if (stillPending.length > 0) {
          pollTimerRef.current = setTimeout(() => doPoll(updatedTasks), 3000);
        } else {
          setPolling(false);
        }
      } catch (e: any) {
        console.error('poll error:', e);
        pollTimerRef.current = setTimeout(() => doPoll(currentTasks), 5000);
      }
    };

    pollTimerRef.current = setTimeout(() => doPoll(initialTasks), 3000);
  };

  const handleSubmit = async () => {
    const valid = prompts.map(p => p.trim()).filter(Boolean);
    if (valid.length === 0) { setError('请至少输入一个 Prompt'); return; }
    setError('');
    setSubmitting(true);
    setTasks(valid.map(prompt => ({ prompt, task_id: null, status: 0, process: 0, images: [] })));
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

    try {
      const res = await fetch('/api/generate-image/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({ prompts: valid }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '提交失败'); setSubmitting(false); return; }

      const newTasks: TaskState[] = data.tasks.map((t: any) => ({
        prompt: t.prompt,
        task_id: t.task_id,
        status: t.error ? 4 : 1,
        process: 0,
        images: [],
        error: t.error,
      }));
      setTasks(newTasks);
      setSubmitting(false);
      startPolling(newTasks);
    } catch (e: any) {
      setError(e.message ?? '网络错误');
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const isRunning = submitting || polling;
  const completedCount = tasks.filter(t => t.status === 3).length;
  const totalCount = tasks.filter(t => t.task_id).length;

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
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 transition-all"
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
                disabled={isRunning}
                placeholder="输入生图 Prompt..."
                rows={3}
                className="flex-1 px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors placeholder:text-gray-400"
              />
              {prompts.length > 1 && (
                <button
                  onClick={() => removePrompt(i)}
                  disabled={isRunning}
                  className="mt-2 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-all flex-shrink-0"
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
          <span className="text-xs text-gray-400">每个 Prompt 生成 4 张图</span>
          <button
            onClick={handleSubmit}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                提交中...
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

      {/* 进度总览 */}
      {tasks.length > 0 && polling && (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin flex-shrink-0" />
          <span className="text-sm text-gray-700">
            正在生成中... 已完成 <span className="font-semibold text-gray-900">{completedCount}</span> / {totalCount} 个任务
          </span>
        </div>
      )}

      {/* 任务结果列表 */}
      {tasks.length > 0 && (
        <div className="space-y-6">
          {tasks.map((task, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {/* 任务标题行 */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed flex-1 line-clamp-2">{task.prompt}</p>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {/* 进度条（生成中显示） */}
                  {task.status === 2 && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all duration-500"
                          style={{ width: `${task.process}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{task.process}%</span>
                    </div>
                  )}
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                    task.status === 3 ? 'bg-green-50 text-green-700 border border-green-200' :
                    task.status === 4 ? 'bg-red-50 text-red-600 border border-red-200' :
                    task.status === 2 ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                    'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}>
                    {STATUS_LABEL[task.status] ?? '未知'}
                  </span>
                </div>
              </div>

              {/* 图片网格 */}
              {task.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
                  {task.images.map((img, j) => (
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
              ) : task.status === 1 || task.status === 2 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="aspect-[9/16] rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : task.error ? (
                <div className="px-5 py-6 text-sm text-red-500 text-center">{task.error}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

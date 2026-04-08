'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { readVipCache, refreshVipCache } from '@/lib/vip-cache';

interface ImageResult { url: string; width: number; height: number; index: number }

// 后台实际任务（一个 task_id 对应一次执行）
interface SubTask {
  task_id: string | null;
  status: number; // 1=排队 2=生成中 3=完成 4=失败
  process: number;
  images: ImageResult[];
  error?: string;
}

// 前端展示单元：一个 prompt 的所有执行合并为一个 PromptGroup
interface PromptGroup {
  prompt: string;
  subtasks: SubTask[];
  // 是否来自历史（历史的不计入本次进度）
  fromHistory: boolean;
  // 该组最新任务的创建时间（用于排序）
  latestAt: number;
}

const STATUS_LABEL: Record<number, string> = {
  0: '等待中',
  1: '排队中',
  2: '生成中',
  3: '完成',
  4: '失败',
};

function groupStatus(subtasks: SubTask[]): number {
  if (subtasks.every(t => t.status === 3)) return 3;
  if (subtasks.some(t => t.status === 4 && subtasks.every(t2 => t2.status === 3 || t2.status === 4))) return 4;
  if (subtasks.some(t => t.status === 2)) return 2;
  if (subtasks.some(t => t.status === 1)) return 1;
  return 0;
}

function groupProcess(subtasks: SubTask[]): number {
  if (subtasks.length === 0) return 0;
  return Math.round(subtasks.reduce((s, t) => s + (t.status === 3 ? 100 : t.process), 0) / subtasks.length);
}

export default function GenerateImgPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [counts, setCounts] = useState<number[]>([1]);
  const [groups, setGroups] = useState<PromptGroup[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');
  const tokenRef = useRef<string>('');
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 本次提交的 task_id 集合，用于进度统计
  const currentBatchIds = useRef<Set<string>>(new Set());

  // 加载历史任务（抽成独立函数，方便缓存命中时直接调用）
  async function loadHistory(token: string) {
    const histRes = await fetch('/api/generate-image/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const histData = await histRes.json();
    if (histData.success && histData.tasks?.length > 0) {
      const histGroups = buildGroupsFromHistory(histData.tasks);
      setGroups(histGroups);
      const pendingSubtasks = histGroups.flatMap(g => g.subtasks).filter(t => t.status !== 3 && t.status !== 4);
      if (pendingSubtasks.length > 0) startPolling(histGroups);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      const userId = session.user.id;
      const token = session.access_token;
      tokenRef.current = token;

      // 先读缓存，命中则立即展示页面，后台异步刷新
      const cached = readVipCache(userId);
      if (cached !== null) {
        if (cached < 2) { router.replace('/overview'); return; }
        setChecking(false);
        loadHistory(token);
        // 后台静默刷新缓存，SVIP 过期时下次进入会被拦截
        refreshVipCache(userId, token).then(fresh => {
          if (fresh !== null && fresh < 2) router.replace('/overview');
        });
        return;
      }

      // 无缓存：等待鉴权完成
      const fresh = await refreshVipCache(userId, token);
      if (fresh === null || fresh < 2) { router.replace('/overview'); return; }

      setChecking(false);
      loadHistory(token);
    });
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, [router]);

  // 历史任务：同 prompt 的合并成一组，组按最新任务时间降序排列
  function buildGroupsFromHistory(tasks: any[]): PromptGroup[] {
    const map = new Map<string, { subtasks: SubTask[]; latestAt: number }>();
    for (const t of tasks) {
      if (!map.has(t.prompt)) map.set(t.prompt, { subtasks: [], latestAt: 0 });
      const entry = map.get(t.prompt)!;
      entry.subtasks.push({
        task_id: t.task_id,
        status: t.status,
        process: t.process ?? 0,
        images: t.images ?? [],
        error: t.error,
      });
      const ts = t.created_at ? new Date(t.created_at).getTime() : 0;
      if (ts > entry.latestAt) entry.latestAt = ts;
    }
    return Array.from(map.entries())
      .map(([prompt, { subtasks, latestAt }]) => ({ prompt, subtasks, fromHistory: true, latestAt }))
      .sort((a, b) => b.latestAt - a.latestAt);
  }

  const addPrompt = () => { setPrompts(p => [...p, '']); setCounts(c => [...c, 1]); };
  const removePrompt = (i: number) => {
    setPrompts(p => p.filter((_, idx) => idx !== i));
    setCounts(c => c.filter((_, idx) => idx !== i));
  };
  const updatePrompt = (i: number, val: string) =>
    setPrompts(p => p.map((v, idx) => (idx === i ? val : v)));
  const updateCount = (i: number, val: number) =>
    setCounts(c => c.map((v, idx) => (idx === i ? val : v)));

  const csvInputRef = useRef<HTMLInputElement>(null);
  const handleCsvUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      // 解析 CSV：取第一列，跳过空行，自动识别有无表头
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      // 判断第一行是否是表头（常见表头词）
      const HEADER_WORDS = ['prompt', 'text', '提示词', '内容', '描述', 'description'];
      const firstCell = lines[0]!.split(',')[0]!.replace(/^"|"$/g, '').trim().toLowerCase();
      const hasHeader = HEADER_WORDS.some(w => firstCell.includes(w));
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const parsed = dataLines
        .map(line => {
          // 处理 CSV 引号转义
          const firstCol = line.match(/^"((?:[^"]|"")*)"|^([^,]*)/)?.[0] ?? '';
          return firstCol.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
        })
        .filter(Boolean);

      if (parsed.length === 0) return;
      setPrompts(parsed);
      setCounts(parsed.map(() => 1));
    };
    reader.readAsText(file, 'utf-8');
  };

  const startPolling = (currentGroups: PromptGroup[]) => {
    const pendingIds = currentGroups
      .flatMap(g => g.subtasks)
      .filter(t => t.task_id && t.status !== 3 && t.status !== 4)
      .map(t => t.task_id as string);
    // 有待提交(status=0)的任务也需要继续轮询（等补提）
    const hasQueued = currentGroups.flatMap(g => g.subtasks).some(t => t.status === 0);

    if (pendingIds.length === 0 && !hasQueued) { setPolling(false); return; }
    setPolling(true);

    const doPoll = async (gs: PromptGroup[]) => {
      const ids = gs.flatMap(g => g.subtasks)
        .filter(t => t.task_id && t.status !== 3 && t.status !== 4)
        .map(t => t.task_id as string);
      const stillHasQueued = gs.flatMap(g => g.subtasks).some(t => t.status === 0);

      if (ids.length === 0 && !stillHasQueued) { setPolling(false); return; }

      // 如果没有进行中的 task_id 但有排队中的，发一个空占位轮询触发补提
      const pollIds = ids.length > 0 ? ids : ['__queue_check__'];

      try {
        const res = await fetch('/api/generate-image/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
          body: JSON.stringify({ task_ids: pollIds }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // 更新已有 task_id 的任务状态
        let updated = gs.map(g => ({
          ...g,
          subtasks: g.subtasks.map(sub => {
            if (!sub.task_id) return sub;
            const item = data.items?.find((it: any) => it.task_id === sub.task_id);
            if (!item) return sub;
            return { ...sub, status: item.status, process: item.process, images: item.images?.length ? item.images : sub.images };
          }),
        }));

        // 把 promoted（刚从 status=0 升为 status=1 的）更新到对应 subtask
        if (data.promoted?.length > 0) {
          updated = updated.map(g => ({
            ...g,
            subtasks: g.subtasks.map(sub => {
              if (sub.status !== 0) return sub;
              const p = data.promoted.find((pr: any) => pr.prompt === g.prompt);
              if (!p) return sub;
              // 从 promoted 里找一个匹配此 prompt 且还没消耗的
              return { ...sub, task_id: p.task_id, status: 1 };
            }),
          }));
        }

        setGroups(updated);

        const stillPending = updated.flatMap(g => g.subtasks).filter(t => t.status !== 3 && t.status !== 4);
        if (stillPending.length > 0) {
          pollTimerRef.current = setTimeout(() => doPoll(updated), 3000);
        } else {
          setPolling(false);
        }
      } catch (e: any) {
        console.error('poll error:', e);
        pollTimerRef.current = setTimeout(() => doPoll(gs), 5000);
      }
    };

    pollTimerRef.current = setTimeout(() => doPoll(currentGroups), 3000);
  };

  const handleSubmit = async () => {
    const entries = prompts
      .map((p, i) => ({ prompt: p.trim(), count: counts[i] ?? 1 }))
      .filter(e => e.prompt);
    if (entries.length === 0) { setError('请至少输入一个 Prompt'); return; }
    setError('');
    setSubmitting(true);
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

    // 展开：每个 prompt 重复 count 次
    const expanded = entries.flatMap(e => Array.from({ length: e.count }, () => e.prompt));

    try {
      const res = await fetch('/api/generate-image/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ prompts: expanded }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '提交失败'); setSubmitting(false); return; }

      // 记录本次批次的所有 task_id
      currentBatchIds.current = new Set(
        data.tasks.filter((t: any) => t.task_id).map((t: any) => t.task_id)
      );

      // 按 prompt 聚合成 PromptGroup（同 prompt 的 subtasks 合在一起）
      const submitTime = Date.now();
      const newGroupMap = new Map<string, SubTask[]>();
      for (const t of data.tasks) {
        if (!newGroupMap.has(t.prompt)) newGroupMap.set(t.prompt, []);
        newGroupMap.get(t.prompt)!.push({
          task_id: t.task_id,
          status: t.queued ? 0 : t.error ? 4 : 1,
          process: 0,
          images: [],
          error: t.error,
        });
      }
      const newGroups: PromptGroup[] = Array.from(newGroupMap.entries()).map(([prompt, subtasks]) => ({
        prompt,
        subtasks,
        fromHistory: false,
        latestAt: submitTime,
      }));

      // 合并后按时间降序排列
      setGroups(prev => {
        const merged = [...newGroups, ...prev.map(g => ({ ...g, fromHistory: true }))];
        return merged.sort((a, b) => b.latestAt - a.latestAt);
      });
      setSubmitting(false);

      // 用新 groups + 现有历史一起轮询
      setGroups(current => {
        const merged = [...newGroups, ...current.filter(g => g.fromHistory)]
          .sort((a, b) => b.latestAt - a.latestAt);
        startPolling(merged);
        return merged;
      });
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

  // 只统计本次提交的任务进度
  const batchIds = currentBatchIds.current;
  const batchSubtasks = groups.flatMap(g => g.subtasks).filter(t => t.task_id && batchIds.has(t.task_id as string));
  const batchTotal = batchSubtasks.length;
  const batchDone = batchSubtasks.filter(t => t.status === 3 || t.status === 4).length;
  // status=0 的排队任务不在 batchIds 里（没有 task_id），单独统计
  const batchQueued = groups.filter(g => !g.fromHistory).flatMap(g => g.subtasks).filter(t => t.status === 0).length;

  const totalRuns = counts.reduce((s, c) => s + c, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">AI 生图</h1>
        <p className="text-xs text-gray-500 tracking-[0.15em] uppercase">Image Generation · SVIP</p>
      </div>

      {/* Prompt 输入区 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-900">Prompt 列表</span>
          <div className="flex items-center gap-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvUpload(f); e.target.value = ''; }}
            />
            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={submitting || polling}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              导入 CSV
            </button>
            <button
              onClick={addPrompt}
              disabled={submitting || polling}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加 Prompt
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {prompts.map((prompt, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2.5 text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}</span>
              <textarea
                value={prompt}
                onChange={e => updatePrompt(i, e.target.value)}
                disabled={submitting || polling}
                placeholder="输入生图 Prompt..."
                rows={3}
                className="flex-1 px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors placeholder:text-gray-400"
              />
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span className="text-[10px] text-gray-400">次数</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={counts[i] ?? 1}
                  onChange={e => {
                    const v = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                    updateCount(i, v);
                  }}
                  disabled={submitting || polling}
                  className="w-14 px-2 py-1.5 text-sm text-center text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                />
              </div>
              {prompts.length > 1 && (
                <button
                  onClick={() => removePrompt(i)}
                  disabled={submitting || polling}
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
          <span className="text-xs text-gray-400">
            共 {totalRuns} 次任务，每次生成 4 张图
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting || polling}
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

      {/* 本次批次进度 */}
      {polling && (batchTotal > 0 || batchQueued > 0) && batchDone < batchTotal + batchQueued && (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin flex-shrink-0" />
          <span className="text-sm text-gray-700">
            本次任务进度：已完成 <span className="font-semibold text-gray-900">{batchDone}</span> / <span className="font-semibold text-gray-900">{batchTotal + batchQueued}</span> 次
            {batchQueued > 0 && <span className="text-gray-400 ml-2">（{batchQueued} 个等待提交）</span>}
          </span>
        </div>
      )}

      {/* 任务结果列表（每个 PromptGroup 一张卡） */}
      {groups.length > 0 && (
        <div className="space-y-6">
          {groups.map((group, gi) => {
            const status = groupStatus(group.subtasks);
            const process = groupProcess(group.subtasks);
            // 所有子任务的图片拼在一起，按子任务顺序分排
            const allImages = group.subtasks.flatMap(st => st.images);
            const hasAnyImages = allImages.length > 0;
            const isPending = status === 1 || status === 2;

            return (
              <div key={gi} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {/* 标题行 */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">
                    {gi + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1 line-clamp-2">{group.prompt}</p>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {group.subtasks.length > 1 && (
                      <span className="text-[10px] text-gray-400">×{group.subtasks.length}</span>
                    )}
                    {status === 2 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-900 rounded-full transition-all duration-500"
                            style={{ width: `${process}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{process}%</span>
                      </div>
                    )}
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                      status === 3 ? 'bg-green-50 text-green-700 border border-green-200' :
                      status === 4 ? 'bg-red-50 text-red-600 border border-red-200' :
                      status === 2 ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                      status === 0 ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' :
                      'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {STATUS_LABEL[status] ?? '未知'}
                    </span>
                  </div>
                </div>

                {/* 图片区：每个子任务一排（4张），未完成的子任务显示骨架屏 */}
                <div className="p-4 space-y-3">
                  {group.subtasks.map((sub, si) => (
                    <div key={si}>
                      {/* 多次时显示第几次 */}
                      {group.subtasks.length > 1 && (
                        <p className="text-[10px] text-gray-400 mb-1.5 ml-1">第 {si + 1} 次</p>
                      )}
                      {sub.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {sub.images.map((img, j) => (
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
                                alt={`第${si + 1}次 图片${j + 1}`}
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
                      ) : sub.status === 1 || sub.status === 2 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[1, 2, 3, 4].map(j => (
                            <div key={j} className="aspect-[9/16] rounded-xl bg-gray-100 animate-pulse" />
                          ))}
                        </div>
                      ) : sub.error ? (
                        <div className="py-3 text-xs text-red-500">{sub.error}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

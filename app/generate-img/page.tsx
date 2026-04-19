'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PrivateAppShell from '@/components/PrivateAppShell';
import { useAuthRequiredHandler } from '@/components/auth/useAuthRequiredHandler';
import { getAuthTabForPrivateRoute } from '@/lib/route-access';
import { readVipCache, refreshVipCache } from '@/lib/vip-cache';
import { App, Tooltip } from 'antd';

interface ImageResult { url: string; width: number; height: number; index: number; is_public?: boolean }

interface SubTask {
  task_id: string | null;
  status: number; // 0=排队等待 1=排队中 2=生成中 3=完成 4=失败
  process: number;
  images: ImageResult[];
  error?: string;
}

interface PromptGroup {
  prompt: string;
  subtasks: SubTask[];
  fromHistory: boolean;
  latestAt: number;
}

// 选中 key: `${task_id}::${image_index}`
type SelectedKey = string;

const STATUS_LABEL: Record<number, string> = {
  0: '等待中', 1: '排队中', 2: '生成中', 3: '完成', 4: '失败',
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

function GenerateImgPageInner() {
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
  const currentBatchIds = useRef<Set<string>>(new Set());

  // 全局管理模式（跨任务选图）
  const [isManaging, setIsManaging] = useState(false);
  const [selected, setSelected] = useState<Set<SelectedKey>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const handleAuthRequired = useAuthRequiredHandler({
    defaultTab: getAuthTabForPrivateRoute(),
    redirectTo: '/generate-img',
  });

  const handleRegenerate = (prompt: string) => {
    setPrompts([prompt]);
    setCounts([1]);
    promptSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const { modal } = App.useApp();

  // 所有有图片的任务数量
  const totalImagesCount = groups.flatMap(g => g.subtasks).flatMap(s => s.images).length;

  async function loadHistory(token: string) {
    const histRes = await fetch('/api/generate-image/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (await handleAuthRequired(histRes)) {
      return;
    }
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
      if (!session) {
        setChecking(false);
        return;
      }
      const userId = session.user.id;
      const token = session.access_token;
      tokenRef.current = token;

      const cached = readVipCache(userId);
      if (cached !== null) {
        if (cached < 2) { router.replace('/overview'); return; }
        setChecking(false);
        loadHistory(token);
        refreshVipCache(userId, token).then(fresh => {
          if (fresh !== null && fresh < 2) router.replace('/overview');
        });
        return;
      }

      const fresh = await refreshVipCache(userId, token);
      if (fresh === null || fresh < 2) { router.replace('/overview'); return; }
      setChecking(false);
      loadHistory(token);
    });
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, [handleAuthRequired, router]);

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
  const promptSectionRef = useRef<HTMLDivElement>(null);
  const handleCsvUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return;
      const HEADER_WORDS = ['prompt', 'text', '提示词', '内容', '描述', 'description'];
      const firstCell = lines[0]!.split(',')[0]!.replace(/^"|"$/g, '').trim().toLowerCase();
      const hasHeader = HEADER_WORDS.some(w => firstCell.includes(w));
      const dataLines = hasHeader ? lines.slice(1) : lines;
      const parsed = dataLines
        .map(line => {
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

  // 删除整个任务组（带二次确认）
  const handleDeleteGroup = (prompt: string) => {
    modal.confirm({
      title: '确认删除任务',
      content: '确定要删除该任务及其所有图片吗？此操作不可恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        setGroups(prev => prev.filter(g => g.prompt !== prompt));
        try {
          await fetch('/api/generate-image/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
            body: JSON.stringify({ prompt }),
          });
        } catch (e) {
          console.error('delete failed', e);
        }
      },
    });
  };

  const startPolling = (currentGroups: PromptGroup[]) => {
    const hasQueued = currentGroups.flatMap(g => g.subtasks).some(t => t.status === 0);
    const pendingIds = currentGroups
      .flatMap(g => g.subtasks)
      .filter(t => t.task_id && t.status !== 3 && t.status !== 4)
      .map(t => t.task_id as string);

    if (pendingIds.length === 0 && !hasQueued) { setPolling(false); return; }
    setPolling(true);

    const doPoll = async (gs: PromptGroup[]) => {
      const ids = gs.flatMap(g => g.subtasks)
        .filter(t => t.task_id && t.status !== 3 && t.status !== 4)
        .map(t => t.task_id as string);
      const stillHasQueued = gs.flatMap(g => g.subtasks).some(t => t.status === 0);
      if (ids.length === 0 && !stillHasQueued) { setPolling(false); return; }

      const pollIds = ids.length > 0 ? ids : ['__queue_check__'];
      try {
        const res = await fetch('/api/generate-image/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
          body: JSON.stringify({ task_ids: pollIds }),
        });
        if (await handleAuthRequired(res)) {
          setPolling(false);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        let updated = gs.map(g => ({
          ...g,
          subtasks: g.subtasks.map(sub => {
            if (!sub.task_id) return sub;
            const item = data.items?.find((it: any) => it.task_id === sub.task_id);
            if (!item) return sub;
            return { ...sub, status: item.status, process: item.process, images: item.images?.length ? item.images : sub.images };
          }),
        }));

        if (data.promoted?.length > 0) {
          updated = updated.map(g => ({
            ...g,
            subtasks: g.subtasks.map(sub => {
              if (sub.status !== 0) return sub;
              const p = data.promoted.find((pr: any) => pr.prompt === g.prompt);
              if (!p) return sub;
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

    const expanded = entries.flatMap(e => Array.from({ length: e.count }, () => e.prompt));

    try {
      const res = await fetch('/api/generate-image/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ prompts: expanded }),
      });
      if (await handleAuthRequired(res)) {
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '提交失败'); setSubmitting(false); return; }

      currentBatchIds.current = new Set(
        data.tasks.filter((t: any) => t.task_id).map((t: any) => t.task_id)
      );

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
        prompt, subtasks, fromHistory: false, latestAt: submitTime,
      }));

      setGroups(prev => {
        const merged = [...newGroups, ...prev.map(g => ({ ...g, fromHistory: true }))];
        return merged.sort((a, b) => b.latestAt - a.latestAt);
      });
      setSubmitting(false);

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

  // 管理模式
  const enterManage = () => { setIsManaging(true); setSelected(new Set()); };
  const exitManage = () => { setIsManaging(false); setSelected(new Set()); };

  const toggleSelect = (key: SelectedKey) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // 解析 selected → Map<task_id, number[]>
  const parseSelected = () => {
    const map = new Map<string, number[]>();
    for (const key of selected) {
      const idx = key.indexOf('::');
      if (idx === -1) continue;
      const task_id = key.slice(0, idx);
      const imgIdx = parseInt(key.slice(idx + 2));
      if (!map.has(task_id)) map.set(task_id, []);
      map.get(task_id)!.push(imgIdx);
    }
    return map;
  };

  const handleSetVisibility = async (is_public: boolean) => {
    if (selected.size === 0) return;
    setActionLoading(true);
    const taskMap = parseSelected();
    try {
      await Promise.all(Array.from(taskMap.entries()).map(([task_id, image_indexes]) =>
        fetch('/api/generate-image/images', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
          body: JSON.stringify({ task_id, image_indexes, is_public }),
        })
      ));
      setGroups(prev => prev.map(g => ({
        ...g,
        subtasks: g.subtasks.map(sub => {
          if (!sub.task_id || !taskMap.has(sub.task_id)) return sub;
          const idxSet = new Set(taskMap.get(sub.task_id));
          return { ...sub, images: sub.images.map(img => idxSet.has(img.index) ? { ...img, is_public } : img) };
        }),
      })));
      setSelected(new Set());
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    modal.confirm({
      title: '确认删除图片',
      content: `确定要删除选中的 ${selected.size} 张图片吗？此操作不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(true);
        const taskMap = parseSelected();
        try {
          await Promise.all(Array.from(taskMap.entries()).map(([task_id, image_indexes]) =>
            fetch('/api/generate-image/images', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
              body: JSON.stringify({ task_id, image_indexes }),
            })
          ));
          setGroups(prev => prev.map(g => ({
            ...g,
            subtasks: g.subtasks.map(sub => {
              if (!sub.task_id || !taskMap.has(sub.task_id)) return sub;
              const idxSet = new Set(taskMap.get(sub.task_id));
              return { ...sub, images: sub.images.filter(img => !idxSet.has(img.index)) };
            }),
          })));
          setSelected(new Set());
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const batchIds = currentBatchIds.current;
  const batchSubtasks = groups.flatMap(g => g.subtasks).filter(t => t.task_id && batchIds.has(t.task_id as string));
  const batchTotal = batchSubtasks.length;
  const batchDone = batchSubtasks.filter(t => t.status === 3 || t.status === 4).length;
  const batchQueued = groups.filter(g => !g.fromHistory).flatMap(g => g.subtasks).filter(t => t.status === 0).length;
  const totalRuns = counts.reduce((s, c) => s + c, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-1 text-xl font-semibold text-gray-900 sm:text-2xl">AI 生图</h1>
        <p className="text-xs text-gray-500 tracking-[0.15em] uppercase">Image Generation · SVIP</p>
      </div>

      {/* Prompt 输入区 */}
      <div ref={promptSectionRef} className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 sm:mb-6 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-gray-900">Prompt 列表</span>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
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
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 sm:flex-row sm:items-start sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0">
              <span className="w-5 flex-shrink-0 text-xs text-gray-400 sm:mt-2.5 sm:text-right">{i + 1}</span>
              <textarea
                value={prompt}
                onChange={e => updatePrompt(i, e.target.value)}
                disabled={submitting || polling}
                placeholder="输入生图 Prompt..."
                rows={3}
                className="flex-1 px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors placeholder:text-gray-400"
              />
              <div className="flex flex-shrink-0 items-end justify-between gap-2 sm:flex-col sm:items-center sm:justify-start sm:gap-1">
                <div className="flex flex-col items-center gap-1">
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
                    className="w-16 px-2 py-1.5 text-sm text-center text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors sm:w-14"
                  />
                </div>
                {prompts.length > 1 && (
                  <button
                    onClick={() => removePrompt(i)}
                    disabled={submitting || polling}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-40 sm:mt-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-gray-400">共 {totalRuns} 次任务，每次生成 4 张图</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || polling}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin flex-shrink-0" />
          <span className="text-sm text-gray-700">
            本次任务进度：已完成 <span className="font-semibold text-gray-900">{batchDone}</span> / <span className="font-semibold text-gray-900">{batchTotal + batchQueued}</span> 次
            {batchQueued > 0 && <span className="text-gray-400 ml-2">（{batchQueued} 个等待提交）</span>}
          </span>
        </div>
      )}

      {/* 任务列表 */}
      {groups.length > 0 && (
        <>
          {/* 任务列表顶部操作栏 */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-gray-400">{groups.length} 个任务</span>
            {totalImagesCount > 0 && (
              isManaging ? (
                <button
                  onClick={exitManage}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50 transition-all"
                >
                  退出管理
                </button>
              ) : (
                <button
                  onClick={enterManage}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  管理图片
                </button>
              )
            )}
          </div>

          <div className="space-y-6">
            {groups.map((group, gi) => {
              const status = groupStatus(group.subtasks);
              const process = groupProcess(group.subtasks);

              return (
                <div key={gi} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  {/* 标题行 */}
                  <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
                    {/* 序号 */}
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
                      {gi + 1}
                    </span>

                    {/* 提示词 + 状态区 */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      {/* 提示词 */}
                      <Tooltip
                        title={group.prompt}
                        placement="bottomLeft"
                        overlayStyle={{ maxWidth: 480 }}
                        overlayInnerStyle={{ fontSize: 12, lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                      >
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 cursor-default">{group.prompt}</p>
                      </Tooltip>

                      {/* 状态行：进度条 + 状态 + 次数 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 状态指示点 + 文字 */}
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          status === 3 ? 'bg-emerald-50 text-emerald-700' :
                          status === 4 ? 'bg-red-50 text-red-600' :
                          status === 2 ? 'bg-sky-50 text-sky-600' :
                          status === 0 ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            status === 3 ? 'bg-emerald-500' :
                            status === 4 ? 'bg-red-500' :
                            status === 2 ? 'bg-sky-500 animate-pulse' :
                            status === 0 ? 'bg-amber-400 animate-pulse' :
                            'bg-gray-400'
                          }`} />
                          {STATUS_LABEL[status] ?? '未知'}
                        </div>

                        {/* 生成进度条（仅生成中显示） */}
                        {status === 2 && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-800 rounded-full transition-all duration-700"
                                style={{ width: `${process}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-gray-400 tabular-nums">{process}%</span>
                          </div>
                        )}

                        {/* 次数 badge */}
                        {group.subtasks.length > 1 && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-md">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            ×{group.subtasks.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮组 */}
                    <div className="flex flex-shrink-0 items-center gap-0.5 self-start rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                      {/* 复制提示词 */}
                      <Tooltip title="复制提示词" placement="top">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(group.prompt).then(() => {
                              setCopiedPrompt(group.prompt);
                              setTimeout(() => setCopiedPrompt(null), 2000);
                            });
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-800 hover:bg-white hover:shadow-sm transition-all"
                        >
                          {copiedPrompt === group.prompt ? (
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </Tooltip>

                      {/* 重新生成 */}
                      <Tooltip title="带回提示词重新生成" placement="top">
                        <button
                          onClick={() => handleRegenerate(group.prompt)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-800 hover:bg-white hover:shadow-sm transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </Tooltip>

                      {/* 分隔线 */}
                      <div className="w-px h-4 bg-gray-200 mx-0.5" />

                      {/* 删除任务 */}
                      <Tooltip title="删除任务" placement="top">
                        <button
                          onClick={() => handleDeleteGroup(group.prompt)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* 图片区 */}
                  <div className="space-y-3 p-4">
                    {group.subtasks.map((sub, si) => (
                      <div key={si}>
                        {group.subtasks.length > 1 && (
                          <p className="text-[10px] text-gray-400 mb-1.5 ml-1">第 {si + 1} 次</p>
                        )}
                        {sub.images.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {sub.images.map((img, j) => {
                              const selKey = `${sub.task_id}::${img.index}`;
                              const isSelected = selected.has(selKey);
                              return (
                                <div
                                  key={j}
                                  className={`group relative aspect-[9/16] rounded-xl overflow-hidden border transition-all ${
                                    isManaging
                                      ? isSelected
                                        ? 'border-gray-900 ring-2 ring-gray-900 cursor-pointer'
                                        : 'border-gray-200 cursor-pointer hover:border-gray-400'
                                      : 'border-gray-100 hover:border-gray-300'
                                  }`}
                                  onClick={() => {
                                    if (isManaging && sub.task_id) toggleSelect(selKey);
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={img.url}
                                    alt={`第${si + 1}次 图片${j + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />

                                  {/* 管理模式：勾选圆圈 */}
                                  {isManaging && (
                                    <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isSelected ? 'bg-gray-900 border-gray-900' : 'bg-white/80 border-gray-300'
                                    }`}>
                                      {isSelected && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  )}

                                  {/* 公开标记 */}
                                  {img.is_public && (
                                    <div className="absolute top-2 right-2 text-[9px] text-white bg-green-500/80 px-1.5 py-0.5 rounded-full">
                                      公开
                                    </div>
                                  )}

                                  {/* 非管理模式：hover 下载按钮 + 尺寸 */}
                                  {!isManaging && (
                                    <>
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              const res = await fetch(img.url);
                                              const blob = await res.blob();
                                              const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `aicave_${Date.now()}.${ext}`;
                                              a.click();
                                              URL.revokeObjectURL(url);
                                            } catch { window.open(img.url, '_blank'); }
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white"
                                          title="下载原图"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                        </button>
                                      </div>
                                      <div className="absolute bottom-2 right-2 text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded-full">
                                        {img.width}×{img.height}
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : sub.status === 1 || sub.status === 2 ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        </>
      )}

      {/* 管理模式底部浮动操作栏 */}
      {isManaging && (
        <div className="fixed bottom-4 left-4 right-4 z-40 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg shadow-gray-200/80 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2 sm:flex-nowrap sm:py-2.5">
          {/* 已选计数 */}
          <div className="flex w-full items-center justify-center gap-1.5 border-b border-gray-100 pb-2 sm:w-auto sm:justify-start sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
            {selected.size > 0 ? (
              <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {selected.size}
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center" />
            )}
            <span className="text-xs text-gray-500 whitespace-nowrap">已选图片</span>
          </div>

          {/* 公开 */}
          <button
            onClick={() => handleSetVisibility(true)}
            disabled={actionLoading || selected.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            公开
          </button>

          {/* 私密 */}
          <button
            onClick={() => handleSetVisibility(false)}
            disabled={actionLoading || selected.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            私密
          </button>

          {/* 删除 */}
          <button
            onClick={handleDeleteSelected}
            disabled={actionLoading || selected.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-full hover:border-red-300 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除
          </button>

          <div className="mx-1 hidden h-4 w-px bg-gray-100 sm:block" />

          {/* 取消 */}
          <button
            onClick={exitManage}
            disabled={actionLoading}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
          >
            取消
          </button>
          {actionLoading && (
            <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}

export default function GenerateImgPage() {
  return (
    <PrivateAppShell>
      <App>
        <GenerateImgPageInner />
      </App>
    </PrivateAppShell>
  );
}

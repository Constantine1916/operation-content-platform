'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/overview');
      setTimeout(() => setLoaded(true), 80);
    });
  }, [router]);

  return (
    <div className={`min-h-screen bg-white transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[1.0625rem] font-semibold tracking-wide text-gray-900">AI树洞</span>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-[0.9375rem] text-gray-500 hover:text-gray-900 transition-colors px-4 py-1.5">
              登录
            </Link>
            <Link href="/register" className="text-[0.9375rem] bg-gray-900 text-white px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors font-medium">
              注册
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — 全屏，一句话 */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-8">aicave.cn</p>
        <h1 className="text-[3.5rem] md:text-[4rem] font-semibold leading-[1.1] tracking-tight text-gray-900 mb-6 max-w-2xl">
          发现 AI 时代<br />最好的原创内容
        </h1>
        <p className="text-[1.0625rem] text-gray-400 max-w-md leading-relaxed mb-12">
          资讯、图片、视频、课程——每天自动更新，由创作者与 AI 共同生产
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-8 py-3.5 rounded-full hover:bg-gray-700 transition-all hover:gap-3"
        >
          免费开始
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {/* 向下滚动提示 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-gray-300" />
        </div>
      </section>

      {/* 数字 — 用数据说话 */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100">
            <Stat number="2h" label="资讯更新间隔" />
            <Stat number="5+" label="内容类型" />
            <Stat number="∞" label="创作者可上传" />
          </div>
        </div>
      </section>

      {/* 内容类型 — 极简列表，不是卡片 */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-16">内容</p>
          <div className="space-y-0 divide-y divide-gray-100">
            <ContentRow icon="📡" title="AI 资讯" desc="全网热点，每 2 小时自动采集" tag="自动更新" />
            <ContentRow icon="📝" title="AI 文章" desc="基于资讯深度生成，也接受创作者投稿" tag="自动更新" />
            <ContentRow icon="🖼️" title="AI 图片" desc="创作者上传 AI 生成作品，瀑布流展示" tag="创作者" />
            <ContentRow icon="🎬" title="AI 视频" desc="AI 生成视频合集，持续扩充" tag="创作者" />
            <ContentRow icon="📚" title="AI 课程" desc="工具教程与实战课，帮你快速上手" tag="即将上线" />
          </div>
        </div>
      </section>

      {/* 创作者 — 一段话，不是三列卡片 */}
      <section className="py-24 border-t border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-8">创作者</p>
            <h2 className="text-[1.75rem] font-semibold text-gray-900 leading-snug mb-6">
              上传你的作品<br />让更多人看见
            </h2>
            <p className="text-base text-gray-500 leading-relaxed mb-10">
              普通创作者免费上传，认证创作者享受优先推荐与收益分成，合作创作者获得最高权益与联合运营支持。
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 border border-gray-900 px-6 py-2.5 rounded-full hover:bg-gray-900 hover:text-white transition-all">
              成为创作者
            </Link>
          </div>
        </div>
      </section>

      {/* 用户权益 — 两行对比，不是两个大卡片 */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-16">获取资源</p>
          <div className="space-y-0 divide-y divide-gray-100">
            <AccessRow type="免费用户" desc="浏览全部内容，观看短广告后下载资源" />
            <AccessRow type="会员" desc="无限下载，无广告，优先体验新功能" highlight />
          </div>
        </div>
      </section>

      {/* CTA — 极简，一句话 + 一个按钮 */}
      <section className="py-32 border-t border-gray-100 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-[1.75rem] font-semibold text-gray-900 mb-5 leading-snug">
            现在就开始
          </h2>
          <p className="text-base text-gray-400 mb-12">免费注册，立即探索所有 AI 内容</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-10 py-4 rounded-full hover:bg-gray-700 transition-all text-base"
          >
            免费注册
          </Link>
          <p className="mt-6 text-xs text-gray-400">
            已有账号？
            <Link href="/login" className="text-gray-600 hover:text-gray-900 ml-1 underline underline-offset-2">
              登录
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="text-[0.9375rem] font-semibold text-gray-900">AI树洞</span>
          <p className="text-xs text-gray-400">© 2026 aicave.cn</p>
        </div>
      </footer>

    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="text-[2rem] font-semibold text-gray-900 mb-2">{number}</div>
      <div className="text-[0.8125rem] text-gray-400 tracking-wide">{label}</div>
    </div>
  );
}

function ContentRow({ icon, title, desc, tag }: {
  icon: string; title: string; desc: string; tag: string;
}) {
  return (
    <div className="flex items-center gap-6 py-6 group">
      <span className="text-2xl w-8 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-base font-medium text-gray-900">{title}</span>
          <span className="text-xs text-gray-400">{desc}</span>
        </div>
      </div>
      <span className="text-[11px] text-gray-400 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0">{tag}</span>
    </div>
  );
}

function AccessRow({ type, desc, highlight }: {
  type: string; desc: string; highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-6 ${highlight ? '' : ''}`}>
      <div className="flex items-center gap-4">
        <span className={`text-sm font-semibold ${highlight ? 'text-gray-900' : 'text-gray-500'}`}>{type}</span>
        {highlight && (
          <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded-full">推荐</span>
        )}
      </div>
      <span className="text-sm text-gray-500 text-right max-w-xs">{desc}</span>
    </div>
  );
}

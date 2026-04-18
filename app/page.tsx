'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/overview');
      setTimeout(() => setLoaded(true), 100);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8f7f4]" style={{ fontFamily: "'Noto Sans SC', -apple-system, sans-serif" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&family=Noto+Sans+SC:wght@300;400;500;600&display=swap');
        .font-serif-sc { font-family: 'Noto Serif SC', Georgia, serif; }
        .font-sans-sc { font-family: 'Noto Sans SC', -apple-system, sans-serif; }
      `}</style>

      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 bg-[#f8f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="font-serif-sc text-[18px] font-bold tracking-wide text-black">AI树洞</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="font-sans-sc text-[14px] text-black/50 hover:text-black transition-colors">
              登录
            </Link>
            <Link
              href="/register"
              className="font-sans-sc text-[14px] bg-black text-white px-5 py-2 rounded-full hover:bg-black/80 transition-all font-medium"
            >
              免费注册
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — 垂直居中，keynote 气质 */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-24 text-center sm:px-6 sm:pt-28 lg:px-8">
        {/* 背景装饰圈 */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center sm:flex">
          <div className="w-[700px] h-[700px] rounded-full border border-black/[0.04]" />
          <div className="absolute w-[500px] h-[500px] rounded-full border border-black/[0.04]" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-black/[0.04]" />
        </div>

        <div className={`relative z-10 max-w-[800px] mx-auto transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="font-sans-sc text-[11px] tracking-[0.3em] text-black/30 uppercase mb-8 font-medium">
            aicave.cn
          </p>
          <h1 className="font-serif-sc text-[clamp(2.8rem,6vw,5.5rem)] font-black leading-[1.1] tracking-[-0.01em] text-black mb-8">
            发现 AI 时代<br />最好的原创内容
          </h1>
          <p className="font-sans-sc text-[15px] text-black/45 leading-[1.8] mb-10 max-w-[480px] mx-auto font-light sm:text-[17px] sm:mb-12">
            资讯、图片、视频、课程<br />每天自动更新，由创作者与 AI 共同生产
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/register"
              className="font-sans-sc inline-flex items-center gap-2 bg-black text-white text-[15px] font-medium px-8 py-3.5 rounded-full hover:bg-black/80 transition-all group"
            >
              免费开始
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="#content" className="font-sans-sc text-[15px] text-black/40 hover:text-black transition-colors">
              了解更多
            </Link>
          </div>

          <CommunityInvite />
        </div>

        {/* 向下滚动提示 */}
        <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 animate-bounce sm:flex">
          <svg className="w-5 h-5 text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Stats — 三栏数字，细线分隔 */}
      <section className="border-t border-black/[0.06] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-[900px]">
          <div className="grid grid-cols-1 divide-y divide-black/[0.06] text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <StatItem number="2h" label="资讯更新间隔" />
            <StatItem number="5+" label="内容类型" />
            <StatItem number="∞" label="创作者自由上传" />
          </div>
        </div>
      </section>

      {/* Content Types */}
      <section id="content" className="border-t border-black/[0.06] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-14 text-center sm:mb-20">
            <p className="font-sans-sc text-[11px] tracking-[0.3em] text-black/25 uppercase mb-4 font-medium">内容</p>
            <h2 className="font-serif-sc text-[30px] font-bold tracking-[-0.01em] text-black sm:text-[36px]">多样的 AI 资源</h2>
          </div>
          <div className="space-y-0">
            <ContentRow icon="📡" title="AI 资讯" desc="全网热点，每 2 小时自动采集" tag="自动更新" />
            <ContentRow icon="📝" title="AI 文章" desc="基于资讯深度生成，也接受创作者投稿" tag="自动更新" />
            <ContentRow icon="🖼️" title="AI 图片" desc="创作者上传 AI 生成作品，瀑布流展示" tag="创作者" />
            <ContentRow icon="🎬" title="AI 视频" desc="AI 生成视频合集，持续扩充" tag="创作者" />
            <ContentRow icon="📚" title="AI 课程" desc="工具教程与实战课，帮你快速上手" tag="即将上线" />
          </div>
        </div>
      </section>

      {/* Creator */}
      <section className="border-t border-black/[0.06] bg-black px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="font-sans-sc text-[11px] tracking-[0.3em] text-white/30 uppercase mb-6 font-medium">创作者</p>
          <h2 className="font-serif-sc text-[32px] font-bold leading-[1.2] tracking-[-0.01em] mb-6 sm:text-[40px]">
            上传你的作品<br />让更多人看见
          </h2>
          <p className="font-sans-sc text-[16px] text-white/45 leading-[1.8] mb-10 max-w-[520px] mx-auto font-light">
            普通创作者免费上传，认证创作者享受优先推荐与收益分成，合作创作者获得最高权益与联合运营支持。
          </p>
          <Link
            href="/register"
            className="font-sans-sc inline-flex items-center gap-2 text-[15px] font-medium text-black bg-white px-7 py-3.5 rounded-full hover:bg-white/90 transition-all"
          >
            成为创作者
          </Link>
        </div>
      </section>

      {/* Access Cards */}
      <section className="border-t border-black/[0.06] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-14 text-center sm:mb-20">
            <p className="font-sans-sc text-[11px] tracking-[0.3em] text-black/25 uppercase mb-4 font-medium">获取资源</p>
            <h2 className="font-serif-sc text-[30px] font-bold tracking-[-0.01em] text-black sm:text-[36px]">两种方式，畅享内容</h2>
          </div>
          <div className="mx-auto grid max-w-[720px] gap-4 md:grid-cols-2 md:gap-6">
            <AccessCard
              type="免费用户"
              desc="浏览全部内容，观看短广告后下载资源"
              features={['浏览所有公开内容', '观看广告后下载', '基础功能体验']}
            />
            <AccessCard
              type="会员"
              desc="无限下载，无广告，优先体验新功能"
              features={['无限下载全部资源', '无广告打扰', '优先体验新功能']}
              highlight
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-black/[0.06] px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-[560px]">
          <h2 className="font-serif-sc text-[38px] font-black leading-[1.1] tracking-[-0.02em] text-black mb-5 sm:text-[48px]">
            现在就开始
          </h2>
          <p className="font-sans-sc text-[16px] text-black/40 mb-10 font-light">免费注册，立即探索所有 AI 内容</p>
          <Link
            href="/register"
            className="font-sans-sc inline-flex items-center gap-2 bg-black text-white text-[15px] font-medium px-12 py-4 rounded-full hover:bg-black/80 transition-all"
          >
            免费注册
          </Link>
          <p className="font-sans-sc mt-7 text-[13px] text-black/30">
            已有账号？
            <Link href="/login" className="text-black/50 hover:text-black ml-1.5 underline underline-offset-2 transition-colors">
              登录
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <span className="font-serif-sc text-[16px] font-bold text-black">AI树洞</span>
          <p className="font-sans-sc text-[13px] text-black/25">© 2026 aicave.cn</p>
        </div>
      </footer>

    </div>
  );
}

function CommunityInvite() {
  return (
    <div className="mt-12 flex justify-center">
      <div className="w-full max-w-[560px] rounded-[32px] border border-black/[0.08] bg-white/78 p-4 shadow-[0_36px_90px_-42px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-stretch sm:gap-6">
          <div className="w-[142px] flex-shrink-0 rounded-[26px] bg-black p-3 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.92)] sm:w-[168px]">
            <div className="overflow-hidden rounded-[20px] bg-white">
              <Image
                src="/assets/qr_code.jpg"
                alt="AI树洞微信社群二维码"
                width={737}
                height={732}
                className="block h-auto w-full"
                priority
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center text-left sm:pr-2">
            <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
              <span className="h-2.5 w-2.5 rounded-full bg-black" />
              <span className="font-sans-sc text-[10px] font-semibold uppercase tracking-[0.28em] text-black/35">
                微信社群
              </span>
            </div>
            <h3 className="font-serif-sc text-[24px] font-bold leading-[1.16] tracking-[-0.025em] text-black sm:text-[30px]">
              扫码加入 AI 树洞社群
            </h3>
            <p className="font-sans-sc mt-3 text-[14px] leading-[1.9] text-black/48 sm:max-w-[260px]">
              获取产品更新、创作交流和内容合作入口。用微信扫码即可加入。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="px-6 py-6 sm:px-8 sm:py-4">
      <div className="font-serif-sc text-[40px] font-black text-black mb-2 tracking-[-0.03em] sm:text-[52px]">{number}</div>
      <div className="font-sans-sc text-[13px] text-black/35 tracking-wide">{label}</div>
    </div>
  );
}

function ContentRow({ icon, title, desc, tag }: {
  icon: string; title: string; desc: string; tag: string;
}) {
  return (
    <div className="group -mx-2 flex items-center gap-4 rounded-xl border-b border-black/[0.06] px-2 py-5 transition-colors hover:bg-black/[0.015] last:border-0 sm:-mx-4 sm:gap-6 sm:px-4 sm:py-6">
      <span className="text-[26px] w-10 flex-shrink-0 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-sans-sc text-[17px] font-semibold text-black">{title}</span>
          <span className="font-sans-sc text-[14px] text-black/35 font-light hidden sm:inline">{desc}</span>
        </div>
      </div>
      <span className="font-sans-sc text-[11px] text-black/30 border border-black/10 px-3 py-1.5 rounded-full flex-shrink-0 font-medium tracking-wide">{tag}</span>
    </div>
  );
}

function AccessCard({ type, desc, features, highlight }: {
  type: string; desc: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-6 transition-all sm:p-8 ${
      highlight
        ? 'border-black bg-black text-white shadow-2xl shadow-black/20'
        : 'border-black/10 bg-white hover:border-black/20 hover:shadow-lg'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <h3 className={`font-sans-sc text-[20px] font-semibold ${highlight ? 'text-white' : 'text-black'}`}>{type}</h3>
        {highlight && (
          <span className="font-sans-sc text-[11px] bg-white text-black px-2.5 py-1 rounded-full font-medium">推荐</span>
        )}
      </div>
      <p className={`font-sans-sc text-[14px] mb-6 leading-[1.7] font-light ${highlight ? 'text-white/50' : 'text-black/45'}`}>{desc}</p>
      <ul className="space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[14px]">
            <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlight ? 'text-white/70' : 'text-black/35'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className={`font-sans-sc ${highlight ? 'text-white/75' : 'text-black/55'}`}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

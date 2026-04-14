'use client';

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
    <div className="min-h-screen bg-[#fafafa]">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between border-b border-black/5">
          <span className="text-[15px] font-semibold tracking-[0.02em] text-black">AI树洞</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[14px] text-black/50 hover:text-black transition-colors px-4 py-1.5">
              登录
            </Link>
            <Link href="/register" className="text-[14px] bg-black text-white px-5 py-2 hover:bg-black/80 transition-all font-medium">
              注册
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — 左对齐，非对称 */}
      <section className="pt-32 pb-24 px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className={`max-w-[720px] transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-[11px] tracking-[0.25em] text-black/30 uppercase mb-6 font-medium">aicave.cn</p>
            <h1 className="text-[clamp(3rem,5.5vw,5rem)] font-bold leading-[1.05] tracking-[-0.02em] text-black mb-8">
              发现 AI 时代<br />
              最好的原创内容
            </h1>
            <p className="text-[17px] text-black/50 leading-[1.6] mb-12 max-w-[520px]">
              资讯、图片、视频、课程——每天自动更新，<br className="hidden sm:block" />
              由创作者与 AI 共同生产
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-black text-white text-[15px] font-medium px-7 py-3.5 hover:bg-black/80 transition-all group"
              >
                免费开始
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="#content" className="text-[15px] text-black/50 hover:text-black transition-colors">
                了解更多
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — 极简数字行 */}
      <section className="py-16 px-8 border-t border-black/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-3 gap-12">
            <StatItem number="2h" label="资讯更新间隔" />
            <StatItem number="5+" label="内容类型" />
            <StatItem number="∞" label="创作者可上传" />
          </div>
        </div>
      </section>

      {/* Content Types — 表格式列表 */}
      <section id="content" className="py-24 px-8 border-t border-black/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16">
            <p className="text-[11px] tracking-[0.25em] text-black/30 uppercase mb-3 font-medium">内容</p>
            <h2 className="text-[32px] font-bold text-black tracking-[-0.01em]">多样的 AI 资源</h2>
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

      {/* Creator — 左右分栏 */}
      <section className="py-24 px-8 border-t border-black/5 bg-white">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] tracking-[0.25em] text-black/30 uppercase mb-6 font-medium">创作者</p>
            <h2 className="text-[36px] font-bold text-black leading-[1.15] tracking-[-0.01em] mb-6">
              上传你的作品<br />让更多人看见
            </h2>
            <p className="text-[16px] text-black/50 leading-[1.65] mb-8">
              普通创作者免费上传，认证创作者享受优先推荐与收益分成，合作创作者获得最高权益与联合运营支持。
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 text-[15px] font-medium text-black border border-black px-6 py-3 hover:bg-black hover:text-white transition-all">
              成为创作者
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="aspect-square bg-gradient-to-br from-black/5 to-black/10 rounded-sm" />
          </div>
        </div>
      </section>

      {/* Access — 对比表格 */}
      <section className="py-24 px-8 border-t border-black/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16">
            <p className="text-[11px] tracking-[0.25em] text-black/30 uppercase mb-3 font-medium">获取资源</p>
            <h2 className="text-[32px] font-bold text-black tracking-[-0.01em]">两种方式，畅享内容</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-[900px]">
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
      <section className="py-32 px-8 border-t border-black/5 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-[40px] font-bold text-black mb-5 leading-[1.15] tracking-[-0.01em]">
            现在就开始
          </h2>
          <p className="text-[16px] text-black/50 mb-10">免费注册，立即探索所有 AI 内容</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-black text-white text-[15px] font-medium px-10 py-4 hover:bg-black/80 transition-all"
          >
            免费注册
          </Link>
          <p className="mt-6 text-[13px] text-black/40">
            已有账号？
            <Link href="/login" className="text-black/60 hover:text-black ml-1.5 underline underline-offset-2">
              登录
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-8 border-t border-black/5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <span className="text-[15px] font-semibold text-black">AI树洞</span>
          <p className="text-[13px] text-black/30">© 2026 aicave.cn</p>
        </div>
      </footer>

    </div>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-[48px] font-bold text-black mb-2 tracking-[-0.02em]">{number}</div>
      <div className="text-[13px] text-black/40 tracking-wide">{label}</div>
    </div>
  );
}

function ContentRow({ icon, title, desc, tag }: {
  icon: string; title: string; desc: string; tag: string;
}) {
  return (
    <div className="flex items-center gap-8 py-6 border-b border-black/5 last:border-0 group hover:bg-black/[0.02] transition-colors px-4 -mx-4">
      <span className="text-[28px] w-10 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-4 mb-1">
          <span className="text-[17px] font-semibold text-black">{title}</span>
          <span className="text-[14px] text-black/40 hidden sm:inline">{desc}</span>
        </div>
      </div>
      <span className="text-[12px] text-black/30 border border-black/10 px-3 py-1.5 flex-shrink-0 font-medium">{tag}</span>
    </div>
  );
}

function AccessCard({ type, desc, features, highlight }: {
  type: string; desc: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div className={`border p-8 transition-all hover:shadow-lg ${
      highlight ? 'border-black bg-black text-white' : 'border-black/10 bg-white hover:border-black/20'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <h3 className={`text-[20px] font-bold ${highlight ? 'text-white' : 'text-black'}`}>{type}</h3>
        {highlight && (
          <span className="text-[11px] bg-white text-black px-2.5 py-1 font-medium">推荐</span>
        )}
      </div>
      <p className={`text-[14px] mb-6 leading-[1.6] ${highlight ? 'text-white/60' : 'text-black/50'}`}>{desc}</p>
      <ul className="space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[14px]">
            <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlight ? 'text-white/80' : 'text-black/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className={highlight ? 'text-white/80' : 'text-black/60'}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

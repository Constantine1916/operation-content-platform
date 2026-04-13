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
    <div className={`min-h-screen bg-[#fafafa] transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>

      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-gray-100 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-gray-50 to-transparent rounded-full blur-3xl" />
      </div>

      {/* 导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
              <span className="text-sm font-bold text-gray-900">AI</span>
            </div>
            <span className="text-base font-semibold tracking-wide text-gray-900">AI树洞</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#resources" className="text-sm tracking-widest text-gray-500 hover:text-gray-900 transition-colors uppercase">资源</a>
            <a href="#creators" className="text-sm tracking-widest text-gray-500 hover:text-gray-900 transition-colors uppercase">创作者</a>
            <a href="#about" className="text-sm tracking-widest text-gray-500 hover:text-gray-900 transition-colors uppercase">关于</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 border border-gray-200 rounded-full hover:border-gray-400">
              登录
            </Link>
            <Link href="/register" className="text-sm bg-gray-900 text-white px-5 py-2 rounded-full hover:bg-gray-700 transition-all font-medium">
              免费注册
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-44 pb-28">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="inline-block mb-8">
            <span className="text-[10px] tracking-[0.4em] text-gray-500 uppercase border border-gray-200 px-5 py-2 rounded-full">
              aicave.cn · AI 原创资源平台
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-light leading-[1.15] tracking-tight mb-6 text-gray-900">
            <span className="block">AI 时代的</span>
            <span className="block font-semibold">原创资源树洞</span>
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-lg mx-auto mb-4">
            每天自动更新 AI 资讯与文章，汇聚创作者的 AI 图片、视频与课程
          </p>
          <p className="text-sm text-gray-400 mb-12">
            发现好内容 · 支持好创作者 · 共建 AI 资源生态
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="px-8 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-all">
              免费开始探索
            </Link>
            <a href="#resources" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group">
              <span>了解更多</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* 资源类型 */}
      <section id="resources" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] tracking-[0.4em] text-gray-400 uppercase">Resources</span>
            <h2 className="text-2xl font-semibold mt-3 text-gray-900">多样的 AI 资源</h2>
            <p className="text-sm text-gray-400 mt-2">由 AI Agent 自动生产 + 创作者原创上传，持续更新</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ResourceCard
              icon="📡"
              tag="每 2 小时更新"
              title="AI 资讯"
              description="Agent 自动采集全网 AI 热点，第一时间掌握模型发布、工具动态、行业趋势"
              accent="bg-blue-50 text-blue-600 border-blue-100"
            />
            <ResourceCard
              icon="📝"
              tag="每 2 小时更新"
              title="AI 文章"
              description="基于热点资讯，Agent 自动撰写深度文章，创作者也可发布原创 AI 内容"
              accent="bg-purple-50 text-purple-600 border-purple-100"
            />
            <ResourceCard
              icon="🖼️"
              tag="创作者上传"
              title="AI 图片"
              description="创作者分享 AI 生成图片作品，支持公开展示与下载，瀑布流画廊浏览"
              accent="bg-pink-50 text-pink-600 border-pink-100"
            />
            <ResourceCard
              icon="🎬"
              tag="创作者上传"
              title="AI 视频"
              description="汇聚 AI 生成视频内容，创作者上传原创作品，用户发现优质 AI 视频资源"
              accent="bg-orange-50 text-orange-600 border-orange-100"
            />
            <ResourceCard
              icon="📚"
              tag="即将上线"
              title="AI 课程"
              description="创作者录制 AI 工具使用教程与实战课程，帮助用户快速掌握 AI 技能"
              accent="bg-green-50 text-green-600 border-green-100"
            />
            <ResourceCard
              icon="⚡"
              tag="持续扩展"
              title="更多资源"
              description="Prompt 模板、AI 工具评测、工作流分享……AI 树洞持续引入更多资源类型"
              accent="bg-gray-50 text-gray-500 border-gray-200"
            />
          </div>
        </div>
      </section>

      {/* 创作者生态 */}
      <section id="creators" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] tracking-[0.4em] text-gray-400 uppercase">Creators</span>
            <h2 className="text-2xl font-semibold mt-3 text-gray-900">创作者生态</h2>
            <p className="text-sm text-gray-400 mt-2">分层体系，按贡献获得差异化权益与收益</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CreatorTierCard
              tier="普通创作者"
              desc="上传 AI 资源，公开展示，积累粉丝与曝光"
              perks={['资源公开展示', '基础数据统计', '社区互动']}
              style="border-gray-200 bg-white"
            />
            <CreatorTierCard
              tier="认证创作者"
              desc="通过质量审核，享受更高曝光与收益分成"
              perks={['优先推荐位', '收益分成资格', '专属认证标识']}
              style="border-gray-900 bg-white"
              highlight
            />
            <CreatorTierCard
              tier="合作创作者"
              desc="深度合作，共建平台内容生态，享受最高权益"
              perks={['最高分成比例', '定制化推广', '联合运营支持']}
              style="border-gray-200 bg-white"
            />
          </div>
        </div>
      </section>

      {/* 用户获取资源方式 */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <span className="text-[10px] tracking-[0.4em] text-gray-400 uppercase">For Users</span>
          <h2 className="text-2xl font-semibold mt-3 mb-4 text-gray-900">两种方式，畅享资源</h2>
          <p className="text-sm text-gray-400 mb-12">免费用户看广告解锁，会员无限畅享所有资源</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="border border-gray-200 rounded-2xl p-8 text-left hover:border-gray-400 transition-all">
              <div className="text-2xl mb-4">🆓</div>
              <h3 className="font-semibold text-gray-900 mb-2">免费用户</h3>
              <p className="text-sm text-gray-500 leading-relaxed">浏览所有公开内容，观看短广告后下载资源，无需付费即可体验平台核心功能</p>
            </div>
            <div className="border border-gray-900 rounded-2xl p-8 text-left bg-gray-900 text-white">
              <div className="text-2xl mb-4">👑</div>
              <h3 className="font-semibold mb-2">会员用户</h3>
              <p className="text-sm text-white/60 leading-relaxed">无限下载全部资源，无广告打扰，优先体验新功能，支持创作者持续创作</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-8 text-center">
          <h2 className="text-2xl font-semibold mb-3 text-gray-900">加入 AI 树洞</h2>
          <p className="text-sm text-gray-400 mb-10">
            无论你是 AI 爱好者、内容创作者，还是想学习 AI 技能的用户<br />这里都有你需要的资源
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-10 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-all">
              免费注册
            </Link>
            <Link href="/login" className="px-10 py-3.5 border border-gray-200 text-gray-600 text-sm rounded-full hover:border-gray-900 hover:text-gray-900 transition-all">
              已有账号，登录
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="py-10 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
              <span className="text-xs font-bold text-gray-900">AI</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">AI树洞</span>
            <span className="text-xs text-gray-400">aicave.cn</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 AI树洞. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

function ResourceCard({ icon, tag, title, description, accent }: {
  icon: string; tag: string; title: string; description: string; accent: string;
}) {
  return (
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-white transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${accent}`}>{tag}</span>
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function CreatorTierCard({ tier, desc, perks, style, highlight }: {
  tier: string; desc: string; perks: string[]; style: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-6 ${style} transition-all`}>
      {highlight && (
        <div className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-3">推荐</div>
      )}
      <h3 className={`text-base font-semibold mb-2 ${highlight ? 'text-gray-900' : 'text-gray-900'}`}>{tier}</h3>
      <p className="text-sm text-gray-500 mb-5 leading-relaxed">{desc}</p>
      <ul className="space-y-2">
        {perks.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

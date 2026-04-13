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
      if (session) {
        router.push('/overview');
      }
      setTimeout(() => setLoaded(true), 100);
    });
  }, [router]);

  return (
    <div className={`min-h-screen bg-[#fafafa] black transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-gray-100 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-gray-50 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50">
                <span className="text-lg font-medium text-gray-900">AI</span>
              </div>
              <span className="text-lg font-medium tracking-[0.15em] text-gray-900">AI树洞</span>
            </div>
            
            <div className="hidden md:flex items-center gap-10">
              <a href="#features" className="text-lg tracking-widest text-gray-900 hover:gray-800 transition-colors uppercase">功能</a>
              <a href="#workflow" className="text-lg tracking-widest text-gray-900 hover:gray-800 transition-colors uppercase">流程</a>
              <a href="#about" className="text-lg tracking-widest text-gray-900 hover:gray-800 transition-colors uppercase">关于</a>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-lg tracking-widest text-gray-900 hover:black transition-colors uppercase px-4 py-2 border border-gray-200 rounded-full hover:border-gray-500"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="text-lg tracking-widest bg-gray-900 text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-all uppercase font-medium"
              >
                注册
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32">
        <div className="max-w-5xl mx-auto px-8">
          <div className="text-center">
            <div className="inline-block mb-10">
              <span className="text-[10px] tracking-[0.4em] text-gray-900 uppercase border border-gray-200 px-5 py-2 rounded-full">
                AI 原创资源平台
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-normal leading-[1.1] tracking-tight mb-8 text-gray-900">
              <span className="block">汇聚 AI 原创内容</span>
              <span className="block text-gray-900">创作者与用户的树洞</span>
            </h1>
            
            <p className="text-lg text-gray-900 leading-relaxed max-w-xl mx-auto mb-16 font-normal">
              汇聚 AI 原创内容，连接创作者与用户
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/register"
                className="group relative px-10 py-4 bg-gray-900 text-white text-lg tracking-[0.25em] uppercase font-medium rounded-full overflow-hidden"
              >
                <span className="relative z-10">立即开始</span>
              </Link>
              <a
                href="#features"
                className="group flex items-center gap-3 text-lg tracking-[0.2em] text-gray-900 uppercase"
              >
                <span>了解更多</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-24">
            <span className="text-[10px] tracking-[0.4em] text-gray-900 uppercase">Core Functions</span>
            <h2 className="text-3xl font-normal mt-4 tracking-wide text-gray-900">核心功能</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              number="01"
              title="AI 资讯聚合"
              description="实时聚合全网 AI 热点资讯，掌握最新模型发布、工具动态、行业趋势"
            />
            <FeatureCard
              number="02"
              title="AI 图片画廊"
              description="创作者上传 AI 生成图片，支持公开展示，消费者可浏览、下载高质量 AI 图像"
            />
            <FeatureCard
              number="03"
              title="AI 文章创作"
              description="AI 辅助生成高质量文章，创作者一键发布，打造专属 AI 内容矩阵"
            />
            <FeatureCard
              number="04"
              title="AI 视频资源"
              description="汇聚 AI 生成视频内容，创作者分享作品，用户发现优质 AI 视频资源"
            />
            <FeatureCard
              number="05"
              title="创作者分层"
              description="多级创作者体系，按贡献与质量分层，享受差异化权益与收益分成"
            />
            <FeatureCard
              number="06"
              title="会员与变现"
              description="消费者看广告或开会员下载资源，平台与创作者共享收益，形成良性生态"
            />
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-32 bg-gray-50">
        <div className="max-w-5xl mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] tracking-[0.4em] text-gray-900 uppercase">Workflow</span>
            <h2 className="text-3xl font-normal mt-4 tracking-wide text-gray-900">资源流转</h2>
            <p className="gray-600 text-lg mt-3">从创作到变现，完整的 AI 资源生态</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <WorkflowStep step={1} title="创作者上传" icon="✍️" delay={0} />
            <WorkflowArrow />
            <WorkflowStep step={2} title="平台审核" icon="🔍" delay={1} />
            <WorkflowArrow />
            <WorkflowStep step={3} title="公开展示" icon="🖼️" delay={2} />
            <WorkflowArrow />
            <WorkflowStep step={4} title="用户下载" icon="⬇️" delay={3} />
            <WorkflowArrow />
            <WorkflowStep step={5} title="收益分成" icon="💰" delay={4} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white">
        <div className="max-w-2xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-normal mb-6 tracking-wide text-gray-900">加入 AI 树洞</h2>
          <p className="text-lg text-gray-900 mb-12 font-normal">
            发现、创作、分享 AI 资源
          </p>
          <Link
            href="/register"
            className="inline-block px-12 py-4 border border-gray-200 black text-lg tracking-[0.25em] uppercase rounded-full hover:bg-gray-900 hover:text-white transition-all duration-500"
          >
            立即开始 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
                <span className="text-lg font-medium text-gray-900">AI</span>
              </div>
              <span className="text-lg text-gray-900 tracking-widest uppercase">AI树洞</span>
            </div>
            <p className="text-[10px] text-gray-900 tracking-widest uppercase">
              © 2026 AI树洞. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 hover:border-gray-400 hover:bg-white transition-all duration-500 group">
      <div className="text-4xl font-normal text-gray-900 mb-6 group-hover:gray-500 transition-colors">
        {number}
      </div>
      <h3 className="text-lg tracking-[0.15em] uppercase mb-3 font-medium text-gray-900">{title}</h3>
      <p className="text-lg text-gray-900 leading-relaxed font-normal">{description}</p>
    </div>
  );
}

function WorkflowStep({ step, title, icon, delay }: { step: number; title: string; icon: string; delay: number }) {
  return (
    <div 
      className="flex flex-col items-center"
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl mb-4 shadow-sm">
        {icon}
      </div>
      <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-lg font-medium flex items-center justify-center mb-2">
        {step}
      </div>
      <span className="text-[10px] tracking-[0.2em] text-gray-900 uppercase">{title}</span>
    </div>
  );
}

function WorkflowArrow() {
  return (
    <div className="hidden md:block text-gray-900 mx-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  );
}

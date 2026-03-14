'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/overview');
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-900">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-white rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">OP</span>
              </div>
              <span className="text-lg font-semibold tracking-wide">内容运营平台</span>
            </div>
            
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">功能</a>
              <a href="#about" className="text-gray-400 hover:text-white transition-colors text-sm">关于</a>
            </div>
            
            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                登录
              </Link>
              <Link
                href="/login"
                className="px-5 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
              >
                开始使用
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block px-4 py-1.5 mb-8 border border-gray-800 rounded-full">
              <span className="text-xs text-gray-500 uppercase tracking-widest">智能内容运营解决方案</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight tracking-tight">
              聚合多平台内容
              <br />
              <span className="text-gray-600">智能高效运营</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              一站式解决从热点采集、数据分析、内容创作、自动化发布到效果优化的全链路运营需求
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all hover:scale-105"
              >
                立即开始 →
              </Link>
              <a
                href="#features"
                className="px-8 py-4 border border-gray-800 text-white font-medium rounded-full hover:border-gray-600 transition-all"
              >
                了解更多
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">核心功能</h2>
            <p className="text-gray-500">完整的运营闭环，从数据到增长</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <FeatureCard
              number="01"
              title="热点数据采集"
              description="实时聚合全网热点，跨平台监控小红书、知乎、微信、X、Reddit 等平台热门内容"
            />
            
            {/* Feature 2 */}
            <FeatureCard
              number="02"
              title="热点数据分析"
              description="深度分析热点趋势、用户画像、内容画像，挖掘潜在爆款因子"
            />
            
            {/* Feature 3 */}
            <FeatureCard
              number="03"
              title="智能内容创作"
              description="基于热点洞察，AI 辅助生成高质量文章和帖子，批量产出运营内容"
            />
            
            {/* Feature 4 */}
            <FeatureCard
              number="04"
              title="自动化发布"
              description="一键分发多平台，定时发布，解放双手，显著提升运营效率"
            />
            
            {/* Feature 5 */}
            <FeatureCard
              number="05"
              title="账号数据分析"
              description="全维度追踪账号表现，阅读量、互动率、粉丝增长等核心指标尽在掌握"
            />
            
            {/* Feature 6 */}
            <FeatureCard
              number="06"
              title="AI 效果优化"
              description="基于数据反馈持续调优 AI 生成策略，形成数据驱动的增长闭环"
            />
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">运营闭环</h2>
            <p className="text-gray-500">从发现到优化，全链路自动化</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
            <ProcessStep label="数据采集" />
            <ProcessArrow />
            <ProcessStep label="智能分析" />
            <ProcessArrow />
            <ProcessStep label="内容创作" />
            <ProcessArrow />
            <ProcessStep label="自动发布" />
            <ProcessArrow />
            <ProcessStep label="效果优化" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-950">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">开启智能运营之旅</h2>
            <p className="text-gray-400 mb-10">
              立即体验一站式内容运营平台，让运营更高效
            </p>
            <Link
              href="/login"
              className="inline-block px-10 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all hover:scale-105"
            >
              立即开始 →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="py-12 border-t border-gray-900">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border border-gray-700 rounded flex items-center justify-center">
                <span className="text-xs font-bold">OP</span>
              </div>
              <span className="text-gray-500 text-sm">内容运营平台</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2026 内容运营平台. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="group p-8 border border-gray-800 rounded-2xl hover:border-gray-600 transition-all hover:bg-gray-900/50">
      <div className="text-4xl font-bold text-gray-800 mb-4 group-hover:text-gray-700 transition-colors">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function ProcessStep({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 border border-gray-800 rounded-full flex items-center justify-center mb-3">
        <div className="w-3 h-3 bg-white rounded-full"></div>
      </div>
      <span className="text-sm text-gray-400">{label}</span>
    </div>
  );
}

function ProcessArrow() {
  return (
    <div className="hidden md:block text-gray-700">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  );
}

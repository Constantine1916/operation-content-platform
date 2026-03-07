#!/usr/bin/env node

/**
 * API 测试脚本
 * 用于验证 API 端点是否正常工作
 * 
 * 使用方法:
 * node test-api.js
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 API 测试开始...\n');

  // 测试 1: GET /api/sources
  console.log('1️⃣ 测试 GET /api/sources');
  try {
    const res1 = await fetch(`${BASE_URL}/api/sources`);
    const data1 = await res1.json();
    console.log('✅ 成功:', data1.data?.length, '个平台');
    console.log('   平台列表:', data1.data?.map(s => s.name).join(', '));
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }

  console.log();

  // 测试 2: GET /api/articles (空列表)
  console.log('2️⃣ 测试 GET /api/articles');
  try {
    const res2 = await fetch(`${BASE_URL}/api/articles`);
    const data2 = await res2.json();
    console.log('✅ 成功: 共', data2.pagination?.total, '篇文章');
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }

  console.log();

  // 测试 3: POST /api/articles
  console.log('3️⃣ 测试 POST /api/articles');
  try {
    const testArticle = {
      title: 'API 测试文章',
      content: '这是一篇通过 API 创建的测试文章',
      source_platform: 'xiaohongshu',
      source_url: 'https://xiaohongshu.com/test/123',
      author: 'API Tester',
      tags: ['测试', 'API'],
      热度: 10,
    };

    const res3 = await fetch(`${BASE_URL}/api/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testArticle),
    });

    const data3 = await res3.json();
    
    if (data3.success) {
      console.log('✅ 文章创建成功!');
      console.log('   ID:', data3.data?.id);
      console.log('   标题:', data3.data?.title);
    } else {
      console.error('❌ 失败:', data3.error);
    }
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }

  console.log();

  // 测试 4: GET /api/articles?platform=xiaohongshu
  console.log('4️⃣ 测试筛选: GET /api/articles?platform=xiaohongshu');
  try {
    const res4 = await fetch(`${BASE_URL}/api/articles?platform=xiaohongshu`);
    const data4 = await res4.json();
    console.log('✅ 成功: 小红书文章数', data4.pagination?.total);
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }

  console.log();

  // 测试 5: GET /api/tags
  console.log('5️⃣ 测试 GET /api/tags');
  try {
    const res5 = await fetch(`${BASE_URL}/api/tags`);
    const data5 = await res5.json();
    console.log('✅ 成功:', data5.data?.length, '个标签');
    if (data5.data?.length > 0) {
      console.log('   热门标签:', data5.data.slice(0, 3).map(t => `${t.name}(${t.count})`).join(', '));
    }
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }

  console.log('\n✨ 测试完成!\n');
  console.log('💡 提示:');
  console.log('   - 确保开发服务器正在运行 (npm run dev)');
  console.log('   - 确保 .env.local 已配置');
  console.log('   - 查看 API_DOCS.md 了解更多用法\n');
}

// 运行测试
testAPI().catch(console.error);

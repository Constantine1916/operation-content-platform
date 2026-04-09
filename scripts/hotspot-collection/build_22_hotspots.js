const fs = require('fs');

const items = [
    {
        "title": "Anthropic封禁OpenClaw：Claude订阅不再涵盖第三方工具",
        "url": "https://news.ycombinator.com/item?id=47633396",
        "source": "HN",
        "category": "AI工具",
        "summary": "Anthropic宣布Claude订阅将不再涵盖OpenClaw等第三方工具，4月4日中午12点PT生效，用户需购买额外用量包，享一个月过渡期赠送同等订阅金额的赠送金。HN 587+评论热议订阅套利与开源生态边界之争。"
    },
    {
        "title": "Google发布Gemma 4：开源模型进入Apache 2.0时代",
        "url": "https://www.aibase.com/zh/news/26840",
        "source": "AIBase",
        "category": "AI模型",
        "summary": "31B参数性能直逼头部大模型，数学竞赛AIME2026从20.8%飙升至89.2%，编程能力Codeforces ELO从110拉升至2150。许可证全面切换为Apache 2.0，内置Thinking Mode和原生Agent支持。"
    },
    {
        "title": "腾讯云发布Agent Memory记忆服务：OpenClaw准确率提升59%",
        "url": "https://www.aibase.com/zh/news/26828",
        "source": "AIBase",
        "category": "AI工具",
        "summary": "四层渐进式记忆系统，使OpenClaw回答准确率从48%提升至76.10%，解决大模型幻觉和上下文丢失问题。已正式上线腾讯云MCP市场。"
    },
    {
        "title": "阿里Qwen 3.6 Plus发布：100万上下文，支持Agent和编码",
        "url": "https://www.aibase.com/zh/news/26835",
        "source": "AIBase",
        "category": "AI模型",
        "summary": "Agent和编码能力大幅提升，默认支持100万上下文，输入2元/百万Token，输出12元/百万Token。已在百炼平台上线。"
    },
    {
        "title": "DeepSeek V4将运行在华为芯片上",
        "url": "https://x.com/dotey/status/2040236453528064241",
        "source": "Twitter@宝玉",
        "category": "AI模型",
        "summary": "DeepSeek专门推迟V4发布时间，与华为、寒武纪合作重写底层代码，确保在昇腾950PR芯片上运行。单卡算力为英伟达H20的2.87倍，支持FP4低精度推理。"
    },
    {
        "title": "ColaOS发布：首个有灵魂的操作系统",
        "url": "https://x.com/oran_ge/status/2039374238680064206",
        "source": "Twitter@OrangeAI",
        "category": "AI产品",
        "summary": "2030年愿景，2026年4月2日开启不删档内测，定位有灵魂的AI原生操作系统，内置智能体中控，支持跨应用任务编排。"
    },
    {
        "title": "Cursor 3发布：软件开发迈入智能体自主时代",
        "url": "https://www.aibase.com/zh/news/26844",
        "source": "AIBase",
        "category": "AI工具",
        "summary": "智能体统一工作区，支持多代码仓库协同与本地云端无缝切换，引入简洁差异视图UI提升代码审查效率，标志软件开发从人机协作转向智能体自主工作。"
    },
    {
        "title": "Claude Code发现Linux内核隐藏23年的漏洞",
        "url": "https://news.ycombinator.com/item?id=47633855",
        "source": "HN",
        "category": "AI工具",
        "summary": "Claude Code在代码审计过程中发现Linux内核中隐藏23年的漏洞，引发技术社区广泛讨论AI在代码安全审计方面的巨大潜力。"
    },
    {
        "title": "百度文心大模型5.0即将发布：号称超越GPT-4",
        "url": "https://www.36kr.com/p/3753700000000001",
        "source": "36氪",
        "category": "AI模型",
        "summary": "百度官宣文心5.0将于4月发布，声称在多项基准测试中超越GPT-4，专注中文语义理解与行业垂直场景落地。"
    },
    {
        "title": "字节跳动发布豆包视频模型：支持15分钟超长视频生成",
        "url": "https://www.aibase.com/news/26852",
        "source": "AIBase",
        "category": "AI视频",
        "summary": "字节跳动发布豆包视频生成模型，支持15分钟超长视频连贯生成，在动作一致性和光影处理上有重大突破，已开启内测。"
    },
    {
        "title": "霸王茶姬创始人首次公开反思：走了一些弯路",
        "url": "https://www.36kr.com/p/3753588923302405",
        "source": "36氪",
        "category": "商业",
        "summary": "霸王茶姬2025年净利润下滑52.4%，创始人张俊杰反思激进扩张策略，表示将回归产品本质，放缓开店速度。"
    },
    {
        "title": "知乎热榜：孙颖莎连续三届世界杯女单冠军、王楚钦夺冠",
        "url": "https://www.zhihu.com/question/2024206797448242856",
        "source": "知乎",
        "category": "体育",
        "summary": "2026澳门世界杯，孙颖莎4-1战胜王曼昱，王楚钦4-3战胜松岛辉空，均创历史佳绩，中国乒乓球队大获全胜。"
    },
    {
        "title": "知乎热榜：京东开除PaaS副总裁",
        "url": "https://www.zhihu.com/question/2024082508686390093",
        "source": "知乎",
        "category": "商业",
        "summary": "京东集团副总裁、PaaS业务负责人被刘强东亲自决定开除，账号秒没、团队被收编，原因系业绩连续两季度未达标。"
    },
    {
        "title": "知乎热榜：美伊冲突持续升级",
        "url": "https://www.zhihu.com/question/2024150991746983516",
        "source": "知乎",
        "category": "国际",
        "summary": "美军运输机执行救援任务时被困后炸毁，伊朗称多架美军飞机被击落，双方信息战持续，全球市场避险情绪升温。"
    },
    {
        "title": "国产手机厂商集体涨价：内存一年涨四倍",
        "url": "https://www.zhihu.com/question/2023712386658443636",
        "source": "知乎",
        "category": "科技",
        "summary": "OPPO、vivo、小米相继宣布涨价，内存涨价幅度超预期，分析师称存储芯片成本暴涨80%，消费者换机周期进一步拉长。"
    },
    {
        "title": "Glanceway: macOS菜单栏信息聚合工具",
        "url": "https://sspai.com/post/108188",
        "source": "少数派",
        "category": "工具",
        "summary": "支持RSS、JS脚本、公开API的菜单栏小工具，支持V2EX、新闻等信息源，配合Claude可做摘要，是效率工具爱好者的新宠。"
    },
    {
        "title": "卡兹克：AIFUT大会倒计时3天",
        "url": "https://x.com/Khazix0918/status/2040659540908417219",
        "source": "Twitter@数字生命卡兹克",
        "category": "AI活动",
        "summary": "AI FUT大会4月8-9日在亦庄举办，免费外场开放，众多展位和礼物，探讨AI过去变化与未来。"
    },
    {
        "title": "归藏：Karpathy本地AI知识库方案详解",
        "url": "https://x.com/op7418/status/2040471456820408449",
        "source": "Twitter@歸藏",
        "category": "AI教程",
        "summary": "Karpathy分享用Obsidian构建本地AI知识库，RAW目录存原始资料，大模型驱动个人Wiki，为知识管理提供新范式。"
    },
    {
        "title": "小互：GPT Image 2灰度测试，中文文字渲染能力提升",
        "url": "https://x.com/xiaohu/status/2040620032133374065",
        "source": "Twitter@小互",
        "category": "AI图像",
        "summary": "GPT Image 2开始灰度测试，中文草书渲染能力与DeepSeek同级别，预计很快发布，多语言文字渲染准确性大幅提升。"
    },
    {
        "title": "Winter Capital：OpenClaw最大优点是记忆系统",
        "url": "https://x.com/oran_ge/status/2040550162511385051",
        "source": "Twitter@OrangeAI",
        "category": "AI工具",
        "summary": "OpenClaw拥有投资框架、三观、所有推文等个性化记忆，懂用户且有情绪价值，可当贴身秘书，被投资圈评为最懂用户的AI助手。"
    },
    {
        "title": "宝玉：AI利用情绪提升生成结果的Prompt技巧",
        "url": "https://x.com/dotey/status/2040159519607587304",
        "source": "Twitter@宝玉",
        "category": "AI教程",
        "summary": "先让AI扮演仇人挑刺给出犀利意见，再基于意见改进，AI情绪机制可被有效利用来提升创意内容质量。"
    },
    {
        "title": "DAN KOE：AI时代个人力量超越20人公司",
        "url": "https://x.com/thedankoe/status/2040853354931446145",
        "source": "Twitter@DANKOE",
        "category": "思维",
        "summary": "互联网赋予学习能力，社交媒体赋予触达能力，AI赋予创造能力，单人比过去20人公司更强大，成为2026年最受关注的个人IP观点。"
    },
    {
        "title": "PixVerse V6发布：AI视频生成速度领先",
        "url": "https://x.com/Khazix0918/status/2038634720830038483",
        "source": "Twitter@数字生命卡兹克",
        "category": "AI视频",
        "summary": "爱诗科技融资3亿美元，PixVerse V6支持15秒1080P视频几十秒生成，电影质感强化，但打不过Seedance 2.0。"
    },
    {
        "title": "小米MiMo大模型发布Token订阅套餐",
        "url": "https://www.aibase.com/zh/news/26833",
        "source": "AIBase",
        "category": "AI商业",
        "summary": "四档位覆盖全模态，月费39元起，Lite/Standard/Pro/Max四档，3月底正式推出，定位中低端市场。"
    },
    {
        "title": "广电行业严禁AI换脸、声纹克隆",
        "url": "https://www.aibase.com/zh/news/26825",
        "source": "AIBase",
        "category": "AI监管",
        "summary": "中广联演员委员会发布严正声明，严禁未经授权使用演员影像与声纹，平台需建立授权核验机制，违规将承担法律责任。"
    },
    {
        "title": "苹果iPhone折叠屏延期：供应链难题",
        "url": "https://www.36kr.com/p/3753443886875143",
        "source": "36氪",
        "category": "科技",
        "summary": "苹果折叠屏原计划Q3发布，因折痕控制问题延期，需时间修改设计，可能面临OPPO、vivo等同款产品激烈竞争。"
    },
    {
        "title": "知乎：新能源车电池8年质保后更换成本引热议",
        "url": "https://www.zhihu.com/question/2023473110414878499",
        "source": "知乎",
        "category": "新能源",
        "summary": "新能源车电池8年质保期后更换成本高昂，单次更换费用高达5-10万，引发消费者对电池寿命和二手车残值的担忧。"
    },
    {
        "title": "知乎：广东顺德鸡煲店被网红带火，老板拼命劝退",
        "url": "https://www.zhihu.com/question/2023829606344521498",
        "source": "知乎",
        "category": "商业",
        "summary": "广东顺德莫氏鸡煲被网红带火后排队数小时，老板发视频拼命劝退网友：不要来，我们真的忙不过来，引发对网红经济的思考。"
    },
    {
        "title": "Show HN: GPU模拟器游戏爆火，790票",
        "url": "https://jaso1024.com/mvidia/",
        "source": "Hacker News",
        "category": "技术",
        "summary": "HN热门第一：一个让你从零构建GPU的游戏，通过游戏化方式理解GPU架构、并行计算和硬件设计，引发硬件工程师和游戏开发者的双重关注。"
    },
    {
        "title": "美的集团日均1.3万个智能体同时在线",
        "url": "https://www.aibase.com/zh/news/26832",
        "source": "AIBase",
        "category": "AI应用",
        "summary": "美的集团正大规模应用AI技术，每天有超1.3万个智能体运行，覆盖研发、制造、供应链及营销等全价值链环节，标志着AI从实验室走向产业深度应用。"
    }
];

const cats = {};
for (const it of items) {
    cats[it.category] = (cats[it.category] || 0) + 1;
}

const data = {
    date: "2026-04-05",
    collected_time: "22:00:00",
    source: "radar",
    timestamp: "2026-04-05_22",
    items: items,
    hotspots_count: items.length,
    top_categories: cats
};

const outPath = '/opt/openclaw/agent-b/workspace/data/daily_hotspots/2026-04-05_22.json';
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Written:', items.length, 'items →', outPath);

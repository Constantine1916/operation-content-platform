import json

items = [
    {
        "title": "Anthropic 正式封杀 OpenClaw：Claude 订阅不再涵盖第三方工具",
        "url": "https://x.com/op7418/status/2040245390814085270",
        "source": "Twitter @歸藏",
        "category": "AI行业",
        "summary": "Anthropic宣布Claude订阅将不再涵盖OpenClaw等第三方工具，4月4日中午12点PT生效。用户需购买额外用量包，享一个月过渡期赠送同等订阅金额的赠送金。HN热议：OpenClaw是订阅套利还是合理商业决策，引发关于开源生态与平台限制的深度讨论。"
    },
    {
        "title": "Anthropic 禁止 Claude Code 订阅使用 OpenClaw（HN 587+评论热议）",
        "url": "https://news.ycombinator.com/item?id=47633396",
        "source": "Hacker News",
        "category": "AI行业",
        "summary": "HN 587+评论热门话题：Anthropic宣布不再允许Claude Code订阅使用OpenClaw等第三方工具。用户争论焦点：订阅服务的容量管理是否应通过ToS而非用量限制来实现，开源生态与平台封闭的边界在哪里。"
    },
    {
        "title": "Google Gemma 4 正式开源：Apache 2.0 协议，31B 参数性能直逼头部大模型",
        "url": "https://www.aibase.com/zh/news/26840",
        "source": "AIBase",
        "category": "AI模型",
        "summary": "Google DeepMind发布Gemma 4，切换至Apache 2.0许可证，31B版本Arena排名第三。AIME数学测试从20.8%飙升至89.2%，Codeforces ELO从110升至2150。支持手机端（E2B/E4B）和工作站（26B MoE/31B Dense）全场景，内置Thinking Mode和原生Agent支持。"
    },
    {
        "title": "DeepSeek V4 将基于华为昇腾芯片运行：推迟发布与寒武纪合作",
        "url": "https://x.com/dotey/status/2040236453528064241",
        "source": "Twitter @宝玉",
        "category": "AI模型",
        "summary": "据The Information报道，DeepSeek专门推迟V4发布时间，与华为、寒武纪合作重写底层代码，确保在昇腾950PR芯片上运行。单卡算力为英伟达H20的2.87倍，支持FP4低精度推理。这是中国AI从离不开英伟达到推理环节可用国产替代的关键一步。"
    },
    {
        "title": "Qwen 3.6 Plus 发布：Agent 和编码能力大幅提升，100万上下文",
        "url": "https://x.com/op7418/status/2039991323252723945",
        "source": "Twitter @歸藏",
        "category": "AI模型",
        "summary": "阿里通义发布Qwen 3.6 Plus，Agent和编码能力显著提升，默认支持100万上下文（最长输出接近991K）。输入2元/百万Token，输出12元/百万Token。已在百炼上线。"
    },
    {
        "title": "Cursor 3 发布：软件开发迈入智能体自主时代",
        "url": "https://www.aibase.com/zh/news/26844",
        "source": "AIBase",
        "category": "AI工具",
        "summary": "Cursor 3发布，标志软件开发从人机协作转向智能体自主工作。核心创新：智能体统一工作区，支持多代码仓库协同与本地/云端智能体无缝切换，引入简洁差异视图UI。"
    },
    {
        "title": "Show HN: A game where you build a GPU（GPU 模拟器游戏爆火 HN 753票）",
        "url": "https://jaso1024.com/mvidia/",
        "source": "Hacker News",
        "category": "技术",
        "summary": "HN热门第一（753票）：一个让你从零构建GPU的游戏，通过游戏化方式理解GPU架构、并行计算和硬件设计。引发硬件工程师和游戏开发者的双重关注。"
    },
    {
        "title": "How many products does Microsoft have named 'Copilot'?（HN 642票）",
        "url": "https://teybannerman.com/strategy/2026/03/31/how-many-microsoft-copilot-are-there.html",
        "source": "Hacker News",
        "category": "行业观察",
        "summary": "HN热门（642票）：系统梳理微软品牌下Copilot产品线的混乱扩张，揭示其AI战略的品牌管理问题，引发对微软AI产品线规划的深度讨论。"
    },
    {
        "title": "AWS 工程师报告 Linux 7.0 导致 PostgreSQL 性能下降 50%（HN 291票）",
        "url": "https://www.phoronix.com/news/Linux-7.0-AWS-PostgreSQL-Drop",
        "source": "Hacker News",
        "category": "技术",
        "summary": "HN热门（291票）：AWS工程师发现Linux 7.0内核导致PostgreSQL性能锐减约50%，且修复方案复杂。涉及内核调度器和内存管理的深层变化，影响大批量云数据库工作负载。"
    },
    {
        "title": "Karpathy LLM Wiki：开源「想法文件」范例",
        "url": "https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f",
        "source": "Hacker News",
        "category": "AI工程",
        "summary": "HN热门（193票）：Karpathy开源发布LLM Wiki示例项目，展示如何使用结构化文本文件与LLM协同工作，作为个人知识管理的轻量级替代方案，引发知识管理新范式讨论。"
    },
    {
        "title": "sllm：与其他开发者共享 GPU 节点，无限 Token（HN 159票）",
        "url": "https://sllm.cloud",
        "source": "Hacker News",
        "category": "AI工具",
        "summary": "HN热门（159票）：sllm云服务允许用户将GPU节点拆分给其他开发者使用，实现Token无限共享，降低个人使用大模型的硬件门槛。"
    },
    {
        "title": "Components of a Coding Agent（HN 234票）",
        "url": "https://magazine.sebastianraschka.com/p/components-of-a-coding-agent",
        "source": "Hacker News",
        "category": "AI工程",
        "summary": "HN热门（234票）：Sebastian Raschka深入解析Coding Agent的组成部分：规划、工具调用、记忆、状态管理等核心模块，为AI编程助手开发提供系统性框架。"
    },
    {
        "title": "OpenAI 悄然资助儿童安全联盟引发透明度质疑",
        "url": "https://www.aibase.com/zh/news/26847",
        "source": "AIBase",
        "category": "AI治理",
        "summary": "OpenAI被曝资助「父母与儿童安全AI联盟」推动加州立法，但未公开资助身份，引发儿童安全组织对透明度的担忧，多个组织在得知OpenAI参与后退出的报道。"
    },
    {
        "title": "北京市新增15款已完成登记的生成式人工智能服务",
        "url": "https://www.aibase.com/zh/news/26846",
        "source": "AIBase",
        "category": "AI政策",
        "summary": "北京市互联网信息办公室发布公告，对直接调用已备案大模型的生成式人工智能应用实行登记管理，允许其合法上线服务。截至2026年4月3日，新增15款完成登记的服务。"
    },
    {
        "title": "LinkedIn 被曝扫描用户浏览器扩展以识别求职竞争情报",
        "url": "https://browsergate.eu/",
        "source": "Hacker News",
        "category": "隐私安全",
        "summary": "安全研究人员发现LinkedIn通过追踪代码扫描用户浏览器扩展列表，用于分析竞争对手招聘情报，HN引发隐私保护争议。"
    },
    {
        "title": "Ex-Human 起诉苹果：指控 App Store 审核不公，扣留 50 万美元收入",
        "url": "https://www.aibase.com/zh/news/26841",
        "source": "AIBase",
        "category": "AI行业",
        "summary": "AI创业公司Ex-Human起诉苹果无证据下架BotifyAI和PhotifyAI并拖欠50万美元收入，指控苹果审核规则模糊且存在双重标准，案件已提交加州联邦法院。"
    },
    {
        "title": "小米 MiMo 大模型首推 Token 套餐：月费 39 元起",
        "url": "https://www.aibase.com/zh/news/26835",
        "source": "AIBase",
        "category": "AI商业化",
        "summary": "小米为MiMo大模型推出首个Token Plan，四档方案：Lite 39元/月、Standard 99元/月、Pro 329元/月、Max 659元/月。订阅可同时获得MiMo-V2-Pro、MiMo-V2-Omni、MiMo-V2-TTS三大模型调用权限。"
    },
    {
        "title": "印度 AI 新星 Sarvam 开启 3.5 亿美元巨额融资：亚马逊、英伟达集体入局",
        "url": "https://www.aibase.com/zh/news/26848",
        "source": "AIBase",
        "category": "AI融资",
        "summary": "印度AI公司Sarvam AI拟融资3-3.5亿美元，估值15-15.5亿美元，贝塞默领投，亚马逊、英伟达、沙特阿美Prosperity7参投，专注22种印度语言、语音交互AI。"
    },
    {
        "title": "美的集团转型 AI 科技巨头：日均 1.3 万个智能体同时在线",
        "url": "https://www.aibase.com/zh/news/26832",
        "source": "AIBase",
        "category": "AI应用",
        "summary": "美的集团正大规模应用AI技术，每天有超1.3万个智能体运行，覆盖研发、制造、供应链及营销等全价值链环节，实现高效协同，标志着AI从实验室走向产业深度应用。"
    },
    {
        "title": "苹果批准 Nvidia eGPU 驱动支持 Arm Mac",
        "url": "https://www.theverge.com/tech/907003/apple-approves-driver-that-lets-nvidia-egpus-work-with-arm-macs",
        "source": "Hacker News",
        "category": "科技",
        "summary": "HN热门：苹果批准了允许Nvidia eGPU在Arm Mac上工作的第三方驱动，打破多年限制，引发开发者社区广泛讨论。"
    },
    {
        "title": "Nvim-treesitter（13K+ Stars）宣布 Archive 停止维护",
        "url": "https://github.com/nvim-treesitter/nvim-treesitter/discussions/8627",
        "source": "Hacker News",
        "category": "开源",
        "summary": "HN热门（86票）：Neovim最重要的语法高亮插件nvim-treesitter（13000+ star）宣布进入Archive状态，标志着Neovim生态的一个时代结束，引发对其替代方案的讨论。"
    },
    {
        "title": "Steam on Linux 使用率 3 月突破 5%，Linux 游戏生态持续壮大",
        "url": "https://www.phoronix.com/news/Steam-On-Linux-Tops-5p",
        "source": "Hacker News",
        "category": "开源",
        "summary": "Steam平台Linux用户使用率在3月首次突破5%大关，创历史新高，反映出Linux游戏生态持续改善，Valve的Proton兼容层功不可没。"
    },
    {
        "title": "OpenScreen：开源 Screen Studio 替代品（HN 291票）",
        "url": "https://github.com/siddharthvaddem/openscreen",
        "source": "Hacker News",
        "category": "效率工具",
        "summary": "HN热门（291票）：OpenScreen是开源屏幕录制工具，定位为Screen Studio的开源替代品，支持高清录制与自动化功能。"
    },
    {
        "title": "德国 eIDAS 实施计划要求用户必须使用 Apple/Google 账号",
        "url": "https://bmi.usercontent.opencode.de/eudi-wallet/wallet-development-documentation-public/latest/architecture-concept/06-mobile-devices/02-mdvm/",
        "source": "Hacker News",
        "category": "隐私安全",
        "summary": "HN热门（258票）：德国数字身份钱包实现方案要求用户必须拥有Apple或Google账号才能使用，引发对数字身份集中化的严重担忧。"
    },
    {
        "title": "AI 搜索引擎 Perplexity 被控隐私侵犯：隐身模式无效",
        "url": "https://www.aibase.com/zh/news/26831",
        "source": "AIBase",
        "category": "安全",
        "summary": "AI搜索引擎Perplexity因隐私问题被起诉，指控其隐身模式无效，用户聊天记录被共享给谷歌和Meta用于广告投放。无论用户是否登录或开启隐私保护，对话内容均被自动共享，涉嫌严重侵犯隐私。"
    }
]

data = {
    "date": "2026-04-05",
    "beijing_date": "2026-04-05",
    "collected_time": "10:00:00",
    "timestamp": "2026-04-05_10",
    "sources": ["hackernews", "36kr", "sspai", "zhihu", "aibase", "twitter"],
    "items": items,
    "hotspots_count": len(items),
    "top_categories": {
        "AI行业": 4,
        "AI模型": 3,
        "技术": 2,
        "AI工程": 2,
        "AI工具": 2,
        "开源": 2,
        "AI治理": 1,
        "AI政策": 1,
        "隐私安全": 2,
        "AI商业化": 1,
        "AI融资": 1,
        "AI应用": 1,
        "行业观察": 1,
        "科技": 1,
        "效率工具": 1
    }
}

with open('/opt/openclaw/agent-b/workspace/data/daily_hotspots/2026-04-05_10.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Written:', len(items), 'items')

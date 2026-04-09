import json

items = [
    {
        "title": "Anthropic 正式封杀 OpenClaw：Claude 订阅不再涵盖第三方工具",
        "url": "https://x.com/op7418/status/2040245390814085270",
        "source": "Twitter @歸藏",
        "category": "AI行业",
        "summary": 'Anthropic 宣布 Claude 订阅将不再涵盖 OpenClaw 等第三方工具，4月4日中午12点PT生效。用户需购买额外用量包，享一个月过渡期赠送同等订阅金额的赠送金。HN热议：OpenClaw 是订阅套利还是合理商业决策，引发关于开源生态与平台限制的深度讨论。'
    },
    {
        "title": "Google Gemma 4 正式开源：Apache 2.0 协议，31B 参数性能直逼头部大模型",
        "url": "https://www.aibase.com/zh/news/26840",
        "source": "AIBase",
        "category": "AI模型",
        "summary": "Google DeepMind 发布 Gemma 4，切换至 Apache 2.0 许可证。31B 版本 Arena 排名第三，AIME 数学测试从 20.8% 飙升至 89.2%，Codeforces ELO 从 110 升至 2150。支持手机端（E2B/E4B）和工作站（26B MoE/31B Dense）全场景，内置 Thinking Mode 和原生 Agent 支持。"
    },
    {
        "title": "Anthropic 禁止 Claude Code 订阅使用 OpenClaw（Hacker News 587评论热议）",
        "url": "https://news.ycombinator.com/item?id=47633396",
        "source": "Hacker News",
        "category": "AI行业",
        "summary": "HN 587评论热门话题：Anthropic 宣布不再允许 Claude Code 订阅使用 OpenClaw 等第三方工具。用户争论焦点：订阅服务的容量管理是否应通过 ToS 而非用量限制来实现，开源生态与平台封闭的边界在哪里。"
    },
    {
        "title": "DeepSeek V4 将基于华为昇腾芯片运行：推迟发布与寒武纪合作",
        "url": "https://x.com/dotey/status/2040236453528064241",
        "source": "Twitter @宝玉",
        "category": "AI模型",
        "summary": "据 The Information 报道，DeepSeek 专门推迟 V4 发布时间，与华为、寒武纪合作重写底层代码，确保在昇腾 950PR 芯片上运行。单卡算力为英伟达 H20 的 2.87 倍，支持 FP4 低精度推理。这是中国 AI 从离不开英伟达到推理环节可用国产替代的关键一步。"
    },
    {
        "title": "Qwen 3.6 Plus 发布：Agent 和编码能力大幅提升，100万上下文",
        "url": "https://x.com/op7418/status/2039991323252723945",
        "source": "Twitter @歸藏",
        "category": "AI模型",
        "summary": "阿里通义发布 Qwen 3.6 Plus，Agent 和编码能力显著提升，默认支持 100 万上下文（最长输出接近 991K）。输入 2元/百万 Token，输出 12元/百万 Token。已在百炼上线。"
    },
    {
        "title": "Cursor 3 发布：软件开发迈入智能体自主时代",
        "url": "https://www.aibase.com/zh/news/26844",
        "source": "AIBase",
        "category": "AI工具",
        "summary": "Cursor 3 发布，标志软件开发从人机协作转向智能体自主工作。核心创新：智能体统一工作区，支持多代码仓库协同与本地/云端智能体无缝切换，引入简洁差异视图 UI。"
    },
    {
        "title": "美团 LongCat-Next 发布：原生多模态，视觉语音底层统一",
        "url": "https://www.aibase.com/zh/news/26849",
        "source": "AIBase",
        "category": "AI模型",
        "summary": "美团发布原生多模态大模型 LongCat-Next，采用 DiNA 架构将图像、语音与文本统一为同源离散 Token。dNaViT 视觉分词器实现 28 倍像素压缩。已全面开源。"
    },
    {
        "title": "千问 App 上线 Wan2.7 视频模型：几句话搞定视频编辑",
        "url": "https://www.aibase.com/zh/news/26850",
        "source": "AIBase",
        "category": "AI工具",
        "summary": "千问 APP 正式上线 Wan2.7 视频生成模型，推出视频编辑、视频续写、动作模仿三大功能。2秒视频可最长续写至15秒，支持多种风格一键切换，开放所有用户免费体验。"
    },
    {
        "title": "微软开启AI自主化总攻：拟 2027 年问世最强自研模型",
        "url": "https://www.aibase.com/zh/news/26830",
        "source": "AIBase",
        "category": "AI行业",
        "summary": "微软正加速自研尖端 AI 模型，目标在 2027 年前实现文本、图像和音频处理能力的行业领先，以挑战 OpenAI 和 Anthropic。此举标志着其 AI 战略从依赖外部合作转向强化自主核心技术开发。"
    },
    {
        "title": "苹果批准 Nvidia eGPU 驱动支持 Arm Mac",
        "url": "https://www.theverge.com/tech/907003/apple-approves-driver-that-lets-nvidia-egpus-work-with-arm-macs",
        "source": "Hacker News",
        "category": "科技",
        "summary": "HN 热门：苹果批准了允许 Nvidia eGPU 在 Arm Mac 上工作的第三方驱动，打破多年限制，引发开发者社区广泛讨论。"
    },
    {
        "title": "Show HN: A game where you build a GPU（GPU 模拟器游戏爆火）",
        "url": "https://jaso1024.com/mvidia/",
        "source": "Hacker News",
        "category": "技术",
        "summary": "HN 热门第一（672票）：一个让你从零构建 GPU 的游戏，通过游戏化方式理解 GPU 架构、并行计算和硬件设计。引发硬件工程师和游戏开发者的双重关注。"
    },
    {
        "title": "AWS 工程师报告 Linux 7.0 导致 PostgreSQL 性能下降 50%",
        "url": "https://www.phoronix.com/news/Linux-7.0-AWS-PostgreSQL-Drop",
        "source": "Hacker News",
        "category": "技术",
        "summary": "HN 热门（253票）：AWS 工程师发现 Linux 7.0 内核导致 PostgreSQL 性能锐减约 50%，且修复方案复杂。涉及内核调度器和内存管理的深层变化，影响大批量云数据库工作负载。"
    },
    {
        "title": "同事.skill GitHub 项目爆火：AI 正在吃掉职场经验",
        "url": "https://www.zhihu.com/question/2023363667584927528",
        "source": "知乎",
        "category": "AI行业",
        "summary": "同事.skill GitHub 项目3天内获上千星，用户上传同事的飞书消息、钉钉文档即可生成可替代该同事工作的 AI skill。引发职场技能被 AI 窃取的法律讨论——若因此被解雇是否受法律保护。"
    },
    {
        "title": "Nvim-treesitter（13K+ Stars）宣布 Archive 停止维护",
        "url": "https://github.com/nvim-treesitter/nvim-treesitter/discussions/8627",
        "source": "Hacker News",
        "category": "开源",
        "summary": "HN 热门（86票）：Neovim 最重要的语法高亮插件 nvim-treesitter（13000+ star）宣布进入 Archive 状态，标志着 Neovim 生态的一个时代结束，引发对其替代方案的讨论。"
    },
    {
        "title": "小米 MiMo 大模型首推 Token 套餐：月费 39 元起",
        "url": "https://www.aibase.com/zh/news/26835",
        "source": "AIBase",
        "category": "AI商业化",
        "summary": "小米为 MiMo 大模型推出首个 Token Plan，四档方案：Lite 39元/月、Standard 99元/月、Pro 329元/月、Max 659元/月。订阅可同时获得 MiMo-V2-Pro、MiMo-V2-Omni、MiMo-V2-TTS 三大模型调用权限。"
    },
    {
        "title": "滴滴 AI 出行助手用户增长 37 倍，清明假期成智能调度大考",
        "url": "https://www.aibase.com/zh/news/26834",
        "source": "AIBase",
        "category": "AI应用",
        "summary": "滴滴 AI 出行助手「小滴」近一周活跃用户较年初激增 37 倍，00 后群体占比超 40%。清明假期打车高峰提前，交通枢纽需求同比涨 239%，异地用车需求增近 40%。"
    },
    {
        "title": "具身智能开发者大会：全球首届 72 小时黑客松落幕",
        "url": "https://www.36kr.com/p/3752115857638145",
        "source": "36氪",
        "category": "具身智能",
        "summary": "全球首届具身智能开发者大会3月29日-4月1日在深圳科创学院举办，20组选手、60+ 小时开发、近百台六轴机械臂、100+ PFLOPs 算力支持。自变量机器人宣布与58到家合作推出全球首个机器人保洁员上岗服务。"
    },
    {
        "title": "AI 搜索引擎 Perplexity 被控隐私侵犯：隐身模式无效",
        "url": "https://www.aibase.com/zh/news/26831",
        "source": "AIBase",
        "category": "安全",
        "summary": "AI 搜索引擎 Perplexity 因隐私问题被起诉，指控其隐身模式无效，用户聊天记录被共享给谷歌和 Meta 用于广告投放。无论用户是否登录或开启隐私保护，对话内容均被自动共享，涉嫌严重侵犯隐私。"
    },
    {
        "title": "千问 AI 眼镜 G1 自费长测：佩戴体验优于 RayBan Meta",
        "url": "https://sspai.com/matrix",
        "source": "少数派",
        "category": "AI产品",
        "summary": "少数派 Matrix 精选：作者自费购买千问 AI 眼镜 G1，对比 RayBan Meta 进行了全面长测。结论：千问 G1 佩戴舒适性更优，AI 本土化体验更好，但音质和可选框型仍有差距。"
    },
    {
        "title": "Karpathy 分享本地 AI 知识库构建方法：Obsidian + 本地 LLM",
        "url": "https://x.com/op7418/status/204047145682040849",
        "source": "Twitter @歸藏",
        "category": "AI工程",
        "summary": "Karpathy 分享了他如何构建本地 AI 知识库：使用 Obsidian 纯本地 MD，通过反向链接和索引连接，配合大语言模型驱动个人 Wiki，展示了本地优先的 AI 知识管理新思路。"
    }
]

data = {
    "date": "2026-04-05",
    "beijing_date": "2026-04-05",
    "collected_time": "08:00:00",
    "timestamp": "2026-04-05_08",
    "sources": ["hackernews", "36kr", "sspai", "zhihu", "aibase", "twitter"],
    "items": items,
    "hotspots_count": len(items),
    "top_categories": {
        "AI模型": 5,
        "AI行业": 4,
        "AI工具": 2,
        "技术": 2,
        "AI应用": 1,
        "具身智能": 1,
        "安全": 1,
        "开源": 1,
        "AI商业化": 1,
        "AI产品": 1,
        "科技": 1
    }
}

with open('/opt/openclaw/agent-b/workspace/data/daily_hotspots/2026-04-05_08.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Written:', len(items), 'items')

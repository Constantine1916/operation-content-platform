// seed-ai-videos.cjs
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const videos = [
  {
    title: 'Gallery Rave Bass Drop',
    prompt: `aesthetic: phone held up in the middle of a packed crowd inside a museum gallery audio: bass booming off marble, every sound doubled by the echo timeline: - "0-5s: Surrounded by a massive crowd, filmed with a phone camera inside a grand museum gallery. High marble ceilings, gold picture frames, a crystal chandelier. The room is PACKED with over 100 people under the chandelier. Paintings on every wall. The music builds." - "5-8s: The drop. The marble floor amplifies every jump into thunder. The chandelier sways. Phone flashlights sweep across the paintings." - "8-15s: The crowd bouncing. Fractured chandelier light across raised hands. Renaissance paintings falling down from the bass vibrations." quality: single shot from the middle of the crowd, warm gallery lighting, gold frames and marble doing all the visual work`,
    author: 'Alex Patrascu',
    author_url: 'https://twitter.com/maxescu/status/2040987170673205536',
    model: 'Seedance 2.0',
    tags: ['music', 'urban', 'intense', 'art', 'neon'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040987170673205536-massive-drop-prompt-below/',
  },
  {
    title: 'Cyberpunk Mech Warrior',
    prompt: `A breathtakingly beautiful young East Asian woman, early 20s, sharp fox-like eyes, flawless porcelain skin, long jet-black hair in a high glossy ponytail with loose strands framing her face, seductive yet confident expression, standing in a powerful pose in a barren desert wasteland under bright daylight. She wears an ultra-detailed, glossy black-and-white futuristic armored bodysuit: tight black corset-style chest plate with metallic accents and subtle gold emblem, white segmented mechanical shoulder pads and arm armor, white thigh armor panels, high black leather thigh-high boots with multiple silver buckles, black gloves. She holds a sleek black futuristic rifle/staff in her right hand. Behind her towers a massive, weathered white battle mech/robot, heavily detailed with battle damage, rust, exposed mechanical parts, giant hydraulic limbs and cockpit head, cinematic low-angle shot. Photorealistic, hyper-detailed 8K, cinematic lighting, sharp focus, dramatic rim lighting, subtle dust in air, epic sci-fi atmosphere, perfect anatomy, intricate mechanical textures, glossy reflections on armor`,
    author: 'Thoughts Creator',
    author_url: 'https://twitter.com/ThoughCreator/status/2040692091207184633',
    model: 'Grok',
    tags: ['cyberpunk', 'mech', 'warrior', 'sci-fi', 'desert'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040692091207184633-grok-imagine-ai-tech-prompt-a-breathtakingly-beaut/',
  },
  {
    title: 'Aerial Duel Anime Battle',
    prompt: `Original Hot-Blooded Duel Anime Short Film: Two top warriors launch their final duel against the backdrop of aerial ruins and thunderstorms. The camera emphasizes extreme speed, intense energy collisions and a sense of oppression from the characters. When moves are released, the surrounding buildings, clouds and debris are simultaneously affected by the force. The actions are like the top-level battle animation of TV anime, with theater-level color grading and lens language, focusing on highlighting the "highly intense, exciting, and blockbuster-like" vibe. A strong hook in the first 2 seconds, with a stable main body, coherent actions, movie-level composition and light and shadow, real texture, epic sense, strong emotion, high-definition details. Completely original characters, worldview, costumes, weapons and moves, no copyright risks.`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['anime', 'battle', 'action', 'fantasy', 'epic'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2039754105460273333-anime-battle-duel/',
  },
  {
    title: 'Fashion Street Tracking',
    prompt: `{"type": "cinematic_hyper_realistic_video", "subject": {"style": "stylish modern subject", "actions": ["walking", "turning", "subtle natural interaction with environment"]}, "scene": {"environment": "dramatic urban luxury city street or modern architecture", "details": ["strong depth", "reflections", "cinematic composition"]}, "camera": {"movement": "smooth cinematic tracking shots", "motion": "slow motion", "lens": "35mm or 50mm", "stabilization": "smooth stabilized motion", "depth_of_field": "shallow"}, "lighting": {"style": "realistic cinematic lighting", "mood": ["golden hour", "neon tones"], "shadows": "soft shadows"}, "visual_style": {"resolution": "4K ultra realism", "color_Grading": "professional cinematic grading", "contrast": "film-like contrast", "textures": "ultra-detailed realistic textures", "aesthetic": "fashion editorial, atmospheric storytelling"}}`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['fashion', 'urban', 'cinematic', 'tracking', 'slow-motion'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040839986845819162-when-youre-just-trying-to-walk-normally-but-the-ca/',
  },
  {
    title: 'Cats Hot Chocolate',
    prompt: `The camera zooms in to a coffee cart at a busy baseball game. At the cart are three cats - one black, one ginger, and another calico. The three work together in unison to make a hot chocolate. One pours chocolate powder into a cup, then begins adding hot water from a kettle. Another melts a small piece of chocolate down in a frying pan. The last cat toasts marshmallows on a stick with a small blow torch. Once the hot water is added to the hot chocolate, the cat toasting the marshmallows takes two off the stick and adds them to the hot chocolate. Then, the cat cooking the chocolate piece in the frying pan drizzles the melted chocolate from the pan on to the marshmallows. Finally, the first cat adds a small cinnamon stick in the side, and holds it towards the viewer with a smile.`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['animal', 'comedy', 'food', 'cute', 'animation'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040852708383429073-need-prompt-inspiration-grab-this/',
  },
  {
    title: 'Tokyo Street Cinematic',
    prompt: `总体风格：日系城市街拍，快节奏碎片化剪辑。冷暖光影交织，夜景带有轻度赛博朋克霓虹氛围，画面具电影感。 BGM与音效：节奏紧凑明快的日系流行摇滚，鼓点清晰，人声充满情绪张力，画面切换与音乐节拍严格卡点。 [0:00-0:01] 白天街景。建筑顶端有3D怒吼雄狮屏幕，下方为罗森便利店，少量行人。 [0:01-0:02] 模糊黑影骑车快速掠过发光自动售货机，带强烈运动模糊。 [0:02-0:03] 车内主观视角。看窗外积雪村庄，内暗外明。 [0:03-0:04] 晴天。密集人群背对镜头走向新宿站玻璃大楼。 [0:04-0:05] 夜间特写。雨后积水石板路倒映霓虹灯，行人快步走过。涩谷十字路口夜景，巨型屏幕与庞大过马路人潮交织。`,
    author: 'John',
    author_url: 'https://x.com/johnAGI168/status/2040797935718318289',
    model: 'Seedance 2.0',
    tags: ['urban', 'japan', 'neon', 'night', 'cinematic'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040797935718318289-japanese-street-cinematic/',
  },
  {
    title: 'Cyberpunk Female Cyborg',
    prompt: `Cinematic 9-second vertical video, ultra-realistic photorealistic style, rainy cyberpunk night street in a futuristic Asian city (neon signs with Chinese characters glowing in the background, wet reflective pavement, blurred crowd of people in winter clothes). A stunning female cyborg stands in the center of the frame. She has a beautiful human face with red lips, partially exposed intricate robotic neck and shoulders with visible pistons, wires and glowing blue circuitry. Dynamic camera movement: starts with a close-up side profile of her head and mechanical neck, slowly orbits around her body while she turns, showing medium full-body shots from the side, then front, then turns to show her back revealing full exposed robotic spine, back armor plates, glowing red and blue lights, and antenna. Rain falls continuously, water droplets run down her wet jacket and metallic surfaces, subtle steam and lens flares. Moody cinematic lighting, volumetric fog, cyberpunk color grading, ultra-detailed textures, 8K, photorealistic.`,
    author: 'Thoughts Creator',
    author_url: 'https://twitter.com/ThoughCreator/status/2040752891267301838',
    model: 'Seedance 2.0',
    tags: ['cyberpunk', 'rain', 'neon', 'sword', 'urban'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040752891267301838-cyborg-rain/',
  },
  {
    title: 'Neon Night Drive',
    prompt: `生成一段16:9比例的视频，包含亚洲顶级帅哥美女，按照以下分镜脚本创作：【镜头一】0秒至1秒，中景，固定，运镜轨迹与速度感：机位稳定，无运镜，主体动作与表情：男女坐于红色敞篷车内，侧脸望前，神态冷峻，画面特效：无，整体色调与情绪：暗调为主，氛围沉闷；【镜头二】1秒至2秒，全景，固定，机位稳定，无运镜，女坐车门，男倚车身脱外套，动作张扬，画面特效：硬切转场，整体色调与情绪：红黑对比，充满街头叛逆感；【镜头三】2秒至3秒，近景，固定，无运镜，男主戴墨镜直视镜头，女主轻撩头发，画面特效：硬切转场，整体色调与情绪：红黑调，情绪冷酷；【镜头四】3秒至4秒，特写，固定，机位固定，汽车后视镜映出女主脸庞，眼神迷离，画面特效：镜面反射，整体色调与情绪：偏冷色调，凸显孤独感；【镜头五】4秒至5秒，中景，仰拍，固定，机位固定，男主身穿白背心抽烟，抬头远望，神色淡漠，画面特效：无，整体色调与情绪：冷灰背景，情绪颓废；【镜头六】5秒至7秒，中景，侧跟拍，与车辆同速平移，具行驶速度感，两人驾车夜游，女侧头看男，神态自然，画面特效：背景动态模糊，整体色调与情绪：夜景霓虹，情绪放松；【镜头七】7秒至9秒，中景，正前跟拍，与车辆同速后退，速度感较强，女主单手握方向盘并比手势，男主随性靠坐，画面特效：背景车灯光斑模糊，整体色调与情绪：色彩丰富，情绪自由奔放；【镜头八】9秒至14秒，近景，固定，机位固定，女主仰头靠椅背，男主戴墨镜凝视前方，神态疏离，画面特效：底部出现字幕，整体色调与情绪：红黑主调，情绪回归孤独与疲惫`,
    author: 'johnAGI168',
    author_url: 'https://x.com/johnAGI168/status/2040337733768331676',
    model: 'Seedance 2.0',
    tags: ['night', 'car', 'neon', 'urban', 'cinematic'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040337733768331676-asian-couple-night-drive/',
  },
  {
    title: 'Morning Rush Beat Sync',
    prompt: `FORMAT: 15s / 145 BPM / 15 SHOTS / beat-synced routine SUBJECT: @[image1]. WARDROBE: Sleep tee and lounge shorts at home. Tailored jacket, fitted top, trousers, and lace-up shoes outside. ENVIRONMENT: Tiny apartment, bright fridge glow, rain-dusted hallway, chrome metro, clean office, then a bedroom in cool window light. Everything feels glossy and lived-in. MOOD: Late-for-work panic, clipped momentum, breathless urgency, then an exhausted exhale. MUSIC: Fast percussive electro-pop COLOR LOGIC: Hyperreal Pop Look. SHOT 1: ECU, 85mm push-in / 06:50 on the phone screen as it shakes on rumpled sheets. SHOT 2: WS, 35mm handheld jolt / Rhythmic cut into her jolting upright through side light, throwing the blanket aside, and planting her feet on the floor in one rushed motion. SHOT 5: Interior fridge view, 24mm wide / Object pass into the camera inside the fridge looking out as the door snaps open and her hand darts in, blue fridge light framing a hurried grab for breakfast ingredients.`,
    author: 'aimikoda',
    author_url: 'https://x.com/aimikoda/status/2040200125533016232',
    model: 'Seedance 2.0',
    tags: ['daily', 'urban', 'music', 'cinematic', 'story'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040200125533016232-daily-routine/',
  },
  {
    title: 'Neon Rooftop Chase Night',
    prompt: `A masked spy races across neon-soaked skyscraper rooftops in the dead of night—rain hammering down as helicopters sweep the skyline with blinding spotlights. The camera tracks every move in a high-intensity chase, sparks bursting as bullets ricochet off metal vents, all captured in cinematic lighting with ultra-realistic, action-film precision.`,
    author: 'UrMeer289',
    author_url: 'https://twitter.com/UrMeer289/status/2039956286662377655',
    model: 'Kling 3.0',
    tags: ['action', 'rooftop', 'urban', 'neon', 'chase'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2039956286662377655-rooftop-shadows/',
  },
  {
    title: 'Luxury Car Commercial',
    prompt: `Film Style: High-end automotive commercial, IMAX feel, ultra-sharp clarity. Lens: 24mm anamorphic. Color Grade: Dark urban tones with neon highlights. Camera Behavior: Fast tracking, whip transitions, drone-like movement.`,
    author: 'Malzahran',
    author_url: 'https://twitter.com/i/status/2040908504123289623',
    model: 'Grok',
    tags: ['car', 'cinematic', 'urban', 'action', 'neon'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040908504123289623-automotive-commercial/',
  },
  {
    title: 'Symbiote Warrior Transformation',
    prompt: `Cinematic 8K video sequence of a stunning East Asian beauty with long flowing jet-black hair transforming into a powerful symbiote warrior in a dark post-apocalyptic ruined city at night. She starts wearing a tight black long-sleeve V-neck dress, standing in shock with mouth slightly open, looking upward, dramatic blue-toned lighting and distant fire glow. Sudden top-down shot: she drops to her knees on cracked concrete as thick, glossy black symbiotic tentacles violently erupt from the ground and her body, spreading like roots. She writhes in pain on all fours while the black liquid symbiote crawls over her skin, rapidly forming a sleek, ultra-glossy black armored bodysuit with sharp angular patterns, glowing blue accents. Her eyes ignite into intense glowing electric blue. Final close-up: she rises powerfully in the full form-fitting glossy black symbiote armor with high collar, shoulder armor plates, clawed fingerless gloves, and a menacing black tactical mask covering her nose and mouth. Intense blue glowing eyes stare directly at camera, dramatic rim lighting, sparks and fire in background, high detail, photorealistic, cinematic color grading, moody atmosphere, dynamic camera angles, slow-motion transformation, 14-second sequence, hyper-realistic textures, 8K --stylize 250 --v 6`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['transformation', 'cyberpunk', 'sci-fi', 'action', 'dark'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040617680185786643-symbiote-warrior/',
  },
  {
    title: 'Cyberpunk Wuxia Flying Boat',
    prompt: `cyberpunk wuxia mechanical warrior piloting a traditional fishing boat over vast sand dunes, sand flying behind like a storm, dynamic motion, futuristic mechanical details on the boat, wind blowing robes and cloaks, dramatic cinematic lighting, epic desert landscape, misty atmosphere, king hu wuxia film style, ultra detailed, wide angle, film still.`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['cyberpunk', 'wuxia', 'desert', 'sci-fi', 'epic'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-03/2037350722006597915-cyberpunk-wuxia-flying-boat/',
  },
  {
    title: 'Mecha Transformation',
    prompt: `核心主题：写实科技感，科幻机甲，磅礴史诗，重工业机械美学，真人演绎，极限运动。人物设定：身高1.7米，面部有微脏感；红色特勤作战服，高科技战术马甲，臂腕带屏控制器，服装和配饰有明显污渍、划痕与使用痕迹；深黑夜晚，光线偏暗，表情坚毅，眉头微皱。场景与机甲：未来感飞船船舱，海上万米高空，乌云闪电，海面海雾，能见度低；80米高重型机甲，真实金属质感，重工业机械美学。画质与氛围：IMAX胶片摄影，Panavision C系列镜头，动态模糊；好莱坞青橙色调，低饱和度，暗部细节保留，胶片颗粒感，轻微柔焦；写实科幻史诗风格，机械感与重量感，好莱坞级视觉特效。`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['mecha', 'transformation', 'sci-fi', 'epic', 'action'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-03/2034818230120849666-seedance-mecha-transformation/',
  },
  {
    title: 'Porsche Transformer Robot',
    prompt: `Generate a 10-second, 16:9, 720p cinematic video. Smooth continuous camera motion with no cuts. The overall pacing is fast and tightly compressed, with rapid escalation from start to finish. Audio evolves quickly from a high-performance engine idle into intricate mechanical shifting and clicks, culminating in a soft electronic chime and the distinct sound of a "mwah" blowing kiss. A sleek, metallic silver Porsche 911 sits on a rain-slicked futuristic city street at night, neon lights reflecting off its polished surface. The camera starts at a low-angle front-quarter view and begins a fast, smooth tracking-arc towards the side. The robot stands tall and elegant. The silver panels lock into place with a satisfying "click," revealing glowing blue LED accents in the seams. The silhouette is clearly feminine, humanoid, and sophisticated. As the robot stabilizes, the camera performs a rapid, smooth zoom-in (Dolly-In) directly to her face. The robot tilts its head slightly, and the optic sensors (eyes) brighten. It brings its mechanical hand to its metallic lips and performs a graceful blowing kiss gesture toward the camera.`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['robot', 'transformation', 'cyberpunk', 'car', 'action'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040453547398185421-we-have-released-seedance-20-httpstcokpmnrndaf0-du/',
  },
  {
    title: 'Dragon Armor Warrior',
    prompt: `Photorealistic cinematic portrait of a confident young East Asian woman warrior standing in the center of a dry grassy battlefield, full-body view. She has long straight dark brown hair with a center part, wearing a black tactical respirator gas mask covering her nose and mouth. She is dressed in sleek, form-fitting futuristic black power armor with intricate gold mechanical accents and glowing golden Chinese dragon motifs. A large, radiant golden dragon emblem dominates her chest plate, with smaller glowing golden dragons on both shoulder pauldrons, forearms, thighs, and calves. The dragons emit a bright neon-gold energy glow. The armor features segmented plates, articulated joints, and tactical details. She stands tall with a powerful stance, hands relaxed at her sides. Background is softly blurred: other armored soldiers in dark uniforms, ancient-style military tents, and red banners under a hazy, overcast sky with dramatic atmospheric lighting. Epic, moody, high-contrast cinematic style, ultra-detailed textures, sharp focus on the subject, 8K resolution, photorealistic, masterpiece, best quality.`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['warrior', 'fantasy', 'armor', 'epic', 'action'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040396054160654480-dragon-armor-warrior/',
  },
  {
    title: 'Blind Shaolin Combat',
    prompt: `cinematic martial arts confrontation in broad daylight, a blind shaolin monk wearing a dark, stylized combat outfit inspired by legendary fighters stands calm and centered, eyes closed, surrounded by multiple hostile creatures emerging from a traditional Japanese landscape. Ultra cinematic choreography coverage, mix of slow dolly-ins + orbit moves + whip pans, transitions masked by body motion and impacts, alternating real-time and slow motion, continuous fluid sequence. (0-2s) wide establishing shot, monk standing still in center, wind moving fabric, creatures circling, tension builds. (2-4s) slow push-in close-up on monk's face, eyes closed, subtle head tilt sensing movement. (4-6s) sudden attack from first creature, monk reacts instantly, precise sidestep + redirection, fluid motion. (6-8s) chained combat sequence, monk engages multiple opponents, spinning strikes, controlled movements, each impact sending creatures flying backward with stylized motion. (8-10s) slow motion highlight: mid-air dodge + counter sequence, cloth movement and body rotation emphasized, creatures suspended briefly before being thrown away. (10-12s) final burst of speed, monk flows through remaining opponents in one continuous movement, camera orbiting rapidly, enemies collapsing or being thrown aside. Ultra realistic, high-end martial arts film choreography, precise body mechanics, cinematic slow motion, strong contrast lighting, volumetric atmosphere, fluid transitions, intense but controlled physical interaction.`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['martial arts', 'combat', 'anime', 'action', 'epic'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2040376349504815467-blind-shaolin-monk/',
  },
  {
    title: 'Anime School Rivalry Battle',
    prompt: `Create a 30-second epic anime fight between a weak hero, two school group rivalry, action fight, punch, dialogue. Secret Power Unleashed.`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['anime', 'battle', 'action', 'fantasy', 'school'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2039627099426931070-anime-fight/',
  },
  {
    title: 'Epic Hand-to-Hand Combat',
    prompt: `Give me the most epic cinematic hand-to-hand combat scene. Cinematic 8K video sequence with ultra-realistic photorealistic style. Dynamic camera movements, dramatic lighting, intense choreography. High-definition details, movie-level composition and light and shadow, epic sense, strong emotion.`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['combat', 'action', 'cinematic', 'epic', 'martial arts'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2039483679156613411-epic-combat/',
  },
  {
    title: 'F16 Wing Stunt',
    prompt: `aesthetic: Raw 35mm handheld, high altitude sun haze. One unbroken continuous tracking shot. No cuts. All real time. audio: Full constant jet engine roar, wind blast, no other sound. timeline: - "0-3s: Normal guy in baggy cargo shorts and flip flops is standing perfectly relaxed balancing on top of the wing of an F16 doing 350mph at 10,000 feet. - 3-7s: The pilot leans out of the canopy, gives a thumbs up towards the guy on the wing. The guy leans forward slightly, smiles and returns the thumbs up. - 7-12s: He does a completely casual, perfectly clean full backflip. No hands. He doesn't grab anything. Lands exactly back on the exact same spot on the wing. He doesn't even stumble. - 12-15s: He brushes a tiny bit of dust off his shorts. Gives a bored little thumbs up straight to the camera. Hard cut. quality: 8K photorealistic, correct fabric motion blur, natural physics, no uncanny valley, no artifacts.`,
    author: 'Anonymous',
    author_url: null,
    model: 'Seedance 2.0',
    tags: ['action', 'comedy', 'aerial', 'fpv', 'extreme'],
    source_url: 'https://awesomevideoprompts.com/prompts/2026-04/2039639802824347878-hold-my-beer/',
  },
];

async function seed() {
  console.log('🌱 Starting AI video seed...');
  for (const video of videos) {
    const { error } = await supabase.from('ai_videos').insert({
      title: video.title,
      prompt: video.prompt,
      author: video.author,
      author_url: video.author_url,
      model: video.model,
      tags: video.tags,
      platform: 'awesomevideoprompts',
      source_url: video.source_url,
    });
    if (error) {
      console.error(`❌ Failed: "${video.title}":`, error.message);
    } else {
      console.log(`✅ ${video.title}`);
    }
  }
  console.log('✨ Done!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });

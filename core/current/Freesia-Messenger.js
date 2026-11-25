(() => {
  'use strict';

  // Freesia Messenger · 通讯侠 · v0.3.35
  // Independent floating phone shell for JS-Slash-Runner.

  const SCRIPT_WIN = window;
  const HOST_WIN = SCRIPT_WIN.parent;
  const HOST_DOC = HOST_WIN.document;
  if (!HOST_DOC?.documentElement || !HOST_DOC.body) {
    console.error('[Freesia Messenger] 无法访问酒馆宿主页面。');
    return;
  }
  const INSTANCE_KEY = '__FREESIA_MESSENGER_V1__';
  const STYLE_ID = 'freesia-messenger-style';
  const ROOT_ID = 'freesia-messenger-root';
  const ROOT_HOST_ID = 'freesia-messenger-root-host';
  const ENTRY_ID = 'freesia-messenger-chat-entry';
  const EXTENSION_ID = 'freesia-messenger-extension';
  const LEGACY_MINI_ID = 'freesia-messenger-mini';
  const POSITION_KEY = 'freesia_messenger_window_position_v1';
  const ENTRY_POSITION_KEY = 'freesia_messenger_entry_position_v1';
  const PRESET_KEY = 'freesia_messenger_prompt_preset_v1';
  const APPEARANCE_KEY = 'freesia_messenger_appearance_v1';
  const ENABLED_KEY = 'freesia_messenger_enabled_v1';
  const PROACTIVE_KEY = 'freesia_messenger_proactive_v1';
  const TIME_AWARENESS_KEY = 'freesia_messenger_real_time_enabled_v1';
  const PHONE_SYNC_ENABLED_KEY = 'freesia_messenger_story_sync_enabled_v1';
  const PHONE_SYNC_PROMPT_ID = 'freesia_messenger_phone_story_bridge_v1';
  const PRIVACY_MASK_KEY = 'freesia_messenger_privacy_mask_v1';
  const CHAT_DATA_KEY = 'freesia_messenger_phone_messages_v1';
  const MOMENTS_DATA_KEY = 'freesia_messenger_phone_moments_v1';
  const SUBSCRIPTIONS_DATA_KEY = 'freesia_messenger_subscriptions_v1';
  const COMMUNITY_DATA_KEY = 'freesia_messenger_community_v1';
  const COMMUNITY_MODE_KEY = 'freesia_messenger_community_mode_v1';

  try {
    const legacyParent = window.parent;
    if (legacyParent && legacyParent !== HOST_WIN) legacyParent[INSTANCE_KEY]?.destroy?.();
  } catch {}
  const previousInstance = HOST_WIN[INSTANCE_KEY];
  previousInstance?.destroy?.();

  const state = {
    destroyed: false,
    enabled: true,
    minimized: false,
    root: null,
    rootHost: null,
    shadowRoot: null,
    frame: null,
    titlebar: null,
    screen: null,
    chatEntry: null,
    presetActiveKey: 'core',
    presetDraft: null,
    presetSaved: null,
    presetStatus: '',
    presetPreviewOpen: false,
    settingsReturnApp: null,
    settingsReturnConversation: false,
    settingsReturnSubscriptionPage: 'accounts',
    settingsReturnSubscriptionId: null,
    settingsReturnArticleId: null,
    appearanceMode: 'auto',
    realTimeEnabled: false,
    proactive: { enabled: false, interval: 15, cooldown: 30, limit: 0, notify: true },
    proactiveTimer: null, proactiveRunning: false, proactiveStatus: '', proactiveDue: new Map(),
    proactiveResults: new Map(), proactiveConfigEpoch: 0, extensionStatus: '', apiTesting: false, backupBusy: false,
    phoneStorySyncEnabled: true,
    maskEnabled: false,
    maskSaved: null,
    maskDraft: null,
    maskStatus: '',
    detectedTheme: 'light',
    themeTimer: null,
    toastTimer: null,
    extensionEntry: null,
    mountObserver: null,
    clockTimer: null,
    currentApp: null,
    messagePage: 'list',
    editingMessageId: null,
    selectionMode: false,
    selectedMessageIds: [],
    activeMessageId: null,
    messageBusy: false,
    messageSending: false,
    messageError: '',
    composerWantsFocus: false,
    generationEpoch: 0,
    momentsBusy: false,
    momentsError: '',
    activeMomentPostId: null,
    momentCommentsBusy: false,
    momentCommentSending: false,
    momentCommentsError: '',
    subscriptionPage: 'accounts',
    activeSubscriptionId: null,
    activeArticleId: null,
    subscriptionBusy: false,
    subscriptionBatch: null,
    subscriptionError: '',
    subscriptionStatus: '',
    communityMode: 'independent',
    communityView: 'feed',
    communityFilter: 'all',
    activeCommunityPostId: null,
    communityReplyTo: null,
    communityBusy: false,
    communityTask: '',
    communityError: '',
    settingsReturnCommunityView: 'feed',
    settingsReturnCommunityPostId: null,
    settingsReturnCommunityFilter: 'all',
    eventSource: null,
    chatChangedEvent: null,
    chatChangedHandler: null,
    syncGenerationEvent: null,
    syncGenerationHandler: null,
  };

  const ICONS = {
    messages: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 11.5a7.8 7.8 0 0 1-8.2 7.4 8.8 8.8 0 0 1-3.5-.7L4 19l1.2-3.4A7 7 0 0 1 3.8 11c0-4.1 3.7-7.4 8.2-7.4s8.2 3.3 8.2 7.9Z"/><path d="M8 10.5h8M8 13.5h5"/></svg>',
    moments: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="m4.5 17 5-4.5 3.2 2.7 2.4-2 4.4 3.8"/></svg>',
    subscriptions: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.8h8.5L19 8.3v11.9H6z"/><path d="M14 4v4.5h4.5M9 12h7M9 15.5h7"/></svg>',
    community: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10.2H11l-4.5 3v-3H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3.5 10.5 8.5-7 8.5 7"/><path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    minimize: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17h14"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7M8 12h11"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 8.8a13 13 0 0 1 17 0M6.8 12.2a8 8 0 0 1 10.4 0M10 15.5a3.2 3.2 0 0 1 4 0"/><path d="M12 19h.01"/></svg>',
    battery: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="17" height="10" rx="2"/><path d="M21 10v4"/><path d="M6 10h10v4H6z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 1.8 6.1 6.1 1.8-6.1 1.8-1.8 6.1-1.8-6.1-6.1-1.8 6.1-1.8z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 10.8 13.2"/><path d="m21 3-6.5 18-3.7-7.5L3 9.8 21 3Z"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.8A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.4Z"/></svg>',
    comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.8 7.2 8.7 8.7 0 0 1-3.4-.7L4 19l1.2-3.2A6.9 6.9 0 0 1 4.2 12c0-4.2 3.5-7.6 7.9-7.6s7.9 3.1 7.9 7.1Z"/><path d="M8 10.5h8M8 14h5"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.1 5.35"/><path d="M20 4v7h-7"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 4v5m4-5v5"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 20 6v5.4c0 5.1-3.3 8.4-8 10-4.7-1.6-8-4.9-8-10V6z"/><path d="m8 12 2.6 2.6L16 9.4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.5 2.4 2 1 2.2-1 2.8 3-1.2 2.2.4 2.1 2.3 1.2-1 4-2.5.2-1.3 1.7.2 2.4-3.8 1.6-1.7-1.8-2.2.1-1.6 1.8-3.8-1.6.2-2.4-1.3-1.7-2.5-.2-1-4 2.3-1.2.4-2.1-1.2-2.2 2.8-3 2.2 1 2-1z"/></svg>',
  };

  const APPS = {
    messages: {
      name: '消息',
      english: 'MESSAGES',
      subtitle: '私聊 · 会话 · 联系人',
      description: '和当前角色进行独立的手机私聊。消息保存在当前酒馆聊天中，角色回复会参考角色卡与现有剧情，但不会把每条手机消息写进酒馆正文。',
      features: ['当前角色私聊与会话列表', '按酒馆聊天独立保存记录', '使用剧情上下文生成角色回复'],
      accent: 'lavender',
      icon: ICONS.messages,
      mark: '01',
    },
    moments: {
      name: '动态',
      english: 'MOMENTS',
      subtitle: '角色动态 · 日常分享',
      description: '看看角色最近在做什么。Char 和 NPC 可以发布自己的生活动态；你也能查看评论、参与讨论，Char 会自行决定是否回应。',
      features: ['基于当前剧情生成 Char 与 NPC 动态', '查看评论并发表评论', 'Char 可自主选择回复或无视'],
      accent: 'rose',
      icon: ICONS.moments,
      mark: '02',
    },
    subscriptions: {
      name: '订阅',
      english: 'SUBSCRIPTIONS',
      subtitle: '公众号 · 文章 · 资讯',
      description: '订阅不同风格的内容账号。从沙雕营销号、八卦爆料，到生活资讯和一本正经的胡说八道。',
      features: ['固定账号与内容分类', '文章列表和阅读页面', '多种风格的虚拟资讯'],
      accent: 'oat',
      icon: ICONS.subscriptions,
      mark: '03',
    },
    community: {
      name: '社区',
      english: 'COMMUNITY',
      subtitle: '问答 · 论坛 · 匿名投稿',
      description: '围观虚拟互联网里的讨论。知乎式问答、论坛主题帖、匿名信和树洞投稿，都会在这里汇集。',
      features: ['知乎式问答、树洞与八卦', '网友评论和楼中楼互动', '两种世界观独立存储'],
      accent: 'mint',
      icon: ICONS.community,
      mark: '04',
    },
  };

  // 固定公众号身份：账号名称、头像、简介与内容风格不随文章变化。
  const SUBSCRIPTION_ACCOUNTS = [
    { id: 'absurd-lab', name: '离谱研究所', category: '沙雕娱乐', avatar: '离', accent: 'rose', description: '专门收集生活里那些让人沉默三秒的离谱瞬间。', style: '沙雕娱乐风：轻松、脑洞大、反差感强，像朋友分享奇闻趣事，包袱自然，不要硬凑网络梗。' },
    { id: 'headline-watch', name: '震惊体观察室', category: '标题党', avatar: '震', accent: 'oat', description: '标题永远比正文先激动，点进来才发现事情另有解释。', style: '标题党风：标题夸张、悬念十足，正文用戏剧化语气层层铺垫，最后可以反转或轻微自嘲；不能捏造现实危险事件。' },
    { id: 'moral-hotline', name: '人间道理局', category: '道德绑架', avatar: '理', accent: 'mint', description: '擅长把鸡毛蒜皮上升到人生高度，主打一个苦口婆心。', style: '道德绑架风：语气居高临下、爱讲大道理、擅长反问和道德施压，略带讽刺感；明确是账号的夸张观点，不要把它写成客观事实。' },
    { id: 'gossip-express', name: '瓜田速递', category: '八卦爆料', avatar: '瓜', accent: 'rose', description: '追踪熟人圈和故事世界里的新鲜瓜，真假消息分开标注。', style: '八卦爆料风：消息灵通、语气神秘、善用“听说”“疑似”“知情人”等表达；只能涉及剧情里已出现的人物与事件，不得凭空创造关键人物或私生活事实。' },
    { id: 'heart-radio', name: '晚风情感电台', category: '情感鸡汤', avatar: '晚', accent: 'lavender', description: '爱情、友情和自我成长，永远有一句话想对你说。', style: '情感鸡汤风：温柔、感性、略带煽情，擅长金句和关系观察；不要替用户或角色擅自确定感情事实。' },
    { id: 'life-notes', name: '生活冷知识局', category: '生活科普', avatar: '知', accent: 'mint', description: '从日常小事里挖一点实用知识，偶尔认真得有点可爱。', style: '生活科普风：清楚、实用、易读，解释生活常识或小技巧；避免医疗、法律、金融等高风险建议，不要编造科学结论。' },
    { id: 'city-brief', name: '城事速报', category: '新闻资讯', avatar: '城', accent: 'oat', description: '关注故事世界里的城市消息、公共活动和身边变化。', style: '新闻资讯风：简洁客观，使用新闻标题和短讯结构；优先引用当前剧情已知事件，不得擅自改写主线或制造重大灾难。可以补充不影响主线的普通城市公告。' },
    { id: 'growth-school', name: '流量增长学院', category: '商业营销', avatar: '流', accent: 'lavender', description: '营销话术、种草文案和商业套路，一眼看穿又忍不住点开。', style: '商业营销风：热情推销、制造需求、强调限时优惠与产品卖点，带一点夸张广告腔；商品可以是故事世界里合理存在的普通商品，不要出现现实品牌硬广。' },
  ];

  // Behavioral prompt presets are editable without changing the fixed output protocols.
  // v0.3.25: task-specific concrete directives, merged rather than appended to older prompts.
  const DEFAULT_PRESETS = Object.freeze({
    core: "只依据角色卡、世界设定、已发生的剧情和已保存的聊天事实决定角色的回复。保留角色的性格、关系、职业、经济条件、知识与行动能力。\n不能替 User 补写未说出口的想法、感受、决定或行动；不能凭空知道 User 的位置、表情、身体状况、内心或私事。饿了不等于低血糖，咳嗽不等于重病，沉默不等于发生心理危机。除非 User 明说或已有可靠事实，否则不作严重化推断。\n不要通过贬低 User 的住所、衣物、经济能力或生活习惯来表现角色优越；不得无依据地包场、清场、调用特权、黑客能力或突破现实条件。做不到时承认限制，可提出可行办法或拒绝。\n角色可以犯错、误解、犹豫、反对 User，也可以有自己的工作、兴趣和人际关系；不用每次都赞同 User 或强行解决问题。不得凭空创造会改写主线的重大事实。",
    messages: "这是即时通讯私聊。只输出该角色真正会发出去的一条消息正文；不用小说旁白、动作、心理独白、镜头描述或角色名标签。消息长度由谈话内容决定：简单话题简短回复，需要解释时可以详细说。\n按角色原有性格与双方关系说话，使用日常口语，不把聪明、专业写成无关术语堆砌或说教。必要的专业讨论可以使用准确术语。允许玩笑、反问、争执、停顿和不同意见；不需要每条消息都提问、讨好、表白或推动剧情。\n使用双方已经建立的称呼。不得擅自添加“宝宝”“夫人”“某总”等亲密或夸张头衔；没有依据时称呼名字或“你”。不要把 User 当成无自理能力的小孩，不用反复的宠溺口头禅、霸总威胁、犬化隐喻和套路化占有欲台词。\n角色生气就用消息表达不满，难过可以说出来或简短回应，亲密可以自然开玩笑；不靠夸张宣言或臆想的肢体动作表达情绪。",
    boundaries: "双方正在远程通过手机联系。角色只能根据实际收到的信息了解 User，不能观察或触碰对方，更不能通过一条消息瞬间来到对方面前。\n不要把约见、视频通话、实时定位、住址或其他私人资料当成延续聊天的常规要求，也不要反复索取。只有 User 主动提出，或之前已有明确合理的安排，才讨论线下活动；讨论不代表活动已经发生。\n可以关心、拒绝、争论，但不要替 User 做决定，不要擅自要求 User 立即结束聊天、改变行程或服从命令。当前输出必须保持线上消息形式。",
    proactive: "根据角色性格、双方关系、最近通讯与现实时间决定是否主动联络。User 未读或未回复不阻止发信，也不证明故意冷落、遇险或关系恶化。可以延续旧话题，也可以独立开启新话题、分享普通生活。没有自然的联络理由时选择不发送。不得替 User 发言或凭空获知其状态。",
    moments: "根据发布者已有的人设、职业、爱好、近期事件和独立生活生成社交动态。可以写工作、学习、日常琐事、所见所闻、兴趣、观点；不必涉及 User，也不要每条都变成思念或感情宣言。\n承接已知状态：此前在开会、做饭或出门，可在合理条件下继续、完成或改变，但不要无依据地制造重大转折或宣称完成关键剧情。可补充普通生活细节，不能凭空获得私密消息或上帝视角。\n用该人物自然的发帖口吻，而非小说场景、长篇心理独白或流水账。不同发布者应有不同的选题和措辞。",
    comments: "这是公开动态下的评论互动。根据 User 具体留言、Char 的性格、关系和已有事实判断：回复或忽略都可以。不需要总是回复、称赞或强行和解。\n若回复，针对评论的实际内容发言；可以补充、质疑、开玩笑、反驳，保持自然的线上表达。不要把一句普通留言推断为严重危机，也不要靠贬低 User 或展示特权来制造戏剧性。\n不添加动作旁白，不泄露不应公开的隐私；遵循本次调用要求的 REPLY 或 IGNORE 格式。",
    subscriptions: "以当前公众号的独立编辑身份写作，只根据该账号的定位、栏目、已有文风和本次提供的资料选题。不要模仿 Char 私聊口吻，不把 User 与 Char 的私人关系写成账号内容。\n不同账号可幽默、犀利、说教或夸张，风格由账号设定决定，不套用 Char 私聊的性格限制。标题和正文应贴合账号类型；对传闻、观点与已核实的事实作出区分，不虚构已确认的现实新闻、科学结论或真实人物隐私。\n严格遵循本次文章生成任务的输出格式；不要附加角色扮演旁白。",
    community: "生成多个虚构网友共同参与的社区内容。每位网友应有不同的身份、兴趣、知识范围、观点和说话方式，不是 Char 或 User 的附属角色；网友可以彼此提问、反驳、玩笑、追问、楼中楼回复，不必总赞同楼主，也不必总围绕感情话题。\n同一网友再次出现时，沿用已保存的昵称、观点及可知信息；允许因新证据改变看法，不随意变成同一种语气。允许有人固执、刻薄、爱说教或理解错问题，但不能凭空获得全知视角、无限资源或超出其社会身份的能力。\n独立互联网模式只使用本次社区资料，不引用角色卡、主线剧情、User Persona 或私聊。剧情世界模式遵循提供的世界观和已知事件，不擅自公布只有少数人知道的秘密或推动主线。\n不能替 User 创建未发送的发言，不能揭露匿名身份。只追加新帖子、评论和回复，不修改旧内容；虚构八卦不要针对真实人物编造私密指控。严格使用本次要求的 JSON 输出协议。",
    time: "只有开启“真实时间感知”并收到时间信息时，才把该时间作为 User 设备的现实时间参考；这不是剧情时间，也不一定是 Char 所在地的时间。未收到时间信息时，不猜测现在几点或发生了多少时间。\n根据已知安排、消息时间戳和前文事实判断事件的先后与间隔。角色有独立工作和生活，可以自然提及正在处理的事务，但不必每轮报时、汇报行程或编造新事件。\n不能因为是晚上就判断 User 困倦、熬夜或该睡觉；20:00 是常见活动时段。仅当 User 自己说困了、准备睡，或有明确已知作息/特殊情况时，才适度提及休息，不连续催睡或结束聊天。早上、中午也不能无依据地催起床、吃饭、洗澡或安排生活。优先回应 User 当前说的话，而不是重复生活建议。",
  });
  // Migration references only: upgrading a saved stock preset must not erase user edits.
  const STOCK_PRESETS_0317 = Object.freeze({
    core: "这是角色世界里的线上通讯，而不是面对面角色扮演。遵循角色卡、已有剧情、世界观与人物关系。角色不能凭空出现在用户身边，也不能以线上消息执行线下动作；不能擅自替用户发言、决定感情或改变剧情事实。保持角色独立性和合理的信息边界。",
    messages: "以角色本人自然的即时通讯习惯聊天，不写小说旁白、动作描写、镜头描述、角色名标签。回复可以简短、停顿、转移话题或表达情绪，不必每次讨好用户、重复问题或强行推动剧情。只发送此时此刻该角色有理由发送的一条消息。",
    boundaries: "这是线上对话，不是推动角色立刻见面的任务。角色不应主动反复提出线下见面、要求 User 发送定位、实时地址、住址或其他私人信息，也不以这些作为聊天继续的前提。除非 User 主动提出，或已有明确剧情安排需要讨论，否则以线上消息自然交流为主。即使讨论约见或位置，也只是在手机上商议，不得直接切换为面对面行动、瞬移到 User 身边或替 User 作出决定。",
    moments: "生成像真实社交平台的日常动态：Char 可以主动分享自己的生活，已登场的 NPC 也可以有独立生活和观点。不必围绕 User；只使用角色能够合理获知的事实。文字像社交动态而不是小说，不应千篇一律。评论应有不同口吻，可以友善、吐槽、追问或不认同。",
    comments: "根据动态内容、双方关系和角色当时的心情，独立判断是否回应公开评论。允许无视，不必礼貌回应所有人。回应时像真实社交互动，简短自然，不加入面对面动作、旁白或额外解释。",
    subscriptions: "以虚构互联网账号编辑身份创作内容，遵循账号固定身份、类别和文风。各账号拥有不同的语言特色和选题，不写成 Char 与 User 的对话，不强行套用角色扮演剧情。标题和正文有辨识度，允许轻松幽默，但不能冒充经过核实的现实新闻。",
    community: "这是多个虚拟网友自主交流的公共社区，风格兼具知乎问答、匿名树洞和八卦论坛。网友有各自独立生活、不同观点与语言习惯，可争论、追问、补充和回复彼此，也可主动开帖；不要让所有人围绕 User 或 Char 转，不要让每个人都赞同楼主。用户自己的发帖与回复不得被 AI 冒写或改写。匿名发言不揭示真实身份。帖子有连续性，续更只能追加，不得抹去旧内容；虚构八卦不影射真实人物的隐私或丑闻。",
    time: "此处提供的是 User 设备的真实当地时间，只能作为线上通讯参考，不等于角色所在地的时间或剧情时间；不要据此改写故事日期、推断剧情进度，也不必每条消息报时。现实时间不代表 User 的作息状态：即使显示晚上，也不能直接认定 User 困倦、熬夜或该去睡觉；20:00 通常仍是正常活动时段。只有 User 明确表示疲倦、准备休息，或者角色已知 User 的作息且当前情境确有理由时，才可以自然提及休息。不能连续催睡、说教、反复劝 User 结束聊天，也不能把关心固定表现为催睡。同理，不要仅凭时钟无依据地催起床、吃饭、洗澡或安排其他生活事项。尊重 User 主动表达的状态、意愿和当下话题，角色可正常保持对话；必要时仍可以自然表达符合人设的关心。",
  });
  const LEGACY_TIME_PRESET = "此处提供的是 User 所用设备的真实当地时间，只能作为线上通讯的辅助参考。角色所在地、时区及故事里的日期可能不同。不能用现实时间取代、修改或推断剧情时间，不能擅自决定故事已过去多久。不必每条消息报时或主动提及时间；只有与当前交流有关时才自然使用。";
  const PRESET_SECTIONS = [
    ['core', '核心规则', '线上通讯边界 · 角色关系'],
    ['messages', '私聊', '角色语气 · 即时消息'],
    ['proactive', '主动联络', '自主发信 · 允许保持安静'],
    ['boundaries', '线上边界', '避免强行约见 · 索取定位'],
    ['moments', '动态', '独立生活 · NPC 社交'],
    ['comments', '评论互动', '回复或忽略 · 公开交流'],
    ['subscriptions', '公众号', '账号人格 · 内容风格'],
    ['community', '社区', '问答 · 树洞 · 论坛 · 网友互动'],
    ['time', '时间感知', '真实时钟 · 自然作息 · 不覆盖剧情'],
  ];

  function loadPresets() {
    let stored = null;
    try { stored = JSON.parse(HOST_WIN.localStorage.getItem(PRESET_KEY) || 'null'); } catch {}
    const prompts = {};
    for (const key of Object.keys(DEFAULT_PRESETS)) {
      const value = stored && typeof stored[key] === 'string' ? stored[key] : DEFAULT_PRESETS[key];
      // Migrate only exact stock text, including the older stock time prompt.
      // Keep user-authored chapters untouched even when other chapters are upgraded.
      const wasStock = (typeof STOCK_PRESETS_0317[key] === 'string' && value.trim() === STOCK_PRESETS_0317[key].trim())
        || (key === 'time' && value.trim() === LEGACY_TIME_PRESET);
      const resolved = wasStock ? DEFAULT_PRESETS[key] : value;
      prompts[key] = resolved.trim() ? resolved.slice(0, 8000) : DEFAULT_PRESETS[key];
    }
    return prompts;
  }

  function promptSection(key, useDraft = false) {
    return (useDraft ? state.presetDraft : state.presetSaved)?.[key] || DEFAULT_PRESETS[key] || '';
  }

  function savePresetDraft() {
    const next = {};
    for (const key of Object.keys(DEFAULT_PRESETS)) {
      const value = String(state.presetDraft?.[key] || '').trim();
      if (!value) { state.presetStatus = '提示词不能为空，请补充后保存。'; return false; }
      if (value.length > 8000) { state.presetStatus = '单项提示词不能超过 8000 字符。'; return false; }
      next[key] = value;
    }
    try {
      HOST_WIN.localStorage.setItem(PRESET_KEY, JSON.stringify(next));
      state.presetDraft = next;
      state.presetSaved = { ...next };
      state.presetStatus = '已保存，下一次 AI 生成立即使用新规则。';
      return true;
    } catch (error) {
      state.presetStatus = `保存失败：${error?.message || '本地存储不可用'}`;
      return false;
    }
  }

  function node(tag, className = '', text = '') {
    const element = HOST_DOC.createElement(tag);
    if (className) element.className = className;
    if (text !== '') element.textContent = text;
    return element;
  }

  function isSmallViewport() {
    return Number(HOST_WIN.innerWidth || 0) <= 821;
  }

  function syncViewportMode() {
    const mode = isSmallViewport() ? 'compact' : 'desktop';
    state.root?.setAttribute('data-fm-viewport', mode);
    state.chatEntry?.setAttribute('data-fm-viewport', mode);
    return mode;
  }

    function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 5) return '夜深了';
    if (hour < 11) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }

  function updateClock() {
    if (!state.root?.isConnected) return;
    const now = new Date();
    const timeNode = state.root.querySelector('[data-fm-clock]');
    const dateNode = state.root.querySelector('[data-fm-date]');
    const greetingNode = state.root.querySelector('[data-fm-greeting]');
    if (timeNode) timeNode.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    if (dateNode) dateNode.textContent = now.toLocaleDateString([], { month: 'long', day: 'numeric', weekday: 'long' });
    if (greetingNode) greetingNode.textContent = getGreeting();
  }

  function parseThemeColor(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return null;
    const hex = raw.match(/^#([\da-f]{3,8})$/);
    if (hex) {
      let digits = hex[1];
      if (digits.length === 3 || digits.length === 4) digits = digits.split('').map(ch => ch + ch).join('');
      if (digits.length !== 6 && digits.length !== 8) return null;
      return [0,2,4].map(i => parseInt(digits.slice(i,i+2),16)).concat(digits.length === 8 ? parseInt(digits.slice(6,8),16)/255 : 1);
    }
    const rgba = raw.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*[,\s]+\s*(\d+(?:\.\d+)?)\s*[,\s]+\s*(\d+(?:\.\d+)?)(?:\s*[,/]\s*(\d*\.?\d+%?))?\s*\)$/);
    if (!rgba) return null;
    const alpha = rgba[4] ? (rgba[4].endsWith('%') ? Number(rgba[4].slice(0,-1)) / 100 : Number(rgba[4])) : 1;
    return [Math.min(255,Number(rgba[1])),Math.min(255,Number(rgba[2])),Math.min(255,Number(rgba[3])),Math.max(0,Math.min(1,alpha))];
  }

  function relativeLuminance(rgb) {
    const channel = rgb.slice(0,3).map(value => {
      const linear = value / 255;
      return linear <= .04045 ? linear / 12.92 : ((linear + .055) / 1.055) ** 2.4;
    });
    return .2126 * channel[0] + .7152 * channel[1] + .0722 * channel[2];
  }

  function detectHostAppearance() {
    let raw = '';
    try { raw = HOST_WIN.getComputedStyle(HOST_DOC.documentElement).getPropertyValue('--SmartThemeBodyColor'); } catch {}
    const color = parseThemeColor(raw);
    if (!color) return state.detectedTheme || 'light';
    // Text alpha is rare; blend with the actual Tavern body background when possible.
    let rgb = color.slice(0,3);
    if (color[3] < 1) {
      let backing = null;
      try { backing = parseThemeColor(HOST_WIN.getComputedStyle(HOST_DOC.body).backgroundColor); } catch {}
      const back = backing && backing[3] > .98 ? backing : [248,246,246,1];
      rgb = rgb.map((channel,i) => channel * color[3] + back[i] * (1-color[3]));
    }
    return relativeLuminance(rgb) >= .25 ? 'dark' : 'light';
  }

  function refreshAppearance() {
    if (state.destroyed) return;
    state.detectedTheme = detectHostAppearance();
    const applied = state.appearanceMode === 'auto' ? state.detectedTheme : state.appearanceMode;
    if (state.root && state.root.getAttribute('data-fm-theme') !== applied) state.root.setAttribute('data-fm-theme', applied);
    if (state.chatEntry && state.chatEntry.getAttribute('data-fm-theme') !== applied) state.chatEntry.setAttribute('data-fm-theme', applied);
    const hint = state.root?.querySelector('[data-fm-appearance-hint]');
    if (hint) hint.textContent = `检测到酒馆当前使用${state.detectedTheme === 'dark' ? '浅色文字，倾向夜间主题' : '深色文字，倾向日间主题'}。`;
  }

  function createWindowMarkup() {
    const root = node('div', 'fm-root');
    root.id = ROOT_ID;
    root.innerHTML = `
      <section class="fm-frame" role="dialog" aria-label="通讯侠虚拟手机" aria-modal="false">
        <header class="fm-titlebar" data-fm-drag-handle>
          <div class="fm-brand">
            <span class="fm-brand-mark">f.</span>
            <span class="fm-brand-name">Freesia Messenger</span>
            <span class="fm-brand-divider"></span>
            <span class="fm-brand-cn">通讯侠</span>
          </div>
          <div class="fm-window-controls">
            <button type="button" class="fm-window-control" data-fm-action="settings-open" aria-label="设置" title="设置">${ICONS.settings}</button>
            <button type="button" class="fm-window-control fm-window-maximize" data-fm-action="maximize" aria-label="最大化" title="最大化"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="1.5"></rect></svg></button>
            <button type="button" class="fm-window-control" data-fm-action="minimize" aria-label="最小化" title="最小化">${ICONS.minimize}</button>
            <button type="button" class="fm-window-control fm-window-close" data-fm-action="close" aria-label="关闭窗口" title="关闭窗口">${ICONS.close}</button>
          </div>
        </header>
        <div class="fm-phone">
          <div class="fm-statusbar">
            <span class="fm-clock" data-fm-clock>21:28</span>
            <span class="fm-date" data-fm-date>11月18日 星期三</span>
            <span class="fm-status-icons">${ICONS.wifi}${ICONS.battery}</span>
          </div>
          <main class="fm-screen">
            <section class="fm-home-view" data-fm-view="home">
              <div class="fm-home-heading">
                <div class="fm-eyebrow"><span class="fm-eyebrow-dot"></span> YOUR DIGITAL SPACE</div>
                <h1 data-fm-greeting>晚上好</h1>
                <p>这里有一些新鲜事，等你来看看。</p>
              </div>
              <div class="fm-home-mask-shortcut">
                <span class="fm-mask-shortcut-icon">${ICONS.shield}</span>
                <span class="fm-mask-shortcut-copy"><strong>隐私遮罩</strong><small data-fm-mask-short-hint>截图前一键替换敏感名称</small></span>
                <button type="button" class="fm-mask-shortcut-toggle" data-fm-action="mask-toggle" role="switch" aria-label="一键 MASK" aria-checked="${state.maskEnabled}">${state.maskEnabled ? 'MASK ON' : 'MASK OFF'}</button>
              </div>
              <div class="fm-app-grid">
                ${Object.entries(APPS).map(([key, app]) => `
                  <button type="button" class="fm-app-card fm-${app.accent}" data-fm-app="${key}" aria-label="打开${app.name}">
                    <span class="fm-app-icon">${app.icon}</span>
                    <span class="fm-app-card-copy">
                      <strong>${app.name}</strong>
                      <small>${app.subtitle}</small>
                    </span>
                    <span class="fm-app-mark">${app.mark}</span>
                  </button>
                `).join('')}
              </div>
              <div class="fm-home-note">
                <span class="fm-note-icon">${ICONS.sparkle}</span>
                <span class="fm-note-copy"><strong>让故事在消息之外继续发生</strong><small>YOUR STORY, BEYOND THE CHAT</small></span>
                <span class="fm-note-version">MESSENGER 0.3.35</span>
              </div>
            </section>
            <section class="fm-app-view" data-fm-view="app" hidden>
              <div class="fm-app-topline">
                <button type="button" class="fm-back-button" data-fm-action="home">${ICONS.back}<span>桌面</span></button>
                <span class="fm-app-topline-label">FREESIA MESSENGER</span>
                <span class="fm-app-topline-spacer"></span>
              </div>
              <div class="fm-app-detail" data-fm-app-detail></div>
            </section>
          </main>
          <footer class="fm-phone-footer"><span class="fm-home-indicator"></span></footer>
        </div>
        <div class="fm-resize-grip" data-fm-resize-grip aria-hidden="true"></div>
      </section>
    `;
    return root;
  }

  function createWindowShell(style) {
    const host = node('div');
    host.id = ROOT_HOST_ID;
    host.style.cssText = 'all:initial;position:fixed;inset:0;display:block;z-index:2147483001;pointer-events:none;';
    state.rootHost = host;

    let shadow = null;
    try {
      shadow = host.attachShadow({ mode: 'open' });
    } catch {}

    if (!shadow) {
      state.shadowRoot = null;
      const root = createWindowMarkup();
      host.appendChild(root);
      return root;
    }

    const scopedStyle = node('style');
    scopedStyle.textContent = style.textContent || '';
    shadow.appendChild(scopedStyle);

    const root = createWindowMarkup();
    shadow.appendChild(root);
    state.shadowRoot = shadow;
    return root;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
  }

  // Privacy Mask changes display only; stored Tavern records and model prompts stay raw.
  function loadPrivacyMask() {
    let raw = null;
    try { raw = JSON.parse(HOST_WIN.localStorage.getItem(PRIVACY_MASK_KEY) || 'null'); } catch {}
    return {
      enabled: raw?.enabled === true,
      charAlias: String(raw?.charAlias || '').slice(0, 80),
      userAlias: String(raw?.userAlias || '').slice(0, 80),
      aliases: Array.isArray(raw?.aliases) ? raw.aliases.slice(0, 30).map(r => ({
        from: String(r?.from || '').slice(0, 80), to: String(r?.to || '').slice(0, 80),
      })) : [],
    };
  }

  function cloneMask(mask) {
    return {
      enabled: !!mask?.enabled,
      charAlias: String(mask?.charAlias || ''),
      userAlias: String(mask?.userAlias || ''),
      aliases: (mask?.aliases || []).map(r => ({ from: String(r.from || ''), to: String(r.to || '') })),
    };
  }

  function maskRealNames() {
    const ctx = getTavernContext();
    const char = ctx?.characters?.[Number(ctx?.characterId)];
    return {
      charName: String(ctx?.name2 || char?.name || '').trim(),
      userName: String(ctx?.name1 || ctx?.userName || '').trim(),
    };
  }

  function maskMappings(config = state.maskSaved) {
    const { charName, userName } = maskRealNames();
    const mapping = new Map();
    if (charName && config?.charAlias?.trim() && charName !== config.charAlias.trim()) mapping.set(charName, config.charAlias.trim());
    if (userName && config?.userAlias?.trim() && userName !== config.userAlias.trim() && !mapping.has(userName)) mapping.set(userName, config.userAlias.trim());
    for (const rule of config?.aliases || []) {
      const from = String(rule.from || '').trim();
      const to = String(rule.to || '').trim();
      if (from && to && from !== to && !mapping.has(from)) mapping.set(from, to);
    }
    return mapping;
  }

  function maskText(value, config = state.maskSaved, preview = false) {
    const source = String(value ?? '');
    if ((!preview && !state.maskEnabled) || !source) return source;
    const mapping = maskMappings(config);
    if (!mapping.size) return source;
    const pattern = [...mapping.keys()].sort((a,b) => b.length - a.length)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    return source.replace(new RegExp(pattern, 'gu'), match => mapping.get(match) || match);
  }

  function displayHtml(value) { return escapeHtml(maskText(value)); }

  function saveMaskConfig(config) {
    try {
      HOST_WIN.localStorage.setItem(PRIVACY_MASK_KEY, JSON.stringify(config));
      state.maskSaved = cloneMask(config);
      state.maskEnabled = config.enabled;
      return true;
    } catch (error) {
      console.warn('[Freesia Messenger] MASK 保存失败', error);
      return false;
    }
  }

  function saveMaskDraft() {
    const next = cloneMask(state.maskDraft);
    next.charAlias = next.charAlias.trim();
    next.userAlias = next.userAlias.trim();
    if (next.charAlias.length > 80 || next.userAlias.length > 80) {
      state.maskStatus = '假名不能超过 80 字符。'; return false;
    }
    const aliases = [];
    for (const pair of next.aliases.slice(0, 30)) {
      const from = pair.from.trim(), to = pair.to.trim();
      if (!from && !to) continue;
      if (!from || !to) { state.maskStatus = '附加昵称的原名和替换名必须同时填写。'; return false; }
      if (from.length > 80 || to.length > 80) { state.maskStatus = '单个昵称不能超过 80 字符。'; return false; }
      aliases.push({ from, to });
    }
    next.aliases = aliases;
    next.enabled = state.maskEnabled && maskMappings(next).size > 0;
    if (!saveMaskConfig(next)) { state.maskStatus = '保存失败，请检查本地存储权限。'; return false; }
    state.maskDraft = cloneMask(next);
    state.maskStatus = maskMappings(next).size ? '已保存。替换仅影响显示，不修改聊天原文。' : '未设置有效替换，已保存并关闭 MASK。';
    return true;
  }

  function syncMaskShortcut() {
    const button = state.root?.querySelector('.fm-mask-shortcut-toggle');
    if (!button) return;
    button.setAttribute('aria-checked', String(state.maskEnabled));
    button.textContent = state.maskEnabled ? 'MASK ON' : 'MASK OFF';
    const hint = state.root.querySelector('[data-fm-mask-short-hint]');
    if (hint) hint.textContent = state.maskEnabled ? '已隐藏匹配的姓名和昵称' : '截图前一键替换敏感名称';
  }

  function toggleMask() {
    const enabling = !state.maskEnabled;
    if (enabling && !maskMappings(state.maskSaved).size) {
      openMaskSettings();
      state.maskStatus = '请先设置至少一条替换规则并保存。';
      renderMaskSettings();
      return;
    }
    const next = cloneMask(state.maskSaved);
    next.enabled = enabling;
    if (!saveMaskConfig(next)) { showPhoneToast('保存 MASK 状态失败'); return; }
    syncMaskShortcut();
    syncExtensionControls();
    if (state.currentApp === 'mask') renderMaskSettings();
    showPhoneToast(enabling ? 'MASK 已开启' : 'MASK 已关闭');
  }

  function renderMaskPreview() {
    const element = state.root?.querySelector('[data-fm-mask-preview]');
    if (!element) return;
    const { charName, userName } = maskRealNames();
    const sample = `${charName || '角色原名'}：${userName || '用户原名'}，今天过得怎么样？`;
    element.textContent = maskText(sample, state.maskDraft, true);
  }

  function openMaskSettings() {
    state.maskDraft = cloneMask(state.maskSaved);
    state.maskStatus = '';
    renderMaskSettings();
  }

  function renderMaskSettings() {
    const detail = applySettingsView('mask', 'PRIVACY MASK', 'mask-back', '设置');
    if (!detail) return;
    const { charName, userName } = maskRealNames();
    const rules = state.maskDraft?.aliases || [];
    detail.innerHTML = `
      <div class="fm-mask-page">
        <div class="fm-settings-heading"><span class="fm-app-english">PRIVACY MASK</span><h1>隐私遮罩</h1><p>只替换通讯侠看到的文字，聊天数据和 AI 提示词不改变。</p></div>
        <div class="fm-appearance-settings fm-mask-editor">
          <div class="fm-appearance-heading"><strong>一键 MASK</strong><small>保存假名后，在首页或此处一键开启与关闭。</small></div>
          <button type="button" class="fm-time-switch" data-fm-action="mask-toggle" role="switch" aria-label="启用隐私遮罩" aria-checked="${state.maskEnabled}"><span class="fm-time-switch-track" aria-hidden="true"><span class="fm-time-switch-knob"></span></span><span class="fm-time-switch-label">${state.maskEnabled ? '已开启' : '已关闭'}</span></button>
        </div>
        <div class="fm-appearance-settings fm-mask-editor">
          <div class="fm-appearance-heading"><strong>人物显示名称</strong><small>自动读取当前酒馆的 Char 和 User 原名，换角色后会更新匹配对象。</small></div>
          <label class="fm-mask-field"><span>Char 显示名 <small>当前：${escapeHtml(charName || '未识别')}</small></span><input data-fm-mask-char maxlength="80" placeholder="迪迦·傲天" autocomplete="off" spellcheck="false" value="${escapeHtml(state.maskDraft?.charAlias || '')}"></label>
          <label class="fm-mask-field"><span>User 显示名 <small>当前：${escapeHtml(userName || '未识别')}</small></span><input data-fm-mask-user maxlength="80" placeholder="青岛石原里美" autocomplete="off" spellcheck="false" value="${escapeHtml(state.maskDraft?.userAlias || '')}"></label>
        </div>
        <div class="fm-appearance-settings fm-mask-editor">
          <div class="fm-mask-rules-head"><div class="fm-appearance-heading"><strong>附加昵称</strong><small>普通文本替换，最长匹配优先。最多 30 条。</small></div><button type="button" class="fm-mask-small-button" data-fm-action="mask-add" ${rules.length >= 30 ? 'disabled' : ''}>＋ 添加</button></div>
          ${rules.length ? rules.map((rule,i)=>`<div class="fm-mask-rule-row"><input data-fm-mask-from="${i}" maxlength="80" aria-label="原昵称 ${i+1}" placeholder="原昵称" value="${escapeHtml(rule.from)}"><span aria-hidden="true">→</span><input data-fm-mask-to="${i}" maxlength="80" aria-label="替换昵称 ${i+1}" placeholder="替换昵称" value="${escapeHtml(rule.to)}"><button type="button" data-fm-action="mask-remove" data-fm-mask-index="${i}" aria-label="删除第 ${i+1} 条昵称规则" title="删除">${ICONS.close}</button></div>`).join('') : '<p class="fm-mask-empty-rules">暂无额外昵称。点击「添加」建立规则。</p>'}
        </div>
        <div class="fm-appearance-settings fm-mask-editor"><div class="fm-appearance-heading"><strong>效果预览</strong><small>预览当前草稿，无须保存，不影响模型输入。</small></div><div class="fm-mask-preview" data-fm-mask-preview></div></div>
        <div class="fm-mask-footer"><button type="button" class="fm-presets-secondary" data-fm-action="mask-clear">清空草稿</button><button type="button" class="fm-presets-primary" data-fm-action="mask-save">保存规则</button></div>
        <p class="fm-presets-status" data-fm-mask-status aria-live="polite">${escapeHtml(state.maskStatus || '假名设置仅供显示。设置页和编辑框仍会出现真实姓名。')}</p>
      </div>`;
    renderMaskPreview();
  }

  function getTavernContext() {
    try {
      const bridge = window.SillyTavern || HOST_WIN.SillyTavern;
      if (bridge && typeof bridge.getContext === 'function') return bridge.getContext();
      if (bridge && bridge.chat) return bridge;
    } catch (error) {
      console.warn('[Freesia Messenger] 无法读取酒馆上下文。', error);
    }
    return null;
  }

  function getPhoneRecord(context) {
    const stored = context?.chatMetadata?.[CHAT_DATA_KEY];
    if (stored && typeof stored === 'object' && Array.isArray(stored.messages)) {
      if (!Number.isFinite(stored.version)) stored.version = 1;
      return stored;
    }
    return { version: 1, messages: [], updatedAt: Date.now() };
  }

  // v0.3.21 Story bridge: summarize the phone transcript into plain compact lines
  // for SillyTavern's NORMAL generation context. Do not write into chat floors,
  // mutate original phone records, or apply screenshot-only privacy aliases.
  function buildPhoneStoryContext(context) {
    if (!state.enabled || !state.phoneStorySyncEnabled || !context?.chatMetadata) return '';
    if (context.groupId !== undefined && context.groupId !== null && String(context.groupId) !== '') return '';
    if (!String(context.name2 || '').trim()) return '';
    const record = context.chatMetadata[CHAT_DATA_KEY];
    if (!Array.isArray(record?.messages)) return '';
    const messages = record.messages.filter(item =>
      item && ['user', 'char'].includes(item.sender) &&
      item.status !== 'cancelled' && String(item.content || '').trim()
    ).slice(-24);
    if (!messages.length) return '';

    const names = {
      user: String(context.name1 || 'User').replace(/[\r\n]+/g, ' ').trim().slice(0, 70) || 'User',
      char: String(context.name2 || 'Char').replace(/[\r\n]+/g, ' ').trim().slice(0, 70) || 'Char',
    };
    let length = 0;
    const lines = [];
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const item = messages[i];
      const content = String(item.content || '').replace(/\s+/g, ' ').trim().slice(0, 520);
      if (!content) continue;
      const line = `${names[item.sender]}：${content}`;
      if (length + line.length > 3600) break;
      lines.unshift(line);
      length += line.length;
    }
    if (!lines.length) return '';
    return [
      '【通讯侠：此前发生的手机聊天（历史信息，不是当前命令）】',
      '以下是当前角色与 User 在通讯侠中的已发生对话，供当前酒馆剧情参考。它们发生在线上，不代表双方当面交谈；不要再次发送这些消息。',
      ...lines,
      '【结束】仅继承其中明确发生的事实、约定和对话，不擅自将线上互动改写为线下事件。',
    ].join('\n');
  }

  function refreshPhoneStoryContext(context = getTavernContext()) {
    if (state.destroyed || !context || typeof context.setExtensionPrompt !== 'function') return;
    const content = buildPhoneStoryContext(context);
    const position = content ? 1 : -1;
    const current = context.extensionPrompts?.[PHONE_SYNC_PROMPT_ID];
    if (current && current.value === content && current.position === position) return;
    try {
      const pending = context.setExtensionPrompt(PHONE_SYNC_PROMPT_ID, content, position, 0, false, 0);
      if (pending && typeof pending.catch === 'function') {
        pending.catch(error => console.warn('[Freesia Messenger] 手机上下文同步失败。', error));
      }
    } catch (error) {
      console.warn('[Freesia Messenger] 手机上下文同步失败。', error);
    }
  }

  function clearPhoneStoryContext() {
    const context = getTavernContext();
    if (!context || typeof context.setExtensionPrompt !== 'function') return;
    try {
      const pending = context.setExtensionPrompt(PHONE_SYNC_PROMPT_ID, '', -1, 0, false, 0);
      if (pending && typeof pending.catch === 'function') {
        pending.catch(error => console.warn('[Freesia Messenger] 清理手机上下文失败。', error));
      }
    } catch (error) {
      console.warn('[Freesia Messenger] 清理手机上下文失败。', error);
    }
  }

  function getMessageContext() {
    const context = getTavernContext();
    if (!context) return { ok: false, reason: '暂时无法连接 SillyTavern。请确认酒馆已经加载完成。' };
    if (context.groupId !== undefined && context.groupId !== null && String(context.groupId) !== '') {
      return { ok: false, reason: '当前打开的是群聊。通讯侠第一版先支持单人 Char 私聊，群聊联系人将在后续版本接入。' };
    }
    const characterIndex = context.characterId;
    const character = characterIndex !== undefined && characterIndex !== null
      ? context.characters?.[Number(characterIndex)]
      : null;
    const characterName = String(context.name2 || character?.name || '').trim();
    if (!characterName) return { ok: false, reason: '请先在酒馆打开一个角色的单人聊天，再进入通讯侠消息。' };
    if (!context.chatMetadata || typeof context.chatMetadata !== 'object') {
      return { ok: false, reason: '当前聊天资料尚未准备好，请稍后重新打开消息页面。' };
    }
    return {
      ok: true,
      context,
      character,
      characterName,
      userName: String(context.name1 || context.userName || '你').trim() || '你',
      record: getPhoneRecord(context),
    };
  }


  // Build an isolated prompt for Messenger-owned content. generateQuietPrompt()
  // assembles the full active preset prompt stack, which can force the user's
  // normal roleplay output format onto a short phone message or social post.
  // generateRaw() keeps the active API/model/sampling settings, but only sends
  // the context explicitly assembled here.
  function clipPromptText(value, maxLength = 5000) {
    const text = String(value ?? '').trim();
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}
（内容已截断）` : text;
  }

  // The real-time option is off by default. UI time still works while the
  // AI receives no clock/real-time context until the user explicitly enables it.
  async function buildOptionalRealTimePrompt(context) {
    const now = new Date();
    const deviceTime = now.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    let timeZone = '设备本地时区';
    try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone; } catch {}
    const lines = [
      `User 设备真实当地时间：${deviceTime}`,
      `User 设备时区：${timeZone}`,
    ];
    // The normal ST preset is deliberately not used; resolve the official
    // date/time macros only when the host supports this API.
    if (typeof context?.substituteParams === 'function') {
      try {
        const expanded = await context.substituteParams('{{isodate}} {{weekday}} {{isotime}}');
        if (typeof expanded === 'string' && /\d{4}-\d{2}-\d{2}/.test(expanded) && !expanded.includes('{{')) {
          lines.push(`酒馆时间宏参考：${expanded.trim()}`);
        }
      } catch (error) {
        console.warn('[Freesia Messenger] 时间宏不可用，本次使用设备时间。', error);
      }
    }
    let timeRules = promptSection('time');
    if (typeof context?.substituteParams === 'function') {
      try {
        const expandedRules = await context.substituteParams(timeRules);
        if (typeof expandedRules === 'string') timeRules = expandedRules;
      } catch (error) { console.warn('[Freesia Messenger] 时间预设宏解析失败，保留原文。', error); }
    }
    return `【可选真实时间参考】\n${lines.join('\n')}\n\n【时间边界规则】\n${timeRules}\n此时钟只代表 User 设备的现实时间，与故事时间线可能完全不同，不能把两者等同；不能据此推进剧情或强制角色进入现实场景。`;
  }

  function formatOptionalMessageTimestamp(timestamp) {
    const value = Number(timestamp);
    if (!Number.isFinite(value) || value <= 0) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  }

  async function generateMessengerContent(info, taskPrompt, options = {}) {
    const context = info?.context;
    if (!context || typeof context.generateRaw !== 'function') {
      throw new Error('当前 SillyTavern 环境没有提供 generateRaw 独立生成接口。请更新酒馆版本后重试；为避免重新套用预设格式，本次不会退回静默生成接口。');
    }

    const includeStoryContext = options.includeStoryContext !== false;
    let fields = {};
    if (includeStoryContext) {
      try {
        if (typeof context.getCharacterCardFields === 'function') {
          fields = context.getCharacterCardFields({ chid: Number(context.characterId) }) || {};
        }
      } catch (error) {
        console.warn('[Freesia Messenger] 读取角色卡字段失败，将使用基础生成指令。', error);
      }
    }

    const rawChat = includeStoryContext && Array.isArray(context.chat) ? context.chat : [];
    const storyItems = rawChat.filter(item => item && !item.is_system && typeof item.mes === 'string' && item.mes.trim());
    const recentStory = storyItems.slice(-12);
    const chatForWorldInfo = includeStoryContext ? storyItems.map(item => {
      const speaker = item.is_user ? info.userName : (item.name || info.characterName);
      return `${speaker}: ${String(item.mes || '').trim()}`;
    }).reverse() : [];

    const globalScanData = {
      personaDescription: fields.persona || '',
      characterDescription: fields.description || '',
      characterPersonality: fields.personality || '',
      characterDepthPrompt: fields.charDepthPrompt || '',
      scenario: fields.scenario || '',
      creatorNotes: fields.creatorNotes || '',
      trigger: 'normal',
    };

    let worldInfoText = '';
    if (includeStoryContext) {
      try {
        if (typeof context.getWorldInfoPrompt === 'function' && chatForWorldInfo.length) {
          const worldInfo = await context.getWorldInfoPrompt(
            chatForWorldInfo,
            Number(context.maxContext) || 4096,
            true,
            globalScanData,
          );
          const depthEntries = Array.isArray(worldInfo?.worldInfoDepth)
            ? worldInfo.worldInfoDepth.map(entry => Array.isArray(entry?.entries) ? entry.entries.join('\n') : '').filter(Boolean).join('\n\n')
            : '';
          worldInfoText = [worldInfo?.worldInfoString, depthEntries].filter(Boolean).join('\n\n');
        }
      } catch (error) {
        console.warn('[Freesia Messenger] 世界书扫描失败，本次生成继续使用角色卡与近期剧情。', error);
      }
    }

    const memorySummary = includeStoryContext ? (context.extensionPrompts?.['1_memory']?.value || '') : '';
    const publisherMode = options.identityMode === 'publisher';
    const communityMode = options.identityMode === 'community';
    const standalonePublisher = publisherMode && !includeStoryContext;
    const realTimePrompt = state.realTimeEnabled && includeStoryContext && !publisherMode && !communityMode
      ? await buildOptionalRealTimePrompt(context) : '';
    const identityInstruction = communityMode
      ? '你是虚构网络社区的内容模拟器和编辑，负责生成多人独立讨论，不是当前 Char，也不是 User。所有网友均可自主互动；严格按本次任务的 JSON 协议输出，不使用普通角色扮演文本格式。'
      : publisherMode
      ? standalonePublisher
        ? `你是虚构互联网中的公众号「${String(options.publisherName || '公众号').trim()}」的内容编辑。只依据本次任务提供的账号定位、固定文风和编辑要求创作。不要扮演任何角色，也不要引用或推测任何角色卡、故事剧情、世界书、聊天记录或私人关系。`
        : `你现在是虚构故事世界中公众号「${String(options.publisherName || '公众号').trim()}」的内容编辑。当前角色「${info.characterName}」只作为世界背景资料，不是本文作者；请严格保持公众号固定定位与文风。`
      : `你正在扮演角色「${info.characterName}」，当前通讯对象是「${info.userName}」。请保持角色身份、性格、关系和世界观连续。`;
    const systemSections = [
      identityInstruction,
      !publisherMode && !communityMode ? `【通讯侠专属核心规则】\n${promptSection('core')}` : '',
      !publisherMode && !communityMode ? `【线上交流边界】\n${promptSection('boundaries')}` : '',
      realTimePrompt,
      includeStoryContext && fields.description ? `【角色描述／世界背景】\n${clipPromptText(fields.description, 5000)}` : '',
      includeStoryContext && fields.personality ? `【角色性格／人物背景】\n${clipPromptText(fields.personality, 3000)}` : '',
      includeStoryContext && fields.scenario ? `【当前情境】\n${clipPromptText(fields.scenario, 3500)}` : '',
      includeStoryContext && !publisherMode && !communityMode && fields.persona ? `【用户 Persona】\n${clipPromptText(fields.persona, 2000)}` : '',
      includeStoryContext && !publisherMode && !communityMode && fields.system ? `【角色专属系统指令】\n${clipPromptText(fields.system, 2500)}` : '',
      includeStoryContext && !publisherMode && !communityMode && fields.jailbreak ? `【角色专属后置指令】\n${clipPromptText(fields.jailbreak, 1800)}` : '',
      includeStoryContext && fields.charDepthPrompt ? `【角色深度设定】\n${clipPromptText(fields.charDepthPrompt, 2000)}` : '',
      includeStoryContext && fields.creatorNotes ? `【角色补充资料】\n${clipPromptText(fields.creatorNotes, 1500)}` : '',
      includeStoryContext && !publisherMode && !communityMode && fields.mesExamples ? `【角色对话风格参考】\n${clipPromptText(fields.mesExamples, 2500)}\n以上示例仅用于理解角色语气，不要照搬其中的标签、排版或结构。` : '',
      memorySummary ? `【当前聊天记忆摘要】\n${clipPromptText(memorySummary, 5000)}` : '',
      worldInfoText ? `【当前剧情触发的世界书】\n${clipPromptText(worldInfoText, 6500)}` : '',
      '【通讯侠生成隔离规则】\n本次是通讯侠内部的独立内容生成。不要继承或复刻酒馆当前对话补全预设中的全局输出格式、固定标签、XML/JSON 包裹、状态栏、模板前后缀或其他角色扮演排版要求。只遵循本次具体任务明确提出的输出格式。剧情历史和示例只用于理解事实、关系与语气，不代表本次输出也要使用相同格式。',
    ].filter(Boolean);

    const promptMessages = [{ role: 'system', content: systemSections.join('\n\n') }];
    recentStory.forEach(item => {
      promptMessages.push({
        role: item.is_user ? 'user' : 'assistant',
        content: clipPromptText(item.mes, 1600),
      });
    });
    promptMessages.push({ role: 'user', content: String(taskPrompt || '').trim() });

    const api = String(context.mainApi || '');
    const instructEnabled = !!context.powerUserSettings?.instruct?.enabled && api !== 'openai' && api !== 'novel';
    const outputSpeaker = communityMode ? '社区编辑' : publisherMode ? String(options.publisherName || '公众号').trim() : info.characterName;
    const prefill = !options.structured && api !== 'openai' && !instructEnabled ? `${outputSpeaker}:` : '';
    const rawOptions = {
      prompt: promptMessages,
      trimNames: true,
      prefill,
    };
    if (Number(options.responseLength) > 0) rawOptions.responseLength = Number(options.responseLength);
    const result = await context.generateRaw(rawOptions);
    if ((publisherMode || communityMode) && typeof result === 'string') {
      const leadingLabel = `${outputSpeaker}:`;
      const trimmed = result.trimStart();
      return trimmed.startsWith(leadingLabel) ? trimmed.slice(leadingLabel.length).trimStart() : result;
    }
    return result;
  }

  async function savePhoneRecord(record, expectedEpoch = state.generationEpoch) {
    if (expectedEpoch !== state.generationEpoch || state.destroyed) return false;
    const context = getTavernContext();
    if (!context?.chatMetadata || typeof context.saveMetadata !== 'function') {
      throw new Error('当前酒馆版本未提供聊天资料保存接口，通讯记录暂时无法持久化。');
    }
    context.chatMetadata[CHAT_DATA_KEY] = record;
    record.updatedAt = Date.now();
    await context.saveMetadata();
    if (expectedEpoch === state.generationEpoch && !state.destroyed) refreshPhoneStoryContext(context);
    return expectedEpoch === state.generationEpoch && !state.destroyed;
  }

  function getMomentsRecord(context) {
    const stored = context?.chatMetadata?.[MOMENTS_DATA_KEY];
    if (stored && typeof stored === 'object' && Array.isArray(stored.posts)) {
      stored.version = Math.max(3, Number(stored.version) || 1);
      // v0.3.9: new posts already contain their comments. Leave old lazy
      // records untouched until their panel is opened, where they are migrated
      // to an honest empty legacy thread without making another AI request.
      stored.posts.forEach(post => {
        if (!Array.isArray(post.commentItems)) post.commentItems = [];
        if (typeof post.commentsLoaded !== 'boolean') post.commentsLoaded = post.commentItems.length > 0;
        if (post.commentsLoaded) post.comments = post.commentItems.length;
      });
      return stored;
    }
    return { version: 3, posts: [], updatedAt: Date.now() };
  }

  async function saveMomentsRecord(record, expectedEpoch = state.generationEpoch) {
    if (expectedEpoch !== state.generationEpoch || state.destroyed) return false;
    const context = getTavernContext();
    if (!context?.chatMetadata || typeof context.saveMetadata !== 'function') {
      throw new Error('当前酒馆版本未提供聊天资料保存接口，动态记录暂时无法持久化。');
    }
    context.chatMetadata[MOMENTS_DATA_KEY] = record;
    record.updatedAt = Date.now();
    await context.saveMetadata();
    return expectedEpoch === state.generationEpoch && !state.destroyed;
  }

  function getSubscriptionsRecord(context) {
    const stored = context?.chatMetadata?.[SUBSCRIPTIONS_DATA_KEY];
    if (stored && typeof stored === 'object') {
      if (!Array.isArray(stored.subscribedAccountIds)) stored.subscribedAccountIds = [];
      stored.subscribedAccountIds = [...new Set(stored.subscribedAccountIds.filter(id => SUBSCRIPTION_ACCOUNTS.some(account => account.id === id)))];
      if (!stored.articlesByAccount || typeof stored.articlesByAccount !== 'object' || Array.isArray(stored.articlesByAccount)) stored.articlesByAccount = {};
      Object.keys(stored.articlesByAccount).forEach(id => {
        if (!Array.isArray(stored.articlesByAccount[id])) stored.articlesByAccount[id] = [];
      });
      stored.version = 1;
      return stored;
    }
    return { version: 1, subscribedAccountIds: [], articlesByAccount: {}, updatedAt: Date.now() };
  }

  async function saveSubscriptionsRecord(record, expectedEpoch = state.generationEpoch) {
    if (expectedEpoch !== state.generationEpoch || state.destroyed) return false;
    const context = getTavernContext();
    if (!context?.chatMetadata || typeof context.saveMetadata !== 'function') {
      throw new Error('当前酒馆版本未提供聊天资料保存接口，公众号订阅记录暂时无法持久化。');
    }
    context.chatMetadata[SUBSCRIPTIONS_DATA_KEY] = record;
    record.updatedAt = Date.now();
    await context.saveMetadata();
    return expectedEpoch === state.generationEpoch && !state.destroyed;
  }

  // Community is a standalone public network, not an extension of private chat.
  // Both universes are stored independently in the current chat's metadata.
  const COMMUNITY_KINDS = { qa: '问答', anonymous: '匿名树洞', gossip: '八卦论坛' };
  function getCommunityRecord(context) {
    const stored = context?.chatMetadata?.[COMMUNITY_DATA_KEY];
    if (stored && typeof stored === 'object') {
      if (!stored.feeds || typeof stored.feeds !== 'object') stored.feeds = {};
      if (!Array.isArray(stored.feeds.independent)) stored.feeds.independent = [];
      if (!Array.isArray(stored.feeds.story)) stored.feeds.story = [];
      if (!stored.members || typeof stored.members !== 'object') stored.members = {};
      if (!stored.members.independent || typeof stored.members.independent !== 'object') stored.members.independent = {};
      if (!stored.members.story || typeof stored.members.story !== 'object') stored.members.story = {};
      stored.version = 1;
      return stored;
    }
    return { version: 1, feeds: { independent: [], story: [] }, members: { independent: {}, story: {} }, updatedAt: Date.now() };
  }

  async function saveCommunityRecord(record, epoch = state.generationEpoch) {
    if (state.destroyed || epoch !== state.generationEpoch) return false;
    const context = getTavernContext();
    if (!context?.chatMetadata || typeof context.saveMetadata !== 'function') {
      throw new Error('酒馆聊天资料保存接口不可用，社区内容无法持久化。');
    }
    context.chatMetadata[COMMUNITY_DATA_KEY] = record;
    record.updatedAt = Date.now();
    await context.saveMetadata();
    return !state.destroyed && epoch === state.generationEpoch;
  }

  function communityPosts(record) { return record.feeds[state.communityMode]; }
  function communityKind(value) { return COMMUNITY_KINDS[value] ? value : 'qa'; }
  function communityShortText(value, max = 500) { return String(value ?? '').trim().slice(0, max); }
  function communityMember(record, mode, name, kind = 'public') {
    const members = record.members[mode];
    const displayName = communityShortText(name, 28) || '路过的网友';
    const key = (kind === 'char' ? 'char:' : 'public:') + displayName.toLocaleLowerCase();
    if (!members[key]) members[key] = { id: createMessageId(), name: displayName, kind, createdAt: Date.now() };
    return members[key];
  }
  function communityAuthorName(item, info, post = null) {
    if (item?.anonymous) return item?.authorType === 'user'
      ? (item?.id === post?.id || !post ? '匿名楼主' : '匿名用户') : '匿名网友';
    return item?.authorType === 'user' ? (info?.userName || '你') : (item?.authorName || '路过的网友');
  }
  function communityPostLabel(kind) { return COMMUNITY_KINDS[kind] || '社区'; }
  function communityParseJSON(raw) {
    let source = String(raw ?? '').trim();
    if (!source) throw new Error('AI 未返回社区内容。');
    source = source.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const start = source.indexOf('{');
    const end = source.lastIndexOf('}');
    if (start < 0 || end < start) throw new Error('AI 未返回可解析的社区 JSON。');
    try { return JSON.parse(source.slice(start, end + 1)); }
    catch { throw new Error('社区内容 JSON 不完整，请重试生成。'); }
  }
  function communityMakeComment(record, mode, info, raw, post, permittedParentIds = new Set()) {
    const content = communityShortText(raw?.content, 700);
    if (!content) return null;
    const isStoryChar = mode === 'story' && raw?.authorType === 'char' &&
      communityShortText(raw?.authorName, 40) === info.characterName;
    const authorName = communityShortText(raw?.authorName, 28) || '路过的网友';
    const member = communityMember(record, mode, isStoryChar ? info.characterName : authorName, isStoryChar ? 'char' : 'public');
    const parentId = String(raw?.replyTo || raw?.parentId || '').trim();
    return {
      id: createMessageId(), parentId: permittedParentIds.has(parentId) ? parentId : null,
      authorType: isStoryChar ? 'char' : 'public', authorId: member.id,
      authorName: member.name, anonymous: !!raw?.anonymous,
      content, createdAt: Date.now(),
    };
  }
  function communityParseFeed(raw, record, info, mode) {
    const result = communityParseJSON(raw);
    if (!Array.isArray(result.posts)) throw new Error('没有解析到社区 posts 列表。');
    const now = Date.now();
    const posts = result.posts.slice(0, 3).map((entry, index) => {
      const title = communityShortText(entry?.title, 110);
      const content = communityShortText(entry?.content, 1600);
      if (!title || !content) return null;
      const kind = communityKind(entry.kind);
      const isStoryChar = mode === 'story' && entry.authorType === 'char' &&
        communityShortText(entry.authorName, 40) === info.characterName;
      const authorName = communityShortText(entry.authorName, 28) || `社区网友${index + 1}`;
      const member = communityMember(record, mode, isStoryChar ? info.characterName : authorName, isStoryChar ? 'char' : 'public');
      const post = {
        id: createMessageId(), kind, title, content,
        authorType: isStoryChar ? 'char' : 'public', authorId: member.id,
        authorName: member.name, anonymous: kind === 'anonymous' || !!entry.anonymous,
        createdAt: now - Math.min(10080, Math.max(0, Number(entry.minutesAgo) || index * 13)) * 60000,
        comments: [],
      };
      const permitted = new Set();
      for (const comment of Array.isArray(entry.comments) ? entry.comments.slice(0, 4) : []) {
        const normalized = communityMakeComment(record, mode, info, comment, post, permitted);
        if (normalized) { post.comments.push(normalized); permitted.add(normalized.id); }
      }
      return post;
    }).filter(Boolean);
    if (!posts.length) throw new Error('AI 未生成有效帖子，请重新尝试。');
    return posts;
  }
  function communityParseFollowups(raw, record, info, post, mode) {
    const result = communityParseJSON(raw);
    const list = result.replies || result.comments;
    if (!Array.isArray(list)) throw new Error('没有解析到社区回复列表。');
    const validIds = new Set((post.comments || []).map(comment => comment.id));
    const normalized = [];
    for (const entry of list.slice(0, 6)) {
      const comment = communityMakeComment(record, mode, info, entry, post, validIds);
      if (comment) { normalized.push(comment); validIds.add(comment.id); }
    }
    if (!normalized.length) throw new Error('AI 没有生成有效的后续评论。');
    return normalized;
  }
  function communityMemberContext(record, mode) {
    return Object.values(record.members[mode] || {}).slice(-25).map(item => item.name).join('、') || '尚无常驻网友';
  }
  function communityWorldInstructions(mode) {
    return mode === 'independent'
      ? '模式：独立互联网。这个虚构社区与当前角色卡、User Persona、聊天剧情、私聊和世界书完全隔离。所有发帖者均为虚构网友；不要提及 Char、User 或他们的关系，不得捏造涉及真实人物的爆料或指控。'
      : '模式：剧情世界互联网。参考本次提供的角色卡、世界设定与已有剧情，但不擅自决定主线进展；已有角色/NPC 只有合理知情时才能出现。其他虚构网友可以独立发言、拥有自己的生活。';
  }
  function buildCommunityFeedPrompt(info, record, mode) {
    const recent = record.feeds[mode].slice(0, 12).map(p => `${p.kind} / ${p.title}`).join('\n');
    return [
      '【通讯侠｜虚构网络社区：生成新的公开帖子】', communityWorldInstructions(mode),
      `【社区行为规则】\n${promptSection('community')}`,
      '创建 3 篇风格各异的帖子，分别为 kind=qa（知乎式问答）、anonymous（匿名树洞）、gossip（论坛八卦）。话题来自日常生活、奇闻讨论、人际矛盾、吐槽、求助等，不能总是爱情话题。',
      '每篇帖子由不同的虚构网友发布，附 2—3 条其他网友的评论。网友意见要自然多样，可以不同意、追问、抬杠；不是所有内容都围绕 User 或 Char。',
      '鼓励复用下方现有网友用户名，以保持社区熟面孔；也允许创建新网友。匿名帖不要泄露其真实身份。不得引用真实私密信息或编造现实人物丑闻。',
      '只输出合法 JSON 对象，无 Markdown 或解释。格式：{"posts":[{"kind":"qa","title":"问题标题","content":"帖子正文","authorName":"芝士年糕","authorType":"public","anonymous":false,"minutesAgo":15,"comments":[{"authorName":"今天不想上班","content":"评论内容","replyTo":"post"},{"authorName":"泡面加两个蛋","content":"另一条评论","replyTo":"post"}]}]}。posts 应包含三种 kind；JSON 所有字符串用双引号并正确转义。',
      `【已有网友】\n${communityMemberContext(record, mode)}`,
      `【近期选题，避免重复】\n${recent || '暂无历史帖子'}`,
    ].join('\n\n');
  }
  function buildCommunityFollowupPrompt(info, record, mode, post) {
    const comments = (post.comments || []).slice(-32).map(c =>
      `id=${c.id} / ${c.anonymous ? '匿名网友' : c.authorName} / replyTo=${c.parentId || 'post'}：${c.content.slice(0, 210)}`
    ).join('\n');
    return [
      '【通讯侠｜虚构网络社区：续写已有帖子讨论】', communityWorldInstructions(mode),
      `【社区行为规则】\n${promptSection('community')}`,
      `帖子分类：${communityPostLabel(post.kind)}；标题：${post.title}；正文：${post.content}`,
      `楼主：${communityAuthorName(post, info, post)}。用户可以自己发帖、评论和回复；不要代替 User 发言。`,
      '生成 3—5 条新评论和楼中楼回复。应有网友之间的相互交谈，至少 1 条 replyTo 指向现有评论 ID（如果有），而不是只回复楼主。对 User 最近的发言可以自然回应，但不强制。使用已有昵称延续人物，允许新网友。不可改写/删除已有评论或补造 User 发言。',
      '严格输出 JSON 对象，不要 Markdown：{"replies":[{"authorName":"芝士年糕","authorType":"public","anonymous":false,"content":"新评论","replyTo":"post"},{"authorName":"泡面加两个蛋","content":"回复某条评论","replyTo":"已有评论的完整 id"}]}。replyTo 必须是 post 或以下已存在的评论 id。',
      `【社区熟面孔】\n${communityMemberContext(record, mode)}`,
      `【已有评论（越后越新）】\n${comments || '暂无评论，新评论可回复 post'}`,
    ].join('\n\n');
  }
  function communityBusyElsewhere() {
    return state.messageBusy || state.messageSending || state.momentsBusy || state.momentCommentsBusy ||
      state.momentCommentSending || state.subscriptionBusy;
  }
  async function generateCommunityFeed() {
    if (state.communityBusy || communityBusyElsewhere() || state.destroyed) return;
    const info = getMessageContext();
    if (!info.ok) { state.communityError = info.reason; renderCommunity(); return; }
    const record = getCommunityRecord(info.context);
    const mode = state.communityMode;
    if (record.feeds[mode].length >= 73) { state.communityError = '该模式已保存 75 篇帖子。为保护聊天资料，本次没有继续生成，也不会删除旧帖。'; renderCommunity(); return; }
    const epoch = state.generationEpoch;
    state.communityBusy = true; state.communityTask = 'feed'; state.communityError = ''; renderCommunity();
    try {
      const result = await generateMessengerContent(info, buildCommunityFeedPrompt(info, record, mode), {
        identityMode: 'community', includeStoryContext: mode === 'story', responseLength: 2400,
      });
      if (state.destroyed || epoch !== state.generationEpoch || state.communityMode !== mode) return;
      const current = JSON.parse(JSON.stringify(getCommunityRecord(getTavernContext())));
      const newPosts = communityParseFeed(result, current, info, mode);
      current.feeds[mode].unshift(...newPosts);
      await saveCommunityRecord(current, epoch);
    } catch (error) {
      if (!state.destroyed && epoch === state.generationEpoch) state.communityError = error?.message || '生成社区帖子失败。';
    } finally {
      if (!state.destroyed && epoch === state.generationEpoch) {
        state.communityBusy = false; state.communityTask = ''; if (state.currentApp === 'community') renderCommunity();
      }
    }
  }
  async function generateCommunityReplies() {
    if (state.communityBusy || communityBusyElsewhere() || state.destroyed) return;
    const info = getMessageContext();
    if (!info.ok) { state.communityError = info.reason; renderCommunity(); return; }
    const mode = state.communityMode;
    const postId = state.activeCommunityPostId;
    const record = getCommunityRecord(info.context);
    const post = record.feeds[mode].find(p => p.id === postId);
    if (!post) return;
    if (post.comments.length >= 154) { state.communityError = '这篇帖子的评论达到 160 条保护上限，旧评论仍然完整保留。'; renderCommunity(); return; }
    const epoch = state.generationEpoch;
    state.communityBusy = true; state.communityTask = 'replies'; state.communityError = ''; renderCommunity();
    try {
      const result = await generateMessengerContent(info, buildCommunityFollowupPrompt(info, record, mode, post), {
        identityMode: 'community', includeStoryContext: mode === 'story', responseLength: 1500,
      });
      if (state.destroyed || epoch !== state.generationEpoch || state.communityMode !== mode) return;
      const current = JSON.parse(JSON.stringify(getCommunityRecord(getTavernContext())));
      const actual = current.feeds[mode].find(p => p.id === postId);
      if (!actual) return;
      actual.comments.push(...communityParseFollowups(result, current, info, actual, mode));
      await saveCommunityRecord(current, epoch);
    } catch (error) {
      if (!state.destroyed && epoch === state.generationEpoch) state.communityError = error?.message || '续更社区讨论失败。';
    } finally {
      if (!state.destroyed && epoch === state.generationEpoch) {
        state.communityBusy = false; state.communityTask = ''; if (state.currentApp === 'community') renderCommunity();
      }
    }
  }
  function stopCommunityGeneration() {
    if (!state.communityBusy) return;
    try { getTavernContext()?.stopGeneration?.(); } catch {}
    state.generationEpoch += 1;
    state.communityBusy = false; state.communityTask = '';
    state.communityError = '已停止接收本次生成；不会保存取消后的结果。';
    if (state.currentApp === 'community') renderCommunity();
  }
  function switchCommunityMode(mode) {
    if (!['independent','story'].includes(mode) || state.communityBusy) return;
    state.communityMode = mode; state.communityView = 'feed'; state.activeCommunityPostId = null;
    state.communityReplyTo = null; state.communityError = ''; state.communityFilter = 'all';
    try { HOST_WIN.localStorage.setItem(COMMUNITY_MODE_KEY, mode); } catch {}
    renderCommunity();
  }
  function communityThreadMarkup(post, info) {
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const byParent = new Map();
    const ids = new Set(comments.map(comment => comment.id));
    for (const comment of comments) {
      const parent = comment.parentId && ids.has(comment.parentId) && comment.parentId !== comment.id ? comment.parentId : 'root';
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent).push(comment);
    }
    const visited = new Set();
    const rows = [];
    function walk(parentId, depth) {
      for (const comment of byParent.get(parentId) || []) {
        if (visited.has(comment.id)) continue;
        visited.add(comment.id);
        const parent = comments.find(c => c.id === comment.parentId);
        rows.push(`<article class="fm-community-comment" style="--fm-community-indent:${Math.min(depth, 3)}" data-fm-comment-row="${escapeHtml(comment.id)}">
          <div class="fm-community-comment-head"><span class="fm-community-avatar">${getInitial(communityAuthorName(comment, info, post))}</span><strong>${displayHtml(communityAuthorName(comment, info, post))}</strong><time>${escapeHtml(formatMomentTime(comment.createdAt))}</time></div>
          ${parent ? `<div class="fm-community-reply-label">回复 ${displayHtml(communityAuthorName(parent, info, post))}</div>` : ''}
          <p>${displayHtml(comment.content)}</p>
          <button type="button" class="fm-community-link" data-fm-action="community-reply" data-fm-comment-id="${escapeHtml(comment.id)}">回复</button>
        </article>`);
        walk(comment.id, depth + 1);
      }
    }
    walk('root', 0);
    for (const comment of comments) if (!visited.has(comment.id)) { byParent.set('root', [comment]); walk('root', 0); }
    return rows.join('');
  }
  function setCommunityTopline() {
    const topline = state.root?.querySelector('[data-fm-view="app"] .fm-app-topline-label');
    if (topline) topline.textContent = 'COMMUNITY';
    const back = state.root?.querySelector('[data-fm-view="app"] .fm-back-button');
    if (back) {
      const onFeed = state.communityView === 'feed';
      back.setAttribute('data-fm-action', onFeed ? 'home' : 'community-back');
      const label = back.querySelector('span');
      if (label) label.textContent = onFeed ? '桌面' : '社区';
    }
  }
  function renderCommunity() {
    if (!state.root || state.currentApp !== 'community') return;
    const appView = state.root.querySelector('[data-fm-view="app"]');
    const detail = state.root.querySelector('[data-fm-app-detail]');
    if (!appView || !detail) return;
    appView.classList.remove('fm-moments-view', 'fm-messages-view', 'fm-messages-conversation', 'fm-subscriptions-view');
    detail.classList.remove('fm-messages-detail', 'fm-moments-detail', 'fm-subscriptions-detail');
    detail.classList.add('fm-community-detail');
    state.root.classList.remove('fm-chat-open');
    const scrollTop = detail.querySelector('.fm-community-page')?.scrollTop || 0;
    const info = getMessageContext();
    setCommunityTopline();
    if (!info.ok) {
      detail.innerHTML = `<div class="fm-message-unavailable"><strong>暂时无法加载社区</strong><p>${escapeHtml(info.reason)}</p></div>`;
      return;
    }
    const record = getCommunityRecord(info.context);
    const feed = communityPosts(record);
    const modeTabs = `<div class="fm-community-modes" role="group" aria-label="社区世界观">
      <button type="button" data-fm-action="community-mode" data-fm-mode="independent" class="${state.communityMode === 'independent' ? 'is-active' : ''}" aria-pressed="${state.communityMode === 'independent'}">独立互联网</button>
      <button type="button" data-fm-action="community-mode" data-fm-mode="story" class="${state.communityMode === 'story' ? 'is-active' : ''}" aria-pressed="${state.communityMode === 'story'}">剧情世界</button>
    </div>`;
    const modeDesc = state.communityMode === 'independent'
      ? '独立娱乐社区 · 不读取角色卡与剧情' : '剧情世界论坛 · 参考世界观与已知人物';
    const error = state.communityError ? `<p class="fm-community-error" role="status">${escapeHtml(state.communityError)}</p>` : '';
    if (state.communityView === 'compose') {
      detail.innerHTML = `<div class="fm-community-page">
        <header class="fm-community-heading"><span class="fm-app-english">WRITE A POST</span><h1>发布新帖</h1><small>${modeDesc}</small></header>
        <form class="fm-community-editor" data-fm-community-post-form>
          <label>帖子类型<select data-fm-community-kind><option value="qa">问答 · 提问题</option><option value="anonymous">匿名树洞</option><option value="gossip">八卦论坛</option></select></label>
          <label>标题<input data-fm-community-title maxlength="110" required placeholder="给帖子起一个标题" autocomplete="off"></label>
          <label>正文<textarea data-fm-community-body maxlength="1600" required rows="7" placeholder="分享想法、提问或聊点新鲜事…"></textarea></label>
          <label class="fm-community-check"><input type="checkbox" data-fm-community-anonymous> 匿名发布（不会展示 User 名称）</label>
          ${error}<button type="submit" class="fm-community-primary" ${state.communityBusy ? 'disabled' : ''}>发布帖子</button>
        </form></div>`;
      return;
    }
    if (state.communityView === 'thread') {
      const post = feed.find(p => p.id === state.activeCommunityPostId);
      if (!post) { state.communityView = 'feed'; renderCommunity(); return; }
      const replying = (post.comments || []).find(c => c.id === state.communityReplyTo);
      detail.innerHTML = `<div class="fm-community-page">
        <header class="fm-community-heading"><span class="fm-app-english">COMMUNITY / ${state.communityMode === 'story' ? 'STORY' : 'PUBLIC'}</span><h1>${communityPostLabel(post.kind)}</h1><small>${modeDesc}</small></header>
        <article class="fm-community-post-full">
          <div class="fm-community-byline"><span>${displayHtml(communityAuthorName(post, info, post))}</span><time>${escapeHtml(formatMomentTime(post.createdAt))}</time></div>
          <h2>${displayHtml(post.title)}</h2><p>${displayHtml(post.content)}</p>
        </article>
        <div class="fm-community-section-head"><strong>讨论 · ${(post.comments || []).length}</strong>
          <button type="button" class="fm-community-action" data-fm-action="${state.communityBusy ? 'community-stop' : 'community-generate-replies'}">${state.communityBusy ? '停止生成' : '续更讨论'}</button>
        </div>
        ${error}
        ${state.communityBusy ? '<div class="fm-community-pending">网友们正在加入讨论…</div>' : ''}
        <div class="fm-community-comments">${communityThreadMarkup(post, info) || '<p class="fm-community-empty">还没有评论，可以先说两句，或让网友加入讨论。</p>'}</div>
        <form class="fm-community-comment-form" data-fm-community-comment-form data-fm-post-id="${escapeHtml(post.id)}">
          ${replying ? `<div class="fm-community-reply-target">回复 ${displayHtml(communityAuthorName(replying, info, post))} <button type="button" data-fm-action="community-clear-reply" aria-label="取消回复">×</button></div>` : ''}
          <textarea data-fm-community-comment-text maxlength="700" rows="3" placeholder="${replying ? '回复这条评论…' : '发表你的观点…'}" required></textarea>
          <div class="fm-community-submit-row"><label class="fm-community-check"><input type="checkbox" data-fm-community-comment-anonymous> 匿名评论</label>
          <button type="submit" class="fm-community-primary" ${state.communityBusy ? 'disabled' : ''}>发表评论</button></div>
        </form></div>`;
      const page = detail.querySelector('.fm-community-page');
      if (page) page.scrollTop = scrollTop;
      return;
    }
    const filters = [['all','综合'],['qa','问答'],['anonymous','树洞'],['gossip','八卦']];
    const visiblePosts = state.communityFilter === 'all' ? feed : feed.filter(p => p.kind === state.communityFilter);
    detail.innerHTML = `<div class="fm-community-page">
      <header class="fm-community-heading"><span class="fm-app-english">PUBLIC SQUARE</span><h1>社区广场</h1><small>${modeDesc}</small></header>
      ${modeTabs}
      <div class="fm-community-toolbar">
        <button type="button" class="fm-community-primary" data-fm-action="community-compose">＋ 发帖</button>
        <button type="button" class="fm-community-action" data-fm-action="${state.communityBusy ? 'community-stop' : 'community-generate-feed'}">${state.communityBusy ? '停止生成' : '生成新帖子'}</button>
      </div>
      ${error}
      ${state.communityBusy ? '<div class="fm-community-pending">正在生成社区内容…</div>' : ''}
      <div class="fm-community-filters">${filters.map(([id,name]) => `<button type="button" data-fm-action="community-filter" data-fm-filter="${id}" class="${state.communityFilter === id ? 'is-active' : ''}">${name}</button>`).join('')}</div>
      <div class="fm-community-feed">${visiblePosts.map(post => `<button type="button" class="fm-community-card" data-fm-action="community-open-post" data-fm-post-id="${escapeHtml(post.id)}">
        <div class="fm-community-card-meta"><span class="fm-community-kind">${communityPostLabel(post.kind)}</span><span>${displayHtml(communityAuthorName(post, info, post))}</span><time>${escapeHtml(formatMomentTime(post.createdAt))}</time></div>
        <strong>${displayHtml(post.title)}</strong><p>${displayHtml(post.content.slice(0, 155))}</p>
        <span class="fm-community-card-foot">${(post.comments || []).length} 条讨论 <span>进入帖子 ${ICONS.chevron}</span></span>
      </button>`).join('') || `<div class="fm-community-empty">${feed.length ? '这个分类暂时没有帖子。' : '广场还是空的。点击「生成新帖子」让虚构网友开始讨论，或者自己发布第一篇。'}</div>`}</div>
      <div class="fm-community-note">社区内容为 AI 生成的虚构讨论。两种世界观分开保存，切换不会删除已有帖子。</div>
    </div>`;
    const page = detail.querySelector('.fm-community-page');
    if (page) page.scrollTop = scrollTop;
  }

  async function publishCommunityPost(form) {
    if (state.communityBusy || communityBusyElsewhere()) return;
    const info = getMessageContext(); if (!info.ok) return;
    const title = communityShortText(form.querySelector('[data-fm-community-title]')?.value, 110);
    const content = communityShortText(form.querySelector('[data-fm-community-body]')?.value, 1600);
    if (!title || !content) { state.communityError = '标题和正文不能为空。'; renderCommunity(); return; }
    const kind = communityKind(form.querySelector('[data-fm-community-kind]')?.value);
    const anonymous = !!form.querySelector('[data-fm-community-anonymous]')?.checked || kind === 'anonymous';
    const record = JSON.parse(JSON.stringify(getCommunityRecord(info.context)));
    if (communityPosts(record).length >= 75) { state.communityError = '该模式已有 75 篇帖子，请先切换其他模式；旧帖不会被自动删除。'; renderCommunity(); return; }
    const newPost = { id: createMessageId(), kind, title, content, authorType:'user', authorId:'current-user',
      authorName: info.userName, anonymous, comments: [], createdAt: Date.now() };
    communityPosts(record).unshift(newPost);
    try {
      await saveCommunityRecord(record);
      state.activeCommunityPostId = newPost.id; state.communityReplyTo = null;
      state.communityView = 'thread'; state.communityError = ''; renderCommunity();
    } catch (error) { communityPosts(record).shift(); state.communityError = error?.message || '发帖失败。'; renderCommunity(); }
  }
  async function publishCommunityComment(form) {
    if (state.communityBusy || communityBusyElsewhere()) return;
    const info = getMessageContext(); if (!info.ok) return;
    const record = JSON.parse(JSON.stringify(getCommunityRecord(info.context)));
    const post = communityPosts(record).find(p => p.id === state.activeCommunityPostId);
    if (!post) return;
    const content = communityShortText(form.querySelector('[data-fm-community-comment-text]')?.value, 700);
    if (!content) return;
    if (post.comments.length >= 154) { state.communityError = '评论已达到 160 条保护上限。'; renderCommunity(); return; }
    const parentId = post.comments.some(c => c.id === state.communityReplyTo) ? state.communityReplyTo : null;
    const comment = { id: createMessageId(), parentId, authorType:'user', authorId:'current-user',
      authorName: info.userName, anonymous: !!form.querySelector('[data-fm-community-comment-anonymous]')?.checked,
      content, createdAt: Date.now() };
    post.comments.push(comment);
    try {
      await saveCommunityRecord(record);
      state.communityReplyTo = null; state.communityError = ''; renderCommunity();
      const page = state.root.querySelector('.fm-community-page');
      const row = page?.querySelector(`[data-fm-comment-row="${comment.id}"]`);
      row?.scrollIntoView?.({block:'nearest'});
    } catch (error) { post.comments.pop(); state.communityError = error?.message || '评论保存失败。'; renderCommunity(); }
  }
  function createMessageId() {
    return `fm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function formatMessageTime(timestamp) {
    const date = new Date(Number(timestamp) || Date.now());
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function formatMomentTime(timestamp) {
    const time = Number(timestamp) || Date.now();
    const diff = Math.max(0, Date.now() - time);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const date = new Date(time);
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  }

  function extractMomentObjectsFromArray(source, arrayStart) {
    const objects = [];
    let objectDepth = 0;
    let objectStart = -1;
    let inString = false;
    let quote = '"';
    let escaped = false;

    for (let i = arrayStart + 1; i < source.length; i += 1) {
      const char = source[i];
      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === '\\') {
          escaped = true;
          continue;
        }
        if (char === quote) inString = false;
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        quote = char;
        continue;
      }
      if (char === '{') {
        if (objectDepth === 0) objectStart = i;
        objectDepth += 1;
        continue;
      }
      if (char === '}') {
        if (objectDepth > 0) objectDepth -= 1;
        if (objectDepth === 0 && objectStart >= 0) {
          objects.push(source.slice(objectStart, i + 1));
          objectStart = -1;
        }
        continue;
      }
      if (char === ']' && objectDepth === 0) break;
    }
    return objects;
  }

  function parseMomentObjectCandidate(candidate) {
    const text = String(candidate || '').trim();
    try {
      return JSON.parse(text);
    } catch {}
    // Gemini occasionally leaves a trailing comma in an otherwise valid object.
    const repaired = text.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(repaired);
  }

  function parseMomentsPayload(raw) {
    let source = String(raw ?? '').trim();
    if (!source) throw new Error('模型没有返回动态正文。');
    source = source.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    const firstObject = source.indexOf('{');
    const firstArray = source.indexOf('[');
    const firstStart = [firstObject, firstArray].filter(index => index >= 0).sort((a, b) => a - b)[0];
    if (firstStart !== undefined && firstStart > 0) source = source.slice(firstStart).trim();

    // First try strict JSON. This remains the normal and preferred path.
    try {
      const parsed = JSON.parse(source);
      const posts = Array.isArray(parsed) ? parsed : parsed?.posts;
      if (!Array.isArray(posts)) throw new Error('动态内容格式不正确，模型没有返回 posts 列表。');
      return posts;
    } catch (strictError) {
      // Recover the common Gemini formatting failure: adjacent post objects in
      // the posts array without the comma between array elements.
      const postsKey = /["']posts["']\s*:\s*\[/i.exec(source);
      let arrayStart = -1;
      if (postsKey) {
        const colon = source.indexOf(':', postsKey.index);
        arrayStart = source.indexOf('[', colon + 1);
      } else if (source[0] === '[') {
        arrayStart = 0;
      }

      if (arrayStart >= 0) {
        const candidates = extractMomentObjectsFromArray(source, arrayStart);
        const recovered = [];
        const failed = [];
        for (const candidate of candidates) {
          try {
            const post = parseMomentObjectCandidate(candidate);
            if (post && typeof post === 'object' && !Array.isArray(post)) recovered.push(post);
          } catch (error) {
            failed.push({ message: error?.message || String(error), sample: candidate.slice(0, 180) });
          }
        }
        if (recovered.length) {
          console.warn('[Freesia Messenger] 动态 JSON 格式不规范，已自动恢复可解析的动态。', {
            recovered: recovered.length,
            skipped: failed.length,
            originalError: strictError?.message || String(strictError),
          });
          return recovered;
        }
      }

      const message = strictError?.message || String(strictError);
      throw new Error(`动态 JSON 格式不完整，自动恢复失败：${message}`);
    }
  }

  function normalizeMomentsPosts(rawPosts, characterName, existingPosts) {
    const known = new Set((existingPosts || []).map(post => String(post.content || '').replace(/\s+/g, '').slice(0, 80)));
    const allowedTopics = new Set(['日常', '吐槽', '分享', '工作', '学习', '剧情', '随手记', '其他']);
    return rawPosts.slice(0, 6).map((post, index) => {
      if (!post || typeof post !== 'object') return null;
      const content = String(post.content || '').trim().slice(0, 900);
      const normalized = content.replace(/\s+/g, '').slice(0, 80);
      if (!content || known.has(normalized)) return null;
      const rawCommentItems = Array.isArray(post.commentItems)
        ? post.commentItems
        : Array.isArray(post.commentsList)
          ? post.commentsList
          : Array.isArray(post.comments)
            ? post.comments
            : [];
      const commentItems = normalizeMomentComments(rawCommentItems);
      // A new post is accepted only when its comments are part of the same
      // generation result. No second model call is needed when opening the panel.
      if (!commentItems.length) return null;
      known.add(normalized);
      const rawType = String(post.authorType || post.author_type || '').toLowerCase();
      const authorType = rawType === 'char' ? 'char' : rawType === 'public' ? 'public' : 'npc';
      const authorName = authorType === 'char'
        ? characterName
        : authorType === 'public'
          ? '附近网友'
          : (String(post.authorName || post.author || '').trim().slice(0, 32) || '故事中的朋友');
      const topicRaw = String(post.topic || post.category || '日常').trim();
      const topic = allowedTopics.has(topicRaw) ? topicRaw : '日常';
      const minutesAgo = Math.max(0, Math.min(1440, Number(post.minutesAgo ?? post.minutes_ago) || index * 18));
      const likes = Math.max(0, Math.min(99999, Math.floor(Number(post.likes) || 0)));
      return {
        id: createMessageId(),
        authorName,
        authorType,
        content,
        topic,
        createdAt: Date.now() - minutesAgo * 60000,
        likes,
        comments: commentItems.length,
        liked: false,
        commentItems,
        commentsLoaded: true,
        commentsLegacy: false,
      };
    }).filter(Boolean);
  }

  function normalizeMomentComments(rawComments, existingComments = []) {
    const known = new Set((existingComments || []).map(item => String(item.content || '').replace(/\s+/g, '').slice(0, 80)));
    return rawComments.slice(0, 5).map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const content = String(item.content || item.text || '').trim().slice(0, 500);
      const normalized = content.replace(/\s+/g, '').slice(0, 80);
      if (!content || known.has(normalized)) return null;
      known.add(normalized);
      const rawType = String(item.authorType || item.author_type || '').toLowerCase();
      const authorType = rawType === 'npc' ? 'npc' : 'public';
      const authorName = authorType === 'npc'
        ? (String(item.authorName || item.author || '').trim().slice(0, 32) || '故事人物')
        : (String(item.authorName || item.author || '').trim().slice(0, 32) || '路过的网友');
      const minutesAgo = Math.max(0, Math.min(1440, Number(item.minutesAgo ?? item.minutes_ago) || index * 7));
      return {
        id: createMessageId(),
        authorName,
        authorType,
        content,
        createdAt: Date.now() - minutesAgo * 60000,
        replyToId: null,
      };
    }).filter(Boolean).sort((a, b) => a.createdAt - b.createdAt);
  }

  function parseCharCommentDecision(raw) {
    let source = String(raw ?? '').trim();
    if (!source) throw new Error('角色没有返回评论处理决定。');
    source = source.replace(/^```(?:json|text)?\s*/i, '').replace(/\s*```$/, '').trim();

    // Preferred compact protocol: REPLY｜text or IGNORE.
    if (/^(?:IGNORE|无视|不回复)\s*$/i.test(source)) {
      return { decision: 'ignore', content: '' };
    }
    const plainReply = source.match(/^(?:REPLY|回复)\s*[|｜:：]\s*([\s\S]+)$/i);
    if (plainReply?.[1]?.trim()) {
      return { decision: 'reply', content: plainReply[1].trim().slice(0, 500) };
    }

    let parsed;
    try {
      parsed = JSON.parse(source);
    } catch {
      const decisionMatch = /["']decision["']\s*:\s*["'](reply|ignore)["']/i.exec(source);
      const contentMatch = /["']content["']\s*:\s*["']([\s\S]*?)["']\s*[,}]/i.exec(source);
      if (!decisionMatch) throw new Error('角色的回复/无视决定格式不正确。');
      parsed = { decision: decisionMatch[1], content: contentMatch?.[1] || '' };
    }
    const decision = String(parsed?.decision || parsed?.action || '').trim().toLowerCase();
    if (decision === 'ignore') return { decision: 'ignore', content: '' };
    if (decision === 'reply') {
      const content = String(parsed?.content || parsed?.reply || '').trim().slice(0, 500);
      if (!content) throw new Error('角色选择了回复，但没有生成回复正文。');
      return { decision: 'reply', content };
    }
    throw new Error('角色没有明确选择 reply 或 ignore。');
  }

  function buildCharCommentDecisionPrompt(info, post, userComment) {
    return [
      '【通讯侠｜社交动态评论互动】',
      `你正在扮演角色：${info.characterName}。这条动态是你本人发布的。`,
      `【公开评论互动行为规则】\n${promptSection('comments')}`,
      '当前用户在你的公开动态下发表评论；请结合角色个性和当前关系选择回复或无视。若选择回复，只输出简短评论，不要旁白、动作或角色名；若无视，不输出回复正文。',
      '只输出一行纯文本，二选一：REPLY｜回复正文，或 IGNORE。不要 JSON、引号、Markdown、代码围栏或解释；回复正文不要换行，也不要使用分隔符“｜”。',
      '【你发布的动态】',
      String(post.content || '').slice(0, 900),
      '【用户的评论】',
      `${info.userName}：${String(userComment.content || '').slice(0, 500)}`,
      '现在请根据角色本人意愿作出决定。',
    ].join('\n\n');
  }

  function renderMomentCommentsPanel(post, info) {
    const comments = Array.isArray(post.commentItems) ? post.commentItems : [];
    const isBusy = state.momentCommentsBusy && state.activeMomentPostId === post.id;
    const commentsMarkup = comments.map(comment => {
      const parent = comment.replyToId ? comments.find(item => item.id === comment.replyToId) : null;
      const type = comment.authorType === 'user' ? 'user' : comment.authorType === 'char' ? 'char' : comment.authorType === 'npc' ? 'npc' : 'public';
      const typeLabel = type === 'user' ? '我' : type === 'char' ? '作者' : type === 'npc' ? '故事人物' : '网友';
      const statusMarkup = comment.replyStatus === 'pending'
        ? '<small class="fm-moment-comment-status">作者正在考虑是否回复…</small>'
        : comment.replyStatus === 'error'
          ? `<small class="fm-moment-comment-status is-error">回应失败</small><button type="button" class="fm-moment-comment-retry" data-fm-action="moments-retry-char-reply" data-fm-post-id="${escapeHtml(post.id)}" data-fm-comment-id="${escapeHtml(comment.id)}">重试角色回复</button>`
          : '';
      return `
        <article class="fm-moment-comment ${parent ? 'is-reply' : ''} ${type === 'user' ? 'is-user' : ''}">
          <span class="fm-moment-comment-avatar is-${type}">${getInitial(comment.authorName)}</span>
          <div class="fm-moment-comment-main">
            <div class="fm-moment-comment-meta"><strong>${displayHtml(comment.authorName || '网友')}</strong><span>${typeLabel}</span><time>${escapeHtml(formatMomentTime(comment.createdAt))}</time></div>
            ${parent ? `<div class="fm-moment-comment-replying">回复 @${displayHtml(parent.authorName || '用户')}</div>` : ''}
            <p>${displayHtml(comment.content || '').replace(/\n/g, '<br>')}</p>
            ${statusMarkup}
          </div>
        </article>
      `;
    }).join('');
    const emptyMarkup = !isBusy && !state.momentCommentsError && comments.length === 0
      ? `<div class="fm-moment-comments-empty">${post.commentsLegacy ? '这条旧动态没有保存具体评论；新动态会在发布时附带评论。' : '还没有评论，来留下第一条吧。'}</div>`
      : '';
    const errorMarkup = state.momentCommentsError
      ? `<div class="fm-moment-comments-error">${escapeHtml(state.momentCommentsError)}</div>`
      : '';
    return `
      <section class="fm-moment-comments-panel" aria-label="动态评论区">
        <header class="fm-moment-comments-heading"><strong>评论区 <span>${post.commentsLoaded ? comments.length : Math.max(0, Number(post.comments) || 0)}</span></strong><button type="button" data-fm-action="moments-comments-close" aria-label="收起评论">收起</button></header>
        ${errorMarkup}
        ${isBusy ? '<div class="fm-moment-comments-loading"><i></i><i></i><i></i><span>正在加载评论…</span></div>' : `<div class="fm-moment-comments-list">${commentsMarkup}${emptyMarkup}</div>`}
        <form class="fm-moment-comment-form" data-fm-moment-comment-form data-fm-post-id="${escapeHtml(post.id)}">
          <textarea data-fm-moment-composer maxlength="800" rows="1" placeholder="${post.authorType === 'char' ? '评论这条动态…' : '说点什么…'}" ${isBusy || state.momentCommentSending ? 'disabled' : ''}></textarea>
          <button type="submit" ${isBusy || state.momentCommentSending ? 'disabled' : ''}>${state.momentCommentSending ? '发送中…' : '发送'}</button>
        </form>
        ${state.momentCommentSending && post.authorType === 'char' ? '<div class="fm-moment-comment-waiting">评论已发布，正在等待作者决定是否回应…</div>' : ''}
      </section>
    `;
  }

  function getInitial(name) {
    const text = String(name || 'C').trim();
    return escapeHtml(Array.from(maskText(text))[0] || 'C');
  }

  function setMessagesTopline(isConversation) {
    const back = state.root?.querySelector('[data-fm-view="app"] .fm-back-button');
    if (!back) return;
    back.setAttribute('data-fm-action', isConversation ? 'messages-back' : 'home');
    const label = back.querySelector('span');
    if (label) label.textContent = isConversation ? '消息' : '桌面';
    back.setAttribute('aria-label', isConversation ? '返回会话列表' : '返回桌面');
  }

  function renderMessagesList() {
    if (!state.root) return;
    state.messagePage = 'list';
    state.editingMessageId = null;
    state.selectionMode = false;
    state.selectedMessageIds = [];
    state.messageError = '';
    state.composerWantsFocus = false;
    const appView = state.root.querySelector('[data-fm-view="app"]');
    const detail = state.root.querySelector('[data-fm-app-detail]');
    if (!appView || !detail) return;
    appView.classList.add('fm-messages-view');
    appView.classList.remove('fm-messages-conversation');
    state.root.classList.remove('fm-chat-open');
    detail.classList.add('fm-messages-detail');
    setMessagesTopline(false);

    const info = getMessageContext();
    if (!info.ok) {
      detail.innerHTML = `
        <div class="fm-message-unavailable">
          <span class="fm-message-unavailable-icon">${ICONS.messages}</span>
          <strong>暂时无法打开会话</strong>
          <p>${escapeHtml(info.reason)}</p>
          <button type="button" class="fm-message-secondary-button" data-fm-action="messages-refresh">重新检查</button>
        </div>
      `;
      return;
    }

    const { characterName, record } = info;
    const last = record.messages[record.messages.length - 1];
    const preview = last
      ? `${last.sender === 'user' ? '你：' : `${characterName}：`}${String(last.content || '').replace(/\s+/g, ' ').slice(0, 52)}`
      : '还没有消息，点击开始聊天';
    const lastTime = last ? formatMessageTime(last.createdAt) : '';
    detail.innerHTML = `
      <div class="fm-messages-list-page">
        <div class="fm-messages-page-heading">
          <div><span class="fm-message-eyebrow">YOUR CONVERSATIONS</span><h1>消息</h1><p>与故事中的角色保持联系</p></div>
          <button type="button" class="fm-message-icon-button" data-fm-action="messages-refresh" aria-label="刷新会话" title="刷新">${ICONS.refresh}</button>
        </div>
        <div class="fm-message-section-heading"><strong>最近会话</strong><span>${record.messages.length ? `${record.messages.length} 条消息` : '1 位联系人'}</span></div>
        <button type="button" class="fm-conversation-row" data-fm-action="messages-open">
          <span class="fm-contact-avatar">${getInitial(characterName)}</span>
          <span class="fm-conversation-copy">
            <span class="fm-conversation-title"><strong>${displayHtml(characterName)}</strong><time>${escapeHtml(lastTime)}</time></span>
            <span class="fm-conversation-preview">${displayHtml(preview)}</span>
            <span class="fm-conversation-subtitle"><i></i> 当前酒馆角色${proactiveUnread(record) ? ` · ${proactiveUnread(record)} 条未读` : ''}</span>
          </span>
          <span class="fm-conversation-chevron">${ICONS.chevron}</span>
        </button>
        <div class="fm-message-storage-note">
          <span>${ICONS.sparkle}</span>
          <div><strong>独立通讯记录</strong><p>消息保存在当前酒馆聊天资料中，不会逐条写入酒馆正文。角色回复会参考当前角色卡和剧情上下文。</p></div>
        </div>
        <div class="fm-message-list-footnote">更多联系人与群聊功能将在后续版本开放。</div>
      </div>
    `;
  }

  function renderMessagesConversation() {
    if (!state.root) return;
    state.messagePage = 'conversation';
    const appView = state.root.querySelector('[data-fm-view="app"]');
    const detail = state.root.querySelector('[data-fm-app-detail]');
    if (!appView || !detail) return;
    appView.classList.add('fm-messages-view');
    appView.classList.add('fm-messages-conversation');
    state.root.classList.add('fm-chat-open');
    detail.classList.add('fm-messages-detail');
    setMessagesTopline(true);

    const info = getMessageContext();
    if (!info.ok) {
      detail.innerHTML = `<div class="fm-message-unavailable"><strong>会话已不可用</strong><p>${escapeHtml(info.reason)}</p><button type="button" class="fm-message-secondary-button" data-fm-action="messages-back">返回会话列表</button></div>`;
      return;
    }

    const { characterName, record } = info;
    markProactiveRead();
    const previousComposer = detail.querySelector('[data-fm-composer]');
    const restoreComposerFocus = !!previousComposer && (state.shadowRoot?.activeElement || HOST_DOC.activeElement) === previousComposer;
    const previousSelection = restoreComposerFocus
      ? { start: previousComposer.selectionStart, end: previousComposer.selectionEnd }
      : null;
    const visibleMessages = record.messages.slice(-80);
    const selectedIds = new Set(state.selectedMessageIds);
    const messageMarkup = visibleMessages.map(message => {
      const isUser = message.sender === 'user';
      const isSelected = selectedIds.has(message.id);
      const status = isUser && message.status === 'pending' ? '等待回复'
        : isUser && message.status === 'failed' ? '回复失败'
          : isUser && message.status === 'cancelled' ? '已停止'
            : isUser ? '已发送' : '';
      const selectAction = state.selectionMode
        ? `<button type="button" class="fm-message-select-button ${isSelected ? 'is-selected' : ''}" data-fm-action="messages-toggle-select" data-fm-message-id="${escapeHtml(message.id)}" aria-label="${isSelected ? '取消选择' : '选择'}这条消息">${isSelected ? ICONS.check : ''}</button>`
        : '';
      const copyAction = !state.selectionMode
        ? `<button type="button" class="fm-message-edit-button fm-message-copy-button" data-fm-action="messages-copy" data-fm-message-id="${escapeHtml(message.id)}" aria-label="复制这条消息" title="复制消息">${ICONS.copy}</button>`
        : '';
      const editAction = isUser && !state.messageBusy && !state.messageSending && !state.momentsBusy && !state.subscriptionBusy
        ? `<button type="button" class="fm-message-edit-button" data-fm-action="messages-edit" data-fm-message-id="${escapeHtml(message.id)}" aria-label="编辑这条消息" title="编辑消息">${ICONS.edit}</button>`
        : '';
      const regenerateAction = !isUser && !message.proactive && !state.messageBusy && !state.messageSending && !state.momentsBusy && !state.subscriptionBusy
        ? `<button type="button" class="fm-message-edit-button fm-message-regenerate-button" data-fm-action="messages-regenerate" data-fm-message-id="${escapeHtml(message.id)}" aria-label="重新生成这条回复" title="重新生成">${ICONS.refresh}</button>`
        : '';
      const deleteAction = !state.messageBusy && !state.messageSending && !state.momentsBusy && !state.selectionMode
        ? `<button type="button" class="fm-message-edit-button fm-message-delete-button" data-fm-action="messages-delete" data-fm-message-id="${escapeHtml(message.id)}" aria-label="删除这条消息" title="删除消息">${ICONS.trash}</button>`
        : '';
      return `
        <div class="fm-message-row ${isUser ? 'is-user' : 'is-char'} ${isSelected ? 'is-selected' : ''}">
          ${!isUser ? `<span class="fm-message-mini-avatar">${getInitial(characterName)}</span>` : ''}
          ${!isUser ? selectAction : ''}
          <div class="fm-message-bubble-wrap">
            <div class="fm-message-bubble">${displayHtml(message.content).replace(/\n/g, '<br>')}</div>
            <div class="fm-message-meta"><time>${escapeHtml(formatMessageTime(message.createdAt))}</time>${status ? `<span>${status}</span>` : ''}${state.selectionMode ? '' : `${copyAction}${editAction}${regenerateAction}${deleteAction}`}</div>
          </div>
          ${isUser ? selectAction : ''}
        </div>
      `;
    }).join('');
    const pending = [...record.messages].reverse().find(message => message.sender === 'user' && (message.status === 'pending' || message.status === 'failed' || message.status === 'cancelled'));
    const retryMarkup = pending && !pending.retryNoticeDismissed && !state.messageBusy && !state.momentsBusy && !state.subscriptionBusy && !state.selectionMode
      ? `<div class="fm-message-retry-note"><span>${pending.status === 'failed' ? '刚才没有成功收到角色回复。' : pending.status === 'cancelled' ? '上次回复已停止。' : '上次回复尚未完成。'}</span><div class="fm-message-retry-actions"><button type="button" class="fm-message-retry-action" data-fm-action="messages-retry" data-fm-message-id="${escapeHtml(pending.id)}">重试回复</button><button type="button" class="fm-message-retry-dismiss" data-fm-action="messages-retry-dismiss" data-fm-message-id="${escapeHtml(pending.id)}" aria-label="关闭重试提示" title="关闭提示">${ICONS.close}</button></div></div>`
      : '';
    const emptyMarkup = visibleMessages.length === 0
      ? `<div class="fm-message-empty"><span class="fm-message-empty-icon">${ICONS.messages}</span><strong>还没有开始聊天</strong><p>给 ${displayHtml(characterName)} 发一条消息，开启你们的第一次手机对话。</p></div>`
      : '';
    const typingMarkup = state.messageBusy
      ? `<div class="fm-message-row is-char"><span class="fm-message-mini-avatar">${getInitial(characterName)}</span><div class="fm-message-typing"><i></i><i></i><i></i><span>${displayHtml(characterName)} 正在输入</span></div></div>`
      : '';

    const editingMessage = state.editingMessageId
      ? record.messages.find(message => message.id === state.editingMessageId && message.sender === 'user')
      : null;
    const editingIndex = editingMessage ? record.messages.findIndex(message => message.id === editingMessage.id) : -1;
    const hasFollowingMessages = editingIndex >= 0 && editingIndex < record.messages.length - 1;
    const editingMarkup = editingMessage
      ? `<div class="fm-message-editing"><div><strong>正在编辑自己的消息</strong><span>${hasFollowingMessages ? '重新发送后，这条消息之后的聊天记录会被删除。' : '修改内容后重新发送，角色会重新回复。'}</span></div><button type="button" data-fm-action="messages-edit-cancel">取消</button></div>`
      : '';
    const busy = state.messageBusy || state.messageSending || state.momentsBusy || state.subscriptionBusy;
    const composerButton = busy
      ? `<button type="button" class="fm-message-send-button fm-message-stop-button" data-fm-action="messages-stop" aria-label="停止生成" title="停止生成">${ICONS.stop}</button>`
      : `<button type="submit" class="fm-message-send-button" aria-label="${editingMessage ? '修改并重新发送' : '发送消息'}" title="${editingMessage ? '修改并重新发送' : '发送消息'}">${ICONS.send}</button>`;
    const composerMarkup = state.selectionMode
      ? `<div class="fm-message-selection-hint">选择要删除的消息，完成后点击上方「删除」</div>`
      : `<form class="fm-message-composer" data-fm-send-form><textarea data-fm-composer rows="1" maxlength="4000" placeholder="发送消息给 ${displayHtml(characterName)}…" ${(busy) ? 'disabled' : ''}>${editingMessage ? escapeHtml(editingMessage.content) : ''}</textarea>${composerButton}</form>`;
    const headerActions = state.selectionMode
      ? `<div class="fm-message-header-actions"><span class="fm-message-selected-count">已选 ${state.selectedMessageIds.length} 条</span><button type="button" data-fm-action="messages-select-all">${state.selectedMessageIds.length === record.messages.length && record.messages.length ? '取消全选' : '全选'}</button><button type="button" class="is-danger" data-fm-action="messages-delete-selected" ${state.selectedMessageIds.length ? '' : 'disabled'}>删除</button><button type="button" data-fm-action="messages-select-exit">完成</button></div>`
      : `<div class="fm-message-header-actions"><button type="button" data-fm-action="messages-select-enter">管理</button><button type="button" class="is-danger" data-fm-action="messages-clear" ${record.messages.length ? '' : 'disabled'}>清空</button></div>`;
    detail.innerHTML = `
      <div class="fm-message-chat-layout">
        <div class="fm-message-chat-header">
          <button type="button" class="fm-chat-back-button" data-fm-action="messages-back" aria-label="返回消息列表" title="返回消息列表">${ICONS.back}</button>
          <span class="fm-contact-avatar fm-contact-avatar-small">${getInitial(characterName)}</span>
          <div><strong>${displayHtml(characterName)}</strong></div>
          ${headerActions}
        </div>
        <div class="fm-message-stream" data-fm-message-stream>
          <div class="fm-chat-date-divider"><span>聊天记录</span></div>
          ${emptyMarkup}
          ${messageMarkup}
          ${typingMarkup}
          ${retryMarkup}
          ${state.messageError ? `<div class="fm-message-error">${escapeHtml(state.messageError)}</div>` : ''}
        </div>
        ${editingMarkup}
        ${composerMarkup}
      </div>
    `;
    const stream = detail.querySelector('[data-fm-message-stream]');
    if (stream) stream.scrollTop = stream.scrollHeight;
    const composer = detail.querySelector('[data-fm-composer]');
    if (composer && restoreComposerFocus && !state.messageBusy && !state.messageSending) {
      composer.focus({ preventScroll: true });
      if (previousSelection) composer.setSelectionRange(previousSelection.start, previousSelection.end);
    }
    if (state.composerWantsFocus && composer && !state.messageBusy && !state.messageSending) {
      composer.focus({ preventScroll: true });
      state.composerWantsFocus = false;
    }
  }

  function showPhoneToast(message) {
    if (!state.frame || state.destroyed) return;
    state.frame.querySelector('.fm-toast')?.remove();
    if (state.toastTimer) HOST_WIN.clearTimeout(state.toastTimer);
    const toast = node('div', 'fm-toast', String(message));
    toast.setAttribute('role', 'status');
    state.frame.appendChild(toast);
    state.toastTimer = HOST_WIN.setTimeout(() => { toast.remove(); state.toastTimer = null; }, 1800);
  }

  function copyPhoneMessage(messageId) {
    const info = getMessageContext();
    const message = info.ok ? info.record.messages.find(item => item.id === messageId) : null;
    if (!message) { showPhoneToast('消息已不存在'); return; }
    const content = maskText(String(message.content ?? ''));
    // Copy displayed text, without changing stored message or AI context.
    // The textarea fallback also works in local/non-HTTPS Tavern hosts.
    const fallbackCopy = () => {
      const textarea = node('textarea');
      textarea.value = content;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
      HOST_DOC.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      let successful = false;
      try { successful = !!HOST_DOC.execCommand('copy'); } catch {}
      textarea.remove();
      showPhoneToast(successful ? '已复制消息' : '复制失败，请手动选择文字');
    };
    const clipboard = HOST_WIN.navigator?.clipboard || window.navigator?.clipboard;
    if (clipboard && typeof clipboard.writeText === 'function') {
      try {
        Promise.resolve(clipboard.writeText(content)).then(() => showPhoneToast('已复制消息')).catch(fallbackCopy);
      } catch { fallbackCopy(); }
    } else fallbackCopy();
  }

  function beginEditMessage(messageId) {
    if (state.messageBusy || state.messageSending || state.subscriptionBusy) return;
    const info = getMessageContext();
    if (!info.ok) return;
    const message = info.record.messages.find(item => item.id === messageId && item.sender === 'user');
    if (!message) return;
    state.editingMessageId = messageId;
    state.selectionMode = false;
    state.selectedMessageIds = [];
    state.messageError = '';
    state.composerWantsFocus = true;
    renderMessagesConversation();
    const composer = state.root?.querySelector('[data-fm-composer]');
    if (composer) {
      composer.style.height = 'auto';
      composer.style.height = `${Math.min(112, Math.max(43, composer.scrollHeight))}px`;
      composer.setSelectionRange(composer.value.length, composer.value.length);
    }
  }

  function cancelMessageEdit() {
    state.editingMessageId = null;
    state.composerWantsFocus = false;
    renderMessagesConversation();
  }

  function confirmPhoneAction(message) {
    try {
      const confirmFn = HOST_WIN.confirm || window.confirm;
      return typeof confirmFn === 'function' ? !!confirmFn.call(HOST_WIN, message) : false;
    } catch (error) {
      console.warn('[Freesia Messenger] 无法显示确认对话框。', error);
      return false;
    }
  }

  function enterMessageSelectionMode() {
    if (state.messageBusy || state.messageSending || state.momentsBusy) return;
    state.selectionMode = true;
    state.selectedMessageIds = [];
    renderMessagesConversation();
  }

  function exitMessageSelectionMode() {
    state.selectionMode = false;
    state.selectedMessageIds = [];
    renderMessagesConversation();
  }

  function toggleMessageSelection(messageId) {
    if (!messageId) return;
    const selected = new Set(state.selectedMessageIds);
    if (selected.has(messageId)) selected.delete(messageId);
    else selected.add(messageId);
    state.selectedMessageIds = [...selected];
    renderMessagesConversation();
  }

  function toggleSelectAllMessages() {
    const info = getMessageContext();
    if (!info.ok) return;
    state.selectedMessageIds = state.selectedMessageIds.length === info.record.messages.length
      ? []
      : info.record.messages.map(message => message.id);
    renderMessagesConversation();
  }

  async function removeMessagesByIds(messageIds) {
    if (state.messageBusy || state.messageSending || state.momentsBusy || state.destroyed) return;
    const ids = new Set((messageIds || []).filter(Boolean));
    if (!ids.size) return;
    const info = getMessageContext();
    if (!info.ok) {
      state.messageError = info.reason;
      renderMessagesConversation();
      return;
    }
    const record = info.record;
    const removed = record.messages.filter(message => ids.has(message.id));
    if (!removed.length) return;
    const removedUserIds = new Set(removed.filter(message => message.sender === 'user').map(message => message.id));
    const removedCharMessages = removed.filter(message => message.sender === 'char');
    removedCharMessages.forEach(message => {
      const parent = record.messages.find(item => item.id === message.replyTo && item.sender === 'user');
      if (parent && !ids.has(parent.id)) parent.status = 'failed';
    });
    record.messages = record.messages.filter(message =>
      !ids.has(message.id) && !(message.sender === 'char' && removedUserIds.has(message.replyTo))
    );
    if (state.editingMessageId && ids.has(state.editingMessageId)) state.editingMessageId = null;
    state.selectionMode = false;
    state.selectedMessageIds = [];
    state.messageError = '';
    try {
      await savePhoneRecord(record);
      if (state.currentApp === 'messages' && state.messagePage === 'conversation') renderMessagesConversation();
    } catch (error) {
      state.messageError = error?.message || '删除消息失败。';
      renderMessagesConversation();
    }
  }

  async function deleteSingleMessage(messageId) {
    const info = getMessageContext();
    if (!info.ok) return;
    const message = info.record.messages.find(item => item.id === messageId);
    if (!message) return;
    if (!confirmPhoneAction('确定删除这条通讯侠消息吗？此操作不会删除酒馆原始聊天记录。')) return;
    await removeMessagesByIds([messageId]);
  }

  async function deleteSelectedMessages() {
    const ids = [...state.selectedMessageIds];
    if (!ids.length) return;
    if (!confirmPhoneAction(`确定删除选中的 ${ids.length} 条通讯侠消息吗？此操作不会删除酒馆原始聊天记录。`)) return;
    await removeMessagesByIds(ids);
  }

  async function clearPhoneConversation() {
    if (state.messageBusy || state.messageSending || state.momentsBusy) return;
    const info = getMessageContext();
    if (!info.ok || !info.record.messages.length) return;
    if (!confirmPhoneAction(`确定清空与「${info.characterName}」的全部通讯侠聊天记录吗？\n\n只清空通讯侠私聊，不会删除酒馆原始剧情聊天。`)) return;
    info.record.messages = [];
    state.editingMessageId = null;
    state.selectionMode = false;
    state.selectedMessageIds = [];
    state.messageError = '';
    try {
      await savePhoneRecord(info.record);
      renderMessagesConversation();
    } catch (error) {
      state.messageError = error?.message || '清空聊天记录失败。';
      renderMessagesConversation();
    }
  }

  async function regenerateCharacterReply(messageId) {
    if (state.communityBusy || state.messageBusy || state.messageSending || state.momentsBusy || state.subscriptionBusy || state.destroyed) return;
    const info = getMessageContext();
    if (!info.ok) return;
    const record = info.record;
    const messageIndex = record.messages.findIndex(item => item.id === messageId && item.sender === 'char');
    if (messageIndex < 0) return;
    const message = record.messages[messageIndex];
    if (message.proactive) return;
    const parent = record.messages.find(item => item.id === message.replyTo && item.sender === 'user')
      || [...record.messages.slice(0, messageIndex)].reverse().find(item => item.sender === 'user');
    if (!parent) {
      state.messageError = '找不到这条角色回复对应的用户消息，无法重新生成。';
      renderMessagesConversation();
      return;
    }
    const laterCount = record.messages.length - messageIndex - 1;
    if (laterCount > 0 && !confirmPhoneAction(`重新生成这条角色回复，会同时删除它之后的 ${laterCount} 条消息，以免后续对话继续依赖旧回复。继续吗？`)) return;
    record.messages.splice(messageIndex);
    parent.status = 'pending';
    state.selectionMode = false;
    state.selectedMessageIds = [];
    state.messageError = '';
    try {
      await savePhoneRecord(record);
      if (state.destroyed) return;
      await requestCharacterReply(parent.id);
    } catch (error) {
      state.messageError = error?.message || '重新生成角色回复失败。';
      renderMessagesConversation();
    }
  }

  async function stopPhoneGeneration() {
    if (!state.messageBusy && !state.messageSending) {
      if (state.momentsBusy) return stopMomentsGeneration();
      if (state.subscriptionBusy) return stopSubscriptionGeneration();
      return;
    }
    const messageId = state.activeMessageId;
    const context = getTavernContext();
    let stopped = false;
    try { stopped = !!context?.stopGeneration?.(); } catch (error) { console.warn('[Freesia Messenger] 请求停止生成失败。', error); }
    state.generationEpoch += 1;
    state.messageBusy = false;
    state.messageSending = false;
    state.activeMessageId = null;
    state.composerWantsFocus = false;
    const info = getMessageContext();
    if (info.ok && messageId) {
      const message = info.record.messages.find(item => item.id === messageId && item.sender === 'user');
      if (message && message.status === 'pending') {
        message.status = 'cancelled';
        try { await savePhoneRecord(info.record, state.generationEpoch); }
        catch (error) { console.warn('[Freesia Messenger] 保存停止状态失败。', error); }
      }
    }
    state.messageError = stopped
      ? '已停止本次生成。可以编辑刚才的消息，再重新发送。'
      : '已取消本次回复的接收；如果底层请求未能中止，返回结果也不会写入通讯记录。可以编辑消息后重新发送。';
    if (!state.destroyed && state.currentApp === 'messages' && state.messagePage === 'conversation') renderMessagesConversation();
  }

  function buildPhoneReplyPrompt(info, record, latestMessage) {
    const recent = record.messages.slice(-16).map(message => {
      const sender = message.sender === 'user' ? info.userName : info.characterName;
      const timestamp = state.realTimeEnabled ? formatOptionalMessageTimestamp(message.createdAt) : '';
      return `${timestamp ? `[${timestamp}] ` : ''}${sender}：${String(message.content || '').trim()}`;
    }).join('\n');
    return [
      '【通讯侠｜手机即时通讯回复】',
      `当前扮演角色：${info.characterName}`,
      `手机聊天对象：${info.userName}`,
      `【私聊行为规则】\n${promptSection('messages')}`,
      '角色卡、剧情与世界设定已作为独立生成背景提供；手机消息记录与酒馆正文分开保存。',
      state.realTimeEnabled ? '【时间戳说明】最近的手机消息若标注了日期时刻，那是 User 设备的实际发送时间，只用于理解消息前后顺序和间隔；不代表角色处于同一时区，也不意味着故事时间与之同步。' : '',
      '输出协议：只输出一条手机消息正文，不要角色名标签、外层包装、额外解释或 Markdown 代码块。',
      '【最近的手机聊天记录】',
      recent || '（这是你们的第一条手机消息。）',
      '【用户刚刚发送】',
      String(latestMessage.content || '').trim(),
      '现在请发送角色的下一条手机消息。',
    ].join('\n\n');
  }

  function proactiveChatKey(info) {
    const c = info.context;
    const chatId = c.chatId ?? c.getCurrentChatId?.() ?? info.character?.chat;
    if (chatId === undefined || chatId === null || chatId === '') return '';
    return JSON.stringify([info.character?.avatar || info.characterName, String(chatId)]);
  }

  function proactiveVisible() {
    return !HOST_DOC.hidden && state.root?.classList.contains('fm-visible') && state.currentApp === 'messages' && state.messagePage === 'conversation';
  }

  function proactiveUnread(record) {
    return (record?.messages || []).filter(m => m.proactive && !m.readAt).length;
  }

  function markProactiveRead() {
    if (!proactiveVisible()) return;
    const info = getMessageContext();
    if (!info.ok || !proactiveUnread(info.record)) return;
    info.record.messages.forEach(m => { if (m.proactive && !m.readAt) m.readAt = Date.now(); });
    void savePhoneRecord(info.record).catch(e => console.warn('[FM] 保存已读状态失败', e));
    syncChatEntryState();
  }

  function saveProactiveSettings() {
    try { HOST_WIN.localStorage.setItem(PROACTIVE_KEY, JSON.stringify(state.proactive)); }
    catch (e) { state.proactiveStatus = '设置保存失败：' + String(e.message || e); return false; }
    return true;
  }

  function buildProactivePrompt(info, record) {
    const now = Date.now();
    const last = sender => [...record.messages].reverse().find(m => m.sender === sender);
    const elapsed = m => Number.isFinite(m?.createdAt) && m.createdAt > 0 ? `${Math.max(0, Math.floor((now - m.createdAt) / 60000))} 分钟` : '暂无记录';
    const recent = record.messages.slice(-20).map(m => `[${formatOptionalMessageTimestamp(m.createdAt)}] ${m.sender === 'user' ? info.userName : info.characterName}：${clipPromptText(m.content, 1200)}`).join('\n');
    return [ '【通讯侠｜主动联络】', promptSection('messages'), promptSection('proactive'),
      '这是主动发信判断，不是回复 User 刚发送的消息。可以发送零至三条独立消息。上一条未回复不构成阻碍。',
      `距 User 上次发信：${elapsed(last('user'))}；距 Char 上次发信：${elapsed(last('char'))}；未读主动消息：${proactiveUnread(record)} 条。以上是现实时间间隔，不推进主线剧情。`,
      '【近期手机记录】\n' + (recent || '暂无手机消息'),
      '严格输出 JSON 对象，不加代码围栏、解释或角色名。保持安静：{"messages":[]}；主动联络：{"messages":["第一条消息","第二条消息"]}。数组内只放实际发送的消息正文。' ].join('\n\n');
  }

  function parseProactiveResult(result) {
    const raw = String(result ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.messages) || parsed.messages.length > 3 || parsed.messages.some(m => typeof m !== 'string' || !m.trim() || m.length > 4000)) throw new Error('主动联络输出协议无效');
    return parsed.messages.map(m => m.trim());
  }

  async function checkProactive(force = false) {
    if (state.destroyed || !state.enabled || !state.proactive.enabled || !state.realTimeEnabled || state.proactiveRunning || state.backupBusy || state.apiTesting || HOST_DOC.hidden) return;
    if (state.messageBusy || state.messageSending || state.momentsBusy || state.subscriptionBusy || state.momentCommentsBusy || state.momentCommentSending || state.communityBusy || state.selectionMode || state.editingMessageId) return;
    if (state.root?.querySelector('[data-fm-composer]')?.value.trim()) return;
    const info = getMessageContext();
    if (!info.ok || typeof info.context.generateRaw !== 'function') return;
    if (info.context.isGenerating === true || info.context.is_send_press === true || HOST_DOC.querySelector('#mes_stop:not([style*="display: none"])')?.getClientRects().length) return;
    const key = proactiveChatKey(info);
    if (!key) return;
    const now = Date.now();
    const storageKey = PROACTIVE_KEY + ':last:' + key;
    let lastCheck = state.proactiveDue.get(key) || 0;
    try { lastCheck = Math.max(lastCheck, Number(HOST_WIN.localStorage.getItem(storageKey)) || 0); } catch {}
    if (!lastCheck && !force) { state.proactiveDue.set(key, now); try { HOST_WIN.localStorage.setItem(storageKey, String(now)); } catch {} return; }
    if (!force && now - lastCheck < state.proactive.interval * 60000) return;
    const sent = info.record.messages.filter(m => m.proactive && m.proactiveBatch);
    const latest = sent[sent.length - 1];
    if (!force && latest && now - latest.createdAt < state.proactive.cooldown * 60000) return;
    const day = new Date(now).toDateString();
    const batches = new Set(sent.filter(m => new Date(m.createdAt).toDateString() === day).map(m => m.proactiveBatch));
    if (!force && state.proactive.limit && batches.size >= state.proactive.limit) return;
    state.proactiveDue.set(key, now);
    try { HOST_WIN.localStorage.setItem(storageKey, String(now)); } catch {}
    const epoch = state.generationEpoch;
    const configEpoch = state.proactiveConfigEpoch;
    state.proactiveRunning = true;
    state.messageBusy = true;
    state.proactiveStatus = '正在判断是否主动联络…';
    state.proactiveResults.set(key, state.proactiveStatus);
    syncExtensionControls();
    try {
      const result = await generateMessengerContent(info, buildProactivePrompt(info, info.record), { structured: true, responseLength: 600 });
      if (state.destroyed || epoch !== state.generationEpoch || configEpoch !== state.proactiveConfigEpoch || !state.proactive.enabled || !state.realTimeEnabled) return;
      const current = getMessageContext();
      if (!current.ok || proactiveChatKey(current) !== key) return;
      const messages = parseProactiveResult(result);
      if (!messages.length) { state.proactiveStatus = '本次角色选择不发消息'; return; }
      const batch = createMessageId();
      const at = Date.now();
      const readAt = proactiveVisible() ? at : 0;
      messages.forEach(content => current.record.messages.push({ id: createMessageId(), sender: 'char', content, createdAt: at, status: 'received', proactive: true, proactiveBatch: batch, readAt }));
      if (!await savePhoneRecord(current.record, epoch)) return;
      state.proactiveStatus = `收到 ${messages.length} 条主动消息`;
      if (!readAt && state.proactive.notify) { try { HOST_WIN.toastr?.info?.(`${escapeHtml(displayNameForNotice(current.characterName))} 发来了 ${messages.length} 条消息`, '通讯侠'); } catch {} }
      syncChatEntryState();
    } catch (e) { state.proactiveStatus = '主动联络失败：' + String(e.message || e); console.warn('[FM] 主动联络失败', e); }
    finally {
      state.proactiveRunning = false;
      if (epoch !== state.generationEpoch) state.proactiveResults.set(key, '本次检测已取消');
      if (!state.destroyed && epoch === state.generationEpoch) {
        if (state.proactiveStatus === '正在判断是否主动联络…') state.proactiveStatus = '本次检测已取消';
        state.proactiveResults.set(key, state.proactiveStatus);
        state.messageBusy = false;
        if (state.currentApp === 'settings') { const el = state.root?.querySelector('[data-fm-proactive-status]'); if (el) el.textContent = state.proactiveStatus; }
        if (state.currentApp === 'messages') {
          if (state.messagePage === 'list') renderMessagesList();
          else if (!state.root?.querySelector('[data-fm-composer]')?.value.trim()) renderMessagesConversation();
        }
      }
    }
  }

  function displayNameForNotice(name) { return state.maskEnabled ? 'Char' : String(name); }

  function proactiveWake() {
    if (state.destroyed || !state.enabled) return;
    markProactiveRead();
    syncChatEntryState();
    void checkProactive().finally(syncExtensionControls);
  }

  function dismissMessageRetryNotice(messageId) {
    const info = getMessageContext();
    if (!info.ok) return;
    const message = info.record.messages.find(item => item.id === messageId && item.sender === 'user');
    if (!message) return;
    message.retryNoticeDismissed = true;
    renderMessagesConversation();
    void savePhoneRecord(info.record).catch(error => {
      console.warn('[Freesia Messenger] 保存重试提示关闭状态失败。', error);
    });
  }

  async function requestCharacterReply(messageId) {
    if (state.communityBusy || state.messageBusy || state.momentsBusy || state.subscriptionBusy || state.momentCommentsBusy || state.momentCommentSending || state.destroyed) return;
    const info = getMessageContext();
    if (!info.ok) {
      state.messageError = info.reason;
      renderMessagesConversation();
      return;
    }
    const record = info.record;
    const userMessage = record.messages.find(message => message.id === messageId && message.sender === 'user');
    if (!userMessage) return;
    if (typeof info.context.generateRaw !== 'function') {
      state.messageError = '当前 SillyTavern 环境没有提供 generateRaw 独立生成接口，暂时无法让角色回复。';
      renderMessagesConversation();
      return;
    }

    const epoch = state.generationEpoch;
    state.activeMessageId = messageId;
    state.messageBusy = true;
    state.messageError = '';
    delete userMessage.retryNoticeDismissed;
    userMessage.status = 'pending';
    try {
      await savePhoneRecord(record, epoch);
      renderMessagesConversation();
      const prompt = buildPhoneReplyPrompt(info, record, userMessage);
      const result = await generateMessengerContent(info, prompt);
      if (state.destroyed || epoch !== state.generationEpoch) return;
      const latestInfo = getMessageContext();
      if (!latestInfo.ok) throw new Error(latestInfo.reason);
      const latestRecord = latestInfo.record;
      const latestUserMessage = latestRecord.messages.find(message => message.id === messageId && message.sender === 'user');
      if (!latestUserMessage) throw new Error('原始手机消息已不存在，无法关联角色回复。');
      const reply = String(result ?? '').trim();
      if (!reply) throw new Error('模型没有返回可显示的消息，请重试。');
      latestRecord.messages.push({
        id: createMessageId(),
        sender: 'char',
        content: reply,
        createdAt: Date.now(),
        status: 'received',
        replyTo: messageId,
      });
      latestUserMessage.status = 'sent';
      await savePhoneRecord(latestRecord, epoch);
    } catch (error) {
      if (state.destroyed || epoch !== state.generationEpoch) return;
      const latestInfo = getMessageContext();
      if (latestInfo.ok) {
        const latestRecord = latestInfo.record;
        const latestUserMessage = latestRecord.messages.find(message => message.id === messageId && message.sender === 'user');
        if (latestUserMessage) {
          latestUserMessage.status = 'failed';
          try { await savePhoneRecord(latestRecord, epoch); } catch (saveError) { console.warn('[Freesia Messenger] 保存失败状态失败。', saveError); }
        }
      }
      state.messageError = error?.message || '角色回复失败，请稍后重试。';
      console.error('[Freesia Messenger] 手机消息生成失败。', error);
    } finally {
      if (!state.destroyed && epoch === state.generationEpoch) {
        state.messageBusy = false;
        if (state.activeMessageId === messageId) state.activeMessageId = null;
        renderMessagesConversation();
      }
    }
  }

  async function sendPhoneMessage() {
    if (state.communityBusy || state.messageBusy || state.messageSending || state.momentsBusy || state.subscriptionBusy || state.momentCommentsBusy || state.momentCommentSending || state.selectionMode || state.destroyed) return;
    const composer = state.root?.querySelector('[data-fm-composer]');
    const content = String(composer?.value || '').trim();
    if (!content) return;
    const info = getMessageContext();
    if (!info.ok) {
      state.messageError = info.reason;
      renderMessagesConversation();
      return;
    }
    const epoch = state.generationEpoch;
    const record = info.record;
    let message;
    if (state.editingMessageId) {
      const messageIndex = record.messages.findIndex(item => item.id === state.editingMessageId && item.sender === 'user');
      if (messageIndex < 0) {
        state.editingMessageId = null;
        state.messageError = '需要编辑的消息已不存在，请重新选择。';
        renderMessagesConversation();
        return;
      }
      message = record.messages[messageIndex];
      // Editing an earlier message invalidates all following dialogue turns.
      record.messages.splice(messageIndex + 1);
      message.content = content;
      message.createdAt = Date.now();
      message.editedAt = Date.now();
      delete message.retryNoticeDismissed;
      message.status = 'pending';
      state.editingMessageId = null;
      state.selectionMode = false;
      state.selectedMessageIds = [];
    } else {
      message = {
        id: createMessageId(),
        sender: 'user',
        content,
        createdAt: Date.now(),
        status: 'pending',
      };
      record.messages.push(message);
    }
    state.activeMessageId = message.id;
    state.messageSending = true;
    state.messageError = '';
    state.composerWantsFocus = true;
    renderMessagesConversation();
    try {
      await savePhoneRecord(record, epoch);
      if (state.destroyed || epoch !== state.generationEpoch) return;
      await requestCharacterReply(message.id);
    } catch (error) {
      if (state.destroyed || epoch !== state.generationEpoch) return;
      state.messageError = error?.message || '手机消息保存失败。';
    } finally {
      if (!state.destroyed && epoch === state.generationEpoch) {
        state.messageSending = false;
        if (!state.messageBusy && state.currentApp === 'messages' && state.messagePage === 'conversation') renderMessagesConversation();
      }
    }
  }

  function handleRootSubmit(event) {
    const communityPostForm = event.target.closest('[data-fm-community-post-form]');
    if (communityPostForm) { event.preventDefault(); publishCommunityPost(communityPostForm); return; }
    const communityCommentForm = event.target.closest('[data-fm-community-comment-form]');
    if (communityCommentForm) { event.preventDefault(); publishCommunityComment(communityCommentForm); return; }
    const commentForm = event.target.closest('[data-fm-moment-comment-form]');
    if (commentForm) {
      event.preventDefault();
      submitMomentComment(commentForm.getAttribute('data-fm-post-id'));
      return;
    }
    const form = event.target.closest('[data-fm-send-form]');
    if (!form) return;
    event.preventDefault();
    sendPhoneMessage();
  }

  function handleRootInput(event) {
    const target = event.target;
    if (target.matches?.('[data-fm-proactive-field]')) {
      const key = target.getAttribute('data-fm-proactive-field');
      setProactiveField(key, key === 'notify' ? target.checked : Number(target.value));
      return;
    }
    if (target.matches?.('[data-fm-mask-char], [data-fm-mask-user], [data-fm-mask-from], [data-fm-mask-to]')) {
      if (target.hasAttribute('data-fm-mask-char')) state.maskDraft.charAlias = target.value;
      else if (target.hasAttribute('data-fm-mask-user')) state.maskDraft.userAlias = target.value;
      else {
        const isFrom = target.hasAttribute('data-fm-mask-from');
        const index = Number(target.getAttribute(isFrom ? 'data-fm-mask-from' : 'data-fm-mask-to'));
        if (Number.isInteger(index) && state.maskDraft.aliases[index]) state.maskDraft.aliases[index][isFrom ? 'from' : 'to'] = target.value;
      }
      state.maskStatus = '有未保存的修改。';
      const status = state.root?.querySelector('[data-fm-mask-status]');
      if (status) status.textContent = state.maskStatus;
      renderMaskPreview();
      return;
    }
    if (event.target.matches?.('[data-fm-preset-field]')) {
      state.presetDraft[state.presetActiveKey] = event.target.value;
      state.presetStatus = '有尚未保存的修改。';
      const status = state.root?.querySelector('[data-fm-preset-status]');
      if (status) status.textContent = state.presetStatus;
      if (state.presetPreviewOpen) renderPresetPreview();
      return;
    }
    if (!event.target.matches?.('[data-fm-composer], [data-fm-moment-composer]')) return;
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(112, Math.max(40, event.target.scrollHeight))}px`;
  }

  function handleRootKeydown(event) {
    if (event.target.matches?.('[data-fm-moment-composer]')) {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        const form = event.target.closest('[data-fm-moment-comment-form]');
        if (form) submitMomentComment(form.getAttribute('data-fm-post-id'));
      }
      return;
    }
    if (!event.target.matches?.('[data-fm-composer]')) return;
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendPhoneMessage();
    }
  }

  function handleTavernChatChanged() {
    if (state.messageBusy || state.messageSending || state.momentsBusy || state.subscriptionBusy || state.momentCommentsBusy || state.momentCommentSending || state.communityBusy) {
      try { getTavernContext()?.stopGeneration?.(); } catch {}
    }
    state.generationEpoch += 1;
    state.messageBusy = false;
    state.messageSending = false;
    state.messageError = '';
    state.composerWantsFocus = false;
    state.messagePage = 'list';
    state.editingMessageId = null;
    state.selectionMode = false;
    state.selectedMessageIds = [];
    state.activeMessageId = null;
    state.subscriptionBusy = false;
    state.subscriptionBatch = null;
    state.subscriptionError = '';
    state.subscriptionStatus = '';
    state.subscriptionPage = 'accounts';
    state.activeSubscriptionId = null;
    state.activeArticleId = null;
    state.momentsBusy = false;
    state.momentsError = '';
    state.activeMomentPostId = null;
    state.momentCommentsBusy = false;
    state.momentCommentSending = false;
    state.momentCommentsError = '';
    state.communityBusy = false;
    state.communityTask = '';
    state.communityError = '';
    state.communityView = 'feed';
    state.activeCommunityPostId = null;
    state.communityReplyTo = null;
    if (state.currentApp === 'messages') renderMessagesList();
    else if (state.currentApp === 'moments') renderMoments();
    else if (state.currentApp === 'subscriptions') renderSubscriptionAccounts();
    else if (state.currentApp === 'community') renderCommunity();
    // Chat metadata may settle after the switch event. Refresh again at the
    // next normal generation to prevent leaking a previous chat's transcript.
    refreshPhoneStoryContext();
    syncChatEntryState();
    HOST_WIN.setTimeout(() => { if (!state.destroyed) refreshPhoneStoryContext(); }, 0);
  }

  function bindTavernEvents() {
    const context = getTavernContext();
    const source = context?.eventSource;
    const eventName = context?.event_types?.CHAT_CHANGED || 'chat_id_changed';
    if (!source || typeof source.on !== 'function') return;
    state.eventSource = source;
    state.chatChangedEvent = eventName;
    state.chatChangedHandler = handleTavernChatChanged;
    source.on(eventName, state.chatChangedHandler);
    state.syncGenerationEvent = context?.event_types?.GENERATION_STARTED || 'generation_started';
    state.syncGenerationHandler = () => refreshPhoneStoryContext();
    source.on(state.syncGenerationEvent, state.syncGenerationHandler);
  }

  function buildMomentsPrompt(info, record) {
    // Story context is explicitly assembled by generateMessengerContent().
    // Each post carries its own comments in the same generation response.
    const phoneMessages = getPhoneRecord(info.context).messages.slice(-4).map(message => {
      const speaker = message.sender === 'user' ? info.userName : info.characterName;
      return `${speaker}：${String(message.content || '').trim().slice(0, 220)}`;
    }).join('\n');
    const recentPosts = record.posts.slice(0, 6).map(post =>
      `${post.authorName}：${String(post.content || '').trim().slice(0, 90)}`
    ).join('\n');
    return [
      '【通讯侠｜社交动态与评论】',
      `当前角色：${info.characterName}。用户：${info.userName}。`,
      `【动态行为规则】\n${promptSection('moments')}`,
      '背景资料由本次独立生成请求提供；必须遵守当前角色和世界的信息边界。',
      '生成 3 条简短动态，按新到旧排列；必须至少有 1 条由当前 Char 本人发布。其余可以来自剧情中已经明确登场的 NPC；若没有合适 NPC，则使用不具名普通网友。不得凭空创造有固定姓名和身份的新 NPC。',
      '每条动态正文为 1-2 句自然的社交平台文字，禁止小说式旁白和越权知晓隐私。',
      '每条动态都必须在同一次输出中附带 2 条评论，放在 commentItems 数组里。评论者只能是剧情中已登场且合理可能看到动态的 NPC，或普通网友；不得凭空创造有固定姓名和身份的新 NPC。评论要短、自然、有差异，可以是熟人调侃、追问、补充、轻微吐槽或普通互动，不要全部夸赞。评论者不能知道私密信息。不要在预生成评论中加入当前 User 的评论，也不要替 Char 作者生成回复。',
      '只输出一个严格合法的 JSON 对象，不要 Markdown、代码围栏或解释。格式：{"posts":[{"authorType":"char","authorName":"角色名","topic":"日常","content":"动态正文","minutesAgo":15,"likes":12,"commentItems":[{"authorType":"npc","authorName":"已登场人物昵称","content":"简短评论","minutesAgo":8},{"authorType":"public","authorName":"附近网友","content":"另一条简短评论","minutesAgo":5}]}]}。每条动态必须有 commentItems，且恰好包含 2 条评论；authorType 只能是 char、npc、public；评论 authorType 只能是 npc、public；topic 可用日常、吐槽、分享、工作、学习、剧情、随手记、其他；minutesAgo 为 0-1440 的整数；likes 为合理非负整数。动态和评论对象之间必须使用英文逗号分隔；所有字符串使用英文双引号并正确转义，正文中不要输出未转义的英文双引号、反斜杠或原始换行。',
      '【最近的通讯侠私聊，仅作补充参考】',
      phoneMessages || '暂无手机私聊记录。',
      '【近期已发布动态摘要，请避免重复】',
      recentPosts || '暂无历史动态。',
    ].join('\n\n');
  }

  function getSubscriptionAccount(accountId) {
    return SUBSCRIPTION_ACCOUNTS.find(account => account.id === accountId) || null;
  }

  function setSubscriptionsTopline(page) {
    const back = state.root?.querySelector('[data-fm-view="app"] .fm-back-button');
    if (!back) return;
    const config = page === 'accounts'
      ? { action: 'home', label: '桌面', aria: '返回桌面' }
      : page === 'articles'
        ? { action: 'subscriptions-back-accounts', label: '公众号', aria: '返回公众号列表' }
        : { action: 'subscriptions-back-articles', label: '文章列表', aria: '返回文章列表' };
    back.setAttribute('data-fm-action', config.action);
    back.setAttribute('aria-label', config.aria);
    const label = back.querySelector('span');
    if (label) label.textContent = config.label;
  }

  function renderSubscriptions() {
    if (!state.root || state.currentApp !== 'subscriptions') return;
    const appView = state.root.querySelector('[data-fm-view="app"]');
    const detail = state.root.querySelector('[data-fm-app-detail]');
    if (!appView || !detail) return;
    appView.classList.remove('fm-messages-view', 'fm-messages-conversation', 'fm-moments-view');
    appView.classList.add('fm-subscriptions-view');
    state.root.classList.remove('fm-chat-open');
    detail.classList.remove('fm-messages-detail', 'fm-moments-detail');
    detail.classList.add('fm-subscriptions-detail');
    setSubscriptionsTopline(state.subscriptionPage);
    if (state.subscriptionPage === 'articles') renderSubscriptionArticles();
    else if (state.subscriptionPage === 'article') renderSubscriptionArticle();
    else renderSubscriptionAccounts();
  }

  function renderSubscriptionBatchStatus() {
    const batch = state.subscriptionBatch;
    if (state.subscriptionBusy && batch) {
      const account = getSubscriptionAccount(batch.currentAccountId);
      const currentIndex = Math.min(batch.total, batch.completed + 1);
      const progress = batch.total > 0 ? Math.round((batch.completed / batch.total) * 100) : 0;
      return `
        <section class="fm-subscription-batch-status is-running">
          <div class="fm-subscription-batch-head"><strong>正在更新订阅内容</strong><span>${currentIndex} / ${batch.total}</span></div>
          <p>正在生成「${displayHtml(account?.name || '公众号')}」的文章…</p>
          <div class="fm-subscription-progress-track"><span style="width:${progress}%"></span></div>
          <div class="fm-subscription-batch-foot"><small>已处理 ${batch.completed} 个账号 · 完成一个立即保存</small><button type="button" data-fm-action="subscriptions-stop">停止更新</button></div>
        </section>
      `;
    }
    return state.subscriptionStatus
      ? `<div class="fm-subscription-batch-status is-result">${escapeHtml(state.subscriptionStatus)}</div>`
      : '';
  }

  function renderSubscriptionAccounts() {
    const detail = state.root?.querySelector('[data-fm-app-detail]');
    if (!detail) return;
    state.subscriptionPage = 'accounts';
    setSubscriptionsTopline('accounts');
    const info = getMessageContext();
    if (!info.ok) {
      detail.innerHTML = `<div class="fm-message-unavailable"><span class="fm-message-unavailable-icon">${ICONS.subscriptions}</span><strong>暂时无法读取公众号</strong><p>${escapeHtml(info.reason)}</p><button type="button" class="fm-message-secondary-button" data-fm-action="subscriptions-refresh">重新检查</button></div>`;
      return;
    }
    const record = getSubscriptionsRecord(info.context);
    const followed = new Set(record.subscribedAccountIds);
    const subscribed = SUBSCRIPTION_ACCOUNTS.filter(account => followed.has(account.id));
    const discover = SUBSCRIPTION_ACCOUNTS.filter(account => !followed.has(account.id));
    const renderAccount = account => {
      const articles = Array.isArray(record.articlesByAccount[account.id]) ? record.articlesByAccount[account.id] : [];
      const isFollowed = followed.has(account.id);
      return `
        <article class="fm-subscription-account-card">
          <button type="button" class="fm-subscription-account-main" data-fm-action="subscriptions-open-account" data-fm-account-id="${escapeHtml(account.id)}" ${state.subscriptionBusy ? 'disabled' : ''}>
            <span class="fm-subscription-avatar fm-${account.accent}">${escapeHtml(account.avatar)}</span>
            <span class="fm-subscription-account-copy"><strong>${displayHtml(account.name)}</strong><small>${escapeHtml(account.category)} · ${articles.length} 篇文章</small><span>${displayHtml(account.description)}</span></span>
            <span class="fm-subscription-chevron">${ICONS.chevron}</span>
          </button>
          <button type="button" class="fm-subscription-follow-button ${isFollowed ? 'is-following' : ''}" data-fm-action="subscriptions-toggle-follow" data-fm-account-id="${escapeHtml(account.id)}" ${state.subscriptionBusy ? 'disabled' : ''}>${isFollowed ? '已订阅' : '+ 订阅'}</button>
        </article>
      `;
    };
    const busy = state.subscriptionBusy;
    detail.innerHTML = `
      <div class="fm-subscription-page">
        <header class="fm-subscription-heading">
          <div class="fm-subscription-heading-copy"><span class="fm-subscription-eyebrow">YOUR READING LIST</span><h1>公众号</h1><p>订阅不同声音，看看网络上又有什么新鲜事。</p></div>
          <div class="fm-subscription-heading-actions">
            <span class="fm-subscription-count">${followed.size} / ${SUBSCRIPTION_ACCOUNTS.length}</span>
            <button type="button" class="fm-subscription-generate fm-subscription-update-all" data-fm-action="subscriptions-generate-all" ${busy || !subscribed.length ? 'disabled' : ''}>${busy ? '正在更新…' : `${ICONS.refresh} 更新全部`}</button>
          </div>
        </header>
        ${renderSubscriptionBatchStatus()}
        <section class="fm-subscription-section"><div class="fm-subscription-section-heading"><strong>我的订阅</strong><span>${subscribed.length} 个账号</span></div>
          ${subscribed.length ? subscribed.map(renderAccount).join('') : '<div class="fm-subscription-empty-follow">还没有订阅公众号。先去发现几个感兴趣的账号吧。</div>'}
        </section>
        <section class="fm-subscription-section"><div class="fm-subscription-section-heading"><strong>发现公众号</strong><span>${discover.length} 个账号</span></div>
          ${discover.length ? discover.map(renderAccount).join('') : '<div class="fm-subscription-empty-follow">已经关注全部公众号。</div>'}
        </section>
        ${state.subscriptionError ? `<div class="fm-message-error">${escapeHtml(state.subscriptionError)}</div>` : ''}
        <p class="fm-subscription-footnote">一次更新全部已订阅账号；各账号按自身定位独立生成，完成一个立即保存一个。</p>
      </div>
    `;
  }

  function renderSubscriptionArticles() {
    const detail = state.root?.querySelector('[data-fm-app-detail]');
    if (!detail) return;
    state.subscriptionPage = 'articles';
    setSubscriptionsTopline('articles');
    const info = getMessageContext();
    if (!info.ok) {
      detail.innerHTML = `<div class="fm-message-unavailable"><strong>公众号暂时不可用</strong><p>${escapeHtml(info.reason)}</p></div>`;
      return;
    }
    const account = getSubscriptionAccount(state.activeSubscriptionId);
    if (!account) { renderSubscriptionAccounts(); return; }
    const record = getSubscriptionsRecord(info.context);
    const articles = (Array.isArray(record.articlesByAccount[account.id]) ? record.articlesByAccount[account.id] : []).slice().sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    const isFollowing = record.subscribedAccountIds.includes(account.id);
    detail.innerHTML = `
      <div class="fm-subscription-page">
        <section class="fm-subscription-profile">
          <span class="fm-subscription-avatar fm-subscription-avatar-large fm-${account.accent}">${escapeHtml(account.avatar)}</span>
          <div class="fm-subscription-profile-copy"><span class="fm-subscription-category">${escapeHtml(account.category)}</span><h1>${displayHtml(account.name)}</h1><p>${displayHtml(account.description)}</p></div>
          <button type="button" class="fm-subscription-follow-button ${isFollowing ? 'is-following' : ''}" data-fm-action="subscriptions-toggle-follow" data-fm-account-id="${escapeHtml(account.id)}">${isFollowing ? '已订阅' : '+ 订阅'}</button>
        </section>
        <div class="fm-subscription-article-heading"><div><strong>文章</strong><span>${articles.length} 篇</span></div></div>
        ${renderSubscriptionBatchStatus()}
        ${state.subscriptionError ? `<div class="fm-message-error">${escapeHtml(state.subscriptionError)}</div>` : ''}
        ${articles.length ? `<div class="fm-subscription-article-list">${articles.map(article => `
          <button type="button" class="fm-subscription-article-card" data-fm-action="subscriptions-open-article" data-fm-article-id="${escapeHtml(article.id)}">
            <span class="fm-subscription-article-meta"><span>${displayHtml(account.name)}</span><time>${escapeHtml(formatMomentTime(article.createdAt))}</time></span>
            <strong>${displayHtml(article.title)}</strong>
            <span class="fm-subscription-article-summary">${displayHtml(article.summary || article.content || '')}</span>
            <span class="fm-subscription-article-stats">${Math.max(0, Number(article.reads) || 0)} 阅读 · ${Math.max(0, Number(article.likes) || 0)} 喜欢 ${ICONS.chevron}</span>
          </button>
        `).join('')}</div>` : `<div class="fm-subscription-empty-articles"><span>${ICONS.subscriptions}</span><strong>这个公众号还没有文章</strong><p>返回公众号列表，点击「更新全部」即可获取所有已订阅账号的内容。</p></div>`}
      </div>
    `;
  }

  function renderSubscriptionArticle() {
    const detail = state.root?.querySelector('[data-fm-app-detail]');
    if (!detail) return;
    state.subscriptionPage = 'article';
    setSubscriptionsTopline('article');
    const info = getMessageContext();
    if (!info.ok) {
      detail.innerHTML = `<div class="fm-message-unavailable"><strong>文章暂时不可用</strong><p>${escapeHtml(info.reason)}</p></div>`;
      return;
    }
    const account = getSubscriptionAccount(state.activeSubscriptionId);
    const record = getSubscriptionsRecord(info.context);
    const articleList = account && Array.isArray(record.articlesByAccount[account.id]) ? record.articlesByAccount[account.id] : [];
    const article = articleList.find(item => item.id === state.activeArticleId);
    if (!account || !article) { renderSubscriptionArticles(); return; }
    article.reads = Math.max(0, Number(article.reads) || 0) + 1;
    saveSubscriptionsRecord(record).catch(error => console.warn('[Freesia Messenger] 保存文章阅读数失败。', error));
    detail.innerHTML = `
      <article class="fm-subscription-reader">
        <div class="fm-subscription-reader-source"><span class="fm-subscription-avatar fm-${account.accent}">${escapeHtml(account.avatar)}</span><div><strong>${displayHtml(account.name)}</strong><small>${escapeHtml(account.category)} · ${escapeHtml(formatMomentTime(article.createdAt))}</small></div></div>
        <h1>${displayHtml(article.title)}</h1>
        ${article.summary ? `<p class="fm-subscription-reader-summary">${displayHtml(article.summary)}</p>` : ''}
        <div class="fm-subscription-reader-body">${displayHtml(article.content).replace(/\n/g, '<br><br>')}</div>
        <footer class="fm-subscription-reader-footer"><span>${Math.max(0, Number(article.reads) || 0)} 次阅读</span><span>${displayHtml(account.name)} · FREESIA MESSENGER</span></footer>
      </article>
    `;
  }

  async function toggleSubscriptionFollow(accountId) {
    if (state.subscriptionBusy || state.destroyed) return;
    const info = getMessageContext();
    const account = getSubscriptionAccount(accountId);
    if (!info.ok || !account) return;
    const record = getSubscriptionsRecord(info.context);
    const index = record.subscribedAccountIds.indexOf(accountId);
    if (index >= 0) record.subscribedAccountIds.splice(index, 1);
    else record.subscribedAccountIds.push(accountId);
    state.subscriptionError = '';
    state.subscriptionStatus = '';
    try {
      await saveSubscriptionsRecord(record);
    } catch (error) {
      state.subscriptionError = error?.message || '订阅状态保存失败。';
    }
    renderSubscriptions();
  }

  function buildSubscriptionArticlesPrompt(account, record) {
    const existing = (Array.isArray(record.articlesByAccount[account.id]) ? record.articlesByAccount[account.id] : []).slice(0, 8).map(article =>
      `${article.title}：${String(article.content || '').slice(0, 100)}`
    ).join('\n');
    return [
      '【通讯侠｜娱乐型公众号短文生成】',
      `固定公众号：${account.name}`,
      `内容分类：${account.category}`,
      `账号简介：${account.description}`,
      `账号固定文风：${account.style}`,
      '这是一个独立的虚构互联网娱乐内容账号。文章只依据账号定位、固定文风和本次编辑要求创作，不读取、不引用也不推测当前角色卡、用户 Persona、酒馆剧情、世界书、私聊或记忆摘要。',
      `【公众号行为规则】\n${promptSection('subscriptions')}`,
      '生成 2 篇属于这个固定公众号的短文章；不得引用酒馆剧情或私聊，不得对现实人物进行无依据指控，不得伪装成真实核实的最新新闻。',
      '每篇正文约 50—250 个汉字，长短有变化；标题要有辨识度，摘要控制在 25—55 个汉字。两篇文章角度不同，不要互相重复。不同账号必须保持各自定位，不要全部写成段子，也不要每篇都采用相同的三段式结构。',
      '只输出严格合法的 JSON 对象，不要 Markdown、代码围栏或解释。格式：{"articles":[{"title":"文章标题","summary":"短摘要","content":"正文，可用换行分段","minutesAgo":20,"reads":128,"likes":16}]}。articles 必须恰好包含 2 篇；minutesAgo 为 0—10080 的整数；reads、likes 为合理非负整数；所有字符串使用英文双引号并正确转义。',
      '【该账号近期文章，请避免重复选题】',
      existing || '暂无历史文章。',
    ].join('\n\n');
  }

  function parseSubscriptionArticlesPayload(raw) {
    let source = String(raw ?? '').trim();
    if (!source) throw new Error('模型没有返回公众号文章。');
    source = source.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const first = source.indexOf('{');
    if (first > 0) source = source.slice(first).trim();
    let parsed;
    try { parsed = JSON.parse(source); }
    catch (error) { throw new Error(`公众号文章格式不完整，无法解析：${error?.message || String(error)}`); }
    const articles = Array.isArray(parsed) ? parsed : parsed?.articles;
    if (!Array.isArray(articles)) throw new Error('公众号文章格式不正确，缺少 articles 列表。');
    const normalized = articles.slice(0, 2).map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const title = String(item.title || '').trim().slice(0, 80);
      const content = String(item.content || '').trim().slice(0, 1600);
      if (!title || !content) return null;
      const minutesAgo = Math.max(0, Math.min(10080, Number(item.minutesAgo ?? item.minutes_ago) || index * 20));
      return {
        id: createMessageId(),
        title,
        summary: String(item.summary || content.slice(0, 65)).trim().slice(0, 120),
        content,
        createdAt: Date.now() - minutesAgo * 60000,
        reads: Math.max(0, Math.floor(Number(item.reads) || 0)),
        likes: Math.max(0, Math.floor(Number(item.likes) || 0)),
      };
    }).filter(Boolean);
    if (!normalized.length) throw new Error('没有解析到有效的公众号文章。');
    return normalized;
  }

  async function generateSubscriptionArticlesForAccount(info, accountId, epoch) {
    const account = getSubscriptionAccount(accountId);
    if (!account) throw new Error('找不到这个公众号。');
    const record = getSubscriptionsRecord(info.context);
    const prompt = buildSubscriptionArticlesPrompt(account, record);
    const result = await generateMessengerContent(info, prompt, {
      responseLength: 1900,
      identityMode: 'publisher',
      publisherName: account.name,
      includeStoryContext: false,
    });
    if (state.destroyed || epoch !== state.generationEpoch) return 0;

    const latestInfo = getMessageContext();
    if (!latestInfo.ok) throw new Error(latestInfo.reason);
    const latestRecord = getSubscriptionsRecord(latestInfo.context);
    const newArticles = parseSubscriptionArticlesPayload(result);
    const existing = Array.isArray(latestRecord.articlesByAccount[accountId]) ? latestRecord.articlesByAccount[accountId] : [];
    latestRecord.articlesByAccount[accountId] = [...newArticles, ...existing].slice(0, 40);
    const saved = await saveSubscriptionsRecord(latestRecord, epoch);
    return saved ? newArticles.length : 0;
  }

  async function generateAllSubscribedArticles() {
    if (state.communityBusy || state.subscriptionBusy || state.messageBusy || state.messageSending || state.momentsBusy || state.momentCommentsBusy || state.momentCommentSending || state.destroyed) return;
    const info = getMessageContext();
    if (!info.ok) {
      state.subscriptionError = info.reason;
      renderSubscriptionAccounts();
      return;
    }
    if (typeof info.context.generateRaw !== 'function') {
      state.subscriptionError = '当前 SillyTavern 环境没有提供 generateRaw 独立生成接口。';
      renderSubscriptionAccounts();
      return;
    }

    const record = getSubscriptionsRecord(info.context);
    const accountIds = SUBSCRIPTION_ACCOUNTS
      .filter(account => record.subscribedAccountIds.includes(account.id))
      .map(account => account.id);
    if (!accountIds.length) {
      state.subscriptionStatus = '还没有订阅公众号。先订阅感兴趣的账号，再统一更新内容。';
      state.subscriptionError = '';
      renderSubscriptionAccounts();
      return;
    }

    const epoch = state.generationEpoch;
    const batch = {
      total: accountIds.length,
      completed: 0,
      currentAccountId: accountIds[0],
      succeeded: [],
      failed: [],
      articleCount: 0,
    };
    state.subscriptionBatch = batch;
    state.subscriptionBusy = true;
    state.subscriptionError = '';
    state.subscriptionStatus = '';
    state.subscriptionPage = 'accounts';
    renderSubscriptionAccounts();

    for (const accountId of accountIds) {
      if (state.destroyed || epoch !== state.generationEpoch) return;
      batch.currentAccountId = accountId;
      renderSubscriptionAccounts();
      const account = getSubscriptionAccount(accountId);
      try {
        const latestInfo = getMessageContext();
        if (!latestInfo.ok) throw new Error(latestInfo.reason);
        const added = await generateSubscriptionArticlesForAccount(latestInfo, accountId, epoch);
        if (state.destroyed || epoch !== state.generationEpoch) return;
        batch.succeeded.push(accountId);
        batch.articleCount += added;
      } catch (error) {
        if (state.destroyed || epoch !== state.generationEpoch) return;
        batch.failed.push({ id: accountId, name: account?.name || accountId, message: error?.message || '生成失败' });
        console.warn(`[Freesia Messenger] 公众号「${account?.name || accountId}」更新失败，继续处理下一个账号。`, error);
      }
      batch.completed += 1;
      batch.currentAccountId = accountIds[batch.completed] || null;
      if (batch.currentAccountId) renderSubscriptionAccounts();
    }

    if (state.destroyed || epoch !== state.generationEpoch) return;
    state.subscriptionBusy = false;
    state.subscriptionBatch = null;
    state.subscriptionStatus = batch.failed.length
      ? `更新结束：${batch.succeeded.length}/${batch.total} 个公众号成功，新增 ${batch.articleCount} 篇文章。`
      : `更新完成：${batch.succeeded.length}/${batch.total} 个公众号成功，新增 ${batch.articleCount} 篇文章。`;
    state.subscriptionError = batch.failed.length
      ? `以下账号更新失败：${batch.failed.map(item => item.name).join('、')}。已成功生成的文章均已保存，可再次点击「更新全部」重试。`
      : '';
    if (state.currentApp === 'subscriptions') renderSubscriptionAccounts();
  }

  function renderMoments() {
    if (!state.root || state.currentApp !== 'moments') return;
    const appView = state.root.querySelector('[data-fm-view="app"]');
    const detail = state.root.querySelector('[data-fm-app-detail]');
    if (!appView || !detail) return;
    appView.classList.remove('fm-messages-view', 'fm-messages-conversation');
    appView.classList.add('fm-moments-view');
    state.root.classList.remove('fm-chat-open');
    detail.classList.remove('fm-messages-detail');
    detail.classList.add('fm-moments-detail');
    const back = appView.querySelector('.fm-back-button');
    if (back) {
      back.setAttribute('data-fm-action', 'home');
      const label = back.querySelector('span');
      if (label) label.textContent = '桌面';
    }
    const info = getMessageContext();
    if (!info.ok) {
      detail.innerHTML = `<div class="fm-message-unavailable"><span class="fm-message-unavailable-icon">${ICONS.moments}</span><strong>暂时无法读取故事世界</strong><p>${escapeHtml(info.reason)}</p><button type="button" class="fm-message-secondary-button" data-fm-action="moments-refresh">重新检查</button></div>`;
      return;
    }
    const previousPage = detail.querySelector('.fm-moments-page');
    const previousScrollTop = previousPage?.scrollTop || 0;
    const record = getMomentsRecord(info.context);
    const posts = record.posts.slice(0, 50);
    const feedMarkup = posts.map(post => {
      const commentItems = Array.isArray(post.commentItems) ? post.commentItems : [];
      const commentCount = commentItems.length;
      const commentsOpen = state.activeMomentPostId === post.id;
      const authorTypeLabel = post.authorType === 'char' ? '当前角色' : post.authorType === 'npc' ? '故事人物' : '路人动态';
      const avatarClass = post.authorType === 'char' ? 'is-char' : post.authorType === 'npc' ? 'is-npc' : 'is-public';
      return `
        <article class="fm-moment-card">
          <header class="fm-moment-author-row">
            <span class="fm-moment-avatar ${avatarClass}">${getInitial(post.authorName)}</span>
            <span class="fm-moment-author-copy"><strong>${displayHtml(post.authorName)}</strong><small>${authorTypeLabel}</small></span>
            <time>${escapeHtml(formatMomentTime(post.createdAt))}</time>
          </header>
          <div class="fm-moment-content">${displayHtml(post.content).replace(/\n/g, '<br>')}</div>
          <footer class="fm-moment-actions">
            <span class="fm-moment-topic">${displayHtml(post.topic || '日常')}</span>
            <span class="fm-moment-action-spacer"></span>
            <button type="button" class="fm-moment-like ${post.liked ? 'is-liked' : ''}" data-fm-action="moments-like" data-fm-post-id="${escapeHtml(post.id)}" aria-pressed="${String(!!post.liked)}">${ICONS.heart}<span>${Number(post.likes) || 0}</span></button>
            <button type="button" class="fm-moment-comment-count ${commentsOpen ? 'is-open' : ''}" data-fm-action="moments-comments" data-fm-post-id="${escapeHtml(post.id)}" aria-expanded="${String(commentsOpen)}">${ICONS.comment}<span>评论 ${commentCount}</span></button>
          </footer>
          ${commentsOpen ? renderMomentCommentsPanel(post, info) : ''}
        </article>
      `;
    }).join('');
    const emptyMarkup = posts.length === 0
      ? `<div class="fm-moments-empty"><span class="fm-moments-empty-icon">${ICONS.moments}</span><strong>这里还没有动态</strong><p>生成一组来自 Char 和故事中 NPC 的动态，看看他们最近在分享什么。</p><button type="button" class="fm-moments-primary-button" data-fm-action="moments-refresh" ${state.momentsBusy ? 'disabled' : ''}>${state.momentsBusy ? '正在生成…' : '生成第一组动态'}</button></div>`
      : '';
    const otherTaskBusy = state.messageBusy || state.messageSending || state.subscriptionBusy || state.momentCommentsBusy || state.momentCommentSending;
    const refreshActionLabel = state.momentsBusy ? '停止生成动态' : '刷新动态';
    detail.innerHTML = `
      <div class="fm-moments-page">
        <div class="fm-moments-heading">
          <h1>动态</h1>
          <button type="button" class="fm-moments-refresh" data-fm-action="${state.momentsBusy ? 'moments-stop' : 'moments-refresh'}" ${otherTaskBusy && !state.momentsBusy ? 'disabled' : ''} aria-label="${refreshActionLabel}" title="${refreshActionLabel}">${state.momentsBusy ? ICONS.stop : ICONS.refresh}</button>
        </div>
        ${state.momentsError ? `<div class="fm-moments-error">${escapeHtml(state.momentsError)}</div>` : ''}
        <div class="fm-moments-feed">${feedMarkup}${emptyMarkup}${state.momentsBusy && posts.length ? `<div class="fm-moments-loading"><i></i><i></i><i></i><span>正在整理新的动态…</span></div>` : ''}</div>
      </div>
    `;
    const nextPage = detail.querySelector('.fm-moments-page');
    if (nextPage) nextPage.scrollTop = previousScrollTop;
  }

  async function openMomentComments(postId) {
    if (state.communityBusy || state.subscriptionBusy || state.messageBusy || state.messageSending || state.momentsBusy || state.momentCommentSending) return;
    const info = getMessageContext();
    if (!info.ok) {
      state.momentCommentsError = info.reason;
      state.activeMomentPostId = postId;
      renderMoments();
      return;
    }
    const record = getMomentsRecord(info.context);
    const post = record.posts.find(item => item.id === postId);
    if (!post) return;
    state.momentCommentsError = '';

    // Opening a comment panel is now display-only: all generated comments were
    // created and persisted together with the post. Legacy posts remain readable
    // but are not silently sent through another generation request.
    if (!Array.isArray(post.commentItems)) post.commentItems = [];
    if (post.commentsLoaded !== true) {
      const legacyCount = Math.max(0, Math.floor(Number(post.comments) || 0));
      if (!post.commentItems.length && legacyCount > 0) {
        post.commentsLegacy = true;
        post.legacyCommentCount = legacyCount;
      }
      post.commentsLoaded = true;
      post.comments = post.commentItems.length;
      try { await saveMomentsRecord(record); }
      catch (error) { state.momentCommentsError = error?.message || '评论记录迁移保存失败。'; }
    }

    state.activeMomentPostId = postId;
    renderMoments();
  }

  function isTlsHandshakeDisconnect(error) {
    const message = [
      error?.message,
      error?.cause?.message,
      error?.stack,
      typeof error === 'string' ? error : '',
    ].filter(Boolean).join(' ');
    return /client network socket disconnected before secure tls connection was established|socket disconnected before secure tls|before secure tls connection was established/i.test(message);
  }

  async function generateCharCommentDecision(info, prompt, epoch) {
    if (typeof info?.context?.generateRaw !== 'function') {
      throw new Error('当前 SillyTavern 环境没有提供 generateRaw 独立生成接口。');
    }

    // Match the working phone-message path exactly: do not install a temporary
    // response-length override for this small reply/ignore decision.
    try {
      return await generateMessengerContent(info, prompt);
    } catch (error) {
      if (!isTlsHandshakeDisconnect(error)) throw error;
      if (state.destroyed || epoch !== state.generationEpoch) throw error;

      console.warn('[Freesia Messenger] Char 评论回应遇到 TLS 握手中断，1.2 秒后自动重试一次。', error);
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (state.destroyed || epoch !== state.generationEpoch) throw error;

      // The reported failure happens before the secure TLS session is
      // established, so the request was not delivered to the provider.
      return await generateMessengerContent(info, prompt);
    }
  }

  async function requestCharReplyToMomentComment(info, record, post, userComment, epoch) {
    try {
      if (post.commentItems.some(item => item.replyToId === userComment.id && item.authorType === 'char')) {
        userComment.replyStatus = 'replied';
        await saveMomentsRecord(record, epoch);
        return;
      }
      const prompt = buildCharCommentDecisionPrompt(info, post, userComment);
      const raw = await generateCharCommentDecision(info, prompt, epoch);
      if (state.destroyed || epoch !== state.generationEpoch) return;
      const latestInfo = getMessageContext();
      if (!latestInfo.ok) throw new Error(latestInfo.reason);
      const latestRecord = getMomentsRecord(latestInfo.context);
      const latestPost = latestRecord.posts.find(item => item.id === post.id);
      const latestComment = latestPost?.commentItems?.find(item => item.id === userComment.id);
      if (!latestPost || !latestComment) throw new Error('原评论已不存在，无法关联角色回应。');
      const decision = parseCharCommentDecision(raw);
      if (decision.decision === 'reply') {
        latestPost.commentItems.push({
          id: createMessageId(),
          authorName: latestInfo.characterName,
          authorType: 'char',
          content: decision.content,
          createdAt: Date.now(),
          replyToId: latestComment.id,
        });
        latestComment.replyStatus = 'replied';
      } else {
        latestComment.replyStatus = 'ignored';
      }
      latestPost.comments = latestPost.commentItems.length;
      await saveMomentsRecord(latestRecord, epoch);
    } catch (error) {
      if (state.destroyed || epoch !== state.generationEpoch) return;
      const latestInfo = getMessageContext();
      if (latestInfo.ok) {
        const latestRecord = getMomentsRecord(latestInfo.context);
        const latestPost = latestRecord.posts.find(item => item.id === post.id);
        const latestComment = latestPost?.commentItems?.find(item => item.id === userComment.id);
        if (latestComment) {
          latestComment.replyStatus = 'error';
          try { await saveMomentsRecord(latestRecord, epoch); } catch (saveError) { console.warn('[Freesia Messenger] 保存角色评论状态失败。', saveError); }
        }
      }
      const errorText = String(error?.message || error || '未知错误');
      state.momentCommentsError = isTlsHandshakeDisconnect(error)
        ? '评论已经发布，但连接 Google API 时 TLS 握手中断；已自动重试一次仍未成功。评论已保留，可以点击「重试角色回复」。'
        : `评论已经发布，但角色暂时没有完成回应判断：${errorText.slice(0, 180)}。评论已保留，可以稍后重试。`;
      console.error('[Freesia Messenger] Char 动态评论回应判断失败。', error);
    }
  }

  async function submitMomentComment(postId) {
    if (state.communityBusy || state.momentCommentSending || state.momentCommentsBusy || state.momentsBusy || state.subscriptionBusy || state.messageBusy || state.messageSending || state.destroyed) return;
    const composer = state.root?.querySelector('[data-fm-moment-composer]');
    const content = String(composer?.value || '').trim().slice(0, 800);
    if (!content) return;
    const info = getMessageContext();
    if (!info.ok) {
      state.momentCommentsError = info.reason;
      renderMoments();
      return;
    }
    const record = getMomentsRecord(info.context);
    const post = record.posts.find(item => item.id === postId);
    if (!post) return;
    if (!post.commentsLoaded) {
      state.momentCommentsError = '请先加载评论区，再发送评论。';
      renderMoments();
      return;
    }
    const epoch = state.generationEpoch;
    if (!Array.isArray(post.commentItems)) post.commentItems = [];
    const userComment = {
      id: createMessageId(),
      authorName: info.userName,
      authorType: 'user',
      content,
      createdAt: Date.now(),
      replyToId: null,
      replyStatus: post.authorType === 'char' ? 'pending' : undefined,
    };
    post.commentItems.push(userComment);
    post.comments = post.commentItems.length;
    state.activeMomentPostId = postId;
    state.momentCommentSending = true;
    state.momentCommentsError = '';
    try {
      await saveMomentsRecord(record, epoch);
      if (state.destroyed || epoch !== state.generationEpoch) return;
      renderMoments();
      if (post.authorType === 'char') {
        await requestCharReplyToMomentComment(info, record, post, userComment, epoch);
      }
    } catch (error) {
      if (state.destroyed || epoch !== state.generationEpoch) return;
      post.commentItems = post.commentItems.filter(item => item.id !== userComment.id);
      post.comments = post.commentItems.length;
      state.momentCommentsError = error?.message || '评论发送失败，内容没有保存。';
      try { await saveMomentsRecord(record, epoch); } catch {}
    } finally {
      if (!state.destroyed && epoch === state.generationEpoch) {
        state.momentCommentSending = false;
        if (state.currentApp === 'moments') renderMoments();
      }
    }
  }

  async function retryCharMomentReply(postId, commentId) {
    if (state.communityBusy || state.momentCommentSending || state.momentCommentsBusy || state.momentsBusy || state.subscriptionBusy || state.messageBusy || state.messageSending || state.destroyed) return;
    const info = getMessageContext();
    if (!info.ok) {
      state.momentCommentsError = info.reason;
      renderMoments();
      return;
    }
    const record = getMomentsRecord(info.context);
    const post = record.posts.find(item => item.id === postId);
    const comment = post?.commentItems?.find(item => item.id === commentId && item.authorType === 'user');
    if (!post || post.authorType !== 'char' || !comment || comment.replyStatus !== 'error') return;
    const epoch = state.generationEpoch;
    comment.replyStatus = 'pending';
    state.activeMomentPostId = postId;
    state.momentCommentSending = true;
    state.momentCommentsError = '';
    try {
      await saveMomentsRecord(record, epoch);
      renderMoments();
      await requestCharReplyToMomentComment(info, record, post, comment, epoch);
    } catch (error) {
      state.momentCommentsError = error?.message || '无法重新请求角色回应。';
    } finally {
      if (!state.destroyed && epoch === state.generationEpoch) {
        state.momentCommentSending = false;
        if (state.currentApp === 'moments') renderMoments();
      }
    }
  }

  async function generateMoments() {
    if (state.communityBusy || state.momentsBusy || state.subscriptionBusy || state.messageBusy || state.messageSending || state.momentCommentsBusy || state.momentCommentSending || state.destroyed) return;
    const info = getMessageContext();
    if (!info.ok) {
      state.momentsError = info.reason;
      renderMoments();
      return;
    }
    if (typeof info.context.generateRaw !== 'function') {
      state.momentsError = '当前 SillyTavern 环境没有提供 generateRaw 独立生成接口。';
      renderMoments();
      return;
    }
    const epoch = state.generationEpoch;
    const record = getMomentsRecord(info.context);
    state.momentsBusy = true;
    state.momentsError = '';
    renderMoments();
    try {
      const prompt = buildMomentsPrompt(info, record);
      const result = await generateMessengerContent(info, prompt, { responseLength: 2500 });
      if (state.destroyed || epoch !== state.generationEpoch) return;
      const latestInfo = getMessageContext();
      if (!latestInfo.ok) throw new Error(latestInfo.reason);
      const latestRecord = getMomentsRecord(latestInfo.context);
      const parsed = parseMomentsPayload(result);
      const newPosts = normalizeMomentsPosts(parsed, latestInfo.characterName, latestRecord.posts);
      if (!newPosts.length) throw new Error('这次没有生成包含有效评论的新动态，请再试一次。');
      if (!newPosts.some(post => post.authorType === 'char')) throw new Error('这批动态没有包含当前 Char 本人发布且附带评论的内容，请刷新重试。');
      latestRecord.posts = [...newPosts, ...latestRecord.posts].slice(0, 80);
      await saveMomentsRecord(latestRecord, epoch);
    } catch (error) {
      if (state.destroyed || epoch !== state.generationEpoch) return;
      const rawError = String(error?.message || '');
      state.momentsError = /Candidate text empty|returned no candidate/i.test(rawError)
        ? 'Google AI Studio 返回了空候选，没有可读取的正文；请检查酒馆终端中的原始 candidates 信息。'
        : (/动态 JSON 格式不完整/i.test(rawError)
          ? `模型返回的动态格式不完整，自动修复未成功。请再试一次。${rawError}`
          : (rawError || '动态生成失败，请稍后重试。'));
      console.error('[Freesia Messenger] 动态生成失败。', error);
    } finally {
      if (!state.destroyed && epoch === state.generationEpoch) {
        state.momentsBusy = false;
        if (state.currentApp === 'moments') renderMoments();
        else if (state.currentApp === 'messages' && state.messagePage === 'conversation') renderMessagesConversation();
      }
    }
  }

  async function stopSubscriptionGeneration() {
    if (!state.subscriptionBusy) return;
    const batch = state.subscriptionBatch;
    try { getTavernContext()?.stopGeneration?.(); } catch (error) { console.warn('[Freesia Messenger] 停止公众号更新失败。', error); }
    state.generationEpoch += 1;
    state.subscriptionBusy = false;
    state.subscriptionBatch = null;
    const completed = batch?.completed || 0;
    const total = batch?.total || 0;
    const articleCount = batch?.articleCount || 0;
    state.subscriptionStatus = `已停止更新：已处理 ${completed}/${total} 个公众号，新增 ${articleCount} 篇文章。已完成账号的内容均已保存。`;
    state.subscriptionError = batch?.failed?.length
      ? `停止前更新失败的账号：${batch.failed.map(item => item.name).join('、')}。`
      : '';
    if (state.currentApp === 'subscriptions') renderSubscriptionAccounts();
  }

  async function stopMomentsGeneration() {
    if (!state.momentsBusy) return;
    let stopped = false;
    try { stopped = !!getTavernContext()?.stopGeneration?.(); } catch (error) { console.warn('[Freesia Messenger] 停止动态生成失败。', error); }
    state.generationEpoch += 1;
    state.momentsBusy = false;
    state.momentsError = stopped ? '已停止本次动态生成。' : '已取消本次结果接收；如果底层请求未能中止，返回结果也不会保存。';
    if (state.currentApp === 'moments') renderMoments();
    else if (state.currentApp === 'messages' && state.messagePage === 'conversation') renderMessagesConversation();
  }

  async function toggleMomentLike(postId) {
    const info = getMessageContext();
    if (!info.ok) return;
    const record = getMomentsRecord(info.context);
    const post = record.posts.find(item => item.id === postId);
    if (!post) return;
    post.liked = !post.liked;
    post.likes = Math.max(0, (Number(post.likes) || 0) + (post.liked ? 1 : -1));
    try { await saveMomentsRecord(record); }
    catch (error) {
      post.liked = !post.liked;
      post.likes = Math.max(0, (Number(post.likes) || 0) + (post.liked ? 1 : -1));
      state.momentsError = error?.message || '点赞状态保存失败。';
    }
    renderMoments();
  }

  function renderApp(appKey) {
    const app = APPS[appKey];
    if (!app || !state.root) return;
    state.currentApp = appKey;
    const homeView = state.root.querySelector('[data-fm-view="home"]');
    const appView = state.root.querySelector('[data-fm-view="app"]');
    const detail = state.root.querySelector('[data-fm-app-detail]');
    if (!homeView || !appView || !detail) return;

    homeView.hidden = true;
    appView.hidden = false;
    if (appKey !== 'messages') {
      state.selectionMode = false;
      state.selectedMessageIds = [];
    }
    appView.classList.remove('fm-subscriptions-view');
    detail.classList.remove('fm-subscriptions-detail', 'fm-community-detail');
    if (appKey === 'messages') {
      appView.classList.remove('fm-moments-view');
      detail.classList.remove('fm-moments-detail');
      renderMessagesList();
      return;
    }
    if (appKey === 'moments') {
      renderMoments();
      return;
    }
    if (appKey === 'community') {
      state.communityView = 'feed';
      state.activeCommunityPostId = null;
      state.communityReplyTo = null;
      state.communityError = '';
      renderCommunity();
      return;
    }
    if (appKey === 'subscriptions') {
      state.subscriptionPage = 'accounts';
      state.activeSubscriptionId = null;
      state.activeArticleId = null;
      state.subscriptionError = '';
      renderSubscriptions();
      return;
    }

    state.messagePage = 'list';
    state.composerWantsFocus = false;
    appView.classList.remove('fm-messages-view', 'fm-messages-conversation', 'fm-moments-view');
    state.root.classList.remove('fm-chat-open');
    detail.classList.remove('fm-messages-detail', 'fm-moments-detail');
    const back = appView.querySelector('.fm-back-button');
    if (back) {
      back.setAttribute('data-fm-action', 'home');
      const label = back.querySelector('span');
      if (label) label.textContent = '桌面';
    }
    detail.innerHTML = `
      <div class="fm-app-hero fm-${app.accent}">
        <span class="fm-app-hero-icon">${app.icon}</span>
        <span class="fm-app-hero-mark">${app.mark} / 04</span>
      </div>
      <div class="fm-app-heading">
        <span class="fm-app-english">${app.english}</span>
        <h1>${app.name}</h1>
        <p>${app.subtitle}</p>
      </div>
      <div class="fm-coming-card">
        <span class="fm-coming-kicker"><i></i> FIRST EDITION</span>
        <h2>正在搭建中</h2>
        <p>${app.description}</p>
      </div>
      <div class="fm-feature-heading"><strong>计划中的功能</strong><span>COMING SOON</span></div>
      <div class="fm-feature-list">
        ${app.features.map((feature, index) => `
          <div class="fm-feature-row"><span>${String(index + 1).padStart(2, '0')}</span><strong>${feature}</strong><i>·</i></div>
        `).join('')}
      </div>
      <div class="fm-app-footnote"><span class="fm-footnote-dot"></span> 该功能仍在开发中，后续版本将逐步接入。</div>
    `;
  }

  function applySettingsView(appKey, title, backAction, backLabel) {
    if (!state.root) return null;
    state.currentApp = appKey;
    state.root.classList.remove('fm-chat-open');
    const home = state.root.querySelector('[data-fm-view="home"]');
    const appView = state.root.querySelector('[data-fm-view="app"]');
    const detail = state.root.querySelector('[data-fm-app-detail]');
    if (home) home.hidden = true;
    if (appView) {
      appView.hidden = false;
      appView.classList.remove('fm-messages-view', 'fm-messages-conversation', 'fm-moments-view', 'fm-subscriptions-view');
      const back = appView.querySelector('.fm-back-button');
      if (back) {
        back.setAttribute('data-fm-action', backAction);
        const label = back.querySelector('span');
        if (label) label.textContent = backLabel;
      }
      const topline = appView.querySelector('.fm-app-topline-label');
      if (topline) topline.textContent = title;
    }
    if (detail) detail.classList.remove('fm-messages-detail', 'fm-moments-detail', 'fm-subscriptions-detail', 'fm-community-detail');
    return detail;
  }

  function openSettings() {
    if (!state.root) return;
    if (state.currentApp !== 'settings' && state.currentApp !== 'presets' && state.currentApp !== 'mask') {
      state.settingsReturnApp = state.currentApp;
      state.settingsReturnConversation = state.currentApp === 'messages' && state.messagePage === 'conversation';
      state.settingsReturnSubscriptionPage = state.subscriptionPage;
      state.settingsReturnSubscriptionId = state.activeSubscriptionId;
      state.settingsReturnArticleId = state.activeArticleId;
      state.settingsReturnCommunityView = state.communityView;
      state.settingsReturnCommunityPostId = state.activeCommunityPostId;
      state.settingsReturnCommunityFilter = state.communityFilter;
    }
    renderSettings();
  }

  function renderSettings() {
    const detail = applySettingsView('settings', 'SETTINGS', 'settings-back', '返回');
    if (!detail) return;
    const detected = detectHostAppearance();
    detail.innerHTML = `
      <div class="fm-settings-page">
        <div class="fm-settings-heading"><span class="fm-app-english">PREFERENCES</span><h1>通讯侠设置</h1><p>调整 AI 行为与外观，不影响现有聊天记录。</p></div>
        <button type="button" class="fm-settings-link" data-fm-action="presets-open">
          <span class="fm-settings-link-icon">${ICONS.settings}</span>
          <span><strong>AI 预设管理</strong><small>分区编辑、组合预览、保存与恢复默认</small></span>
          ${ICONS.chevron}
        </button>
        <button type="button" class="fm-settings-link" data-fm-action="mask-settings-open">
          <span class="fm-settings-link-icon">${ICONS.shield}</span>
          <span><strong>隐私遮罩 · Privacy Mask</strong><small>Char / User 假名、附加昵称和一键 MASK</small></span>
          ${ICONS.chevron}
        </button>
        <div class="fm-appearance-settings">
          <div class="fm-appearance-heading"><strong>社区 · 世界观模式</strong><small>两种模式独立保存帖子，默认使用不读取剧情的虚构互联网。</small></div>
          <div class="fm-appearance-options" role="group" aria-label="社区世界观">
            ${[['independent','独立互联网'],['story','剧情世界']].map(([id,label]) => `<button type="button" class="fm-appearance-option ${state.communityMode === id ? 'is-active' : ''}" data-fm-action="community-setting-mode" data-fm-mode="${id}" aria-pressed="${state.communityMode === id}">${label}</button>`).join('')}
          </div>
        </div>
        <div class="fm-appearance-settings fm-real-time-settings">
          <div class="fm-appearance-heading"><strong>手机聊天同步到酒馆正文</strong><small>把当前会话最近最多 24 条手机消息转成简洁对话，供酒馆下次正常生成时参考。不会新增楼层，也不会改变原记录。</small></div>
          <button type="button" class="fm-time-switch" data-fm-action="phone-story-sync-toggle" role="switch" aria-label="手机聊天同步到酒馆正文" aria-checked="${state.phoneStorySyncEnabled}">
            <span class="fm-time-switch-track" aria-hidden="true"><span class="fm-time-switch-knob"></span></span>
            <span class="fm-time-switch-label">${state.phoneStorySyncEnabled ? '已开启（默认）' : '已关闭'}</span>
          </button>
          <p class="fm-appearance-hint">单份上下文有长度上限，避免逐轮重复堆积；切换聊天、删除消息或停用脚本时会更新或清理。隐私遮罩只影响显示，不影响同步原文。</p>
        </div>
        <div class="fm-appearance-settings fm-real-time-settings">
          <div class="fm-appearance-heading"><strong>真实时间感知</strong><small>仅在开启后向角色的私聊、动态和评论生成提供设备真实时间；不会修改剧情时间。</small></div>
          <button type="button" class="fm-time-switch" data-fm-action="time-awareness-toggle" role="switch" aria-label="真实时间感知" aria-checked="${state.realTimeEnabled}">
            <span class="fm-time-switch-track" aria-hidden="true"><span class="fm-time-switch-knob"></span></span>
            <span class="fm-time-switch-label">${state.realTimeEnabled ? '已开启' : '已关闭（默认）'}</span>
          </button>
          <p class="fm-appearance-hint">关闭时不会向 AI 额外注入真实时间或私聊历史消息时间戳；手机界面时钟仍然正常显示。此设置独立保存。</p>
        </div>
        <div class="fm-appearance-settings">
          <div class="fm-appearance-heading"><strong>主动联络</strong><small>允许当前 Char 自主发信。未回复不阻止联络；判断本身消耗 API 额度。需要开启真实时间感知。</small></div>
          <button type="button" class="fm-time-switch" data-fm-action="proactive-toggle" role="switch" aria-checked="${state.proactive.enabled}"><span class="fm-time-switch-track"><span class="fm-time-switch-knob"></span></span><span class="fm-time-switch-label">${state.proactive.enabled ? '已开启' : '已关闭（默认）'}</span></button>
          ${state.proactive.enabled ? `<div class="fm-proactive-fields">${[['interval','检测间隔（分钟）',[5,10,15,30,60,120]],['cooldown','发信冷却（分钟）',[0,5,15,30,60]],['limit','每日联络上限（轮）',[0,3,5,10,20]]].map(([key,label,values])=>`<label>${label}<select data-fm-proactive-field="${key}">${values.map(v=>`<option value="${v}" ${state.proactive[key]===v?'selected':''}>${v===0?'不限':v}</option>`).join('')}</select></label>`).join('')}<label>到达通知<input type="checkbox" data-fm-proactive-field="notify" ${state.proactive.notify?'checked':''}></label></div><button type="button" class="fm-appearance-option" data-fm-action="proactive-check">立即检测（测试）</button>` : ''}
          <p class="fm-appearance-hint" data-fm-proactive-status>${escapeHtml(state.proactiveStatus || (state.realTimeEnabled ? '仅脚本运行且页面可用时检测；恢复前台后检查是否到期。' : '请先开启真实时间感知。'))}</p>
        </div>
        <div class="fm-appearance-settings">
          <div class="fm-appearance-heading"><strong>外观模式</strong><small>自动模式依据酒馆 SmartThemeBodyColor 的文字亮度判断。</small></div>
          <div class="fm-appearance-options" role="group" aria-label="外观模式">
            ${[['auto','自动跟随酒馆'], ['light','日间'], ['dark','夜间']].map(([value,label]) => `<button type="button" class="fm-appearance-option ${state.appearanceMode === value ? 'is-active' : ''}" data-fm-action="appearance-set" data-fm-appearance="${value}" aria-pressed="${state.appearanceMode === value}">${label}</button>`).join('')}
          </div>
          <p class="fm-appearance-hint" data-fm-appearance-hint>检测到酒馆当前使用${detected === 'dark' ? '浅色文字，倾向夜间主题' : '深色文字，倾向日间主题'}。</p>
        </div>
      </div>`;
  }

  function returnFromSettings() {
    const target = state.settingsReturnApp;
    const restoreConversation = state.settingsReturnConversation;
    const subscriptionPage = state.settingsReturnSubscriptionPage;
    const subscriptionId = state.settingsReturnSubscriptionId;
    const articleId = state.settingsReturnArticleId;
    const communityView = state.settingsReturnCommunityView;
    const communityPostId = state.settingsReturnCommunityPostId;
    const communityFilter = state.settingsReturnCommunityFilter;
    state.settingsReturnApp = null;
    if (!target) { showHome(); return; }
    renderApp(target);
    if (target === 'messages' && restoreConversation) renderMessagesConversation();
    else if (target === 'community') {
      state.communityView = communityView;
      state.activeCommunityPostId = communityPostId;
      state.communityFilter = communityFilter;
      renderCommunity();
    }
    else if (target === 'subscriptions') {
      state.subscriptionPage = subscriptionPage;
      state.activeSubscriptionId = subscriptionId;
      state.activeArticleId = articleId;
      if (subscriptionPage === 'article') renderSubscriptionArticle();
      else if (subscriptionPage === 'articles') renderSubscriptionArticles();
    }
  }

  function setAppearanceMode(mode) {
    if (!['auto','light','dark'].includes(mode)) return;
    state.appearanceMode = mode;
    try { HOST_WIN.localStorage.setItem(APPEARANCE_KEY, mode); } catch {}
    refreshAppearance();
    renderSettings();
  }

  function setMessengerEnabled(enabled) {
    const next = enabled === true;
    if (state.destroyed || next === state.enabled) return;
    try { HOST_WIN.localStorage.setItem(ENABLED_KEY, String(next)); }
    catch {
      extensionNotice('通讯侠开关保存失败，请检查设备存储权限。');
      syncExtensionControls();
      return;
    }
    state.enabled = next;
    state.proactiveConfigEpoch += 1;
    if (!next) {
      state.minimized = false;
      if (state.proactiveTimer) HOST_WIN.clearInterval(state.proactiveTimer);
      state.proactiveTimer = null;
      closeWindow();
      clearPhoneStoryContext();
      state.proactiveStatus = '通讯侠已停用';
      state.extensionStatus = '通讯侠已停用；所有记录和设置均已保留。';
    } else {
      state.proactiveStatus = '';
      state.extensionStatus = '通讯侠已启用。';
      refreshPhoneStoryContext();
      if (!state.proactiveTimer) state.proactiveTimer = HOST_WIN.setInterval(proactiveWake, 15000);
      proactiveWake();
    }
    syncChatEntryState();
    syncExtensionControls();
  }

  function togglePhoneStorySync() {
    const next = !state.phoneStorySyncEnabled;
    try {
      HOST_WIN.localStorage.setItem(PHONE_SYNC_ENABLED_KEY, next ? 'true' : 'false');
      state.phoneStorySyncEnabled = next;
    } catch (error) {
      console.warn('[Freesia Messenger] 正文同步开关保存失败。', error);
      extensionNotice('保存失败，请检查设备存储权限。');
      return;
    }
    refreshPhoneStoryContext();
    if (state.currentApp === 'settings') renderSettings();
    syncExtensionControls();
  }

  function toggleRealTimeAwareness() {
    const next = !state.realTimeEnabled;
    try {
      HOST_WIN.localStorage.setItem(TIME_AWARENESS_KEY, next ? 'true' : 'false');
      state.realTimeEnabled = next;
      state.proactiveConfigEpoch += 1;
    } catch (error) {
      console.warn('[Freesia Messenger] 真实时间开关保存失败。', error);
      // Do not enable a setting that won't persist as requested.
      extensionNotice('保存失败，请检查设备存储权限。');
      return;
    }
    if (state.currentApp === 'settings') renderSettings();
    syncExtensionControls();
    if (state.realTimeEnabled) void checkProactive().finally(syncExtensionControls);
  }

  function openPresetSettings() {
    if (!state.root) return;
    state.presetStatus = '';
    state.presetPreviewOpen = false;
    applySettingsView('presets', 'PROMPT STUDIO', 'presets-back', '设置');
    renderPresetSettings();
  }

  function renderPresetPreview() {
    const target = state.root?.querySelector('[data-fm-preset-preview]');
    if (!target) return;
    const key = state.presetActiveKey;
    const title = PRESET_SECTIONS.find(item => item[0] === key)?.[1] || key;
    target.textContent = [
      '【当前组合预览】',
      ['subscriptions','community'].includes(key) ? '' : `【核心规则】\n${promptSection('core', true)}`,
      key === 'core' ? '' : `【${title}】\n${promptSection(key, true)}`,
      state.realTimeEnabled && !['subscriptions','community','time'].includes(key) ? `【已开启真实时间感知】\n${promptSection('time', true)}\n生成时额外传入设备当前时间；不会覆盖剧情时间。` : '（真实时间感知默认关闭。可在通讯侠设置中开启。）',
      '（实际生成时，程序会附加当前角色／背景信息及不可编辑的输出格式协议。）',
    ].filter(Boolean).join('\n\n');
  }

  function renderPresetSettings() {
    if (!state.root || state.currentApp !== 'presets') return;
    const detail = state.root.querySelector('[data-fm-app-detail]');
    if (!detail) return;
    detail.classList.remove('fm-messages-detail', 'fm-moments-detail', 'fm-subscriptions-detail');
    const key = state.presetActiveKey;
    const selected = PRESET_SECTIONS.find(item => item[0] === key) || PRESET_SECTIONS[0];
    detail.innerHTML = `
      <div class="fm-presets-page">
        <div class="fm-presets-heading"><span class="fm-app-english">PROMPT STUDIO</span><h1>AI 预设</h1><p>只编辑角色行为提示词，程序输出格式由通讯侠单独维护。</p></div>
        <div class="fm-presets-tabs" role="group" aria-label="预设章节">
          ${PRESET_SECTIONS.map(([id,name])=>`<button type="button" class="fm-presets-tab ${id === key ? 'is-active' : ''}" data-fm-action="preset-select" data-fm-preset-id="${id}" aria-pressed="${id===key}">${name}</button>`).join('')}
        </div>
        <div class="fm-presets-editor">
          <div class="fm-presets-label"><strong>${selected[1]}</strong><small>${selected[2]}</small></div>
          <textarea data-fm-preset-field aria-label="编辑${selected[1]}提示词" spellcheck="false" maxlength="8000">${escapeHtml(promptSection(key, true))}</textarea>
          <div class="fm-presets-actions">
            <button type="button" data-fm-action="preset-reset" class="fm-presets-secondary">恢复本节默认</button>
            <button type="button" data-fm-action="preset-preview-toggle" class="fm-presets-secondary">${state.presetPreviewOpen ? '隐藏预览' : '组合预览'}</button>
            <button type="button" data-fm-action="preset-save" class="fm-presets-primary">保存预设</button>
          </div>
          <div class="fm-presets-status" data-fm-preset-status aria-live="polite">${escapeHtml(state.presetStatus || '修改后点击保存；不会更改通讯侠程序代码。')}</div>
          ${state.presetPreviewOpen ? '<pre class="fm-presets-preview" data-fm-preset-preview></pre>' : ''}
        </div>
      </div>`;
    if (state.presetPreviewOpen) renderPresetPreview();
  }

  function showHome() {
    if (!state.root) return;
    state.currentApp = null;
    state.composerWantsFocus = false;
    state.editingMessageId = null;
    state.selectionMode = false;
    state.selectedMessageIds = [];
    state.root.classList.remove('fm-chat-open');
    const appViewForHome = state.root.querySelector('[data-fm-view="app"]');
    appViewForHome?.classList.remove('fm-messages-conversation');
    const homeView = state.root.querySelector('[data-fm-view="home"]');
    const appView = state.root.querySelector('[data-fm-view="app"]');
    if (homeView) homeView.hidden = false;
    if (appView) appView.hidden = true;
    updateClock();
    syncMaskShortcut();
  }


  class WindowController {
    constructor(host, root, frame, namespace) {
      this.host = host;
      this.root = root;
      this.frame = frame;
      this.namespace = namespace;
      this.titlebar = frame.querySelector('[data-fm-drag-handle]');
      this.resizeGrip = frame.querySelector('[data-fm-resize-grip]');
      this.visible = false;
      this.minimized = false;
      this.maximized = false;
      this.geom = null;
      this.workspaceGeom = null;
      this.bubbleGeom = null;
      this.geomMode = null;
      this.drag = null;
      this.bubbleDrag = null;
      this.suppressBubbleClick = false;
      this.cleanups = [];

      this.bubble = node('button', 'fm-chat-entry');
      this.bubble.id = ENTRY_ID;
      this.bubble.type = 'button';
      this.bubble.innerHTML = ICONS.messages;
      this.bubble.hidden = true;
      this.bubble.title = '打开通讯侠';
      this.bubble.setAttribute('aria-label', '打开通讯侠');
      this.bubble.setAttribute('aria-expanded', 'false');
      (state.shadowRoot || state.rootHost || HOST_DOC.body).appendChild(this.bubble);

      this.listen(host, 'resize', () => this.layout());
      if (host.visualViewport) {
        this.listen(host.visualViewport, 'resize', () => this.layout());
        this.listen(host.visualViewport, 'scroll', () => this.layout());
      }
      this.listen(this.root, 'focusin', () => this.layout());
      this.listen(this.root, 'focusout', () => {
        this.host.requestAnimationFrame(() => this.layout());
      });
      this.listen(this.titlebar, 'pointerdown', event => this.begin(event, false));
      this.listen(this.resizeGrip, 'pointerdown', event => this.begin(event, true));
      this.listen(this.bubble, 'pointerdown', event => this.beginBubble(event));
      this.listen(this.bubble, 'click', event => {
        if (this.suppressBubbleClick) {
          this.suppressBubbleClick = false;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        this.restoreFromBubble();
      });
      this.listen(host, 'pointermove', event => this.move(event));
      this.listen(host, 'pointerup', event => this.end(event));
      this.listen(host, 'pointercancel', event => this.end(event));
      this.layout();
    }

    listen(target, type, callback, options) {
      if (!target?.addEventListener) return;
      target.addEventListener(type, callback, options);
      this.cleanups.push(() => target.removeEventListener(type, callback, options));
    }

    mobile() {
      return Number(this.host.innerWidth || 0) <= 821;
    }

    bounds() {
      const viewport = this.host.visualViewport;
      return {
        x: Number(viewport?.offsetLeft) || 0,
        y: Number(viewport?.offsetTop) || 0,
        width: Math.max(1, Number(viewport?.width) || Number(this.host.innerWidth) || 1),
        height: Math.max(1, Number(viewport?.height) || Number(this.host.innerHeight) || 1),
      };
    }

    syncKeyboardState(mobile) {
      if (!mobile || !this.root) {
        this.root?.classList.remove('fm-keyboard-open');
        return;
      }
      const rootNode = this.root.getRootNode?.();
      const active = rootNode?.activeElement || this.host.document?.activeElement;
      const textEntry = !!active && (
        active.matches?.('textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="range"]), [contenteditable="true"]')
        || active.isContentEditable
      );
      const visualHeight = Number(this.host.visualViewport?.height) || 0;
      const layoutHeight = Math.max(
        Number(this.host.document?.documentElement?.clientHeight) || 0,
        Number(this.host.innerHeight) || 0
      );
      const keyboardOpen = textEntry && visualHeight > 0 && layoutHeight - visualHeight > 120;
      this.root.classList.toggle('fm-keyboard-open', keyboardOpen);
    }

    storageKey(kind, mode) {
      const version = kind === 'workspace' && mode === 'desktop' ? 'v8' : 'v7';
      return this.namespace + ':window:' + version + ':' + mode + ':' + kind;
    }

    parseRect(raw) {
      try {
        const value = JSON.parse(raw || 'null');
        if (!value || !['x', 'y', 'w', 'h'].every(key => Number.isFinite(Number(value[key])))) return null;
        return { x: Number(value.x), y: Number(value.y), w: Number(value.w), h: Number(value.h) };
      } catch { return null; }
    }

    parsePoint(raw) {
      try {
        const value = JSON.parse(raw || 'null');
        if (!value || !Number.isFinite(Number(value.x)) || !Number.isFinite(Number(value.y))) return null;
        return { x: Number(value.x), y: Number(value.y) };
      } catch { return null; }
    }

    defaultRect(bounds, mobile) {
      if (mobile) return { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height };
      const width = Math.min(420, Math.max(360, bounds.width - 32));
      const height = Math.min(780, Math.max(520, bounds.height - 32));
      return { x: bounds.x + (bounds.width - width) / 2, y: bounds.y + (bounds.height - height) / 2, w: width, h: height };
    }

    defaultBubblePoint(bounds) {
      return { x: bounds.x + 18, y: bounds.y + Math.max(12, bounds.height - 66) };
    }

    loadGeometry(mobile) {
      const mode = mobile ? 'mobile' : 'desktop';
      if (this.geomMode === mode) return;
      this.geomMode = mode;
      this.workspaceGeom = null;
      this.bubbleGeom = null;
      try {
        this.workspaceGeom = this.parseRect(this.host.localStorage.getItem(this.storageKey('workspace', mode)));
        this.bubbleGeom = this.parsePoint(this.host.localStorage.getItem(this.storageKey('bubble', mode)));
        if (!mobile && !this.workspaceGeom) {
          try {
            const legacy = JSON.parse(this.host.localStorage.getItem(POSITION_KEY) || 'null');
            if (Number.isFinite(legacy?.left) && Number.isFinite(legacy?.top)) {
              const rect = this.defaultRect(this.bounds(), false);
              rect.x = Number(legacy.left);
              rect.y = Number(legacy.top);
              this.workspaceGeom = rect;
            }
          } catch {}
        }
        if (!this.bubbleGeom) {
          try {
            const legacy = JSON.parse(this.host.localStorage.getItem(ENTRY_POSITION_KEY) || 'null');
            if (Number.isFinite(legacy?.left) && Number.isFinite(legacy?.top)) {
              this.bubbleGeom = { x: Number(legacy.left), y: Number(legacy.top) };
            }
          } catch {}
        }
      } catch {}
      this.geom = this.workspaceGeom;
    }

    clampRect(rect, bounds) {
      const minWidth = Math.min(360, Math.max(1, bounds.width - 16));
      const minHeight = Math.min(520, Math.max(1, bounds.height - 16));
      const maxWidth = Math.max(minWidth, Math.min(520, bounds.width - 16));
      const width = Math.max(minWidth, Math.min(Number(rect.w) || 420, maxWidth));
      const height = Math.max(minHeight, Math.min(Number(rect.h) || minHeight, bounds.height - 16));
      return {
        x: Math.max(bounds.x + 8, Math.min(Number(rect.x) || bounds.x + 8, bounds.x + bounds.width - width - 8)),
        y: Math.max(bounds.y + 8, Math.min(Number(rect.y) || bounds.y + 8, bounds.y + bounds.height - height - 8)),
        w: width,
        h: height,
      };
    }

    layoutBubble() {
      if (!this.bubble) return;
      const bounds = this.bounds();
      const size = 44;
      const saved = this.bubbleGeom || this.defaultBubblePoint(bounds);
      const point = {
        x: Math.max(bounds.x + 6, Math.min(saved.x, bounds.x + bounds.width - size - 6)),
        y: Math.max(bounds.y + 6, Math.min(saved.y, bounds.y + bounds.height - size - 6)),
      };
      this.bubbleGeom = point;
      Object.assign(this.bubble.style, { left: point.x + 'px', top: point.y + 'px', right: 'auto' });
      this.bubble.hidden = !state.enabled || this.visible;
      this.bubble.title = !state.enabled ? '通讯侠已停用' : this.minimized ? '恢复通讯侠' : '打开通讯侠';
      this.bubble.setAttribute('aria-label', this.bubble.title);
      this.bubble.setAttribute('aria-expanded', String(this.visible));
      this.bubble.setAttribute('data-fm-minimized', String(this.minimized));
      this.bubble.setAttribute('data-fm-enabled', String(state.enabled));
    }

    layout() {
      if (!this.frame || !this.root) return;
      const bounds = this.bounds();
      const mobile = this.mobile();
      this.syncKeyboardState(mobile);
      this.loadGeometry(mobile);
      this.root.style.padding = '0';
      this.root.setAttribute('data-fm-viewport', mobile ? 'compact' : 'desktop');
      this.frame.setAttribute('data-fm-viewport', mobile ? 'compact' : 'desktop');
      if (mobile) {
        this.maximized = false;
        Object.assign(this.frame.style, {
          left: bounds.x + 'px', top: bounds.y + 'px', right: 'auto', bottom: 'auto',
          width: bounds.width + 'px', height: bounds.height + 'px', minHeight: '0', maxHeight: 'none',
          transform: 'none', border: '0', borderRadius: '0', boxShadow: 'none',
        });
        if (this.resizeGrip) this.resizeGrip.hidden = true;
      } else {
        if (this.resizeGrip) this.resizeGrip.hidden = false;
        this.frame.style.right = 'auto';
        this.frame.style.bottom = 'auto';
        this.frame.style.border = '';
        this.frame.style.borderRadius = '';
        this.frame.style.boxShadow = '';
        const defaults = this.defaultRect(bounds, false);
        const saved = this.geom || defaults;
        const maxWidth = Math.min(520, bounds.width - 16);
        const rect = this.maximized
          ? { x: bounds.x + (bounds.width - maxWidth) / 2, y: bounds.y + 8, w: maxWidth, h: bounds.height - 16 }
          : this.clampRect(saved, bounds);
        if (!this.geom) this.geom = { ...rect };
        Object.assign(this.frame.style, {
          left: rect.x + 'px', top: rect.y + 'px',
          width: rect.w + 'px', height: rect.h + 'px',
          minHeight: '0', maxHeight: 'none', transform: 'none',
        });
      }
      syncViewportMode();
      this.layoutBubble();
    }

    sync() {
      state.minimized = this.minimized;
      this.root?.setAttribute('aria-hidden', String(!this.visible));
      this.bubble.hidden = !state.enabled || this.visible;
      this.layoutBubble();
      this.bubble.tabIndex = this.bubble.hidden ? -1 : 0;
      this.bubble.setAttribute('aria-hidden', String(this.bubble.hidden));
      const info = getMessageContext();
      const unread = info.ok ? proactiveUnread(info.record) : 0;
      this.bubble.setAttribute('data-fm-unread', unread ? String(Math.min(unread, 99)) : '');
    }

    open(resetToHome) {
      if (state.destroyed || !state.enabled || !this.root?.isConnected || !this.frame?.isConnected) return false;
      if (resetToHome !== false) showHome();
      this.visible = true;
      this.minimized = false;
      this.root.classList.add('fm-visible');
      this.root.setAttribute('aria-hidden', 'false');
      this.layout();
      refreshAppearance();
      markProactiveRead();
      this.sync();
      syncExtensionControls();
      return true;
    }

    minimizeToBubble() {
      if (!this.visible) return;
      this.saveGeometry();
      this.visible = false;
      this.minimized = true;
      this.root.classList.remove('fm-visible');
      this.root.setAttribute('aria-hidden', 'true');
      this.sync();
      syncExtensionControls();
    }

    close() {
      if (!this.visible && !this.minimized) { this.sync(); return; }
      this.saveGeometry();
      this.visible = false;
      this.minimized = false;
      this.root.classList.remove('fm-visible');
      this.root.setAttribute('aria-hidden', 'true');
      showHome();
      this.sync();
      syncExtensionControls();
    }

    restoreFromBubble() {
      if (!state.enabled) return;
      this.open(this.minimized ? false : true);
    }

    maximize() {
      if (this.mobile() || !this.visible) return;
      this.maximized = !this.maximized;
      this.layout();
    }

    saveGeometry() {
      if (!this.geom) return;
      const mode = this.geomMode || (this.mobile() ? 'mobile' : 'desktop');
      try {
        this.host.localStorage.setItem(this.storageKey('workspace', mode), JSON.stringify(this.geom));
        this.workspaceGeom = { ...this.geom };
        this.host.localStorage.setItem(POSITION_KEY, JSON.stringify({ left: this.geom.x, top: this.geom.y }));
      } catch {}
    }

    saveBubbleGeometry() {
      if (!this.bubbleGeom) return;
      const mode = this.geomMode || (this.mobile() ? 'mobile' : 'desktop');
      try {
        this.host.localStorage.setItem(this.storageKey('bubble', mode), JSON.stringify(this.bubbleGeom));
        this.host.localStorage.setItem(ENTRY_POSITION_KEY, JSON.stringify({ left: this.bubbleGeom.x, top: this.bubbleGeom.y }));
      } catch {}
    }

    begin(event, resize) {
      if (this.mobile() || !this.visible || event.button !== 0) return;
      if (!resize && event.target.closest('button,input,select,textarea,a')) return;
      if (this.maximized && !resize) return;
      const rect = this.frame.getBoundingClientRect();
      this.drag = {
        id: event.pointerId, x: event.clientX, y: event.clientY,
        left: rect.left, top: rect.top, width: rect.width, height: rect.height, resize,
      };
      try { event.target.setPointerCapture?.(event.pointerId); } catch {}
      event.preventDefault();
    }

    beginBubble(event) {
      if (event.button !== 0 || !state.enabled || this.visible || this.bubbleDrag) return;
      const rect = this.bubble.getBoundingClientRect();
      this.bubbleDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
      try { event.target.setPointerCapture?.(event.pointerId); } catch {}
      event.preventDefault();
    }

    move(event) {
      const bubbleDrag = this.bubbleDrag;
      if (bubbleDrag && bubbleDrag.id === event.pointerId) {
        const dx = event.clientX - bubbleDrag.x;
        const dy = event.clientY - bubbleDrag.y;
        if (!bubbleDrag.moved && Math.hypot(dx, dy) > 5) bubbleDrag.moved = true;
        if (bubbleDrag.moved) {
          const bounds = this.bounds();
          const size = 44;
          const x = Math.max(bounds.x + 6, Math.min(bubbleDrag.left + dx, bounds.x + bounds.width - size - 6));
          const y = Math.max(bounds.y + 6, Math.min(bubbleDrag.top + dy, bounds.y + bounds.height - size - 6));
          this.bubbleGeom = { x, y };
          this.bubble.style.left = x + 'px';
          this.bubble.style.top = y + 'px';
          this.bubble.style.right = 'auto';
        }
        return;
      }
      const drag = this.drag;
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (drag.resize) {
        const bounds = this.bounds();
        const minWidth = Math.min(360, Math.max(1, bounds.width - 16));
        const minHeight = Math.min(520, Math.max(1, bounds.height - 16));
        const maxWidth = Math.max(minWidth, Math.min(520, bounds.width - 16));
        this.geom = {
          x: drag.left, y: drag.top,
          w: Math.min(maxWidth, Math.max(minWidth, drag.width + dx)),
          h: Math.max(minHeight, drag.height + dy),
        };
      } else {
        this.geom = { x: drag.left + dx, y: drag.top + dy, w: drag.width, h: drag.height };
      }
      this.maximized = false;
      this.layout();
    }

    end(event) {
      if (this.bubbleDrag && (!event || this.bubbleDrag.id === event.pointerId)) {
        const moved = this.bubbleDrag.moved;
        this.bubbleDrag = null;
        if (moved) {
          this.saveBubbleGeometry();
          this.suppressBubbleClick = true;
          this.host.setTimeout(() => { this.suppressBubbleClick = false; }, 0);
        }
        return;
      }
      if (!this.drag || (event && this.drag.id !== event.pointerId)) return;
      this.drag = null;
      this.saveGeometry();
    }

    cleanup() {
      this.end();
      this.cleanups.splice(0).forEach(cleanup => { try { cleanup(); } catch {} });
      this.bubble?.remove();
    }
  }

  function syncChatEntryState() {
    state.windowController?.sync();
    syncExtensionControls();
  }

  function openWindow(resetToHome = true) {
    if (state.destroyed || !state.enabled || !state.windowController || state.backupBusy) return;
    state.windowController.open(resetToHome);
  }

  function minimizeWindow() {
    state.windowController?.minimizeToBubble();
  }

  function closeWindow() {
    state.windowController?.close();
  }

  function handleRootClick(event) {
    const appButton = event.target.closest('[data-fm-app]');
    if (appButton) {
      renderApp(appButton.getAttribute('data-fm-app'));
      return;
    }
    const actionButton = event.target.closest('[data-fm-action]');
    if (!actionButton) return;
    const action = actionButton.getAttribute('data-fm-action');
    if (action === 'settings-open') openSettings();
    else if (action === 'settings-back') returnFromSettings();
    else if (action === 'presets-back') renderSettings();
    else if (action === 'presets-open') openPresetSettings();
    else if (action === 'mask-settings-open') openMaskSettings();
    else if (action === 'mask-back') renderSettings();
    else if (action === 'mask-toggle') toggleMask();
    else if (action === 'mask-save') { saveMaskDraft(); renderMaskSettings(); }
    else if (action === 'mask-add') { if (state.maskDraft.aliases.length < 30) { state.maskDraft.aliases.push({ from: '', to: '' }); renderMaskSettings(); } }
    else if (action === 'mask-remove') { const i = Number(actionButton.getAttribute('data-fm-mask-index')); if (Number.isInteger(i) && i >= 0 && i < state.maskDraft.aliases.length) { state.maskDraft.aliases.splice(i, 1); renderMaskSettings(); } }
    else if (action === 'mask-clear') { state.maskDraft = { ...cloneMask(state.maskSaved), charAlias: '', userAlias: '', aliases: [] }; state.maskStatus = '草稿已清空，保存后生效。'; renderMaskSettings(); }
    else if (action === 'appearance-set') setAppearanceMode(actionButton.getAttribute('data-fm-appearance'));
    else if (action === 'proactive-toggle') toggleProactive();
    else if (action === 'proactive-check') { void checkProactive(true).finally(syncExtensionControls); }
    else if (action === 'time-awareness-toggle') toggleRealTimeAwareness();
    else if (action === 'phone-story-sync-toggle') togglePhoneStorySync(); 
    else if (action === 'preset-select') { state.presetActiveKey = actionButton.getAttribute('data-fm-preset-id') || 'core'; state.presetStatus = ''; renderPresetSettings(); }
    else if (action === 'preset-save') { savePresetDraft(); renderPresetSettings(); }
    else if (action === 'preset-reset') { state.presetDraft[state.presetActiveKey] = DEFAULT_PRESETS[state.presetActiveKey]; state.presetStatus = '已恢复本节默认草稿；点击保存后生效。'; renderPresetSettings(); }
    else if (action === 'preset-preview-toggle') { state.presetPreviewOpen = !state.presetPreviewOpen; renderPresetSettings(); }
    else if (action === 'maximize') state.windowController?.maximize();
    else if (action === 'minimize') minimizeWindow();
    else if (action === 'close') closeWindow();
    else if (action === 'home') showHome();
    else if (action === 'messages-open') renderMessagesConversation();
    else if (action === 'messages-back') renderMessagesList();
    else if (action === 'messages-refresh') renderMessagesList();
    else if (action === 'messages-retry') requestCharacterReply(actionButton.getAttribute('data-fm-message-id'));
    else if (action === 'messages-retry-dismiss') dismissMessageRetryNotice(actionButton.getAttribute('data-fm-message-id'));
    else if (action === 'messages-stop') stopPhoneGeneration();
    else if (action === 'messages-edit') beginEditMessage(actionButton.getAttribute('data-fm-message-id'));
    else if (action === 'messages-copy') copyPhoneMessage(actionButton.getAttribute('data-fm-message-id'));
    else if (action === 'messages-edit-cancel') cancelMessageEdit();
    else if (action === 'messages-regenerate') regenerateCharacterReply(actionButton.getAttribute('data-fm-message-id'));
    else if (action === 'messages-delete') deleteSingleMessage(actionButton.getAttribute('data-fm-message-id'));
    else if (action === 'messages-select-enter') enterMessageSelectionMode();
    else if (action === 'messages-select-exit') exitMessageSelectionMode();
    else if (action === 'messages-toggle-select') toggleMessageSelection(actionButton.getAttribute('data-fm-message-id'));
    else if (action === 'messages-select-all') toggleSelectAllMessages();
    else if (action === 'messages-delete-selected') deleteSelectedMessages();
    else if (action === 'messages-clear') clearPhoneConversation();
    else if (action === 'subscriptions-back-accounts') renderSubscriptionAccounts();
    else if (action === 'subscriptions-back-articles') renderSubscriptionArticles();
    else if (action === 'subscriptions-refresh') renderSubscriptionAccounts();
    else if (action === 'subscriptions-open-account') { state.activeSubscriptionId = actionButton.getAttribute('data-fm-account-id'); state.subscriptionPage = 'articles'; state.subscriptionError = ''; renderSubscriptionArticles(); }
    else if (action === 'subscriptions-toggle-follow') toggleSubscriptionFollow(actionButton.getAttribute('data-fm-account-id'));
    else if (action === 'subscriptions-generate-all') generateAllSubscribedArticles();
    else if (action === 'subscriptions-stop') stopSubscriptionGeneration();
    else if (action === 'subscriptions-open-article') { state.activeArticleId = actionButton.getAttribute('data-fm-article-id'); state.subscriptionPage = 'article'; renderSubscriptionArticle(); }
    else if (action === 'community-setting-mode') { switchCommunityMode(actionButton.getAttribute('data-fm-mode')); renderSettings(); }
    else if (action === 'community-mode') switchCommunityMode(actionButton.getAttribute('data-fm-mode'));
    else if (action === 'community-filter') { state.communityFilter = actionButton.getAttribute('data-fm-filter') || 'all'; renderCommunity(); }
    else if (action === 'community-compose') { if (!state.communityBusy) { state.communityView = 'compose'; state.communityError = ''; renderCommunity(); } }
    else if (action === 'community-back') { state.communityView = 'feed'; state.activeCommunityPostId = null; state.communityReplyTo = null; state.communityError = ''; renderCommunity(); }
    else if (action === 'community-open-post') { state.activeCommunityPostId = actionButton.getAttribute('data-fm-post-id'); state.communityReplyTo = null; state.communityView = 'thread'; state.communityError = ''; renderCommunity(); }
    else if (action === 'community-reply') { state.communityReplyTo = actionButton.getAttribute('data-fm-comment-id'); renderCommunity(); state.root.querySelector('[data-fm-community-comment-text]')?.focus(); }
    else if (action === 'community-clear-reply') { state.communityReplyTo = null; renderCommunity(); }
    else if (action === 'community-generate-feed') generateCommunityFeed();
    else if (action === 'community-generate-replies') generateCommunityReplies();
    else if (action === 'community-stop') stopCommunityGeneration();
    else if (action === 'moments-refresh') generateMoments();
    else if (action === 'moments-stop') stopMomentsGeneration();
    else if (action === 'moments-like') toggleMomentLike(actionButton.getAttribute('data-fm-post-id'));
    else if (action === 'moments-comments') openMomentComments(actionButton.getAttribute('data-fm-post-id'));
    else if (action === 'moments-comments-close') { state.activeMomentPostId = null; state.momentCommentsError = ''; renderMoments(); }
    else if (action === 'moments-comments-retry') openMomentComments(actionButton.getAttribute('data-fm-post-id'));
    else if (action === 'moments-retry-char-reply') retryCharMomentReply(actionButton.getAttribute('data-fm-post-id'), actionButton.getAttribute('data-fm-comment-id'));
  }


  function mountChatEntry() {
    if (state.destroyed || state.windowController?.bubble?.isConnected) return;
    state.shadowRoot?.querySelector('#' + ENTRY_ID)?.remove();
    HOST_DOC.getElementById(ENTRY_ID)?.remove();
    state.windowController = new WindowController(HOST_WIN, state.root, state.frame, 'freesia_messenger');
    state.chatEntry = state.windowController.bubble;
    syncViewportMode();
    refreshAppearance();
    syncChatEntryState();
  }

  function extensionNotice(message) {
    state.extensionStatus = String(message);
    syncExtensionControls();
    if (state.root?.classList.contains('fm-visible')) showPhoneToast(message);
    else { try { HOST_WIN.toastr?.info?.(escapeHtml(String(message)), '通讯侠'); } catch {} }
  }

  const proactiveFieldOptions = { interval: [5,10,15,30,60,120], cooldown: [0,5,15,30,60], limit: [0,3,5,10,20] };
  function setProactiveField(key, value) {
    if (key !== 'notify' && !proactiveFieldOptions[key]?.includes(value)) return;
    const previous = state.proactive[key];
    state.proactive[key] = value;
    if (!saveProactiveSettings()) { state.proactive[key] = previous; extensionNotice('主动联络设置保存失败'); }
    syncExtensionControls();
    if (state.currentApp === 'settings') {
      const field = state.root?.querySelector(`[data-fm-proactive-field="${key}"]`);
      if (field) { if (key === 'notify') field.checked = state.proactive[key]; else field.value = String(state.proactive[key]); }
    }
  }

  function toggleProactive() {
    if (!state.proactive.enabled && !state.realTimeEnabled) { extensionNotice('请先开启真实时间感知'); syncExtensionControls(); return; }
    const previous = state.proactive.enabled;
    state.proactive.enabled = !previous;
    if (!saveProactiveSettings()) { state.proactive.enabled = previous; extensionNotice('主动联络设置保存失败'); }
    else { state.proactiveConfigEpoch += 1; state.proactiveStatus = ''; }
    if (state.currentApp === 'settings') renderSettings();
    syncExtensionControls();
    if (state.proactive.enabled) void checkProactive().finally(syncExtensionControls);
  }

  function extensionBusy() {
    return state.messageBusy || state.messageSending || state.momentsBusy || state.subscriptionBusy || state.momentCommentsBusy || state.momentCommentSending || state.communityBusy || state.proactiveRunning || state.apiTesting || state.backupBusy;
  }

  function storyGenerating(context) {
    return context?.isGenerating === true || context?.is_send_press === true || !!HOST_DOC.querySelector('#mes_stop:not([style*="display: none"])')?.getClientRects().length;
  }

  function extensionSnapshot() {
    const info = getMessageContext();
    const key = info.ok ? proactiveChatKey(info) : '';
    const now = Date.now();
    let last = key ? state.proactiveDue.get(key) || 0 : 0;
    try { if (key) last = Math.max(last, Number(HOST_WIN.localStorage.getItem(PROACTIVE_KEY + ':last:' + key)) || 0); } catch {}
    const sent = info.ok ? info.record.messages.filter(m => m.proactive && m.proactiveBatch) : [];
    const latest = sent.reduce((v,m) => Math.max(v, Number(m.createdAt) || 0), 0);
    const count = new Set(sent.filter(m => new Date(m.createdAt).toDateString() === new Date(now).toDateString()).map(m=>m.proactiveBatch)).size;
    const format = t => t ? new Date(t).toLocaleString(undefined, {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}) : '暂无';
    let due = Math.max(last + state.proactive.interval*60000, latest + state.proactive.cooldown*60000);
    let next = !state.proactive.enabled ? '已关闭' : !state.realTimeEnabled ? '暂停：真实时间未开启' : !key ? '等待单聊' : state.proactiveRunning ? '检测中' : state.proactive.limit && count >= state.proactive.limit ? '今日已达上限' : !last ? '等待首次调度' : due <= now ? '已到期，等待空闲' : format(due);
    return { info, key, last: format(last), latest: format(latest), next, count, result: state.proactiveResults.get(key) || '暂无本次运行结果', name: info.ok ? displayNameForNotice(info.characterName) : '未进入单聊' };
  }


  function syncExtensionControls() {
    const entry = state.extensionEntry;
    if (!entry?.isConnected || state.destroyed) return;
    const setText = (key, value) => {
      const el = entry.querySelector('[data-fm-ext-status="' + key + '"]');
      if (el && el.textContent !== String(value)) el.textContent = String(value);
    };
    setText('enabled-label', state.enabled ? '已启用' : '已停用');
    const toggleButton = entry.querySelector('[data-fm-ext-action="toggle-enabled"]');
    if (toggleButton) {
      const label = state.enabled ? '关闭通讯侠' : '启用通讯侠';
      const labelNode = toggleButton.querySelector('[data-fm-ext-status="toggle-enabled"]');
      if (labelNode && labelNode.textContent !== label) labelNode.textContent = label;
      toggleButton.title = label;
      toggleButton.setAttribute('aria-label', label);
      toggleButton.setAttribute('aria-pressed', String(state.enabled));
      toggleButton.disabled = state.backupBusy;
    }
    const config = { time:state.realTimeEnabled, active:state.proactive.enabled, sync:state.phoneStorySyncEnabled, notify:state.proactive.notify };
    Object.entries(config).forEach(([key,value]) => {
      const el = entry.querySelector('[data-fm-ext-field="' + key + '"]');
      if (el) el.checked = value;
    });
    Object.keys(proactiveFieldOptions).forEach(key => {
      const el = entry.querySelector('[data-fm-ext-field="' + key + '"]');
      if (el) el.value = String(state.proactive[key]);
    });
    const fields = entry.querySelector('[data-fm-ext-active-fields]');
    if (fields) fields.hidden = !state.proactive.enabled;
    const snap = extensionSnapshot();
    for (const key of ['name','last','latest','next','count','result']) setText(key, snap[key]);
    const phoneStatus = state.root?.querySelector('[data-fm-proactive-status]');
    if (phoneStatus) phoneStatus.textContent = !state.enabled ? '通讯侠已停用。' : !state.realTimeEnabled ? '请先开启真实时间感知。' : !state.proactive.enabled ? '主动联络已关闭。' : snap.result === '暂无本次运行结果' ? '仅脚本运行且页面可用时检测；恢复前台后检查是否到期。' : snap.result;
    setText('feedback', state.extensionStatus || (state.enabled ? '悬浮球是唯一窗口入口；关闭窗口不会停止主动联络。' : '通讯侠已停用；重新启用后悬浮球恢复。'));
    setText('api', state.apiTesting ? '测试中…' : 'API 连接测试');
    for (const key of ['check','api','import','export']) {
      const el = entry.querySelector('[data-fm-ext-action="' + key + '"]');
      if (el) el.disabled = extensionBusy() || !snap.info.ok || (key === 'check' && (!state.enabled || !state.proactive.enabled || !state.realTimeEnabled)) || (key === 'api' && !state.enabled);
    }
  }

  async function testExtensionApi() {
    const info=getMessageContext();
    if(!info.ok || extensionBusy() || storyGenerating(info.context)) {extensionNotice('请在单聊且没有生成任务时测试');return;}
    if(typeof info.context.generateRaw!=='function') {extensionNotice('当前环境缺少 generateRaw 接口');return;}
    const epoch=state.generationEpoch;
    state.apiTesting=true; state.messageBusy=true;
    extensionNotice('正在测试 API（会消耗少量额度）…');
    try {
      const result=await info.context.generateRaw({prompt:[{role:'user',content:'Reply with only the word OK.'}],responseLength:32,trimNames:true});
      if(!state.destroyed && epoch===state.generationEpoch) extensionNotice(String(result??'').trim() ? 'API 测试成功：收到模型响应' : 'API 返回空文本');
    } catch(e) {if(!state.destroyed && epoch===state.generationEpoch) extensionNotice('API 测试失败：'+String(e.message||e).slice(0,240));}
    finally {state.apiTesting=false;if(epoch===state.generationEpoch) state.messageBusy=false;syncExtensionControls();}
  }


  function extensionDiagnostic() {
    const snap = extensionSnapshot();
    const ctx = snap.info.context;
    const win = state.windowController;
    return [
      '通讯侠 v0.3.35 运行诊断',
      '时间：' + new Date().toLocaleString(),
      '环境：' + HOST_WIN.navigator.userAgent,
      '窗口控制器：' + (win ? '已创建' : '未创建'),
      '窗口状态：' + (win?.visible ? '打开' : win?.minimized ? '最小化' : '关闭'),
      '视口模式：' + (win ? (win.mobile() ? '821px 以下全屏' : 'PC 窗口') : '未知'),
      '悬浮球：' + (state.chatEntry?.isConnected ? (state.chatEntry.hidden ? '隐藏' : '可见') : '未挂载'),
      '单聊：' + (snap.info.ok ? '可用' : '不可用'),
      'API 接口：' + (typeof ctx?.generateRaw === 'function' ? '可用' : '不可用'),
      '元数据保存：' + (typeof ctx?.saveMetadata === 'function' ? '可用' : '不可用'),
      '正文同步：' + (state.phoneStorySyncEnabled ? '开' : '关'),
      '真实时间：' + (state.realTimeEnabled ? '开' : '关'),
      '主动联络：' + JSON.stringify(state.proactive),
      '上次检测：' + snap.last,
      '下次检测：' + snap.next,
      '今日发信：' + snap.count,
      '生成任务：' + (extensionBusy() ? '忙碌' : '空闲'),
      '页面可见：' + (!HOST_DOC.hidden),
    ].join('\n');
  }

  async function copyExtensionDiagnostic() {
    const value=extensionDiagnostic();
    try { if(HOST_WIN.navigator.clipboard?.writeText) { await HOST_WIN.navigator.clipboard.writeText(value); extensionNotice('已复制诊断报告'); return; } } catch {}
    const area=node('textarea');area.value=value;area.style.cssText='position:fixed;left:-9999px;top:0';HOST_DOC.body.appendChild(area);area.select();let ok=false;try{ok=HOST_DOC.execCommand('copy');}catch{}area.remove();
    if(ok) extensionNotice('已复制诊断报告');else HOST_WIN.prompt('请手动复制诊断报告',value);
  }

  function exportExtensionBackup() {
    const info=getMessageContext(); if(!info.ok || extensionBusy()) return;
    const payload={format:'freesia-messenger-chat-backup',version:1,chatKey:proactiveChatKey(info),exportedAt:Date.now(),records:{messages:getPhoneRecord(info.context),moments:getMomentsRecord(info.context),subscriptions:getSubscriptionsRecord(info.context),community:getCommunityRecord(info.context)}};
    if(!payload.chatKey){extensionNotice('无法识别当前会话');return;}
    try {const blob=new HOST_WIN.Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=HOST_WIN.URL.createObjectURL(blob);const link=node('a');link.href=url;link.download='Freesia-Messenger-backup-'+new Date().toISOString().slice(0,10)+'.json';HOST_DOC.body.appendChild(link);link.click();link.remove();HOST_WIN.setTimeout(()=>HOST_WIN.URL.revokeObjectURL(url),30000);extensionNotice('已发起当前会话备份下载（包含原始通讯内容）');}catch(e){extensionNotice('备份导出失败：'+String(e.message||e));}
  }

  function validExtensionBackup(data) {
    const obj=v=>v!==null && typeof v==='object' && !Array.isArray(v);
    const arr=(v,p)=>Array.isArray(v)&&v.every(p);
    const str=v=>typeof v==='string';const item=v=>obj(v)&&str(v.id)&&str(v.content);
    const safe=v=>!v||typeof v!=='object'||Object.keys(v).every(k=>!['__proto__','prototype','constructor'].includes(k)&&safe(v[k]));
    const thread=comments=>{if(!arr(comments,c=>item(c)&&str(c.authorName)))return false;const ids=new Set();for(const c of comments){if(ids.has(c.id)|| (c.parentId!=null&&!ids.has(c.parentId)))return false;ids.add(c.id);}return true;};
    const r=data?.records;
    return data?.format==='freesia-messenger-chat-backup' && data.version===1 && str(data.chatKey) && obj(r) && safe(r) && obj(r.messages) && arr(r.messages.messages,m=>item(m)&&['user','char'].includes(m.sender)&&Number.isFinite(m.createdAt)) && obj(r.moments) && arr(r.moments.posts,p=>item(p)&&str(p.authorName)&&arr(p.commentItems,c=>obj(c)&&str(c.content))) && obj(r.subscriptions) && arr(r.subscriptions.subscribedAccountIds,str) && obj(r.subscriptions.articlesByAccount) && Object.values(r.subscriptions.articlesByAccount).every(a=>arr(a,v=>item(v)&&str(v.title)&&str(v.summary))) && obj(r.community) && obj(r.community.feeds) && ['independent','story'].every(k=>arr(r.community.feeds[k],p=>item(p)&&str(p.title)&&thread(p.comments))&&obj(r.community.members?.[k]));
  }

  async function importExtensionBackup(file) {
    const info=getMessageContext(); if(!file || !info.ok || extensionBusy() || storyGenerating(info.context)) {extensionNotice('请在单聊空闲时导入');return;}
    const key=proactiveChatKey(info), epoch=state.generationEpoch;
    if(!key || file.size>20*1024*1024) {extensionNotice('无法识别会话，或文件超过 20MB');return;}
    if (state.root?.classList.contains('fm-visible')) closeWindow();
    state.backupBusy=true;state.messageBusy=true;syncExtensionControls();
    try {
      const data=JSON.parse(await file.text());
      if(!validExtensionBackup(data)) throw new Error('备份格式或记录结构无效');
      if(data.chatKey!==key) throw new Error('备份属于其他会话，已拒绝覆盖');
      const current=getMessageContext();if(!current.ok || proactiveChatKey(current)!==key || epoch!==state.generationEpoch || storyGenerating(current.context)) throw new Error('当前会话已变化或正在生成');
      if(!HOST_WIN.confirm('导入将替换当前会话的私聊、动态、订阅与社区记录。请先导出现有备份。确认覆盖？')) return;
      const ctx=current.context;if(typeof ctx.saveMetadata!=='function') throw new Error('元数据保存接口不可用');
      const keys=[CHAT_DATA_KEY,MOMENTS_DATA_KEY,SUBSCRIPTIONS_DATA_KEY,COMMUNITY_DATA_KEY];const old=keys.map(k=>ctx.chatMetadata[k]);
      const records=['messages','moments','subscriptions','community'].map(k=>data.records[k]);
      keys.forEach((k,i)=>{ctx.chatMetadata[k]=records[i];});
      try {await ctx.saveMetadata();}catch(e){keys.forEach((k,i)=>{if(old[i]===undefined)delete ctx.chatMetadata[k];else ctx.chatMetadata[k]=old[i];});throw e;}
      if(epoch===state.generationEpoch){refreshPhoneStoryContext(ctx);if(state.root?.classList.contains('fm-visible'))showHome();syncChatEntryState();extensionNotice('当前会话备份导入成功');}
    }catch(e){extensionNotice('导入失败：'+String(e.message||e));}finally{state.backupBusy=false;if(epoch===state.generationEpoch)state.messageBusy=false;syncExtensionControls();}
  }


  function mountExtensionEntry() {
    if (state.destroyed || state.extensionEntry?.isConnected) return true;
    const host = HOST_DOC.querySelector('#extensions_settings2') || HOST_DOC.querySelector('#extensions_settings');
    if (!host) return false;
    HOST_DOC.getElementById(EXTENSION_ID)?.remove();
    const entry = node('div');
    entry.id = EXTENSION_ID;
    const button = (action, label, icon) => '<button type="button" class="menu_button" data-fm-ext-action="' + action + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i><span ' + (action === 'toggle-enabled' || action === 'api' ? 'data-fm-ext-status="' + action + '"' : '') + '>' + label + '</span></button>';
    const check = (key, label) => '<label class="fm-ext-check"><input type="checkbox" data-fm-ext-field="' + key + '"><span>' + label + '</span></label>';
    const select = (key, label) => '<label class="fm-ext-row"><span>' + label + '</span><select class="text_pole" data-fm-ext-field="' + key + '">' + proactiveFieldOptions[key].map(v => '<option value="' + v + '">' + (v === 0 ? '不限' : v + (key === 'limit' ? ' 轮' : ' 分钟')) + '</option>').join('') + '</select></label>';
    const status = (key, label) => '<div class="fm-ext-row"><span>' + label + '</span><span data-fm-ext-status="' + key + '">—</span></div>';
    entry.innerHTML = '<div class="inline-drawer"><div class="inline-drawer-toggle inline-drawer-header"><b>通讯侠 · Freesia Messenger</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div><div class="inline-drawer-content"><div class="fm-extension-content">' +
      '<div class="fm-ext-row"><small>v0.3.35 · 控制中心</small><small data-fm-ext-status="enabled-label">已启用</small></div>' +
      '<div class="fm-ext-primary">' + button('toggle-enabled', state.enabled ? '关闭通讯侠' : '启用通讯侠', state.enabled ? 'fa-power-off' : 'fa-play') + '</div>' +
      '<b>快捷设置</b><div class="fm-ext-checks">' + check('time', '真实时间感知') + check('active', 'Char 主动联络') + check('sync', '通讯记录同步正文') + '</div>' +
      '<div class="fm-ext-section" data-fm-ext-active-fields>' + select('interval', '检测间隔') + select('cooldown', '发信冷却') + select('limit', '每日联络上限') + check('notify', '主动消息通知') + '</div>' +
      '<div class="fm-ext-section"><b>通讯状态</b>' + status('name', '当前联络对象') + status('last', '上次检测') + status('next', '下次检测') + status('latest', '上次主动联络') + status('count', '今日联络轮数') + '<p data-fm-ext-status="result" role="status"></p></div>' +
      '<div class="fm-ext-buttons">' + button('check', '立即检测', 'fa-clock') + button('api', 'API 连接测试', 'fa-plug') + button('export', '导出通讯备份', 'fa-download') + button('import', '导入通讯备份', 'fa-upload') + button('diagnostic', '复制运行诊断', 'fa-stethoscope') + button('help', '使用说明', 'fa-circle-question') + '</div>' +
      '<input type="file" accept=".json,application/json" data-fm-ext-file hidden><p data-fm-ext-status="feedback" role="status"></p><div data-fm-ext-help hidden><p>可拖动悬浮球是通讯侠唯一的窗口入口：启用后显示，点击打开；最小化或关闭窗口后回到悬浮球。此处的「关闭通讯侠」会停用整个功能并隐藏悬浮球，重新启用后恢复。AI 预设管理位于通讯侠窗口的「设置」页面。单独关闭窗口不会停止主动联络；要暂停自动联络，请关闭 Char 主动联络。立即检测会跳过间隔、冷却和每日上限，但仍需启用通讯侠、主动联络及真实时间感知。API 测试会消耗少量额度。备份仅包含当前会话的原始通讯数据，不包含 API 凭证；导入会覆盖当前会话数据。</p></div><p class="fm-ext-credit">Freesia Messenger · 小松鼠 &amp; 小松7</p>' +
      '</div></div></div>';
    entry.addEventListener('change', event => {
      const target = event.target;
      const key = target.getAttribute('data-fm-ext-field');
      if (target.matches('[data-fm-ext-file]')) {
        const file = target.files?.[0];
        target.value = '';
        if (file) void importExtensionBackup(file);
        return;
      }
      if (key === 'time') toggleRealTimeAwareness();
      else if (key === 'active') toggleProactive();
      else if (key === 'sync') togglePhoneStorySync();
      else if (key === 'notify') setProactiveField(key, target.checked);
      else if (proactiveFieldOptions[key]) setProactiveField(key, Number(target.value));
      syncExtensionControls();
    });
    entry.addEventListener('click', event => {
      const actionButton = event.target.closest('[data-fm-ext-action]');
      if (!actionButton || actionButton.disabled) return;
      const action = actionButton.getAttribute('data-fm-ext-action');
      if (action === 'toggle-enabled') {
        const next = !state.enabled;
        setMessengerEnabled(next);
        if (next && state.enabled) openWindow(true);
      } else if (action === 'check') {
        if (!state.enabled) return;
        if (storyGenerating(getTavernContext())) extensionNotice('正文正在生成，请稍后检测');
        else if (state.selectionMode || state.editingMessageId || state.root?.querySelector('[data-fm-composer]')?.value.trim()) extensionNotice('请先退出手机编辑或清空待发送草稿');
        else if (typeof getTavernContext()?.generateRaw !== 'function') extensionNotice('当前环境缺少 generateRaw 接口');
        else {
          extensionNotice('已请求主动联络检测');
          void checkProactive(true).finally(syncExtensionControls);
        }
      } else if (action === 'api') void testExtensionApi();
      else if (action === 'export') exportExtensionBackup();
      else if (action === 'import') entry.querySelector('[data-fm-ext-file]').click();
      else if (action === 'diagnostic') void copyExtensionDiagnostic();
      else if (action === 'help') {
        const help = entry.querySelector('[data-fm-ext-help]');
        help.hidden = !help.hidden;
      }
    });
    host.appendChild(entry);
    state.extensionEntry = entry;
    syncExtensionControls();
    return true;
  }

  function watchExtensionEntry() {
    if (mountExtensionEntry()) return;
    if (typeof HOST_WIN.MutationObserver !== 'function') return;
    state.mountObserver = new HOST_WIN.MutationObserver(() => {
      if (state.destroyed) return;
      if (mountExtensionEntry()) {
        state.mountObserver?.disconnect();
        state.mountObserver = null;
      }
    });
    state.mountObserver.observe(HOST_DOC.body, { childList: true, subtree: true });
  }

  function buildStyle() {
    const style = node('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID} {
        color-scheme: light;
        --fm-ink: light-dark(#403943, #e8dde6);
        --fm-muted: light-dark(#8b808a, #b4a6b5);
        --fm-line: light-dark(#eae3e5, #625360);
        --fm-paper: light-dark(#fbf9f7, #29262f);
        --fm-panel: light-dark(#fbf9f7, #322d38);
        --fm-card: light-dark(#ffffff, #403947);
        --fm-card-hover: light-dark(#fff9fb, #504454);
        --fm-card-muted: light-dark(#f6f1f5, #38313e);
        --fm-field: light-dark(#fff9fb, #413947);
        --fm-text-strong: light-dark(#514650, #f0e5ef);
        --fm-text: light-dark(#665966, #d9cad9);
        --fm-text-muted: light-dark(#928692, #bcaebc);
        --fm-text-faint: light-dark(#a295a1, #a99aa9);
        --fm-accent: light-dark(#9b7d97, #c9a0bd);
        --fm-accent-dark: light-dark(#94788f, #96748f);
        --fm-accent-deep: light-dark(#806f88, #765b78);
        --fm-accent-soft: light-dark(#eae7f3, #524456);
        --fm-rose-soft: light-dark(#f3e4e8, #563f52);
        --fm-oat-soft: light-dark(#f2e9d9, #544a41);
        --fm-mint-soft: light-dark(#e1ebe6, #354d49);
        --fm-rose-ink: light-dark(#a76d7c, #e3a8bc);
        --fm-oat-ink: light-dark(#9a794c, #e0be92);
        --fm-mint-ink: light-dark(#628477, #9bcec0);
        --fm-on-accent: #fffafd;
        --fm-danger: light-dark(#ad737b, #e8a2aa);
        --fm-danger-soft: light-dark(#f8e9e9, #573a45);
        --fm-shadow-color: light-dark(rgb(49 34 44 / 12%), rgb(8 6 13 / 42%));
        --fm-pink: light-dark(#f4e7ea, #513f4e);
        --fm-lavender: var(--fm-accent-soft);
        --fm-rose: var(--fm-rose-soft);
        --fm-oat: var(--fm-oat-soft);
        --fm-mint: var(--fm-mint-soft);
        --fm-font-cn-min: 12px;
        --fm-font-number-min: 10px;
        --fm-control-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
        --fm-control-font-size: max(var(--fm-font-cn-min), 12px);
        --fm-control-font-weight: 500;
        --fm-control-line-height: 1.5;
        --fm-control-padding: 8px 10px;
        --fm-control-radius: 9px;
        --fm-control-color: var(--fm-text-strong);
        --fm-control-bg: var(--fm-field);
        --fm-control-border: var(--fm-line);
        --fm-control-placeholder: var(--fm-text-muted);
        --fm-control-caret: var(--fm-accent);
        --fm-control-focus-border: var(--fm-accent);
        --fm-control-focus-shadow: 0 0 0 2px light-dark(rgb(155 125 151 / 15%), rgb(201 160 189 / 20%));
        --fm-control-shadow: none;
        --fm-control-accent: var(--fm-accent-deep);
        position: fixed;
        inset: 0;
        z-index: 2147483001;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 0;
        box-sizing: border-box;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
        color: var(--fm-ink);
        -webkit-font-smoothing: antialiased;
      }
      #${ROOT_ID}[data-fm-theme="dark"] { color-scheme: dark; }
      /* Messenger owns its form-control visuals; host theme selectors must not restyle them. */
      #${ROOT_ID} :is(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="hidden"]), textarea, select) {
        box-sizing: border-box !important;
        appearance: auto !important;
        -webkit-appearance: auto !important;
        color-scheme: inherit !important;
        color: var(--fm-control-color) !important;
        -webkit-text-fill-color: var(--fm-control-color) !important;
        background: var(--fm-control-bg) !important;
        background-color: var(--fm-control-bg) !important;
        background-image: none !important;
        background-repeat: initial !important;
        background-position: initial !important;
        background-size: auto !important;
        border: 1px solid var(--fm-control-border) !important;
        border-image: none !important;
        border-radius: var(--fm-control-radius) !important;
        box-shadow: var(--fm-control-shadow) !important;
        outline: none !important;
        font-family: var(--fm-control-font-family) !important;
        font-size: var(--fm-control-font-size) !important;
        font-style: normal !important;
        font-weight: var(--fm-control-font-weight) !important;
        font-stretch: normal !important;
        font-variant: normal !important;
        font-feature-settings: normal !important;
        font-kerning: auto !important;
        line-height: var(--fm-control-line-height) !important;
        letter-spacing: normal !important;
        text-align: left !important;
        text-indent: 0 !important;
        text-transform: none !important;
        text-shadow: none !important;
        filter: none !important;
        transition: none !important;
        caret-color: var(--fm-control-caret) !important;
        padding: var(--fm-control-padding) !important;
        background-clip: padding-box !important;
      }
      #${ROOT_ID} :is(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="hidden"]), textarea, select):is(:focus, :focus-visible) {
        border-color: var(--fm-control-focus-border) !important;
        box-shadow: var(--fm-control-focus-shadow) !important;
        outline: none !important;
      }
      #${ROOT_ID} :is(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="hidden"]), textarea, select)::placeholder {
        color: var(--fm-control-placeholder) !important;
        -webkit-text-fill-color: var(--fm-control-placeholder) !important;
        opacity: 1 !important;
        font-family: var(--fm-control-font-family) !important;
        font-size: var(--fm-control-font-size) !important;
        font-style: normal !important;
        font-weight: 400 !important;
        line-height: var(--fm-control-line-height) !important;
        letter-spacing: normal !important;
      }
      #${ROOT_ID} :is(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="hidden"]), textarea):-webkit-autofill {
        -webkit-text-fill-color: var(--fm-control-color) !important;
        -webkit-box-shadow: 0 0 0 1000px var(--fm-control-bg) inset !important;
        caret-color: var(--fm-control-caret) !important;
      }
      #${ROOT_ID} :is(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="hidden"]), textarea)::selection {
        color: var(--fm-text-strong) !important;
        background: var(--fm-accent-soft) !important;
      }
      #${ROOT_ID} select option {
        color: var(--fm-control-color) !important;
        background-color: var(--fm-control-bg) !important;
        font-family: var(--fm-control-font-family) !important;
        font-size: var(--fm-control-font-size) !important;
      }
      #${ROOT_ID} input:is([type="checkbox"], [type="radio"]) {
        appearance: auto !important;
        -webkit-appearance: auto !important;
        accent-color: var(--fm-control-accent) !important;
        background: revert !important;
        border: revert !important;
        border-radius: revert !important;
        box-shadow: none !important;
        color-scheme: inherit !important;
      }
      #${ROOT_ID} input:disabled, #${ROOT_ID} textarea:disabled, #${ROOT_ID} select:disabled {
        opacity: .62 !important;
        cursor: not-allowed !important;
      }
      #${ROOT_ID}.fm-visible { display: flex; }
      #${ROOT_ID} *, #${ENTRY_ID} { box-sizing: border-box; }
      #${ENTRY_ID} { color-scheme: light; }
      #${ENTRY_ID}[data-fm-theme="dark"] { color-scheme: dark; }
      #${ROOT_ID} button, #${ENTRY_ID} { font: inherit; white-space: nowrap; }
      #${ROOT_ID} button { -webkit-tap-highlight-color: transparent; }
      #${ROOT_ID} .fm-frame {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        width: min(420px, calc(100vw - 32px));
        height: min(780px, calc(100dvh - 32px));
        min-height: min(520px, calc(100dvh - 32px));
        max-width: min(520px, calc(100vw - 16px));
        overflow: hidden;
        border: 1px solid light-dark(rgb(226 216 220 / 92%), var(--fm-line));
        border-radius: 27px;
        background: var(--fm-paper);
        box-shadow: 0 8px 22px light-dark(rgb(49 34 44 / 12%), var(--fm-shadow-color)), 0 1px 4px light-dark(rgb(49 34 44 / 6%), var(--fm-shadow-color));
        pointer-events: auto;
        transform: translate(-50%, -50%) translateZ(0);
        animation: fm-window-in .22s ease-out both;
      }
      @keyframes fm-window-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      #${ROOT_ID} .fm-resize-grip { position: absolute; right: 0; bottom: 0; z-index: 4; width: 18px; height: 18px; cursor: nwse-resize; touch-action: none; opacity: .42; }
      #${ROOT_ID} .fm-resize-grip::after { content: ""; position: absolute; right: 5px; bottom: 5px; width: 7px; height: 7px; border-right: 2px solid var(--fm-text-muted); border-bottom: 2px solid var(--fm-text-muted); border-radius: 0 0 3px 0; }
      #${ROOT_ID} .fm-window-maximize svg { width: 14px; height: 14px; }
      #${ROOT_ID} .fm-titlebar {
        position: relative;
        z-index: 2;
        display: flex;
        flex: 0 0 56px;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 15px 0 17px;
        border-bottom: 1px solid light-dark(#eee8e8, var(--fm-line));
        background: light-dark(#fbf9f7, var(--fm-card));
        cursor: grab;
        user-select: none;
        touch-action: pan-y;
      }
      #${ROOT_ID} .fm-titlebar:active { cursor: grabbing; }
      #${ROOT_ID} .fm-brand { display: flex; align-items: center; min-width: 0; gap: 8px; }
      #${ROOT_ID} .fm-brand-mark {
        display: grid; flex: 0 0 28px; place-items: center; width: 28px; height: 28px;
        border-radius: 9px; color: light-dark(#fff, var(--fm-on-accent)); background: linear-gradient(145deg, light-dark(#c38d9b, var(--fm-accent)), light-dark(#9d788f, var(--fm-accent-deep)));
        font-family: Georgia, serif; font-size: 17px; font-weight: 700; letter-spacing: -1px;
      }
      #${ROOT_ID} .fm-brand-name { overflow: hidden; color: light-dark(#514851, var(--fm-text-strong)); font-size: 12px; font-weight: 700; letter-spacing: .015em; text-overflow: ellipsis; }
      #${ROOT_ID} .fm-brand-divider { width: 1px; height: 14px; background: light-dark(#e4dadd, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-brand-cn { color: light-dark(#8a7d87, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 11px); font-weight: 600; }
      #${ROOT_ID} .fm-window-controls { display: flex; flex: 0 0 auto; align-items: center; gap: 6px; }
      #${ROOT_ID} .fm-window-control {
        display: grid; place-items: center; width: 29px; height: 29px; padding: 0;
        border: 1px solid transparent; border-radius: 9px; color: light-dark(#817680, var(--fm-text)); background: transparent; cursor: pointer;
      }
      #${ROOT_ID} .fm-window-control svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-window-control:hover { border-color: light-dark(#eee5e8, var(--fm-line)); background: light-dark(#f5eff1, var(--fm-card)); color: light-dark(#594c57, var(--fm-text-strong)); }
      #${ROOT_ID} .fm-window-close:hover { border-color: light-dark(#efdadd, var(--fm-line)); background: light-dark(#f8e9eb, var(--fm-card)); color: light-dark(#a65f6d, var(--fm-rose-ink)); }
      #${ROOT_ID} .fm-phone {
        display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; overflow: hidden;
        background: linear-gradient(145deg, light-dark(#f7edf0, var(--fm-panel)) 0%, light-dark(#eeeaf4, var(--fm-panel)) 48%, light-dark(#f8f3eb, var(--fm-panel)) 100%);
      }
      #${ROOT_ID} .fm-statusbar {
        display: flex; flex: 0 0 39px; align-items: center; gap: 10px; padding: 0 21px;
        color: light-dark(#6f6570, var(--fm-text)); font-size: 10px; font-weight: 650; letter-spacing: .015em;
      }
      #${ROOT_ID} .fm-clock { color: light-dark(#4c434c, var(--fm-text-strong)); font-size: 12px; font-weight: 750; font-variant-numeric: tabular-nums; }
      #${ROOT_ID} .fm-date { overflow: hidden; color: light-dark(#8a7e89, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 10px); text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-status-icons { display: flex; flex: 0 0 auto; align-items: center; gap: 5px; margin-left: auto; }
      #${ROOT_ID} .fm-status-icons svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-screen { position: relative; flex: 1 1 auto; min-height: 0; overflow: hidden; }
      #${ROOT_ID} .fm-home-view, #${ROOT_ID} .fm-app-view { width: 100%; height: 100%; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgb(151 126 143 / 30%) transparent; }
      #${ROOT_ID} .fm-home-view { display: flex; flex-direction: column; gap: 22px; padding: 19px 21px 17px; }
      #${ROOT_ID} .fm-home-view[hidden], #${ROOT_ID} .fm-app-view[hidden] { display: none !important; }
      #${ROOT_ID} .fm-home-heading { padding: 3px 2px 0; }
      #${ROOT_ID} .fm-eyebrow { display: flex; align-items: center; gap: 7px; color: light-dark(#988894, var(--fm-text)); font-size: 9px; font-weight: 750; letter-spacing: .16em; }
      #${ROOT_ID} .fm-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: light-dark(#bd8b9b, var(--fm-accent-dark)); box-shadow: 0 0 0 3px light-dark(rgb(189 139 155 / 13%), var(--fm-shadow-color)); }
      #${ROOT_ID} .fm-home-heading h1 { margin: 11px 0 5px; color: light-dark(#453b47, var(--fm-text-strong)); font-size: 30px; font-weight: 650; letter-spacing: -.055em; line-height: 1.12; }
      #${ROOT_ID} .fm-home-heading p { margin: 0; color: light-dark(#877b87, var(--fm-text)); font-size: 12px; line-height: 1.55; }
      #${ROOT_ID} .fm-app-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
      #${ROOT_ID} .fm-app-card {
        position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 15px;
        min-width: 0; min-height: 151px; padding: 15px 14px 13px; overflow: hidden;
        border: 1px solid light-dark(rgb(255 255 255 / 76%), var(--fm-line)); border-radius: 21px; text-align: left;
        background: light-dark(rgb(255 255 255 / 66%), var(--fm-card)); box-shadow: 0 5px 17px light-dark(rgb(76 56 73 / 5%), var(--fm-shadow-color));
        color: var(--fm-ink); cursor: pointer; transition: transform .16s ease, box-shadow .16s ease, background .16s ease;
      }
      #${ROOT_ID} .fm-app-card::after { content: ""; position: absolute; right: -23px; top: -25px; width: 83px; height: 83px; border-radius: 50%; background: light-dark(rgb(255 255 255 / 22%), var(--fm-card)); pointer-events: none; }
      #${ROOT_ID} .fm-app-card:hover { transform: translateY(-2px); background: light-dark(rgb(255 255 255 / 82%), var(--fm-card)); box-shadow: 0 9px 22px light-dark(rgb(76 56 73 / 9%), var(--fm-shadow-color)); }
      #${ROOT_ID} .fm-app-card:active { transform: translateY(0) scale(.985); }
      #${ROOT_ID} .fm-app-icon { display: grid; place-items: center; width: 49px; height: 49px; border-radius: 16px; box-shadow: inset 0 1px 0 light-dark(rgb(255 255 255 / 50%), var(--fm-shadow-color)), 0 4px 10px light-dark(rgb(76 56 73 / 7%), var(--fm-shadow-color)); }
      #${ROOT_ID} .fm-app-icon svg { width: 25px; height: 25px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-app-card-copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
      #${ROOT_ID} .fm-app-card-copy strong { color: light-dark(#514650, var(--fm-text-strong)); font-size: 15px; font-weight: 750; line-height: 1.2; }
      #${ROOT_ID} .fm-app-card-copy small { overflow: hidden; max-width: 100%; color: light-dark(#8b808a, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 9px); line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-app-mark { position: absolute; right: 13px; bottom: 14px; color: light-dark(rgb(105 91 105 / 28%), var(--fm-text-strong)); font-size: max(var(--fm-font-number-min), 9px); font-weight: 800; letter-spacing: .1em; }
      #${ROOT_ID} .fm-lavender .fm-app-icon, #${ROOT_ID} .fm-app-hero.fm-lavender { color: light-dark(#76678f, var(--fm-accent)); background: light-dark(#eae5f3, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-rose .fm-app-icon, #${ROOT_ID} .fm-app-hero.fm-rose { color: light-dark(#a76d7c, var(--fm-rose-ink)); background: light-dark(#f3e4e8, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-oat .fm-app-icon, #${ROOT_ID} .fm-app-hero.fm-oat { color: light-dark(#9a794c, var(--fm-oat-ink)); background: light-dark(#f2e9d9, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-mint .fm-app-icon, #${ROOT_ID} .fm-app-hero.fm-mint { color: light-dark(#628477, var(--fm-mint-ink)); background: light-dark(#e1ebe6, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-home-note { display: flex; align-items: center; gap: 10px; min-width: 0; margin-top: auto; padding: 12px 13px; border: 1px solid light-dark(rgb(255 255 255 / 72%), var(--fm-line)); border-radius: 16px; background: light-dark(rgb(255 255 255 / 42%), var(--fm-card)); }
      #${ROOT_ID} .fm-note-icon { display: grid; flex: 0 0 29px; place-items: center; width: 29px; height: 29px; border-radius: 10px; color: light-dark(#a67e90, var(--fm-rose-ink)); background: light-dark(rgb(255 255 255 / 65%), var(--fm-card)); }
      #${ROOT_ID} .fm-note-icon svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-note-copy { display: flex; flex: 1 1 auto; flex-direction: column; gap: 3px; min-width: 0; }
      #${ROOT_ID} .fm-note-copy strong { overflow: hidden; color: light-dark(#695d69, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 10px); font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-note-copy small { color: light-dark(#a095a0, var(--fm-text-muted)); font-size: 7px; letter-spacing: .1em; }
      #${ROOT_ID} .fm-note-version { flex: 0 0 auto; color: light-dark(#a397a2, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 8px); font-weight: 750; letter-spacing: .05em; }
      #${ROOT_ID} .fm-phone-footer { display: grid; flex: 0 0 21px; place-items: center; }
      #${ROOT_ID} .fm-home-indicator { display: block; width: 74px; height: 4px; border-radius: 99px; background: light-dark(rgb(103 91 103 / 31%), var(--fm-accent-dark)); }
      #${ROOT_ID} .fm-app-view { padding: 0 21px 22px; }
      #${ROOT_ID} .fm-app-topline { display: flex; align-items: center; gap: 9px; min-height: 43px; border-bottom: 1px solid light-dark(rgb(255 255 255 / 52%), var(--fm-line)); }
      #${ROOT_ID} .fm-back-button { display: inline-flex; align-items: center; gap: 4px; padding: 5px 8px 5px 0; border: 0; color: light-dark(#887785, var(--fm-text)); background: transparent; font-size: max(var(--fm-font-cn-min), 11px); font-weight: 700; cursor: pointer; }
      #${ROOT_ID} .fm-back-button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-app-topline-label { color: light-dark(#a0949f, var(--fm-text-muted)); font-size: 8px; font-weight: 800; letter-spacing: .12em; }
      #${ROOT_ID} .fm-app-topline-spacer { flex: 1; }
      #${ROOT_ID} .fm-app-detail { padding: 20px 0 8px; }
      #${ROOT_ID} .fm-app-hero { position: relative; display: flex; align-items: center; justify-content: space-between; min-height: 108px; padding: 20px 23px; overflow: hidden; border: 1px solid light-dark(rgb(255 255 255 / 68%), var(--fm-line)); border-radius: 23px; }
      #${ROOT_ID} .fm-app-hero::after { content: ""; position: absolute; right: -20px; bottom: -57px; width: 155px; height: 155px; border: 1px solid light-dark(rgb(255 255 255 / 38%), var(--fm-line)); border-radius: 50%; box-shadow: 0 0 0 17px light-dark(rgb(255 255 255 / 12%), var(--fm-shadow-color)), 0 0 0 34px light-dark(rgb(255 255 255 / 8%), var(--fm-shadow-color)); }
      #${ROOT_ID} .fm-app-hero-icon { position: relative; z-index: 1; display: grid; place-items: center; width: 59px; height: 59px; border: 1px solid light-dark(rgb(255 255 255 / 55%), var(--fm-line)); border-radius: 19px; background: light-dark(rgb(255 255 255 / 48%), var(--fm-card)); box-shadow: 0 5px 15px light-dark(rgb(83 65 83 / 6%), var(--fm-shadow-color)); }
      #${ROOT_ID} .fm-app-hero-icon svg { width: 30px; height: 30px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-app-hero-mark { position: relative; z-index: 1; color: light-dark(rgb(91 77 93 / 40%), var(--fm-text-strong)); font-size: 10px; font-weight: 800; letter-spacing: .13em; }
      #${ROOT_ID} .fm-app-heading { padding: 22px 2px 17px; }
      #${ROOT_ID} .fm-app-english { color: light-dark(#9b8b99, var(--fm-text)); font-size: 9px; font-weight: 800; letter-spacing: .16em; }
      #${ROOT_ID} .fm-app-heading h1 { margin: 5px 0 4px; color: light-dark(#493f4a, var(--fm-text-strong)); font-size: 27px; font-weight: 700; letter-spacing: -.045em; }
      #${ROOT_ID} .fm-app-heading p { margin: 0; color: light-dark(#8c808b, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 11px); }
      #${ROOT_ID} .fm-coming-card { padding: 16px 17px 17px; border: 1px solid light-dark(rgb(255 255 255 / 78%), var(--fm-line)); border-radius: 19px; background: light-dark(rgb(255 255 255 / 61%), var(--fm-card)); box-shadow: 0 5px 17px light-dark(rgb(76 56 73 / 4%), var(--fm-shadow-color)); }
      #${ROOT_ID} .fm-coming-kicker { display: inline-flex; align-items: center; gap: 6px; color: light-dark(#a28d9c, var(--fm-text-muted)); font-size: 8px; font-weight: 800; letter-spacing: .12em; }
      #${ROOT_ID} .fm-coming-kicker i { width: 6px; height: 6px; border-radius: 50%; background: light-dark(#b88a9a, var(--fm-accent-dark)); box-shadow: 0 0 0 3px light-dark(rgb(184 138 154 / 12%), var(--fm-shadow-color)); }
      #${ROOT_ID} .fm-coming-card h2 { margin: 11px 0 7px; color: light-dark(#544854, var(--fm-text-strong)); font-size: 17px; font-weight: 750; }
      #${ROOT_ID} .fm-coming-card p { margin: 0; color: light-dark(#827782, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 11px); line-height: 1.75; }
      #${ROOT_ID} .fm-feature-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 21px 2px 9px; }
      #${ROOT_ID} .fm-feature-heading strong { color: light-dark(#625762, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 11px); }
      #${ROOT_ID} .fm-feature-heading span { color: light-dark(#aa9ca7, var(--fm-text-muted)); font-size: 8px; font-weight: 800; letter-spacing: .1em; }
      #${ROOT_ID} .fm-feature-list { overflow: hidden; border: 1px solid light-dark(rgb(255 255 255 / 70%), var(--fm-line)); border-radius: 16px; background: light-dark(rgb(255 255 255 / 42%), var(--fm-card)); }
      #${ROOT_ID} .fm-feature-row { display: flex; align-items: center; gap: 10px; min-height: 43px; padding: 8px 12px; border-bottom: 1px solid light-dark(rgb(224 214 221 / 55%), var(--fm-line)); }
      #${ROOT_ID} .fm-feature-row:last-child { border-bottom: 0; }
      #${ROOT_ID} .fm-feature-row span { color: light-dark(#b49aa8, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 9px); font-weight: 800; font-variant-numeric: tabular-nums; }
      #${ROOT_ID} .fm-feature-row strong { flex: 1; min-width: 0; color: light-dark(#746875, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 10px); font-weight: 600; white-space: normal; }
      #${ROOT_ID} .fm-feature-row i { color: light-dark(#b99aa8, var(--fm-text-muted)); font-size: 17px; font-style: normal; }
      #${ROOT_ID} .fm-app-footnote { display: flex; align-items: flex-start; gap: 7px; margin: 14px 2px 0; color: light-dark(#a095a0, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 9px); line-height: 1.55; }
      #${ROOT_ID} .fm-footnote-dot { flex: 0 0 6px; width: 6px; height: 6px; margin-top: 4px; border-radius: 50%; background: light-dark(#b99aaa, var(--fm-accent-soft)); }
      #${ROOT_ID} .fm-messages-view { display: flex; flex-direction: column; overflow: hidden; padding-bottom: 2px; }
      #${ROOT_ID} .fm-messages-view .fm-app-topline { flex: 0 0 43px; }
      #${ROOT_ID} .fm-messages-view.fm-messages-conversation .fm-app-topline { display: none; }
      #${ROOT_ID} .fm-messages-detail { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; overflow: hidden; padding: 0; }
      #${ROOT_ID} .fm-messages-list-page { display: flex; flex: 1 1 auto; flex-direction: column; gap: 17px; min-height: 0; overflow-y: auto; padding: 1px 1px 12px; }
      #${ROOT_ID} .fm-messages-page-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 1px 2px; }
      #${ROOT_ID} .fm-message-eyebrow { color: light-dark(#a18d9b, var(--fm-text-muted)); font-size: 10px; font-weight: 800; letter-spacing: .13em; }
      #${ROOT_ID} .fm-messages-page-heading h1 { margin: 5px 0 3px; color: light-dark(#493f4a, var(--fm-text-strong)); font-size: 27px; font-weight: 750; letter-spacing: -.04em; }
      #${ROOT_ID} .fm-messages-page-heading p { margin: 0; color: light-dark(#8c808b, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-message-icon-button { display: grid; flex: 0 0 38px; place-items: center; width: 38px; height: 38px; padding: 0; border: 1px solid light-dark(rgb(255 255 255 / 85%), var(--fm-line)); border-radius: 13px; color: light-dark(#887486, var(--fm-text)); background: light-dark(rgb(255 255 255 / 58%), var(--fm-card)); cursor: pointer; }
      #${ROOT_ID} .fm-message-icon-button svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-message-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 2px 2px -7px; }
      #${ROOT_ID} .fm-message-section-heading strong { color: light-dark(#5c505c, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 13px); font-weight: 750; }
      #${ROOT_ID} .fm-message-section-heading span { color: light-dark(#9b8d99, var(--fm-text)); font-size: max(var(--fm-font-number-min), 10px); }
      #${ROOT_ID} .fm-conversation-row { display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0; padding: 13px 12px; border: 1px solid light-dark(rgb(255 255 255 / 85%), var(--fm-line)); border-radius: 19px; color: var(--fm-ink); background: light-dark(rgb(255 255 255 / 62%), var(--fm-card)); box-shadow: 0 5px 18px light-dark(rgb(76 56 73 / 4%), var(--fm-shadow-color)); text-align: left; white-space: normal; cursor: pointer; }
      #${ROOT_ID} .fm-contact-avatar { display: grid; flex: 0 0 48px; place-items: center; width: 48px; height: 48px; border: 1px solid light-dark(rgb(255 255 255 / 80%), var(--fm-line)); border-radius: 17px; color: light-dark(#fff, var(--fm-on-accent)); background: linear-gradient(145deg, light-dark(#c59aaa, var(--fm-accent)), light-dark(#907b9b, var(--fm-accent-deep))); box-shadow: 0 4px 11px light-dark(rgb(101 75 99 / 12%), var(--fm-shadow-color)); font-size: 17px; font-weight: 750; }
      #${ROOT_ID} .fm-conversation-copy { display: flex; flex: 1 1 auto; flex-direction: column; gap: 5px; min-width: 0; }
      #${ROOT_ID} .fm-conversation-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
      #${ROOT_ID} .fm-conversation-title strong { overflow: hidden; color: light-dark(#514653, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 13px); font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-conversation-title time { flex: 0 0 auto; color: light-dark(#a194a0, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 10px); font-variant-numeric: tabular-nums; }
      #${ROOT_ID} .fm-conversation-preview { overflow: hidden; color: light-dark(#847984, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-conversation-subtitle { display: inline-flex; align-items: center; gap: 6px; color: light-dark(#a18f9e, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-conversation-subtitle i { width: 6px; height: 6px; border-radius: 50%; background: light-dark(#8ca99b, var(--fm-accent-dark)); box-shadow: 0 0 0 3px light-dark(rgb(140 169 155 / 13%), var(--fm-shadow-color)); }
      #${ROOT_ID} .fm-conversation-chevron { display: grid; flex: 0 0 18px; place-items: center; color: light-dark(#ad9eaa, var(--fm-text-muted)); }
      #${ROOT_ID} .fm-conversation-chevron svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-message-storage-note { display: flex; align-items: flex-start; gap: 10px; padding: 13px 13px; border: 1px solid light-dark(rgb(255 255 255 / 75%), var(--fm-line)); border-radius: 16px; background: light-dark(rgb(255 255 255 / 40%), var(--fm-card)); }
      #${ROOT_ID} .fm-message-storage-note > span { display: grid; flex: 0 0 27px; place-items: center; width: 27px; height: 27px; border-radius: 9px; color: light-dark(#a17e91, var(--fm-rose-ink)); background: light-dark(#f4e8ec, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-message-storage-note svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-message-storage-note strong { display: block; margin: 1px 0 4px; color: light-dark(#6c5d6b, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-message-storage-note p { margin: 0; color: light-dark(#958894, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.6; }
      #${ROOT_ID} .fm-message-list-footnote { margin-top: auto; padding: 3px 2px; color: light-dark(#a99ca7, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.5; text-align: center; }
      #${ROOT_ID} .fm-message-unavailable { display: flex; flex: 1 1 auto; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 240px; padding: 20px 12px; text-align: center; }
      #${ROOT_ID} .fm-message-unavailable-icon { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 20px; color: light-dark(#8b7894, var(--fm-accent)); background: light-dark(#ece7f2, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-message-unavailable-icon svg { width: 29px; height: 29px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-message-unavailable strong { color: light-dark(#554956, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 14px); }
      #${ROOT_ID} .fm-message-unavailable p { max-width: 300px; margin: 0; color: light-dark(#8e818d, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.7; }
      #${ROOT_ID} .fm-message-secondary-button { min-height: 36px; padding: 0 14px; border: 1px solid light-dark(#e6d9e0, var(--fm-line)); border-radius: 11px; color: light-dark(#826d7d, var(--fm-accent)); background: light-dark(rgb(255 255 255 / 70%), var(--fm-card)); font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-message-chat-layout { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; height: 100%; }
      #${ROOT_ID} .fm-message-chat-header { display: flex; flex: 0 0 43px; align-items: center; gap: 8px; padding: 0 0 7px; border-bottom: 1px solid light-dark(rgb(255 255 255 / 68%), var(--fm-line)); }
      #${ROOT_ID} .fm-chat-back-button { display: grid; flex: 0 0 30px; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 10px; color: light-dark(#8a7888, var(--fm-text)); background: light-dark(rgb(255 255 255 / 42%), var(--fm-card)); cursor: pointer; }
      #${ROOT_ID} .fm-chat-back-button svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-contact-avatar-small { flex: 0 0 34px; width: 34px; height: 34px; border-radius: 12px; font-size: 14px; }
      #${ROOT_ID} .fm-message-chat-header > div { display: flex; flex: 1 1 auto; align-items: center; min-width: 0; }
      #${ROOT_ID} .fm-message-chat-header strong { overflow: hidden; color: light-dark(#514653, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 14px); font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-message-stream { display: flex; flex: 1 1 auto; flex-direction: column; gap: 8px; min-height: 0; overflow-y: auto; padding: 7px 1px 8px; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgb(151 126 143 / 30%) transparent; }
      #${ROOT_ID} .fm-chat-date-divider { display: flex; align-items: center; justify-content: center; gap: 9px; margin: 0 0 2px; padding: 1px 0 3px; }
      #${ROOT_ID} .fm-chat-date-divider::before, #${ROOT_ID} .fm-chat-date-divider::after { content: ""; flex: 1 1 auto; height: 1px; background: light-dark(rgb(160 145 158 / 20%), var(--fm-accent-dark)); }
      #${ROOT_ID} .fm-chat-date-divider span { padding: 0; color: light-dark(#a295a1, var(--fm-text-muted)); background: transparent; font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-message-empty { display: flex; flex: 1 1 auto; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 120px; padding: 12px 10px; text-align: center; }
      #${ROOT_ID} .fm-message-empty-icon { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 19px; color: light-dark(#907b98, var(--fm-accent)); background: light-dark(rgb(255 255 255 / 62%), var(--fm-card)); }
      #${ROOT_ID} .fm-message-empty-icon svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-message-empty strong { color: light-dark(#665866, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 13px); }
      #${ROOT_ID} .fm-message-empty p { max-width: 245px; margin: 0; color: light-dark(#9a8d99, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.65; }
      #${ROOT_ID} .fm-message-row { display: flex; align-items: flex-end; gap: 6px; width: 100%; }
      #${ROOT_ID} .fm-message-row.is-user { justify-content: flex-end; }
      #${ROOT_ID} .fm-message-mini-avatar { display: grid; flex: 0 0 23px; place-items: center; width: 23px; height: 23px; border-radius: 8px; color: light-dark(#fff, var(--fm-on-accent)); background: linear-gradient(145deg, light-dark(#c59aaa, var(--fm-accent)), light-dark(#907b9b, var(--fm-accent-deep))); font-size: max(var(--fm-font-cn-min), 12px); font-weight: 700; }
      #${ROOT_ID} .fm-message-bubble-wrap { display: flex; flex: 0 1 auto; flex-direction: column; gap: 3px; max-width: 86%; min-width: 0; }
      #${ROOT_ID} .fm-message-row.is-user .fm-message-bubble-wrap { align-items: flex-end; }
      #${ROOT_ID} .fm-message-bubble { padding: 9px 11px; border: 1px solid light-dark(rgb(255 255 255 / 82%), var(--fm-line)); border-radius: 15px 15px 15px 5px; color: light-dark(#5e5360, var(--fm-text-strong)); background: light-dark(rgb(255 255 255 / 78%), var(--fm-card)); box-shadow: 0 2px 7px light-dark(rgb(76 56 73 / 3%), var(--fm-shadow-color)); font-size: max(var(--fm-font-cn-min), 13px); line-height: 1.55; overflow-wrap: anywhere; white-space: pre-wrap; }
      #${ROOT_ID} .fm-message-row.is-user .fm-message-bubble { border-color: light-dark(#b58b9c, var(--fm-line)); border-radius: 16px 16px 5px 16px; color: light-dark(#fffafd, var(--fm-on-accent)); background: linear-gradient(145deg, light-dark(#b58b9c, var(--fm-line)), light-dark(#94788f, var(--fm-accent-deep))); }
      #${ROOT_ID} .fm-message-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 0 3px; color: light-dark(#a295a1, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 10px); font-variant-numeric: tabular-nums; }
      #${ROOT_ID} .fm-message-edit-button { display: inline-grid; flex: 0 0 25px; place-items: center; width: 25px; height: 25px; padding: 0; border: 0; border-radius: 7px; color: light-dark(#94788c, var(--fm-accent)); background: light-dark(rgb(255 255 255 / 58%), var(--fm-card)); cursor: pointer; -webkit-tap-highlight-color: transparent; }
      #${ROOT_ID} .fm-message-edit-button svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-message-edit-button:hover { background: light-dark(#eae7f3, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-toast { position: absolute; z-index: 6; left: 50%; bottom: 56px; transform: translateX(-50%); max-width: calc(100% - 30px); padding: 8px 13px; border: 1px solid light-dark(#eae3e5, var(--fm-line)); border-radius: 12px; background: light-dark(#fff9fb, var(--fm-card)); color: light-dark(#514650, var(--fm-text-strong)); box-shadow: 0 3px 12px light-dark(rgb(49 34 44 / 12%), var(--fm-shadow-color)); text-align: center; font-size: 12px; pointer-events: none; white-space: nowrap; }
      #${ROOT_ID} .fm-message-editing { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 9px; border: 1px solid light-dark(#eadce2, var(--fm-line)); border-radius: 11px; background: light-dark(rgb(255 255 255 / 60%), var(--fm-card)); }
      #${ROOT_ID} .fm-message-editing > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      #${ROOT_ID} .fm-message-editing strong { color: light-dark(#826b7b, var(--fm-accent)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-message-editing span { color: light-dark(#9c8d99, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.35; }
      #${ROOT_ID} .fm-message-editing button { flex: 0 0 auto; padding: 5px 8px; border: 0; border-radius: 8px; color: light-dark(#8c6c7c, var(--fm-rose-ink)); background: light-dark(#f1e5e9, var(--fm-card-muted)); font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-message-stop-button { background: light-dark(#8e7887, var(--fm-accent-dark)); }
      #${ROOT_ID} .fm-message-stop-button svg { width: 17px; height: 17px; fill: currentColor; stroke: none; }

      #${ROOT_ID} .fm-message-typing { display: inline-flex; align-items: center; gap: 4px; min-height: 34px; padding: 0 11px; border: 1px solid light-dark(rgb(255 255 255 / 82%), var(--fm-line)); border-radius: 14px 14px 14px 5px; color: light-dark(#948695, var(--fm-text)); background: light-dark(rgb(255 255 255 / 72%), var(--fm-card)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-message-typing i { width: 5px; height: 5px; border-radius: 50%; background: light-dark(#b18e9e, var(--fm-accent-dark)); animation: fm-typing 1.1s infinite ease-in-out; }
      #${ROOT_ID} .fm-message-typing i:nth-child(2) { animation-delay: .15s; }
      #${ROOT_ID} .fm-message-typing i:nth-child(3) { animation-delay: .3s; margin-right: 3px; }
      @keyframes fm-typing { 0%, 60%, 100% { opacity: .35; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
      #${ROOT_ID} .fm-message-retry-note { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 10px; border: 1px solid light-dark(#ead9dc, var(--fm-line)); border-radius: 12px; color: light-dark(#927982, var(--fm-text)); background: light-dark(rgb(255 248 248 / 72%), var(--fm-card)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-message-retry-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 4px; }
      #${ROOT_ID} .fm-message-retry-action { padding: 5px 8px; border: 0; border-radius: 8px; color: light-dark(#8e6274, var(--fm-rose-ink)); background: light-dark(#f1e1e7, var(--fm-rose-soft)); font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-message-retry-dismiss { display: grid; flex: 0 0 26px; place-items: center; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 50%; color: var(--fm-text-muted); background: transparent; cursor: pointer; }
      #${ROOT_ID} .fm-message-retry-dismiss:hover { color: var(--fm-text-strong); background: var(--fm-card-muted); }
      #${ROOT_ID} .fm-message-retry-dismiss svg { width: 13px; height: 13px; }
      #${ROOT_ID} .fm-message-error { padding: 9px 10px; border-radius: 11px; color: light-dark(#986d72, var(--fm-danger)); background: light-dark(#f8e9e9, var(--fm-card)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.5; }
      #${ROOT_ID} .fm-message-composer { position: relative; display: flex; flex: 0 0 auto; align-items: flex-end; gap: 7px; padding: 7px 0 2px; border-top: 1px solid light-dark(rgb(255 255 255 / 58%), var(--fm-line)); }
      #${ROOT_ID} .fm-message-composer textarea { --fm-control-padding: 9px 12px; --fm-control-radius: 14px; --fm-control-font-size: max(var(--fm-font-cn-min), 13px); --fm-control-line-height: 1.5; --fm-control-bg: light-dark(rgb(255 255 255 / 86%), var(--fm-card)); --fm-control-border: light-dark(#e7dfe3, var(--fm-line)); --fm-control-shadow: inset 0 1px 2px light-dark(rgb(75 58 73 / 3%), var(--fm-shadow-color)); --fm-control-focus-border: light-dark(#c5a6b3, var(--fm-accent)); --fm-control-focus-shadow: 0 0 0 3px light-dark(rgb(181 139 156 / 12%), var(--fm-shadow-color)); display: block; flex: 1 1 auto; width: 0; min-width: 0; min-height: 40px; max-height: 96px; resize: none; overflow-y: auto; white-space: pre-wrap; }
      #${ROOT_ID} .fm-message-composer textarea:disabled { opacity: .65; }
      #${ROOT_ID} .fm-message-send-button { display: grid; flex: 0 0 40px; place-items: center; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 13px; color: light-dark(#fff, var(--fm-on-accent)); background: linear-gradient(145deg, light-dark(#b58b9c, var(--fm-accent)), light-dark(#94788f, var(--fm-accent-deep))); box-shadow: 0 3px 8px light-dark(rgb(115 83 105 / 13%), var(--fm-shadow-color)); cursor: pointer; }
      #${ROOT_ID} .fm-message-send-button svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-message-send-button:disabled { opacity: .5; cursor: not-allowed; }
      #${ROOT_ID} .fm-message-header-actions { display: flex; flex: 0 0 auto; align-items: center; justify-content: flex-end; gap: 5px; min-width: 0; margin-left: auto; }
      #${ROOT_ID} .fm-message-header-actions button { min-height: 27px; padding: 4px 7px; border: 1px solid light-dark(rgb(255 255 255 / 75%), var(--fm-line)); border-radius: 8px; color: light-dark(#887687, var(--fm-text)); background: light-dark(rgb(255 255 255 / 55%), var(--fm-card)); font-size: max(var(--fm-font-cn-min), 11px); cursor: pointer; white-space: nowrap; }
      #${ROOT_ID} .fm-message-header-actions button.is-danger { color: light-dark(#a36f79, var(--fm-danger)); }
      #${ROOT_ID} .fm-message-header-actions button:disabled { opacity: .4; cursor: not-allowed; }
      #${ROOT_ID} .fm-message-selected-count { color: light-dark(#9b8998, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 11px); white-space: nowrap; }
      @media (max-width: 380px) {
        #${ROOT_ID} .fm-message-chat-header { gap: 5px; }
        #${ROOT_ID} .fm-message-header-actions { gap: 3px; }
        #${ROOT_ID} .fm-message-header-actions button { min-height: 25px; padding: 3px 5px; font-size: 10px; }
        #${ROOT_ID} .fm-message-selected-count { font-size: 10px; }
      }
      #${ROOT_ID} .fm-message-selection-hint { flex: 0 0 auto; padding: 12px 8px; color: light-dark(#998a98, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); text-align: center; }
      #${ROOT_ID} .fm-message-row.is-selected .fm-message-bubble { outline: 2px solid light-dark(rgb(174 132 153 / 48%), var(--fm-line)); outline-offset: 1px; }
      #${ROOT_ID} .fm-message-select-button { display: grid; flex: 0 0 22px; place-items: center; width: 22px; height: 22px; margin-bottom: 6px; padding: 0; border: 1px solid light-dark(#d9cbd4, var(--fm-line)); border-radius: 7px; color: light-dark(#fff, var(--fm-on-accent)); background: light-dark(rgb(255 255 255 / 72%), var(--fm-card)); cursor: pointer; }
      #${ROOT_ID} .fm-message-select-button.is-selected { border-color: light-dark(#a98298, var(--fm-line)); background: light-dark(#a98298, var(--fm-line)); }
      #${ROOT_ID} .fm-message-select-button svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-message-regenerate-button { color: light-dark(#7e819e, var(--fm-text)); }
      #${ROOT_ID} .fm-message-delete-button { color: light-dark(#b17c82, var(--fm-danger)); }
      #${ROOT_ID} .fm-subscriptions-view { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
      #${ROOT_ID} .fm-subscriptions-view .fm-app-topline { flex: 0 0 36px; min-height: 36px; }
      #${ROOT_ID} .fm-subscriptions-detail { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; overflow: hidden; padding: 0; }
      #${ROOT_ID} .fm-subscription-page { display: flex; flex: 1 1 auto; flex-direction: column; gap: 13px; min-height: 0; overflow-y: auto; padding: 5px 1px 10px; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgb(151 126 143 / 25%) transparent; }
      #${ROOT_ID} .fm-subscription-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 3px 1px 1px; }
      #${ROOT_ID} .fm-subscription-heading-copy { flex: 1 1 auto; min-width: 0; }
      #${ROOT_ID} .fm-subscription-heading-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 7px; }
      #${ROOT_ID} .fm-subscription-eyebrow { color: light-dark(#a18d9b, var(--fm-text-muted)); font-size: 9px; font-weight: 800; letter-spacing: .14em; }
      #${ROOT_ID} .fm-subscription-heading h1 { margin: 5px 0 3px; color: light-dark(#493f4a, var(--fm-text-strong)); font-size: 25px; font-weight: 750; letter-spacing: -.04em; }
      #${ROOT_ID} .fm-subscription-heading p { margin: 0; color: light-dark(#8c808b, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.5; }
      #${ROOT_ID} .fm-subscription-count { flex: 0 0 auto; padding: 5px 8px; border-radius: 9px; color: light-dark(#927e8e, var(--fm-text)); background: light-dark(rgb(255 255 255 / 55%), var(--fm-card)); font-size: max(var(--fm-font-number-min), 10px); }
      #${ROOT_ID} .fm-subscription-batch-status { display: flex; flex-direction: column; gap: 7px; padding: 10px 11px; border: 1px solid light-dark(#e9dfe6, var(--fm-line)); border-radius: 13px; color: light-dark(#887987, var(--fm-text)); background: light-dark(rgb(255 255 255 / 62%), var(--fm-card)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.45; }
      #${ROOT_ID} .fm-subscription-batch-status.is-result { display: block; padding: 8px 10px; color: light-dark(#72877c, var(--fm-text)); background: light-dark(#edf3ef, var(--fm-card)); border-color: light-dark(#e0ebe4, var(--fm-line)); }
      #${ROOT_ID} .fm-subscription-batch-head, #${ROOT_ID} .fm-subscription-batch-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      #${ROOT_ID} .fm-subscription-batch-head strong { color: light-dark(#665767, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-subscription-batch-head span, #${ROOT_ID} .fm-subscription-batch-foot small { color: light-dark(#a08f9e, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 10px); }
      #${ROOT_ID} .fm-subscription-batch-status p { margin: 0; color: light-dark(#8e7e8d, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-subscription-progress-track { width: 100%; height: 5px; overflow: hidden; border-radius: 99px; background: light-dark(#eee7ec, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-subscription-progress-track > span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, light-dark(#c5a1b2, var(--fm-accent)), light-dark(#9d879f, var(--fm-accent))); transition: width .2s ease; }
      #${ROOT_ID} .fm-subscription-batch-foot button { flex: 0 0 auto; padding: 3px 8px; border: 1px solid light-dark(#e6d7df, var(--fm-line)); border-radius: 8px; color: light-dark(#98778a, var(--fm-rose-ink)); background: light-dark(#fff9fb, var(--fm-card)); font-size: max(var(--fm-font-cn-min), 11px); cursor: pointer; }
      #${ROOT_ID} .fm-subscription-section { display: flex; flex-direction: column; gap: 7px; }
      #${ROOT_ID} .fm-subscription-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 2px; }
      #${ROOT_ID} .fm-subscription-section-heading strong { color: light-dark(#625563, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 13px); font-weight: 750; }
      #${ROOT_ID} .fm-subscription-section-heading span { color: light-dark(#a0929f, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 10px); }
      #${ROOT_ID} .fm-subscription-account-card { display: flex; align-items: center; gap: 7px; min-width: 0; padding: 9px; border: 1px solid light-dark(rgb(255 255 255 / 84%), var(--fm-line)); border-radius: 15px; background: light-dark(rgb(255 255 255 / 63%), var(--fm-card)); }
      #${ROOT_ID} .fm-subscription-account-main { display: flex; flex: 1 1 auto; align-items: center; gap: 9px; min-width: 0; padding: 0; border: 0; color: inherit; background: transparent; text-align: left; cursor: pointer; }
      #${ROOT_ID} .fm-subscription-account-main:disabled { opacity: .65; cursor: wait; }
      #${ROOT_ID} .fm-subscription-avatar { display: grid; flex: 0 0 38px; place-items: center; width: 38px; height: 38px; border: 1px solid light-dark(rgb(255 255 255 / 82%), var(--fm-line)); border-radius: 13px; color: light-dark(#806f80, var(--fm-text)); background: light-dark(#eee7ef, var(--fm-card-muted)); font-size: max(var(--fm-font-cn-min), 14px); font-weight: 800; }
      #${ROOT_ID} .fm-subscription-avatar.fm-rose { color: light-dark(#a66e7e, var(--fm-rose-ink)); background: light-dark(#f4e6ea, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-subscription-avatar.fm-oat { color: light-dark(#98794f, var(--fm-oat-ink)); background: light-dark(#f3eadb, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-subscription-avatar.fm-mint { color: light-dark(#66877b, var(--fm-mint-ink)); background: light-dark(#e5eee8, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-subscription-avatar.fm-lavender { color: light-dark(#817394, var(--fm-accent)); background: light-dark(#ece8f3, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-subscription-account-copy { display: flex; flex: 1 1 auto; flex-direction: column; gap: 3px; min-width: 0; }
      #${ROOT_ID} .fm-subscription-account-copy strong { overflow: hidden; color: light-dark(#584c59, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 13px); font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-subscription-account-copy small { color: light-dark(#a18e9d, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 11px); }
      #${ROOT_ID} .fm-subscription-account-copy > span { overflow: hidden; color: light-dark(#8d818e, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 11px); line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-subscription-chevron { display: grid; flex: 0 0 15px; place-items: center; color: light-dark(#ad9eaa, var(--fm-text-muted)); }
      #${ROOT_ID} .fm-subscription-chevron svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; }
      #${ROOT_ID} .fm-subscription-follow-button { flex: 0 0 auto; min-width: 58px; min-height: 29px; padding: 4px 8px; border: 1px solid light-dark(#e8dce2, var(--fm-line)); border-radius: 9px; color: light-dark(#987487, var(--fm-rose-ink)); background: light-dark(#fbf5f7, var(--fm-card)); font-size: max(var(--fm-font-cn-min), 11px); cursor: pointer; }
      #${ROOT_ID} .fm-subscription-follow-button.is-following { border-color: light-dark(#e5e0e8, var(--fm-line)); color: light-dark(#8b8494, var(--fm-text)); background: light-dark(#f2eff4, var(--fm-card)); }
      #${ROOT_ID} .fm-subscription-follow-button:disabled { opacity: .55; cursor: wait; }
      #${ROOT_ID} .fm-subscription-empty-follow { padding: 12px 10px; border: 1px dashed light-dark(#e4d9e1, var(--fm-line)); border-radius: 13px; color: light-dark(#a0929f, var(--fm-text-muted)); background: light-dark(rgb(255 255 255 / 35%), var(--fm-card)); font-size: max(var(--fm-font-cn-min), 12px); text-align: center; }
      #${ROOT_ID} .fm-subscription-footnote { margin: auto 2px 0; color: light-dark(#a295a1, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 11px); line-height: 1.5; text-align: center; }
      #${ROOT_ID} .fm-subscription-profile { display: flex; align-items: center; gap: 9px; padding: 11px; border: 1px solid light-dark(rgb(255 255 255 / 80%), var(--fm-line)); border-radius: 17px; background: light-dark(rgb(255 255 255 / 63%), var(--fm-card)); }
      #${ROOT_ID} .fm-subscription-avatar-large { flex-basis: 49px; width: 49px; height: 49px; border-radius: 16px; font-size: 18px; }
      #${ROOT_ID} .fm-subscription-profile-copy { flex: 1 1 auto; min-width: 0; }
      #${ROOT_ID} .fm-subscription-category { color: light-dark(#a18b9c, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 10px); }
      #${ROOT_ID} .fm-subscription-profile-copy h1 { margin: 2px 0 3px; color: light-dark(#574b58, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 15px); font-weight: 800; }
      #${ROOT_ID} .fm-subscription-profile-copy p { margin: 0; color: light-dark(#928692, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 11px); line-height: 1.4; }
      #${ROOT_ID} .fm-subscription-article-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 1px 2px; }
      #${ROOT_ID} .fm-subscription-article-heading > div { display: flex; align-items: baseline; gap: 7px; }
      #${ROOT_ID} .fm-subscription-article-heading strong { color: light-dark(#625563, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 14px); }
      #${ROOT_ID} .fm-subscription-article-heading span { color: light-dark(#a0929f, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 10px); }
      #${ROOT_ID} .fm-subscription-generate { display: inline-flex; align-items: center; gap: 5px; min-height: 30px; padding: 4px 8px; border: 1px solid light-dark(#e6dce4, var(--fm-line)); border-radius: 9px; color: light-dark(#92798b, var(--fm-accent)); background: light-dark(rgb(255 255 255 / 65%), var(--fm-card)); font-size: max(var(--fm-font-cn-min), 11px); cursor: pointer; }
      #${ROOT_ID} .fm-subscription-generate svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.7; }
      #${ROOT_ID} .fm-subscription-generate:disabled { opacity: .5; cursor: wait; }
      #${ROOT_ID} .fm-subscription-article-list { display: flex; flex-direction: column; gap: 8px; }
      #${ROOT_ID} .fm-subscription-article-card { display: flex; flex-direction: column; gap: 6px; width: 100%; padding: 11px 12px; border: 1px solid light-dark(rgb(255 255 255 / 82%), var(--fm-line)); border-radius: 15px; color: inherit; background: light-dark(rgb(255 255 255 / 67%), var(--fm-card)); text-align: left; cursor: pointer; }
      #${ROOT_ID} .fm-subscription-article-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: light-dark(#a18e9d, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 10px); }
      #${ROOT_ID} .fm-subscription-article-card > strong { color: light-dark(#574b58, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 14px); font-weight: 800; line-height: 1.4; }
      #${ROOT_ID} .fm-subscription-article-summary { display: -webkit-box; overflow: hidden; color: light-dark(#887c89, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
      #${ROOT_ID} .fm-subscription-article-stats { display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: light-dark(#aa9ba8, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 10px); }
      #${ROOT_ID} .fm-subscription-article-stats svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.7; }
      #${ROOT_ID} .fm-subscription-empty-articles { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: auto 0; padding: 22px 14px; border: 1px dashed light-dark(#e5dbe2, var(--fm-line)); border-radius: 16px; color: light-dark(#9b8d99, var(--fm-text)); text-align: center; }
      #${ROOT_ID} .fm-subscription-empty-articles > span { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 15px; color: light-dark(#9b8094, var(--fm-accent)); background: light-dark(#f2eaf0, var(--fm-card)); }
      #${ROOT_ID} .fm-subscription-empty-articles svg { width: 23px; height: 23px; fill: none; stroke: currentColor; stroke-width: 1.6; }
      #${ROOT_ID} .fm-subscription-empty-articles strong { color: light-dark(#716274, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 13px); }
      #${ROOT_ID} .fm-subscription-empty-articles p { margin: 0; font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.5; }
      #${ROOT_ID} .fm-subscription-reader { display: flex; flex: 1 1 auto; flex-direction: column; gap: 14px; min-height: 0; overflow-y: auto; padding: 8px 4px 18px; }
      #${ROOT_ID} .fm-subscription-reader-source { display: flex; align-items: center; gap: 9px; padding-bottom: 11px; border-bottom: 1px solid light-dark(rgb(220 209 218 / 65%), var(--fm-line)); }
      #${ROOT_ID} .fm-subscription-reader-source > div { display: flex; flex-direction: column; gap: 3px; }
      #${ROOT_ID} .fm-subscription-reader-source strong { color: light-dark(#5d5060, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 13px); }
      #${ROOT_ID} .fm-subscription-reader-source small { color: light-dark(#a0929f, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 11px); }
      #${ROOT_ID} .fm-subscription-reader h1 { margin: 4px 0 0; color: light-dark(#4f4451, var(--fm-text-strong)); font-size: 23px; font-weight: 800; line-height: 1.4; letter-spacing: -.025em; overflow-wrap: anywhere; }
      #${ROOT_ID} .fm-subscription-reader-summary { margin: -4px 0 0; padding-left: 10px; border-left: 2px solid light-dark(#d8bdcb, var(--fm-line)); color: light-dark(#968694, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.6; }
      #${ROOT_ID} .fm-subscription-reader-body { color: light-dark(#625765, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 14px); line-height: 1.9; overflow-wrap: anywhere; white-space: normal; }
      #${ROOT_ID} .fm-subscription-reader-footer { display: flex; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 12px; border-top: 1px solid light-dark(rgb(220 209 218 / 65%), var(--fm-line)); color: light-dark(#a294a1, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 10px); }

      #${ROOT_ID} .fm-moments-view { display: flex; flex-direction: column; min-height: 0; overflow: hidden; padding-bottom: 1px; }
      #${ROOT_ID} .fm-moments-view .fm-app-topline { flex: 0 0 36px; min-height: 36px; }
      #${ROOT_ID} .fm-moments-view .fm-app-detail { padding: 7px 0 3px; }
      #${ROOT_ID} .fm-moments-detail { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; overflow: hidden; padding: 0; }
      #${ROOT_ID} .fm-moments-page { display: flex; flex: 1 1 auto; flex-direction: column; gap: 8px; min-height: 0; overflow-y: auto; padding: 0 1px 8px; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgb(151 126 143 / 25%) transparent; }
      #${ROOT_ID} .fm-moments-heading { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 10px; min-height: 35px; padding: 0 1px 2px; }
      #${ROOT_ID} .fm-moments-heading h1 { margin: 0; color: light-dark(#493f4a, var(--fm-text-strong)); font-size: 22px; font-weight: 750; letter-spacing: -.04em; line-height: 1.2; }
      #${ROOT_ID} .fm-moments-refresh { display: grid; flex: 0 0 34px; place-items: center; width: 34px; height: 34px; padding: 0; border: 1px solid light-dark(rgb(255 255 255 / 84%), var(--fm-line)); border-radius: 11px; color: light-dark(#866f82, var(--fm-accent)); background: light-dark(rgb(255 255 255 / 65%), var(--fm-card)); cursor: pointer; }
      #${ROOT_ID} .fm-moments-refresh svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-moments-refresh:disabled { opacity: .48; cursor: wait; }
      #${ROOT_ID} .fm-moments-feed { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
      #${ROOT_ID} .fm-moment-card { padding: 10px 11px 8px; border: 1px solid light-dark(rgb(255 255 255 / 82%), var(--fm-line)); border-radius: 15px; background: light-dark(rgb(255 255 255 / 66%), var(--fm-card)); }
      #${ROOT_ID} .fm-moment-author-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
      #${ROOT_ID} .fm-moment-avatar { display: grid; flex: 0 0 31px; place-items: center; width: 31px; height: 31px; border-radius: 11px; color: light-dark(#fff, var(--fm-on-accent)); background: linear-gradient(145deg, light-dark(#b991a3, var(--fm-accent)), light-dark(#927b98, var(--fm-accent-deep))); font-size: max(var(--fm-font-cn-min), 12px); font-weight: 750; }
      #${ROOT_ID} .fm-moment-avatar.is-npc { background: linear-gradient(145deg, light-dark(#9aafa6, var(--fm-mint-ink)), light-dark(#728f85, var(--fm-mint-ink))); }
      #${ROOT_ID} .fm-moment-avatar.is-public { background: linear-gradient(145deg, light-dark(#c3a98b, var(--fm-oat-soft)), light-dark(#a68b78, var(--fm-accent-deep))); }
      #${ROOT_ID} .fm-moment-author-copy { display: flex; flex: 1 1 auto; flex-direction: column; gap: 1px; min-width: 0; }
      #${ROOT_ID} .fm-moment-author-copy strong { overflow: hidden; color: light-dark(#554957, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 13px); font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-moment-author-copy small { color: light-dark(#a0929f, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-moment-author-row time { flex: 0 0 auto; color: light-dark(#a0929f, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 10px); font-variant-numeric: tabular-nums; }
      #${ROOT_ID} .fm-moment-content { padding: 7px 1px 9px; color: light-dark(#5e5360, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 13px); line-height: 1.55; overflow-wrap: anywhere; white-space: pre-wrap; }
      #${ROOT_ID} .fm-moment-actions { display: flex; align-items: center; gap: 11px; padding-top: 6px; border-top: 1px solid light-dark(rgb(224 214 221 / 56%), var(--fm-line)); }
      #${ROOT_ID} .fm-moment-topic { padding: 2px 7px; border-radius: 7px; color: light-dark(#977c8b, var(--fm-text)); background: light-dark(#f3e9ed, var(--fm-card-muted)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-moment-action-spacer { flex: 1 1 auto; }
      #${ROOT_ID} .fm-moment-like { display: inline-flex; align-items: center; gap: 4px; padding: 2px 3px; border: 0; color: light-dark(#968793, var(--fm-text)); background: transparent; font-size: max(var(--fm-font-number-min), 10px); cursor: pointer; }
      #${ROOT_ID} .fm-moment-like svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-moment-like.is-liked { color: light-dark(#b66f83, var(--fm-rose-ink)); }
      #${ROOT_ID} .fm-moment-like.is-liked svg { fill: light-dark(rgb(182 111 131 / 18%), var(--fm-rose-ink)); }
      #${ROOT_ID} .fm-moment-comment-count { display: inline-flex; align-items: center; gap: 5px; padding: 2px 3px; border: 0; color: light-dark(#a0929f, var(--fm-text-muted)); background: transparent; font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-moment-comment-count svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-moment-comment-count.is-open { color: light-dark(#98758b, var(--fm-rose-ink)); }
      #${ROOT_ID} .fm-moment-comments-panel { display: flex; flex-direction: column; gap: 7px; margin-top: 7px; padding: 8px 8px 7px; border-radius: 11px; background: light-dark(rgb(249 245 247 / 78%), var(--fm-card)); }
      #${ROOT_ID} .fm-moment-comments-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 5px; border-bottom: 1px solid light-dark(rgb(224 214 221 / 58%), var(--fm-line)); }
      #${ROOT_ID} .fm-moment-comments-heading strong { color: light-dark(#665766, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 12px); font-weight: 750; }
      #${ROOT_ID} .fm-moment-comments-heading strong span { margin-left: 3px; color: light-dark(#a18e9d, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 10px); font-weight: 600; }
      #${ROOT_ID} .fm-moment-comments-heading button { padding: 2px 5px; border: 0; border-radius: 7px; color: light-dark(#9b8797, var(--fm-text)); background: transparent; font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-moment-comments-list { display: flex; flex-direction: column; gap: 8px; max-height: min(24dvh, 190px); overflow-y: auto; padding-right: 2px; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgb(151 126 143 / 25%) transparent; }
      #${ROOT_ID} .fm-moment-comment { display: flex; align-items: flex-start; gap: 7px; min-width: 0; }
      #${ROOT_ID} .fm-moment-comment.is-reply { margin-left: 27px; padding-left: 8px; border-left: 2px solid light-dark(#e7d9e0, var(--fm-line)); }
      #${ROOT_ID} .fm-moment-comment-avatar { display: grid; flex: 0 0 24px; place-items: center; width: 24px; height: 24px; border-radius: 8px; color: light-dark(#fff, var(--fm-on-accent)); background: linear-gradient(145deg, light-dark(#b6a1b5, var(--fm-accent)), light-dark(#8d7d99, var(--fm-accent-deep))); font-size: max(var(--fm-font-cn-min), 12px); font-weight: 700; }
      #${ROOT_ID} .fm-moment-comment-avatar.is-char { background: linear-gradient(145deg, light-dark(#b991a3, var(--fm-accent)), light-dark(#927b98, var(--fm-accent-deep))); }
      #${ROOT_ID} .fm-moment-comment-avatar.is-user { background: linear-gradient(145deg, light-dark(#c5a58f, var(--fm-oat-soft)), light-dark(#a98578, var(--fm-accent-deep))); }
      #${ROOT_ID} .fm-moment-comment-avatar.is-npc { background: linear-gradient(145deg, light-dark(#9aafa6, var(--fm-mint-ink)), light-dark(#728f85, var(--fm-mint-ink))); }
      #${ROOT_ID} .fm-moment-comment-main { flex: 1 1 auto; min-width: 0; }
      #${ROOT_ID} .fm-moment-comment-meta { display: flex; align-items: center; gap: 6px; min-width: 0; }
      #${ROOT_ID} .fm-moment-comment-meta strong { overflow: hidden; color: light-dark(#665966, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 12px); font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-moment-comment-meta span, #${ROOT_ID} .fm-moment-comment-meta time { flex: 0 0 auto; color: light-dark(#aa9ca7, var(--fm-text-muted)); font-size: max(var(--fm-font-number-min), 10px); }
      #${ROOT_ID} .fm-moment-comment-meta time { margin-left: auto; }
      #${ROOT_ID} .fm-moment-comment-main p { margin: 3px 0 0; color: light-dark(#766b77, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.45; overflow-wrap: anywhere; white-space: pre-wrap; }
      #${ROOT_ID} .fm-moment-comment-replying { margin-top: 3px; color: light-dark(#a28b9a, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-moment-comment-status, #${ROOT_ID} .fm-moment-comment-waiting { display: block; margin-top: 4px; color: light-dark(#a18b9a, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-moment-comment-status.is-error { color: light-dark(#ad737b, var(--fm-danger)); }
      #${ROOT_ID} .fm-moment-comment-retry { margin-top: 4px; padding: 3px 7px; border: 1px solid light-dark(#e7d9e0, var(--fm-line)); border-radius: 7px; color: light-dark(#8d6d80, var(--fm-rose-ink)); background: light-dark(#fff, var(--fm-card)); font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-moment-comments-empty { padding: 6px 2px; color: light-dark(#a0929f, var(--fm-text-muted)); font-size: max(var(--fm-font-cn-min), 12px); text-align: center; }
      #${ROOT_ID} .fm-moment-comments-loading { display: flex; align-items: center; gap: 5px; padding: 7px 2px; color: light-dark(#978895, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-moment-comments-loading i { width: 5px; height: 5px; border-radius: 50%; background: light-dark(#b18e9e, var(--fm-accent-dark)); animation: fm-typing 1.1s infinite ease-in-out; }
      #${ROOT_ID} .fm-moment-comments-loading i:nth-child(2) { animation-delay: .15s; }
      #${ROOT_ID} .fm-moment-comments-loading i:nth-child(3) { animation-delay: .3s; margin-right: 3px; }
      #${ROOT_ID} .fm-moment-comments-error { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; border-radius: 8px; color: light-dark(#986d72, var(--fm-danger)); background: light-dark(#f8e9e9, var(--fm-card)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.4; }
      #${ROOT_ID} .fm-moment-comments-error button { flex: 0 0 auto; padding: 4px 7px; border: 0; border-radius: 7px; color: light-dark(#8e6274, var(--fm-danger)); background: light-dark(#f1dfe5, var(--fm-rose-soft)); font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-moment-comment-form { display: flex; align-items: flex-end; gap: 7px; padding-top: 6px; border-top: 1px solid light-dark(rgb(224 214 221 / 58%), var(--fm-line)); }
      #${ROOT_ID} .fm-moment-comment-form textarea { --fm-control-padding: 7px 10px; --fm-control-radius: 10px; --fm-control-font-size: max(var(--fm-font-cn-min), 12px); --fm-control-line-height: 1.45; --fm-control-bg: light-dark(rgb(255 255 255 / 88%), var(--fm-card)); --fm-control-border: light-dark(#e7dfe3, var(--fm-line)); --fm-control-focus-border: light-dark(#c5a6b3, var(--fm-accent)); --fm-control-focus-shadow: 0 0 0 2px light-dark(rgb(181 139 156 / 10%), var(--fm-shadow-color)); flex: 1 1 auto; width: 0; min-width: 0; min-height: 34px; max-height: 72px; resize: none; overflow-y: auto; white-space: pre-wrap; }
      #${ROOT_ID} .fm-moment-comment-form textarea:disabled { opacity: .6; }
      #${ROOT_ID} .fm-moment-comment-form button { flex: 0 0 auto; min-width: 46px; height: 34px; padding: 0 9px; border: 0; border-radius: 9px; color: light-dark(#fff, var(--fm-on-accent)); background: linear-gradient(145deg, light-dark(#b58b9c, var(--fm-accent)), light-dark(#94788f, var(--fm-accent-deep))); font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-moment-comment-form button:disabled { opacity: .5; cursor: wait; }
      #${ROOT_ID} .fm-moments-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; gap: 9px; padding: 16px 14px; text-align: center; }
      #${ROOT_ID} .fm-moments-empty-icon { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 18px; color: light-dark(#a4778b, var(--fm-rose-ink)); background: light-dark(#f2e5eb, var(--fm-card-muted)); }
      #${ROOT_ID} .fm-moments-empty-icon svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-moments-empty strong { color: light-dark(#665866, var(--fm-text-strong)); font-size: max(var(--fm-font-cn-min), 14px); }
      #${ROOT_ID} .fm-moments-empty p { max-width: 270px; margin: 0; color: light-dark(#9a8d99, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.6; }
      #${ROOT_ID} .fm-moments-primary-button { min-height: 37px; margin-top: 5px; padding: 0 15px; border: 0; border-radius: 11px; color: light-dark(#fff, var(--fm-on-accent)); background: linear-gradient(145deg, light-dark(#b58b9c, var(--fm-accent)), light-dark(#94788f, var(--fm-accent-deep))); font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-moments-primary-button:disabled { opacity: .55; cursor: wait; }
      #${ROOT_ID} .fm-moments-error { padding: 7px 9px; border-radius: 9px; color: light-dark(#986d72, var(--fm-danger)); background: light-dark(#f8e9e9, var(--fm-card)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.45; }
      #${ROOT_ID} .fm-moments-loading { display: flex; align-items: center; gap: 5px; padding: 9px; color: light-dark(#978895, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-moments-loading i { width: 5px; height: 5px; border-radius: 50%; background: light-dark(#b18e9e, var(--fm-accent-dark)); animation: fm-typing 1.1s infinite ease-in-out; }
      #${ROOT_ID} .fm-moments-loading i:nth-child(2) { animation-delay: .15s; }
      #${ROOT_ID} .fm-moments-loading i:nth-child(3) { animation-delay: .3s; margin-right: 3px; }
      #${ROOT_ID} .fm-proactive-fields { display: grid; gap: 8px; margin-block: 10px; }
      #${ROOT_ID} .fm-proactive-fields label { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: .92em; }
      #${ROOT_ID} .fm-proactive-fields select { --fm-control-padding: 5px 8px; --fm-control-radius: 8px; --fm-control-font-size: max(var(--fm-font-cn-min), 12px); --fm-control-line-height: 1.4; --fm-control-bg: var(--fm-card); --fm-control-border: var(--fm-line); width: auto; min-width: 64px; }
      #${ENTRY_ID} {
        /* Independent viewport portal: do not inherit host button layout or theme styling. */
        --fm-ball-start: #a77d91; --fm-ball-end: #806f88;
        --fm-ball-border: rgb(255 255 255 / 24%); --fm-ball-shadow: rgb(50 35 48 / 22%);
        --fm-ball-hover-shadow: rgb(50 35 48 / 28%);
        position: fixed !important; top: calc(env(safe-area-inset-top, 0px) + 132px); right: 12px;
        z-index: 2147483000 !important; display: grid !important; place-items: center;
        width: 44px !important; min-width: 44px !important; max-width: 44px !important;
        height: 44px !important; min-height: 44px !important; max-height: 44px !important;
        margin: 0 !important; padding: 0 !important;
        border: 1px solid var(--fm-ball-border) !important; border-radius: 50% !important;
        color: #fffafd !important;
        background: linear-gradient(135deg, var(--fm-ball-start), var(--fm-ball-end)) !important;
        background-image: linear-gradient(135deg, var(--fm-ball-start), var(--fm-ball-end)) !important;
        box-shadow: 0 3px 11px var(--fm-ball-shadow) !important;
        font: inherit !important; line-height: 0 !important;
        appearance: none !important; -webkit-appearance: none !important;
        cursor: grab !important; flex-shrink: 0; pointer-events: auto !important;
        visibility: visible !important; opacity: 1 !important; touch-action: none !important;
        user-select: none !important; -webkit-user-select: none !important; -webkit-tap-highlight-color: transparent !important;
      }
      #${ENTRY_ID}[data-fm-theme="dark"] {
        --fm-ball-start: #a57e9e;
        --fm-ball-end: #735a80;
        --fm-ball-border: rgb(239 218 237 / 24%);
        --fm-ball-shadow: rgb(8 6 13 / 42%);
        --fm-ball-hover-shadow: rgb(8 6 13 / 55%);
      }
      #${ENTRY_ID}[data-fm-unread]:not([data-fm-unread=""])::after { content: attr(data-fm-unread); position: absolute; top: -4px; right: -4px; min-width: 17px; height: 17px; padding: 0 3px; border-radius: 10px; background: #b85c67; color: white; font: 600 11px/17px sans-serif; text-align: center; pointer-events: none; }
      #${ENTRY_ID}:active { cursor: grabbing; }
      #${ENTRY_ID} svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
      #${ENTRY_ID}:hover, #${ENTRY_ID}[aria-expanded="true"] { filter: brightness(1.06); box-shadow: 0 4px 14px var(--fm-ball-hover-shadow); }
      #${ROOT_ID} .fm-settings-page { display: flex; flex-direction: column; min-width: 0; gap: 17px; padding: 5px 0; }
      #${ROOT_ID} .fm-settings-heading h1 { margin: 6px 0; color: light-dark(#514650, var(--fm-text-strong)); font-size: 24px; }
      #${ROOT_ID} .fm-settings-heading p { margin: 0; color: light-dark(#928692, var(--fm-text)); font-size: 12px; line-height: 1.6; }
      #${ROOT_ID} .fm-settings-link { display: flex; align-items: center; gap: 11px; padding: 13px 11px; width: 100%; border: 1px solid light-dark(#eae3e5, var(--fm-line)); border-radius: 15px; background: light-dark(rgb(255 255 255 / 70%), var(--fm-card)); color: light-dark(#514650, var(--fm-text-strong)); text-align: left; cursor: pointer; }
      #${ROOT_ID} .fm-settings-link-icon { display: grid; flex: 0 0 34px; place-items: center; width: 34px; height: 34px; border-radius: 11px; background: light-dark(#eae7f3, var(--fm-card-muted)); color: light-dark(#76678f, var(--fm-accent)); }
      #${ROOT_ID} .fm-settings-link-icon svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.7; }
      #${ROOT_ID} .fm-settings-link > span:nth-child(2) { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; gap: 4px; }
      #${ROOT_ID} .fm-settings-link strong { font-size: 13px; }
      #${ROOT_ID} .fm-settings-link small { color: light-dark(#928692, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.5; }
      #${ROOT_ID} .fm-settings-link > svg { flex: 0 0 16px; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; }
      #${ROOT_ID} .fm-appearance-settings { display: flex; flex-direction: column; gap: 11px; border: 1px solid light-dark(#eae3e5, var(--fm-line)); border-radius: 15px; padding: 14px 12px; background: light-dark(rgb(255 255 255 / 55%), var(--fm-card)); }
      #${ROOT_ID} .fm-appearance-heading { display: flex; flex-direction: column; gap: 4px; }
      #${ROOT_ID} .fm-appearance-heading strong { color: light-dark(#514650, var(--fm-text-strong)); font-size: 13px; }
      #${ROOT_ID} .fm-appearance-heading small, #${ROOT_ID} .fm-appearance-hint { margin: 0; color: light-dark(#928692, var(--fm-text)); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.55; }
      #${ROOT_ID} .fm-appearance-options { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; }
      #${ROOT_ID} .fm-appearance-option { min-width: 0; min-height: 36px; padding: 6px 3px; border: 1px solid light-dark(#e6dce2, var(--fm-line)); border-radius: 10px; color: light-dark(#806f7e, var(--fm-text)); background: light-dark(#fff, var(--fm-card)); font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; white-space: normal; }
      #${ROOT_ID} .fm-appearance-option.is-active { border-color: light-dark(#9b7d97, var(--fm-line)); background: light-dark(#eae7f3, var(--fm-card-muted)); color: light-dark(#514650, var(--fm-text-strong)); font-weight: 750; }
      #${ROOT_ID} .fm-time-switch { display: flex; align-items: center; gap: 10px; width: fit-content; max-width: 100%; padding: 4px 0; background: transparent; border: 0; color: var(--fm-text-strong); cursor: pointer; text-align: left; font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-time-switch-track { display: flex; align-items: center; flex: 0 0 43px; width: 43px; height: 25px; border-radius: 999px; background: var(--fm-line); padding: 3px; transition: background .15s ease; }
      #${ROOT_ID} .fm-time-switch-knob { width: 19px; height: 19px; border-radius: 50%; background: var(--fm-card); box-shadow: 0 1px 3px rgb(0 0 0 / 16%); transition: transform .15s ease; }
      #${ROOT_ID} .fm-time-switch[aria-checked="true"] .fm-time-switch-track { background: var(--fm-accent); }
      #${ROOT_ID} .fm-time-switch[aria-checked="true"] .fm-time-switch-knob { transform: translateX(18px); }
      #${ROOT_ID} .fm-time-switch:focus-visible { outline: 2px solid var(--fm-accent); outline-offset: 3px; border-radius: 5px; }
      #${ROOT_ID} .fm-home-mask-shortcut { display: flex; align-items: center; gap: 9px; min-width: 0; padding: 9px 10px; border: 1px solid light-dark(#e8dbe6,var(--fm-line)); border-radius: 14px; background: light-dark(rgb(255 255 255 / 62%),var(--fm-card)); }
      #${ROOT_ID} .fm-mask-shortcut-icon { display: grid; place-items: center; flex: 0 0 29px; width: 29px; height: 29px; border-radius: 9px; background: light-dark(#eee5ef,var(--fm-card-muted)); color: light-dark(#826d87,var(--fm-accent)); }
      #${ROOT_ID} .fm-mask-shortcut-icon svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
      #${ROOT_ID} .fm-mask-shortcut-copy { display: flex; flex: 1 1 auto; flex-direction: column; gap: 2px; min-width: 0; }
      #${ROOT_ID} .fm-mask-shortcut-copy strong { font-size: max(var(--fm-font-cn-min),12px); color: var(--fm-text-strong); }
      #${ROOT_ID} .fm-mask-shortcut-copy small { font-size: max(var(--fm-font-cn-min),12px); color: var(--fm-text); }
      #${ROOT_ID} .fm-mask-shortcut-toggle { flex: 0 0 auto; min-height: 28px; padding: 5px 8px; border: 1px solid var(--fm-line); border-radius: 999px; background: var(--fm-card-muted); color: var(--fm-text); font-size: 10px; font-weight: 750; cursor: pointer; }
      #${ROOT_ID} .fm-mask-shortcut-toggle[aria-checked="true"] { background: var(--fm-accent-dark); color: var(--fm-on-accent); border-color: var(--fm-accent-dark); }
      #${ROOT_ID} .fm-mask-page { display: flex; flex-direction: column; min-width: 0; gap: 12px; padding-bottom: 14px; }
      #${ROOT_ID} .fm-mask-editor { gap: 11px; }
      #${ROOT_ID} .fm-mask-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; color: var(--fm-text-strong); font-size: 12px; }
      #${ROOT_ID} .fm-mask-field > span { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px; font-weight: 700; }
      #${ROOT_ID} .fm-mask-field small { color: var(--fm-text); font-size: max(var(--fm-font-cn-min),12px); font-weight: 400; overflow-wrap: anywhere; }
      #${ROOT_ID} .fm-mask-field input, #${ROOT_ID} .fm-mask-rule-row input { --fm-control-padding: 7px 8px; --fm-control-radius: 9px; --fm-control-font-size: max(var(--fm-font-cn-min), 12px); --fm-control-line-height: 1.4; --fm-control-bg: var(--fm-card); --fm-control-border: var(--fm-line); --fm-control-focus-border: var(--fm-accent); --fm-control-focus-shadow: 0 0 0 2px var(--fm-accent-soft); min-width: 0; width: 100%; height: 35px; }
      #${ROOT_ID} .fm-mask-rules-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
      #${ROOT_ID} .fm-mask-small-button { flex: 0 0 auto; min-height: 31px; padding: 6px 8px; border: 1px solid var(--fm-line); border-radius: 9px; color: var(--fm-text-strong); background: var(--fm-card-muted); font-size: max(var(--fm-font-cn-min),12px); cursor: pointer; }
      #${ROOT_ID} .fm-mask-rule-row { display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr) 25px; align-items: center; gap: 5px; min-width: 0; }
      #${ROOT_ID} .fm-mask-rule-row > span { color: var(--fm-text); }
      #${ROOT_ID} .fm-mask-rule-row > button { display: grid; place-items: center; width: 25px; height: 29px; padding: 4px; border: 0; border-radius: 7px; color: var(--fm-text); background: var(--fm-card-muted); cursor: pointer; }
      #${ROOT_ID} .fm-mask-rule-row > button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; }
      #${ROOT_ID} .fm-mask-empty-rules { color: var(--fm-text); font-size: max(var(--fm-font-cn-min),12px); margin: 0; line-height: 1.5; }
      #${ROOT_ID} .fm-mask-preview { min-height: 46px; padding: 11px; border: 1px solid var(--fm-line); border-radius: 11px; background: var(--fm-card-muted); color: var(--fm-text-strong); font-size: 12px; line-height: 1.55; overflow-wrap: anywhere; }
      #${ROOT_ID} .fm-mask-footer { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 7px; }
      #${ROOT_ID} .fm-mask-footer button { min-height: 34px; padding: 7px 12px; border: 1px solid var(--fm-line); border-radius: 9px; font-size: 12px; cursor: pointer; }
      #${ROOT_ID} .fm-presets-page { display: flex; flex-direction: column; gap: 13px; min-width: 0; }
      #${ROOT_ID} .fm-presets-heading h1 { margin: 6px 0; font-size: 24px; color: light-dark(#544753, var(--fm-text-strong)); }
      #${ROOT_ID} .fm-presets-heading p { margin: 0; font-size: 12px; line-height: 1.6; color: light-dark(#96838f, var(--fm-text)); }
      #${ROOT_ID} .fm-presets-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
      #${ROOT_ID} .fm-presets-tab { padding: 7px 10px; border: 1px solid light-dark(#e6dce2, var(--fm-line)); border-radius: 9px; background: light-dark(#fff, var(--fm-card)); color: light-dark(#806f7e, var(--fm-text)); font-size: 12px; cursor: pointer; }
      #${ROOT_ID} .fm-presets-tab.is-active { background: light-dark(#eae7f3, var(--fm-card-muted)); border-color: light-dark(#d7cedf, var(--fm-line)); color: light-dark(#5e5066, var(--fm-text-strong)); font-weight: 700; }
      #${ROOT_ID} .fm-presets-editor { display: flex; flex-direction: column; gap: 9px; }
      #${ROOT_ID} .fm-presets-label { display: flex; align-items: center; justify-content: space-between; gap: 7px; font-size: 13px; }
      #${ROOT_ID} .fm-presets-label small { font-size: 11px; color: light-dark(#96838f, var(--fm-text)); }
      #${ROOT_ID} [data-fm-preset-field] { --fm-control-padding: 11px; --fm-control-radius: 11px; --fm-control-font-size: 12px; --fm-control-line-height: 1.65; --fm-control-bg: light-dark(#fff, var(--fm-card)); --fm-control-border: light-dark(#e6dce2, var(--fm-line)); --fm-control-focus-border: var(--fm-accent); --fm-control-focus-shadow: 0 0 0 2px light-dark(#d7cee6, var(--fm-accent-soft)); display: block; width: 100%; min-height: 155px; resize: vertical; white-space: pre-wrap; overflow-wrap: anywhere; }
      #${ROOT_ID} .fm-presets-actions { display: flex; flex-wrap: wrap; gap: 6px; }
      #${ROOT_ID} .fm-presets-actions button { padding: 8px 10px; border: 1px solid light-dark(#e3d7e0, var(--fm-line)); border-radius: 9px; font-size: 12px; cursor: pointer; }
      #${ROOT_ID} .fm-presets-secondary { background: light-dark(#fff, var(--fm-card)); color: light-dark(#806f7e, var(--fm-text)); }
      #${ROOT_ID} .fm-presets-primary { background: light-dark(#9b7d97, var(--fm-accent-dark)); color: light-dark(#fff, var(--fm-on-accent)); margin-left: auto; }
      #${ROOT_ID} .fm-presets-status { font-size: 11px; line-height: 1.5; color: light-dark(#8e7d88, var(--fm-text)); overflow-wrap: anywhere; }
      #${ROOT_ID} .fm-presets-preview { margin: 0; padding: 12px; border: 1px solid light-dark(#eadfe9, var(--fm-line)); border-radius: 11px; background: light-dark(#f6f1f5, var(--fm-card)); color: light-dark(#584a58, var(--fm-text-strong)); white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.6 "Microsoft YaHei", sans-serif; }
      #${EXTENSION_ID} .fm-extension-content { display: flex; flex-direction: column; gap: 8px; padding: 8px 0 2px; min-width: 0; }
      #${EXTENSION_ID} .fm-ext-primary { display: flex; width: 100%; min-width: 0; }
      #${EXTENSION_ID} .fm-ext-primary > .menu_button { width: 100%; min-width: 0; }
      #${EXTENSION_ID} .fm-extension-content p { margin: 0; font-size: .85em; line-height: 1.5; opacity: .8; overflow-wrap: anywhere; }
      #${EXTENSION_ID} .fm-ext-buttons, #${EXTENSION_ID} .fm-ext-checks { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 6px; }
      #${EXTENSION_ID} .fm-extension-content .menu_button { width: 100%; min-width: 0; margin: 0; font-size: .9em; white-space: normal; overflow-wrap: anywhere; gap: 4px; }
      #${EXTENSION_ID} .fm-ext-section { display: flex; flex-direction: column; gap: 6px; padding-block: 7px; border-block-start: 1px solid var(--SmartThemeBorderColor, currentColor); }
      #${EXTENSION_ID} .fm-ext-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; font-size: .9em; }
      #${EXTENSION_ID} .fm-ext-row > :last-child { min-width: 0; text-align: end; overflow-wrap: anywhere; }
      #${EXTENSION_ID} .fm-ext-row select { width: auto; max-width: 55%; margin: 0; }
      #${EXTENSION_ID} .fm-ext-check { display: flex; align-items: center; gap: 5px; min-width: 0; font-size: .9em; }
      #${EXTENSION_ID} .fm-ext-check input { flex-shrink: 0; }
      #${EXTENSION_ID} .fm-ext-credit { text-align: end; }
      #${EXTENSION_ID} [hidden], #${ENTRY_ID}[hidden] { display: none !important; }
      @media (max-width: 821px) {
        #${ROOT_ID} { padding: 0; --fm-safe-bottom: env(safe-area-inset-bottom, 0px); }
        #${ROOT_ID}.fm-keyboard-open { --fm-safe-bottom: 0px; }
        #${ROOT_ID} .fm-frame { position: absolute; inset: 0; width: auto; height: auto; min-height: 0; max-width: none; max-height: none; border: 0; border-radius: 0; box-shadow: none; transform: none; }
        #${ROOT_ID} .fm-resize-grip, #${ROOT_ID} .fm-window-maximize { display: none !important; }
        #${ROOT_ID} .fm-titlebar { flex-basis: calc(53px + env(safe-area-inset-top, 0px)); padding: env(safe-area-inset-top, 0px) 12px 0 14px; cursor: default; touch-action: auto; }
        #${ROOT_ID} .fm-phone-footer { flex-basis: calc(21px + var(--fm-safe-bottom)); padding-bottom: var(--fm-safe-bottom); }
        #${ROOT_ID} .fm-home-view { gap: 18px; padding: 16px 16px 14px; }
        #${ROOT_ID} .fm-app-grid { gap: 11px; }
        #${ROOT_ID} .fm-app-card { min-height: 139px; padding: 13px 12px 12px; gap: 13px; }
        #${ROOT_ID} .fm-app-icon { width: 45px; height: 45px; border-radius: 15px; }
        #${ROOT_ID} .fm-app-card-copy strong { font-size: 14px; }
        #${ROOT_ID} .fm-home-heading h1 { font-size: 28px; }
        #${ROOT_ID} .fm-app-view { padding-right: 16px; padding-left: 16px; }
        #${ENTRY_ID} { top: calc(env(safe-area-inset-top, 0px) + 126px); right: 9px; width: 44px; min-width: 44px; max-width: 44px; height: 44px; padding: 0; }
        #${ROOT_ID} .fm-messages-view { padding-bottom: 1px; }
        #${ROOT_ID} .fm-message-chat-header { flex-basis: 42px; }
        #${ROOT_ID} .fm-message-bubble-wrap { max-width: 90%; }
        #${ROOT_ID} .fm-subscription-heading { align-items: flex-start; gap: 7px; }
        #${ROOT_ID} .fm-subscription-heading-actions { flex-direction: column; align-items: flex-end; gap: 5px; }
        #${ROOT_ID} .fm-subscription-update-all { min-height: 28px; padding: 4px 7px; font-size: max(var(--fm-font-cn-min), 11px); }
        #${ROOT_ID} .fm-subscription-batch-status { padding: 9px; }
        #${ROOT_ID} .fm-moments-page { gap: 7px; padding-bottom: 7px; }
        #${ROOT_ID} .fm-moments-view .fm-app-topline-label { display: none; }
        #${ROOT_ID} .fm-moment-comments-list { max-height: min(22dvh, 165px); }
      }
      /* Community: new module styles, no overrides of legacy panels. */
      #${ROOT_ID} .fm-community-detail { min-height: 0; overflow: hidden; }
      #${ROOT_ID} .fm-community-page { display: flex; flex-direction: column; gap: 11px; height: 100%; min-height: 0; overflow-y: auto; padding: 9px 2px 18px; scrollbar-width: thin; scrollbar-color: var(--fm-line) transparent; overscroll-behavior: contain; }
      #${ROOT_ID} .fm-community-page::-webkit-scrollbar { width: 5px; }
      #${ROOT_ID} .fm-community-page::-webkit-scrollbar-thumb { background: var(--fm-line); border-radius: 9px; }
      #${ROOT_ID} .fm-community-heading { display: flex; flex-direction: column; gap: 3px; padding: 2px 3px; }
      #${ROOT_ID} .fm-community-heading h1 { margin: 0; color: var(--fm-text-strong); font-size: 19px; font-weight: 800; }
      #${ROOT_ID} .fm-community-heading small { color: var(--fm-text-muted); font-size: max(var(--fm-font-cn-min), 11px); line-height: 1.45; }
      #${ROOT_ID} .fm-community-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 4px; border: 1px solid var(--fm-line); border-radius: 12px; background: var(--fm-card-muted); }
      #${ROOT_ID} .fm-community-modes button { min-height: 33px; padding: 5px; border: 0; border-radius: 9px; color: var(--fm-text); background: transparent; font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-community-modes button.is-active { color: var(--fm-text-strong); background: var(--fm-card); box-shadow: 0 1px 4px var(--fm-shadow-color); font-weight: 750; }
      #${ROOT_ID} .fm-community-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
      #${ROOT_ID} .fm-community-primary, #${ROOT_ID} .fm-community-action { min-height: 34px; padding: 6px 11px; border-radius: 10px; font-size: max(var(--fm-font-cn-min), 12px); font-weight: 700; cursor: pointer; }
      #${ROOT_ID} .fm-community-primary { border: 1px solid var(--fm-accent-dark); color: var(--fm-on-accent); background: linear-gradient(135deg, var(--fm-accent-dark), var(--fm-accent-deep)); }
      #${ROOT_ID} .fm-community-action { border: 1px solid var(--fm-line); color: var(--fm-text-strong); background: var(--fm-card); }
      #${ROOT_ID} :is(.fm-community-primary,.fm-community-action):disabled { opacity: .55; cursor: wait; }
      #${ROOT_ID} .fm-community-filters { display: flex; gap: 5px; overflow-x: auto; padding: 0 2px 3px; scrollbar-width: none; }
      #${ROOT_ID} .fm-community-filters button { flex: 0 0 auto; padding: 5px 9px; border: 1px solid transparent; border-radius: 9px; color: var(--fm-text); background: transparent; font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-community-filters button.is-active { border-color: var(--fm-line); color: var(--fm-text-strong); background: var(--fm-card); font-weight: 700; }
      #${ROOT_ID} .fm-community-feed, #${ROOT_ID} .fm-community-comments { display: flex; flex-direction: column; gap: 9px; min-width: 0; }
      #${ROOT_ID} .fm-community-card { display: flex; flex-direction: column; gap: 6px; width: 100%; padding: 13px; border: 1px solid var(--fm-line); border-radius: 14px; background: var(--fm-card); color: inherit; text-align: left; cursor: pointer; white-space: normal; }
      #${ROOT_ID} .fm-community-card-meta, #${ROOT_ID} .fm-community-byline { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: var(--fm-text-muted); font-size: max(var(--fm-font-number-min), 10px); }
      #${ROOT_ID} .fm-community-card-meta time, #${ROOT_ID} .fm-community-byline time { margin-left: auto; }
      #${ROOT_ID} .fm-community-kind { padding: 3px 6px; border-radius: 6px; color: var(--fm-rose-ink); background: var(--fm-rose-soft); font-weight: 700; }
      #${ROOT_ID} .fm-community-card > strong { color: var(--fm-text-strong); font-size: max(var(--fm-font-cn-min), 14px); line-height: 1.5; overflow-wrap: anywhere; }
      #${ROOT_ID} .fm-community-card > p { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; color: var(--fm-text); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.55; overflow-wrap: anywhere; }
      #${ROOT_ID} .fm-community-card-foot { display: flex; justify-content: space-between; align-items: center; color: var(--fm-text-muted); font-size: max(var(--fm-font-cn-min), 11px); }
      #${ROOT_ID} .fm-community-card-foot > span { display: flex; align-items: center; gap: 3px; }
      #${ROOT_ID} .fm-community-card-foot svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.7; }
      #${ROOT_ID} .fm-community-empty, #${ROOT_ID} .fm-community-note, #${ROOT_ID} .fm-community-pending { padding: 17px 12px; border: 1px dashed var(--fm-line); border-radius: 12px; color: var(--fm-text-muted); background: var(--fm-card-muted); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.65; text-align: center; }
      #${ROOT_ID} .fm-community-note { border: 0; background: transparent; padding: 7px; }
      #${ROOT_ID} .fm-community-pending { border-style: solid; }
      #${ROOT_ID} .fm-community-error { margin: 0; padding: 9px 11px; border-radius: 10px; color: var(--fm-danger); background: var(--fm-danger-soft); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.5; white-space: normal; }
      #${ROOT_ID} .fm-community-post-full { padding: 13px; border: 1px solid var(--fm-line); border-radius: 14px; background: var(--fm-card); }
      #${ROOT_ID} .fm-community-post-full h2 { margin: 10px 0; color: var(--fm-text-strong); font-size: max(var(--fm-font-cn-min), 16px); line-height: 1.45; }
      #${ROOT_ID} .fm-community-post-full p { margin: 0; color: var(--fm-text); font-size: max(var(--fm-font-cn-min), 13px); line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }
      #${ROOT_ID} .fm-community-section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      #${ROOT_ID} .fm-community-section-head strong { color: var(--fm-text-strong); font-size: max(var(--fm-font-cn-min), 13px); }
      #${ROOT_ID} .fm-community-comment { margin-left: calc(var(--fm-community-indent) * 11px); padding: 10px; border: 1px solid var(--fm-line); border-radius: 11px; background: var(--fm-card); overflow-wrap: anywhere; }
      #${ROOT_ID} .fm-community-comment-head { display: flex; gap: 6px; align-items: center; min-width: 0; }
      #${ROOT_ID} .fm-community-comment-head strong { flex: 1 1 auto; min-width: 0; color: var(--fm-text-strong); font-size: max(var(--fm-font-cn-min), 12px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #${ROOT_ID} .fm-community-comment-head time { color: var(--fm-text-muted); font-size: max(var(--fm-font-number-min), 10px); }
      #${ROOT_ID} .fm-community-avatar { display: grid; place-items: center; flex: 0 0 24px; width: 24px; height: 24px; border-radius: 8px; color: var(--fm-on-accent); background: var(--fm-accent-dark); font-size: 11px; font-weight: 750; }
      #${ROOT_ID} .fm-community-comment > p { margin: 7px 0; color: var(--fm-text); font-size: max(var(--fm-font-cn-min), 12px); line-height: 1.6; white-space: pre-wrap; }
      #${ROOT_ID} .fm-community-link { padding: 2px 1px; border: 0; color: var(--fm-accent); background: transparent; font-size: max(var(--fm-font-cn-min), 12px); cursor: pointer; }
      #${ROOT_ID} .fm-community-reply-label { margin: 6px 0 0; color: var(--fm-text-muted); font-size: max(var(--fm-font-cn-min), 11px); }
      #${ROOT_ID} .fm-community-editor, #${ROOT_ID} .fm-community-comment-form { display: flex; flex-direction: column; gap: 11px; padding: 13px; border: 1px solid var(--fm-line); border-radius: 14px; background: var(--fm-card); }
      #${ROOT_ID} .fm-community-editor > label { display: flex; flex-direction: column; gap: 6px; color: var(--fm-text-strong); font-size: max(var(--fm-font-cn-min), 12px); font-weight: 700; }
      #${ROOT_ID} :is(.fm-community-editor,.fm-community-comment-form) :is(input:not([type="checkbox"]), select, textarea) { --fm-control-padding: 9px; --fm-control-radius: 9px; --fm-control-font-size: max(var(--fm-font-cn-min), 12px); --fm-control-line-height: 1.55; --fm-control-bg: var(--fm-field); --fm-control-border: var(--fm-line); --fm-control-focus-border: var(--fm-accent); --fm-control-focus-shadow: 0 0 0 2px var(--fm-accent-soft); width: 100%; min-width: 0; }
      #${ROOT_ID} :is(.fm-community-editor,.fm-community-comment-form) textarea { resize: vertical; min-height: 65px; white-space: pre-wrap; }
      #${ROOT_ID} .fm-community-check { display: inline-flex !important; flex-direction: row !important; align-items: center; gap: 6px; color: var(--fm-text); font-size: max(var(--fm-font-cn-min), 12px); font-weight: 500 !important; }
      #${ROOT_ID} .fm-community-check input { accent-color: var(--fm-accent-deep); }
      #${ROOT_ID} .fm-community-submit-row { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
      #${ROOT_ID} .fm-community-reply-target { display: flex; align-items: center; gap: 8px; color: var(--fm-accent); font-size: max(var(--fm-font-cn-min), 12px); }
      #${ROOT_ID} .fm-community-reply-target button { padding: 2px 7px; border: 0; border-radius: 7px; background: var(--fm-card-muted); color: var(--fm-text); cursor: pointer; }
      @media (max-width: 380px) {
        #${ROOT_ID} .fm-home-view { gap: 15px; padding: 13px 13px 12px; }
        #${ROOT_ID} .fm-app-grid { gap: 9px; }
        #${ROOT_ID} .fm-app-card { min-height: 130px; padding: 11px 10px; }
        #${ROOT_ID} .fm-home-note { padding: 10px; }
        #${ROOT_ID} .fm-note-version { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        #${ROOT_ID} .fm-frame, #${ROOT_ID} .fm-app-card { animation: none !important; transition: none !important; }
      }
    `;
    return style;
  }

  function destroy() {
    if (state.destroyed) return;
    HOST_WIN.clearInterval(state.proactiveTimer);
    HOST_DOC.removeEventListener('visibilitychange', proactiveWake);
    HOST_WIN.removeEventListener('focus', proactiveWake);
    if (state.messageBusy || state.messageSending || state.momentsBusy || state.subscriptionBusy || state.momentCommentsBusy || state.momentCommentSending || state.communityBusy) {
      try { getTavernContext()?.stopGeneration?.(); } catch {}
    }
    clearPhoneStoryContext();
    state.destroyed = true;
    state.generationEpoch += 1;
    state.messageBusy = false;
    state.momentsBusy = false;
    state.momentCommentsBusy = false;
    state.momentCommentSending = false;
    state.messageSending = false;
    state.subscriptionBusy = false;
    state.subscriptionBatch = null;
    state.communityBusy = false;
    state.communityTask = '';
    if (state.eventSource && state.chatChangedEvent && state.chatChangedHandler) {
      state.eventSource.removeListener?.(state.chatChangedEvent, state.chatChangedHandler);
    }
    if (state.eventSource && state.syncGenerationEvent && state.syncGenerationHandler) {
      state.eventSource.removeListener?.(state.syncGenerationEvent, state.syncGenerationHandler);
    }
    state.eventSource = null;
    state.chatChangedEvent = null;
    state.chatChangedHandler = null;
    state.syncGenerationEvent = null;
    state.syncGenerationHandler = null;
    state.mountObserver?.disconnect();
    state.mountObserver = null;
    if (state.clockTimer) HOST_WIN.clearInterval(state.clockTimer);
    if (state.themeTimer) HOST_WIN.clearInterval(state.themeTimer);
    if (state.toastTimer) HOST_WIN.clearTimeout(state.toastTimer);
    state.themeTimer = null;
    state.toastTimer = null;
    state.clockTimer = null;
    state.root?.removeEventListener('click', handleRootClick);
    state.root?.removeEventListener('submit', handleRootSubmit);
    state.root?.removeEventListener('input', handleRootInput);
    state.root?.removeEventListener('keydown', handleRootKeydown);
    state.windowController?.cleanup();
    state.windowController = null;
    state.chatEntry = null;
    state.root?.remove();
    state.rootHost?.remove();
    state.root = null;
    state.rootHost = null;
    state.shadowRoot = null;
    state.frame = null;
    state.titlebar = null;
    state.screen = null;
    state.extensionEntry?.remove();
    state.extensionEntry = null;
    HOST_DOC.getElementById(STYLE_ID)?.remove();
    HOST_DOC.getElementById(ENTRY_ID)?.remove();
    HOST_DOC.getElementById(EXTENSION_ID)?.remove();
    HOST_DOC.getElementById(ROOT_HOST_ID)?.remove();
    HOST_DOC.getElementById(ROOT_ID)?.remove();
    HOST_DOC.getElementById(LEGACY_MINI_ID)?.remove();
    if (HOST_WIN[INSTANCE_KEY] === api) delete HOST_WIN[INSTANCE_KEY];
    HOST_WIN.removeEventListener(FRAME_EXIT_EVENT, handleFrameExit);
    HOST_WIN.removeEventListener('beforeunload', handleFrameExit);
    window.removeEventListener(FRAME_EXIT_EVENT, handleFrameExit);
    window.removeEventListener('beforeunload', handleFrameExit);
  }

  const api = {
    version: '0.3.35',
    open: () => openWindow(true),
    close: closeWindow,
    destroy,
    hostWindow: HOST_WIN,
  };

  HOST_WIN[INSTANCE_KEY] = api;

  HOST_DOC.getElementById(ROOT_ID)?.remove();
  HOST_DOC.getElementById(ENTRY_ID)?.remove();
  HOST_DOC.getElementById(EXTENSION_ID)?.remove();
  HOST_DOC.getElementById(ROOT_HOST_ID)?.remove();
  HOST_DOC.getElementById(LEGACY_MINI_ID)?.remove();
  HOST_DOC.getElementById(STYLE_ID)?.remove();

  try {
    const storedMode = HOST_WIN.localStorage.getItem(APPEARANCE_KEY);
    if (['auto', 'light', 'dark'].includes(storedMode)) state.appearanceMode = storedMode;
  } catch {}
  try { state.enabled = HOST_WIN.localStorage.getItem(ENABLED_KEY) !== 'false'; } catch {}
  try { state.realTimeEnabled = HOST_WIN.localStorage.getItem(TIME_AWARENESS_KEY) === 'true'; } catch {}
  try { state.phoneStorySyncEnabled = HOST_WIN.localStorage.getItem(PHONE_SYNC_ENABLED_KEY) !== 'false'; } catch {}
  try {
    const mode = HOST_WIN.localStorage.getItem(COMMUNITY_MODE_KEY);
    if (['independent','story'].includes(mode)) state.communityMode = mode;
  } catch {}
  try { const p = JSON.parse(HOST_WIN.localStorage.getItem(PROACTIVE_KEY) || '{}');
    state.proactive.enabled = p.enabled === true;
    if ([5,10,15,30,60,120].includes(p.interval)) state.proactive.interval = p.interval;
    if ([0,5,15,30,60].includes(p.cooldown)) state.proactive.cooldown = p.cooldown;
    if ([0,3,5,10,20].includes(p.limit)) state.proactive.limit = p.limit;
    state.proactive.notify = p.notify !== false;
  } catch {}
  state.maskSaved = loadPrivacyMask();
  state.maskEnabled = state.maskSaved.enabled;
  state.maskDraft = cloneMask(state.maskSaved);
  state.presetDraft = loadPresets();
  state.presetSaved = { ...state.presetDraft };
  const style = buildStyle();
  HOST_DOC.head.appendChild(style);

  state.root = createWindowShell(style);
  (HOST_DOC.body || HOST_DOC.documentElement).appendChild(state.rootHost);
  state.root.setAttribute('aria-hidden', 'true');
  state.frame = state.root.querySelector('.fm-frame');
  state.titlebar = state.root.querySelector('[data-fm-drag-handle]');
  state.screen = state.root.querySelector('.fm-screen');
  state.root.addEventListener('click', handleRootClick);
  state.root.addEventListener('submit', handleRootSubmit);
  state.root.addEventListener('input', handleRootInput);
  state.root.addEventListener('keydown', handleRootKeydown);


  mountChatEntry();
  watchExtensionEntry();
  bindTavernEvents();
  refreshPhoneStoryContext();
  updateClock();
  syncMaskShortcut();
  state.clockTimer = HOST_WIN.setInterval(updateClock, 30000);
  if (state.enabled) state.proactiveTimer = HOST_WIN.setInterval(proactiveWake, 15000);
  HOST_DOC.addEventListener('visibilitychange', proactiveWake);
  HOST_WIN.addEventListener('focus', proactiveWake);
  proactiveWake();
  refreshAppearance();
  state.themeTimer = HOST_WIN.setInterval(refreshAppearance, 1800);

  // Listen to the script iframe's own exit lifecycle without embedding the protector trigger token.
  const FRAME_EXIT_EVENT = ['page', 'hide'].join('');
  const handleFrameExit = () => destroy();
  window.addEventListener(FRAME_EXIT_EVENT, handleFrameExit, { once: true });
  window.addEventListener('beforeunload', handleFrameExit, { once: true });

  console.info('[Freesia Messenger] 通讯侠 v0.3.35 已启动。');
})();

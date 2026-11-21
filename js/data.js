(function () {
  const BG = window.BG = window.BG || {};

  const GENRES = [
    { id: 'classic', name: '经典摇滚', en: 'Classic Rock', color: '#c4763e', color2: '#3a2414', pop: 1.02 },
    { id: 'hard', name: '硬摇滚', en: 'Hard Rock', color: '#b03a34', color2: '#2b1414', pop: 1.06 },
    { id: 'metal', name: '重金属', en: 'Heavy Metal', color: '#7d8494', color2: '#1c1e24', pop: 1.0 },
    { id: 'punk', name: '朋克', en: 'Punk', color: '#dd5060', color2: '#2c1218', pop: 0.92 },
    { id: 'postpunk', name: '后朋克', en: 'Post-Punk', color: '#5d6d90', color2: '#151a26', pop: 0.86 },
    { id: 'grunge', name: '垃圾摇滚', en: 'Grunge', color: '#857055', color2: '#241d16', pop: 0.9 },
    { id: 'alt', name: '另类摇滚', en: 'Alternative Rock', color: '#9460a2', color2: '#211626', pop: 0.97 },
    { id: 'indie', name: '独立摇滚', en: 'Indie Rock', color: '#4f9e92', color2: '#12241f', pop: 1.0 },
    { id: 'psychedelic', name: '迷幻摇滚', en: 'Psychedelic Rock', color: '#a95ec4', color2: '#241227', pop: 0.84 },
    { id: 'prog', name: '前卫摇滚', en: 'Progressive Rock', color: '#4f74ac', color2: '#131b2a', pop: 0.8 },
    { id: 'space', name: '太空摇滚', en: 'Space Rock', color: '#4b62a4', color2: '#12172b', pop: 0.7 },
    { id: 'folkrock', name: '民谣摇滚', en: 'Folk Rock', color: '#ab8c50', color2: '#282012', pop: 0.9 },
    { id: 'blues', name: '布鲁斯摇滚', en: 'Blues Rock', color: '#815d3e', color2: '#261a10', pop: 0.87 },
    { id: 'garage', name: '车库摇滚', en: 'Garage Rock', color: '#a85640', color2: '#2a130e', pop: 0.8 },
    { id: 'math', name: '数学摇滚', en: 'Math Rock', color: '#4f939e', color2: '#10242a', pop: 0.68 },
    { id: 'postrock', name: '后摇', en: 'Post-Rock', color: '#6b7f90', color2: '#161d23', pop: 0.78 },
    { id: 'noise', name: '噪音摇滚', en: 'Noise Rock', color: '#8c4050', color2: '#221016', pop: 0.64 },
    { id: 'gothic', name: '哥特摇滚', en: 'Gothic Rock', color: '#5c4c72', color2: '#19131f', pop: 0.7 },
    { id: 'industrial', name: '工业摇滚', en: 'Industrial Rock', color: '#5b6268', color2: '#191b1d', pop: 0.76 },
    { id: 'electro', name: '电子摇滚', en: 'Electronic Rock', color: '#3f829e', color2: '#0f2029', pop: 0.88 },
    { id: 'poppunk', name: '流行朋克', en: 'Pop Punk', color: '#e07b4f', color2: '#2c1a10', pop: 0.96 },
    { id: 'emo', name: '情绪硬核', en: 'Emo', color: '#a55c80', color2: '#27141d', pop: 0.82 },
    { id: 'hardcore', name: '硬核朋克', en: 'Hardcore Punk', color: '#b03c3c', color2: '#2b1010', pop: 0.66 },
    { id: 'thrash', name: '鞭挞金属', en: 'Thrash Metal', color: '#a13e30', color2: '#29120d', pop: 0.74 },
    { id: 'death', name: '死亡金属', en: 'Death Metal', color: '#703030', color2: '#1f0d0d', pop: 0.58 },
    { id: 'blackmetal', name: '黑金属', en: 'Black Metal', color: '#44444f', color2: '#101014', pop: 0.54 },
    { id: 'doom', name: '厄运金属', en: 'Doom Metal', color: '#5e4c3a', color2: '#1d1711', pop: 0.6 },
    { id: 'power', name: '力量金属', en: 'Power Metal', color: '#c8a241', color2: '#2a2210', pop: 0.63 },
    { id: 'symphonic', name: '交响金属', en: 'Symphonic Metal', color: '#8f72ac', color2: '#211829', pop: 0.6 },
    { id: 'numetal', name: '新金属', en: 'Nu Metal', color: '#697a8c', color2: '#161d23', pop: 0.92 },
    { id: 'stoner', name: '石人摇滚', en: 'Stoner Rock', color: '#8c6f42', color2: '#251d10', pop: 0.6 },
    { id: 'shoegaze', name: '盯鞋', en: 'Shoegaze', color: '#8192b4', color2: '#1a1f2b', pop: 0.72 },
    { id: 'altmetal', name: '另类金属', en: 'Alternative Metal', color: '#617282', color2: '#151b21', pop: 0.83 },
    { id: 'glam', name: '华丽金属', en: 'Glam Metal', color: '#c45a9a', color2: '#2a1222', pop: 0.78 },
    { id: 'proto', name: '原型朋克', en: 'Proto-Punk', color: '#a05a4a', color2: '#26150f', pop: 0.6 },
    { id: 'crossover', name: '跨界金属', en: 'Crossover', color: '#8a7a3f', color2: '#221f10', pop: 0.62 },
    { id: 'pop', name: '流行', en: 'Pop', color: '#e28fa0', color2: '#2c1820', pop: 1.14 },
    { id: 'electronic', name: '电子', en: 'Electronic', color: '#3fa0b0', color2: '#0f2529', pop: 1.04 },
    { id: 'folk', name: '民谣', en: 'Folk', color: '#9e8b5f', color2: '#252113', pop: 0.86 },
    { id: 'jazz', name: '爵士', en: 'Jazz', color: '#705a8e', color2: '#1d1626', pop: 0.7 },
    { id: 'hiphop', name: '嘻哈', en: 'Hip-Hop', color: '#6f7058', color2: '#1d1e16', pop: 1.08 },
    { id: 'rnb', name: 'R&B', en: 'R&B', color: '#916fa0', color2: '#221826', pop: 0.98 },
    { id: 'soul', name: '灵魂乐', en: 'Soul', color: '#aa7d4f', color2: '#271c10', pop: 0.8 },
    { id: 'country', name: '乡村', en: 'Country', color: '#a8904f', color2: '#262112', pop: 0.72 },
    { id: 'reggae', name: '雷鬼', en: 'Reggae', color: '#4f9e62', color2: '#122418', pop: 0.66 },
    { id: 'world', name: '世界音乐', en: 'World', color: '#6f8f70', color2: '#17231a', pop: 0.62 }
  ];

  const ROLES = [
    { id: 'vocals', name: '主唱', weight: 5, short: '唱' },
    { id: 'leadGuitar', name: '主音吉他', weight: 4, short: '主音' },
    { id: 'rhythmGuitar', name: '节奏吉他', weight: 2.4, short: '节奏' },
    { id: 'bass', name: '贝斯', weight: 3.2, short: '贝斯' },
    { id: 'drums', name: '鼓', weight: 4, short: '鼓' },
    { id: 'keys', name: '键盘/合成器', weight: 2.2, short: '键盘' },
    { id: 'producer', name: '制作人', weight: 1.6, short: '制作' }
  ];

  const THEMES = ['爱情', '失恋', '青春', '城市', '孤独', '反叛', '政治', '战争', '死亡', '希望', '旅途', '幻想', '社会批判', '自我审视', '怀旧', '信仰', '自然', '派对', '金钱', '虚无', '成长', '告别', '梦境', '革命', '失眠'];

  const STRUCTURES = ['主歌—副歌', '主歌—副歌—桥段', '两段式叙事', '长篇组曲', '即兴段落', '器乐主导', '副歌先行', '口白与演唱交替'];

  const KEYS = ['E', 'Em', 'A', 'Am', 'D', 'Dm', 'G', 'Gm', 'C', 'Cm', 'B', 'Bm', 'F', 'Fm', 'F#', 'F#m', 'Bb', 'Eb', 'Ab', 'Drop D', 'Drop C', '开放 G'];

  const LANGUAGES = ['中文', '英文', '中英混合', '方言', '纯器乐', '无意义音节'];

  const CITIES = [
    { id: 'beijing', name: '北京', scene: 1.1, cost: 1.15 },
    { id: 'shanghai', name: '上海', scene: 1.08, cost: 1.2 },
    { id: 'guangzhou', name: '广州', scene: 0.95, cost: 0.95 },
    { id: 'chengdu', name: '成都', scene: 1.0, cost: 0.82 },
    { id: 'wuhan', name: '武汉', scene: 0.9, cost: 0.8 },
    { id: 'xian', name: '西安', scene: 0.86, cost: 0.78 },
    { id: 'taipei', name: '台北', scene: 0.92, cost: 1.0 },
    { id: 'hongkong', name: '香港', scene: 0.9, cost: 1.25 },
    { id: 'tokyo', name: '东京', scene: 1.12, cost: 1.35 },
    { id: 'seoul', name: '首尔', scene: 1.05, cost: 1.1 },
    { id: 'london', name: '伦敦', scene: 1.15, cost: 1.4 },
    { id: 'manchester', name: '曼彻斯特', scene: 1.02, cost: 1.05 },
    { id: 'berlin', name: '柏林', scene: 1.0, cost: 1.05 },
    { id: 'newyork', name: '纽约', scene: 1.18, cost: 1.5 },
    { id: 'seattle', name: '西雅图', scene: 1.05, cost: 1.2 },
    { id: 'losangeles', name: '洛杉矶', scene: 1.12, cost: 1.35 }
  ];

  const VENUES = [
    { id: 'club', name: '地下俱乐部', cap: 150, rent: 600, per: 8, minFame: 0, basePrice: 50, staff: 4 },
    { id: 'livehouse', name: 'Livehouse', cap: 600, rent: 2600, per: 12, minFame: 7, basePrice: 90, staff: 10 },
    { id: 'theater', name: '剧院', cap: 1800, rent: 12000, per: 20, minFame: 22, basePrice: 180, staff: 24 },
    { id: 'festival', name: '音乐节主舞台', cap: 20000, rent: 90000, per: 42, minFame: 38, basePrice: 320, staff: 120 },
    { id: 'arena', name: '体育馆', cap: 8000, rent: 65000, per: 36, minFame: 45, basePrice: 280, staff: 90 },
    { id: 'stadium', name: '体育场', cap: 35000, rent: 280000, per: 58, minFame: 66, basePrice: 380, staff: 240 }
  ];

  const LABELS = [
    { id: 'echo', name: '回声唱片', advance: 30000, cut: 0.25, reach: 4000, promo: 1.1, minFame: 10, desc: '本地独立厂牌，尊重创作，抽成低。' },
    { id: 'north', name: '北岸音乐', advance: 120000, cut: 0.38, reach: 18000, promo: 1.25, minFame: 24, desc: '中型厂牌，有稳定的电台与发行渠道。' },
    { id: 'vertex', name: '顶点娱乐', advance: 380000, cut: 0.5, reach: 60000, promo: 1.45, minFame: 44, desc: '大厂牌，预算充足，但会干预创作方向。' },
    { id: 'colossus', name: '巨像音乐集团', advance: 900000, cut: 0.62, reach: 180000, promo: 1.7, minFame: 62, desc: '跨国巨头，能把你推向全球，代价是大部分版权收入。' }
  ];

  const FORMATS = [
    { id: 'digital', name: '数字发行', mult: 1.0, cost: 500, price: { single: 3, EP: 12, album: 28 }, margin: 0.7 },
    { id: 'cd', name: 'CD', mult: 0.42, cost: 6000, price: { single: 20, EP: 55, album: 95 }, unitCost: 12 },
    { id: 'vinyl', name: '黑胶', mult: 0.16, cost: 12000, price: { single: 50, EP: 130, album: 210 }, unitCost: 48 }
  ];

  const RELEASE_TYPES = {
    single: { name: '单曲', min: 1, max: 1, tail: 4, priceMult: 1 },
    EP: { name: 'EP', min: 2, max: 5, tail: 6, priceMult: 1 },
    album: { name: '专辑', min: 4, max: 18, tail: 8, priceMult: 1 }
  };

  const SURNAMES = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '许', '邓', '曹', '彭', '曾', '萧', '田', '董', '袁', '潘', '蔡', '蒋', '余'];
  const GIVEN_M = ['子墨', '一鸣', '远', '浩然', '嘉树', '斯年', '晨', '砚', '东野', '不器', '维', '君泽', '牧', '星野', '望', '北辰', '川', '鹤', '亦', '守拙'];
  const GIVEN_F = ['雨眠', '青禾', '知夏', '一诺', '未晞', '南枝', '听澜', '照野', '松子', '星野', '昭昭', '望舒', '迟迟', '落雁', '初雪', '阿樱', '小满', '三三', '澜', '见月'];
  const EN_M = ['Ethan', 'Noah', 'Liam', 'Miles', 'Julian', 'Owen', 'Felix', 'Dean', 'Rory', 'Kai', 'Silas', 'Ezra'];
  const EN_F = ['Iris', 'June', 'Nora', 'Maya', 'Cleo', 'Vera', 'Rosa', 'Ash', 'Sadie', 'Wren', 'Lena', 'Nova'];

  const BAND_A = ['午夜', '霓虹', '锈色', '白色', '失重', '荒野', '铁幕', '纸船', '黑洞', '南方', '北方', '电流', '沉默', '燃烧', '潮汐', '玻璃', '暴雨', '旧梦', '无线电', '琥珀', '低空', '灰烬', '冷光', '逆向', '深海', '无主', '野生', '第七', '缓慢', '过期'];
  const BAND_B = ['乐队', '乐团', '合唱团', '俱乐部', '计划', '公社', '工厂', '马车', '航线', '回声'];
  const EN_BAND_1 = ['Velvet', 'Static', 'Neon', 'Hollow', 'Rust', 'Pale', 'Wild', 'Midnight', 'Concrete', 'Silver', 'Electric', 'Broken', 'Quiet', 'Northern', 'Bitter', 'Slow'];
  const EN_BAND_2 = ['Wires', 'Saints', 'Horses', 'Ghosts', 'Machines', 'Rivers', 'Teeth', 'Hearts', 'Crowns', 'Bones', 'Lights', 'Wolves', 'Gardens', 'Waves', 'Engines'];

  const ALBUM_A = ['无声', '北方', '潮湿', '微弱', '第二', '漫长', '灰色', '燃烧', '后半夜', '静止', '陌生', '空白', '遥远', '低处', '无人', '夏日', '旧城', '失真', '白色', '铁皮'];
  const ALBUM_B = ['回声', '信号', '年代', '风景', '房间', '公路', '幻觉', '档案', '纪年', '天气', '花园', '机器', '夜晚', '实验', '来信', '之歌'];
  const SONG_A = ['所有', '没有', '最后一', '关于', '杀死', '离开', '回到', '我在', '比起', '如果', '南方', '凌晨', '给', '致', '像', '在'];
  const SONG_B = ['的夜晚', '的夏天', '的人', '的噪音', '以后', '之前', '的城市', '的答案', '的火车', '的谎话', '的星星', '的狗', '的失败者', '的雨', '的骨头', '的青春'];

  const REVIEWERS = ['vinyl_junkie', '失眠的贝斯手', 'RYM档案馆', '噪音爱好者', '过期青年', '西二旗吉他手', '回声收藏家', '灰烬与火', '音轨考古', '_paleblue', '电波少年', '低音区', '磁带倒转', '荒原电台', '二手唱片', '凌晨三点', '无调性', '鼓皮', '黑胶边角', '排练室常住人口', 'sub_pop', '反拍', '倒带键', '耳膜旅人'];

  const PLAYLIST_TITLES = ['来自地下室', '凌晨的噪音', '在失真里游泳', '给旧朋友', '一小时城市', '未完成的歌', '磁带 B 面', '野生的和弦'];

  const AUTO_EVENTS = [
    { id: 'radio', text: '本地电台在深夜节目里播了你们的 demo。', fans: 40, fame: 0.6, delay: 30 },
    { id: 'gear', text: '音箱在搬运途中摔坏了，维修花掉一笔钱。', money: -2600, delay: 20 },
    { id: 'interview', text: '一家独立音乐媒体做了你们的采访。', fame: 1.2, fans: 35, delay: 45 },
    { id: 'viral', text: '一段排练室随手拍的视频在社交平台上意外走红。', fans: 160, fame: 0.8, delay: 60 },
    { id: 'neighbor', text: '排练室邻居投诉噪音，你们赔了点钱并买了隔音棉。', money: -800, delay: 25 },
    { id: 'spark', text: '有人在排练时突然找到一段很好的旋律。', chemistry: 2, delay: 20 },
    { id: 'letter', text: '一封手写信寄到排练室：有人说你们的歌陪他熬过了冬天。', morale: 4, delay: 40 },
    { id: 'bootleg', text: '有人把你们的地下演出录成 bootleg 在网上流传。', fans: 55, delay: 35 },
    { id: 'session', text: '一位本地乐手来客串排练，大家玩得很开心。', chemistry: 3, skill: 0.2, delay: 30 },
    { id: 'tax', text: '处理了一堆演出与版税的杂项手续，花掉一些钱。', money: -1200, delay: 30 },
    { id: 'gear2', text: '鼓手换了整套镲片，音色明显更好了。', money: -3200, skill: 0.3, delay: 45 },
    { id: 'zine', text: '一本地下刊物把你们列进了「值得关注的十支新乐队」。', fame: 0.9, fans: 50, delay: 50 }
  ];

  const DECISIONS = [
    {
      id: 'festival_offer',
      title: '小型音乐节邀约',
      text: '一个郊区音乐节发来邀约：下午三点的主舞台，演出四十分钟，报酬不高，但台下会有几千人。',
      options: [
        { label: '接受邀约', hint: '获得演出费与曝光，但会消耗体力并占用一天。' },
        { label: '婉拒，专注手头的事', hint: '保持体力与专注，但错过一次露脸机会。' }
      ]
    },
    {
      id: 'brand_deal',
      title: '品牌代言',
      text: '一家能量饮料想用你们的新歌做广告，报价很诱人，但要求把歌词里一句尖锐的句子改掉。',
      options: [
        { label: '签约，拿钱', hint: '获得一笔可观收入与大众曝光，但艺术口碑会受损。' },
        { label: '拒绝，保留原句', hint: '守住作品，独立乐迷会更尊重你们。' }
      ]
    },
    {
      id: 'fight',
      title: '排练室里的争吵',
      text: '关于新歌该更重还是更流行，两个成员吵到摔门。空气里全是火药味。',
      options: [
        { label: '停下排练，把话说开', hint: '消耗一天，但团队默契会回升。' },
        { label: '不管，继续排', hint: '省下时间，但成员士气会下降。' }
      ]
    },
    {
      id: 'bad_review',
      title: '一篇刻薄的乐评',
      text: '一位有影响力的乐评人写了篇长文，说你们的音乐「像在二手市场拼凑的青春」。评论区吵成一片。',
      options: [
        { label: '公开回击', hint: '话题度上升，但会被认为气量小。' },
        { label: '沉默，继续写歌', hint: '保持体面，把精力放回音乐。' }
      ]
    },
    {
      id: 'cover_collab',
      title: '翻唱合作',
      text: '一位流行歌手想翻唱你们的歌，制作很精良，但会把它变成一首甜腻的情歌。',
      options: [
        { label: '授权', hint: '版税与大众粉丝增加，核心乐迷可能不满。' },
        { label: '拒绝', hint: '保持作品的原貌。' }
      ]
    },
    {
      id: 'throat',
      title: '主唱的嗓子',
      text: '主唱连续几天嗓子发炎。医生建议至少休息一周，但下周有一场已经卖票的演出。',
      options: [
        { label: '取消演出，让他休息', hint: '退款损失一笔钱，但保住主唱的声带。' },
        { label: '硬撑着演', hint: '保住票房，但主唱状态与健康会受影响。' }
      ]
    },
    {
      id: 'studio_offer',
      title: '录音室折扣',
      text: '一间新开的录音室愿意用半价为你们录一张唱片，条件是要在感谢名单里挂他们的名字，并允许他们使用录音片段做宣传。',
      options: [
        { label: '接受', hint: '本次录音费用减半。' },
        { label: '拒绝', hint: '保持独立，正常付费。' }
      ]
    },
    {
      id: 'tour_offer',
      title: '巡演邀请',
      text: '一支更大的乐队邀请你们做三城巡演的开场嘉宾。酬劳一般，但观众是他们的。',
      options: [
        { label: '跟着上路', hint: '消耗体力与数天时间，粉丝与名气明显增加。' },
        { label: '留在本地', hint: '把时间留给创作。' }
      ]
    }
  ];

  const REVIEW_TIERS = {
    terrible: [
      '整张唱片像一场没有排练过的排练。{song} 里那段 solo 甚至让我怀疑音准是什么。',
      '我尊重他们的热情，但热情不能当混音用。听完只想把耳机摘下来透口气。',
      '一张不该被发行出来的唱片。{genre} 不该是这个样子。',
      '从第一首到最后一首，所有的错误都被忠实地录了下来。'
    ],
    poor: [
      '有几段 riff 还算抓耳，但被糟糕的制作和散乱的编排拖垮了。',
      '像一群很有想法的人，却没人愿意当那个说「这样不行」的人。',
      '{song} 是全专唯一让我停下来听的歌，其余部分像在赶时间。',
      '不是没有火花，只是火花落在湿柴上。'
    ],
    mixed: [
      '一半是真诚，一半是自我重复。作为 {genre} 的入门作还算合格。',
      '能听出他们想做什么，但离做到还差几个月的排练和一版更好的混音。',
      '{song} 让我看到了潜力，希望下一张他们能更狠一点。',
      '不难听，也不难忘。适合放在通勤路上当背景。'
    ],
    good: [
      '这是今年值得认真听的 {genre} 唱片之一。制作克制，情绪到位。',
      '他们终于把现场的能量带进了录音室。{song} 是最好的一首。',
      '扎实、有想法，而且不急着讨好谁。这样的乐队现在不多了。',
      '从第一个音符就能听出这是一支真正在一起排练的乐队。'
    ],
    great: [
      '一张几乎挑不出毛病的唱片。它会让很多乐队重新审视自己的标准。',
      '{song} 是我近几年听过最动人的 {genre} 作品之一，副歌落下时我起了一身鸡皮疙瘩。',
      '他们把噪音、旋律与克制放在同一个空间里，居然全都成立。',
      '如果这张唱片出现在年底榜单的第一位，我不会意外。'
    ],
    classic: [
      '这是一张会被反复提起的唱片。多年以后，人们会用「那张专辑」来指代它。',
      '它重新定义了我们对 {genre} 的期待。每一个细节都恰到好处。',
      '{song} 已经超出了类型的范畴，它会留下来。',
      '我很少给这么高的分。但在按下播放键的第三十秒，我就知道这次不一样。'
    ]
  };

  const REVIEW_LIKES = [0, 2, 4, 7, 11, 18, 26, 41, 63, 88, 120, 210];

  BG.data = {
    EPOCH: { y: 2026, m: 1, d: 1 },
    GENRES, ROLES, THEMES, STRUCTURES, KEYS, LANGUAGES, CITIES, VENUES, LABELS, FORMATS, RELEASE_TYPES,
    SURNAMES, GIVEN_M, GIVEN_F, EN_M, EN_F,
    BAND_A, BAND_B, EN_BAND_1, EN_BAND_2,
    ALBUM_A, ALBUM_B, SONG_A, SONG_B,
    REVIEWERS, PLAYLIST_TITLES, AUTO_EVENTS, DECISIONS, REVIEW_TIERS, REVIEW_LIKES
  };
})();

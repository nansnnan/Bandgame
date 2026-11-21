(function () {
  const D = BG.data;
  const E = BG.engine;
  const appEl = document.getElementById('app');
  const overlay = document.getElementById('overlay');
  const toastEl = document.getElementById('toast');

  let state = null;
  let view = 'dash';
  let creation = null;
  let toastTimer = null;

  const NAV = [
    ['dash', '概览', '01'],
    ['band', '乐队', '02'],
    ['studio', '创作', '03'],
    ['release', '发行', '04'],
    ['concert', '演出', '05'],
    ['chart', '榜单', '06'],
    ['finance', '财务', '07'],
    ['settings', '设置', '08']
  ];

  const ROLE_MAP = {};
  D.ROLES.forEach(r => { ROLE_MAP[r.id] = r; });
  const GENRE_MAP = {};
  D.GENRES.forEach(g => { GENRE_MAP[g.id] = g; });
  const VENUE_MAP = {};
  D.VENUES.forEach(v => { VENUE_MAP[v.id] = v; });
  const FORMAT_MAP = {};
  D.FORMATS.forEach(f => { FORMAT_MAP[f.id] = f; });

  const GENDER_TEXT = { male: '男子乐队', female: '女子乐队', mixed: '混合编制' };
  const GENDER_SHORT = { male: '全男', female: '全女', mixed: '混合' };

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function genreOf(id) { return GENRE_MAP[id] || D.GENRES[0]; }
  function stars(r) {
    const full = Math.round(Number(r) || 0);
    return '★'.repeat(Math.max(0, Math.min(5, full))) + '☆'.repeat(Math.max(0, 5 - full));
  }
  function cover(title, genreId, cls) {
    const g = genreOf(genreId);
    return '<div class="cover ' + (cls || '') + '" style="--c1:' + g.color + ';--c2:' + g.color2 + '">' +
      '<span class="lbl">' + esc(String(title || '?').slice(0, 6)) + '</span></div>';
  }
  function memberName(id) {
    const m = state.band.members.find(x => x.id === id);
    return m ? m.name : '客座乐手';
  }
  function cityOf() { return D.CITIES.find(c => c.id === state.band.city) || D.CITIES[0]; }
  function avgRating() {
    const rs = state.releases.filter(r => r.status === 'released' && r.rating);
    if (!rs.length) return '—';
    return (rs.reduce((a, r) => a + r.rating, 0) / rs.length).toFixed(2);
  }
  function money(n) {
    if (state && state.mode === 'sandbox') return '∞';
    return E.fmtMoney(n);
  }
  function bar(label, value, max, cls) {
    const pct = Math.max(0, Math.min(100, value / max * 100));
    return '<div class="bar"><span>' + label + '</span><div class="track"><div class="fill ' + (cls || '') + '" style="width:' + pct + '%"></div></div><span class="v">' + Math.round(value) + '</span></div>';
  }
  function toast(msg, type) {
    if (!msg) return;
    toastEl.innerHTML = '<div class="msg ' + (type || 'ok') + '">' + esc(msg) + '</div>';
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }
  function save() { if (BG.main) BG.main.save(state); }

  function showModal(html, opts) {
    opts = opts || {};
    overlay.innerHTML = html;
    overlay.classList.add('open');
    overlay.dataset.locked = opts.locked ? '1' : '';
    overlay.scrollTop = 0;
    document.body.classList.add('modal-open');
  }
  function closeModal() {
    overlay.classList.remove('open');
    overlay.innerHTML = '';
    overlay.dataset.locked = '';
    document.body.classList.remove('modal-open');
  }

  /* ---------------- creation ---------------- */
  function createInit() {
    const roles = ['vocals', 'leadGuitar', 'rhythmGuitar', 'bass', 'drums'];
    creation = {
      mode: 'reality',
      name: randomBandName(),
      gender: 'mixed',
      genre: 'alt',
      city: 'chengdu',
      members: roles.map((r, i) => ({
        name: E.chineseName('mixed'),
        role: r,
        skill: E.ri(10, 15)
      }))
    };
  }

  function randomBandName() {
    if (Math.random() < 0.62) return E.pick(D.BAND_A) + E.pick(D.BAND_B);
    return 'The ' + E.pick(D.EN_BAND_1) + ' ' + E.pick(D.EN_BAND_2);
  }

  function syncCreation() {
    if (!creation) return;
    const nameEl = document.querySelector('[data-cfield="name"]');
    if (nameEl) creation.name = nameEl.value;
    const genderEl = document.querySelector('[data-cfield="gender"]');
    if (genderEl) creation.gender = genderEl.value;
    const genreEl = document.querySelector('[data-cfield="genre"]');
    if (genreEl) creation.genre = genreEl.value;
    const cityEl = document.querySelector('[data-cfield="city"]');
    if (cityEl) creation.city = cityEl.value;
    const rows = Array.from(document.querySelectorAll('.member-edit'));
    if (rows.length) {
      creation.members = rows.map((row, i) => ({
        name: row.querySelector('.cname').value,
        role: row.querySelector('.crole').value,
        skill: Math.max(6, Math.min(18, Number(row.querySelector('.cskill').value) || 12))
      }));
    }
  }

  function genreOptions(selected) {
    const rock = D.GENRES.slice(0, D.GENRES.findIndex(g => g.id === 'pop'));
    const other = D.GENRES.slice(D.GENRES.findIndex(g => g.id === 'pop'));
    const opt = g => '<option value="' + g.id + '"' + (g.id === selected ? ' selected' : '') + '>' + esc(g.name) + '</option>';
    return '<optgroup label="摇滚">' + rock.map(opt).join('') + '</optgroup>' +
      '<optgroup label="其他风格">' + other.map(opt).join('') + '</optgroup>';
  }

  function renderCreation() {
    state = null;
    const modeCards = [
      ['reality', '现实模式', '初始资金 ¥100,000。每月的房租、排练室和制作费都要自己挣。签约厂牌可以获得预付款，但销量会被抽成。'],
      ['sandbox', '沙盒模式', '资金无限，所有费用都不会真正扣除。可以随意尝试各种制作预算、宣传和演出规模。']
    ].map(([id, name, desc]) =>
      '<div class="modecard ' + (creation.mode === id ? 'on' : '') + '" data-act="mode" data-mode="' + id + '">' +
      '<span class="badge">' + (creation.mode === id ? '已选择' : '可选') + '</span>' +
      '<h3>' + name + '</h3><p>' + desc + '</p></div>').join('');

    const rows = creation.members.map((m, i) =>
      '<div class="member-edit">' +
      '<input class="cname" value="' + esc(m.name) + '" placeholder="姓名" maxlength="18">' +
      '<select class="crole">' + D.ROLES.map(r => '<option value="' + r.id + '"' + (r.id === m.role ? ' selected' : '') + '>' + r.name + '</option>').join('') + '</select>' +
      '<input class="cskill" type="number" min="6" max="18" value="' + m.skill + '" title="演奏能力 6-18">' +
      '<button class="del" data-act="del-member" data-index="' + i + '">×</button>' +
      '</div>').join('');

    appEl.innerHTML =
      '<div class="creation"><div class="wrap">' +
      '<div class="logo">A BAND MANAGEMENT SIMULATION · 2026</div>' +
      '<h1>乐队人生</h1>' +
      '<p class="tagline">从一间潮湿的排练室开始，决定你们成为什么样的乐队。</p>' +

      '<div class="creategrid">' + modeCards + '</div>' +

      '<div class="card" style="margin-top:14px">' +
      '<div class="cardhead"><h2>乐队档案</h2><span class="sub">这些信息之后也可以在世界里留下痕迹</span></div>' +
      '<div class="formrow">' +
      '<label class="field">乐队名<input data-cfield="name" value="' + esc(creation.name) + '" maxlength="24"></label>' +
      '<div class="row" style="align-items:flex-end"><button class="btn" data-act="roll-name">随机名字</button></div>' +
      '<label class="field">编制<select data-cfield="gender">' +
      '<option value="male"' + (creation.gender === 'male' ? ' selected' : '') + '>男子乐队</option>' +
      '<option value="female"' + (creation.gender === 'female' ? ' selected' : '') + '>女子乐队</option>' +
      '<option value="mixed"' + (creation.gender === 'mixed' ? ' selected' : '') + '>混合乐队</option>' +
      '</select></label>' +
      '<label class="field">主风格<select data-cfield="genre">' + genreOptions(creation.genre) + '</select></label>' +
      '<label class="field">根据地<select data-cfield="city">' + D.CITIES.map(c => '<option value="' + c.id + '"' + (c.id === creation.city ? ' selected' : '') + '>' + c.name + '</option>').join('') + '</select></label>' +
      '</div></div>' +

      '<div class="card">' +
      '<div class="cardhead"><h2>初始成员</h2><div class="row"><button class="btn small" data-act="reroll">重掷能力</button><button class="btn small" data-act="add-member">+ 成员</button></div></div>' +
      '<div class="hint" style="margin-bottom:10px">能力范围 6–18。不同位置的成员会影响歌曲的演奏质量与创作水平。</div>' +
      rows +
      '</div>' +

      '<div class="card">' +
      '<div class="cardhead"><h2>开始之前</h2></div>' +
      '<div class="grid g3">' +
      '<div><div class="eyebrow">创作</div><p class="sub">自己写歌、自己填歌词、指定每个乐器的负责人，然后进录音室。</p></div>' +
      '<div><div class="eyebrow">发行</div><p class="sub">单曲、EP、专辑。选择数字、CD 或黑胶，安排宣传与档期。</p></div>' +
      '<div><div class="eyebrow">世界</div><p class="sub">RYM 式评分、销量榜、对手乐队、厂牌合约和随机事件。</p></div>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="spread"><span class="hint">时间从 2026 年 1 月 1 日开始流动。所有选择都会留下记录。</span>' +
      '<button class="btn primary" data-act="start-game">成立乐队</button></div>' +
      '</div>' +

      '</div></div>';
  }

  function startCreation() {
    createInit();
    renderCreation();
  }

  function startGame() {
    syncCreation();
    if (!creation.name.trim()) { toast('先给乐队取个名字。', 'err'); return; }
    if (creation.members.length < 3) { toast('至少需要 3 名成员。', 'err'); return; }
    const roles = creation.members.map(m => m.role);
    if (new Set(roles).size !== roles.length) { toast('同一个位置不能有两个人，请调整成员位置。', 'err'); return; }
    if (!roles.includes('vocals')) { toast('乐队需要一个主唱（或至少把某个成员设为主唱）。', 'err'); return; }
    const s = E.newGame({
      mode: creation.mode,
      name: creation.name.trim(),
      gender: creation.gender,
      genre: creation.genre,
      city: creation.city,
      members: creation.members.map(m => ({ name: m.name.trim() || E.chineseName('mixed'), role: m.role, skill: m.skill }))
    });
    creation = null;
    BG.main.startNew(s);
  }

  /* ---------------- shell ---------------- */
  function start(gameState) {
    state = gameState;
    if (state && !state.chartHistory) state.chartHistory = [];
    if (state && !state.stats) state.stats = { revenue: 0, expense: 0, units: 0, shows: 0, bestRating: 0 };
    view = 'dash';
    closeModal();
    render();
    if (state.pendingDecision) showDecision();
  }

  function render() {
    if (!state) return;
    const nav = NAV.map(([id, name, idx]) =>
      '<button class="' + (view === id ? 'active' : '') + '" data-act="nav" data-view="' + id + '"><span class="idx">' + idx + '</span>' + name + '</button>'
    ).join('');
    appEl.innerHTML =
      renderTopbar() +
      '<div class="shell"><nav class="nav">' + nav +
      '<div class="navfoot">BAND LIFE<br>2026.01.01 —<br><span id="navmode">' + (state.mode === 'sandbox' ? '沙盒模式' : '现实模式') + '</span></div>' +
      '</nav><main class="main">' + renderView() + '</main></div>';
    if (state.pendingDecision && !document.querySelector('.decision-modal')) showDecision();
  }

  function renderTopbar() {
    const b = state.band;
    const mode = state.mode === 'sandbox' ? '沙盒模式' : '现实模式';
    return '<header class="topbar">' +
      '<div class="brand"><b>BAND LIFE</b><span>乐队人生</span></div>' +
      '<div class="clock"><span class="date">' + E.fmtDay(state.day) + '</span><span class="tag">' + mode + '</span></div>' +
      '<div class="topstats">' +
      '<div class="tstat"><small>资金</small><b class="money">' + (state.mode === 'sandbox' ? '∞' : E.fmtMoney(state.money)) + '</b></div>' +
      '<div class="tstat"><small>名气</small><b class="fame">' + Math.round(b.fame) + '</b></div>' +
      '<div class="tstat"><small>粉丝</small><b class="inf">' + E.fmtNum(b.fanbase) + '</b></div>' +
      '<div class="tstat"><small>作品均分</small><b>' + avgRating() + '</b></div>' +
      '</div>' +
      '<div class="timebtns">' +
      '<button class="btn small" data-act="advance" data-days="1">+1 天</button>' +
      '<button class="btn small" data-act="advance" data-days="7">+7 天</button>' +
      '<button class="btn small primary" data-act="advance-next">下一事件</button>' +
      '</div></header>';
  }

  function renderView() {
    switch (view) {
      case 'band': return renderBand();
      case 'studio': return renderStudio();
      case 'release': return renderRelease();
      case 'concert': return renderConcert();
      case 'chart': return renderChart();
      case 'finance': return renderFinance();
      case 'settings': return renderSettings();
      default: return renderDash();
    }
  }

  function pagehead(title, sub, right) {
    return '<div class="pagehead"><div><div class="eyebrow">BAND LIFE / ' + esc(state.band.name) + '</div><h1>' + title + '</h1><p>' + sub + '</p></div>' + (right || '') + '</div>';
  }

  /* ---------------- dashboard ---------------- */
  function renderDash() {
    const b = state.band;
    const g = genreOf(b.genre);
    const city = cityOf();
    const next = E.upcoming(state, 5);
    const upcomingHtml = next.length ? next.map(x =>
      '<div class="tlitem"><div class="d">' + E.fmtDay(x.day) + '</div><div class="t">' + esc(x.text) +
      '<small>还有 ' + Math.max(0, x.day - state.day) + ' 天 · ' + (x.type === 'release' ? '发行' : '演出') + '</small></div></div>'
    ).join('') : '<div class="empty">暂无安排。发行一张唱片，或者订一场演出。</div>';

    const news = state.log.slice(0, 24).map(l =>
      '<div class="logitem ' + esc(l.type) + '"><span class="date">' + E.shortDay(l.day) + '</span><span class="txt">' + esc(l.text) + '</span></div>'
    ).join('') || '<div class="empty">还没有任何消息。</div>';

    const label = (b.label ? '<span class="pill amber">' + esc(b.label.name) + '</span>' : '<span class="pill">独立发行</span>') +
      (!b.label && E.getLabelOffers(state).length ? '<span class="pill amber">' + E.getLabelOffers(state).length + ' 家厂牌接洽</span>' : '');

    return '<div class="view">' +
      '<section class="hero">' +
      '<div class="eyebrow">' + esc(g.name) + ' · ' + esc(city.name) + ' · ' + GENDER_TEXT[b.gender] + '</div>' +
      '<h1>' + esc(b.name) + '</h1>' +
      '<div class="meta">' + label +
      '<span class="pill">' + b.members.length + ' 名成员</span>' +
      '<span class="pill">默契 ' + Math.round(b.chemistry) + '</span>' +
      '<span class="pill">口碑 ' + Math.round(b.cred) + '</span>' +
      '<span class="pill">' + (state.mode === 'sandbox' ? '沙盒' : '现实') + '</span></div>' +
      '<div class="stats">' +
      '<div><b>' + Math.round(b.fame) + '</b><small>知名度</small></div>' +
      '<div><b>' + E.fmtNum(b.fanbase) + '</b><small>粉丝</small></div>' +
      '<div><b>' + state.releases.filter(r => r.status === 'released').length + '</b><small>已发行作品</small></div>' +
      '<div><b>' + E.fmtNum(state.stats.units || 0) + '</b><small>累计销量</small></div>' +
      '<div><b>' + avgRating() + '</b><small>平均评分</small></div>' +
      '</div></section>' +

      '<div class="grid g2" style="margin-bottom:14px">' +
      '<div class="card"><div class="cardhead"><h2>快速行动</h2><span class="sub">时间会随之流动</span></div>' +
      '<div class="quick">' +
      '<button class="btn ghost" data-act="nav" data-view="studio"><span>写一首歌</span><small>进入创作室</small></button>' +
      '<button class="btn ghost" data-act="nav" data-view="release"><span>安排发行</span><small>单曲 / EP / 专辑</small></button>' +
      '<button class="btn ghost" data-act="nav" data-view="concert"><span>预订演出</span><small>从俱乐部到体育场</small></button>' +
      '<button class="btn ghost" data-act="rehearse"><span>排练 3 天</span><small>¥960 · 提升默契与能力</small></button>' +
      '<button class="btn ghost" data-act="rest"><span>休息 3 天</span><small>恢复体力与士气</small></button>' +
      '<button class="btn ghost" data-act="social"><span>发一条动态</span><small>¥200 · 1 天</small></button>' +
      '<button class="btn ghost" data-act="radio"><span>媒体宣传</span><small>¥5,000 · 2 天</small></button>' +
      '<button class="btn ghost" data-act="merch"><span>制作周边</span><small>¥8,000 · 持续收入</small></button>' +
      '<button class="btn ghost" data-act="work"><span>临时打工 3 天</span><small>+¥2,200 · 保住排练室</small></button>' +
      '</div></div>' +
      '<div class="card"><div class="cardhead"><h2>近期日程</h2><button class="btn tiny ghost" data-act="nav" data-view="release">发行</button></div>' +
      '<div class="timeline">' + upcomingHtml + '</div>' +
      '<div class="divider"></div>' +
      '<div class="row"><span class="sub">下一件事</span><b class="flex1">' + (next.length ? esc(next[0].text) : '没有安排') + '</b>' +
      '<button class="btn tiny" data-act="advance-next">推进过去</button></div>' +
      '</div></div>' +

      '<div class="card"><div class="cardhead"><h2>世界与乐队动态</h2><span class="sub">最近 ' + Math.min(24, state.log.length) + ' 条</span></div>' +
      '<div class="news">' + news + '</div></div>' +
      '</div>';
  }

  /* ---------------- band ---------------- */
  function renderBand() {
    const b = state.band;
    const g = genreOf(b.genre);
    const city = cityOf();
    const members = b.members.map(m => {
      const role = ROLE_MAP[m.role] || { name: m.role };
      return '<div class="member">' +
        '<div class="top"><div class="avatar">' + esc(m.name.slice(-1)) + '</div>' +
        '<div class="flex1"><div class="nm">' + esc(m.name) + '</div><div class="rl">' + role.name + ' · ' + m.age + ' 岁</div></div>' +
        '<button class="btn tiny danger" data-act="fire-member" data-id="' + m.id + '">离队</button></div>' +
        '<div class="bars">' +
        bar('演奏', m.skill, 20, '') +
        bar('创作', m.creativity, 20, 'blue') +
        bar('舞台', m.stage, 20, 'amber') +
        bar('体力', m.stamina, 100, 'green') +
        bar('士气', m.morale, 100, '') +
        '</div></div>';
    }).join('');

    let labelHtml;
    if (b.label) {
      labelHtml = '<div class="contract"><div class="badge2">' + esc(b.label.name.slice(0, 1)) + '</div>' +
        '<div class="flex1"><h3>' + esc(b.label.name) + '</h3><div class="sub">签约于 ' + E.fmtDay(b.label.since) + ' · 抽成 ' + Math.round(b.label.cut * 100) + '% · 到期 ' + E.fmtDay(b.label.until) + '</div></div>' +
        '<span class="pill green">合约中</span></div>';
    } else {
      const offers = E.getLabelOffers(state);
      labelHtml = offers.length ? offers.map(l =>
        '<div class="contract" style="margin-bottom:8px"><div class="badge2">' + esc(l.name.slice(0, 1)) + '</div>' +
        '<div class="flex1"><h3>' + esc(l.name) + '</h3><div class="sub">预付 ' + E.fmtMoney(l.advance) + ' · 抽成 ' + Math.round(l.cut * 100) + '% · 发行渠道覆盖 ' + E.fmtNum(l.reach) + ' 人</div>' +
        '<div class="hint">' + esc(l.desc) + '</div></div>' +
        '<button class="btn small primary" data-act="sign-label" data-id="' + l.id + '">签约</button></div>'
      ).join('') : '<div class="empty">目前没有厂牌接洽。先积累名气和作品，机会会来的。</div>';
    }

    return '<div class="view">' + pagehead('乐队', '人、合约，以及你们之间的默契。',
      '<div class="row"><button class="btn small" data-act="recruit">招募成员</button></div>') +

      '<div class="statgrid" style="margin-bottom:14px">' +
      '<div class="statcell"><small>成立</small><b>' + E.fmtDay(b.formedDay || 0) + '</b></div>' +
      '<div class="statcell"><small>编制</small><b>' + GENDER_TEXT[b.gender] + '</b></div>' +
      '<div class="statcell"><small>主风格</small><b>' + esc(g.name) + '</b></div>' +
      '<div class="statcell"><small>根据地</small><b>' + esc(city.name) + '</b></div>' +
      '<div class="statcell"><small>默契</small><b class="blue">' + Math.round(b.chemistry) + '</b></div>' +
      '<div class="statcell"><small>乐队口碑</small><b class="amber">' + Math.round(b.cred) + '</b></div>' +
      '</div>' +

      '<div class="card"><div class="cardhead"><h2>成员</h2><span class="sub">最多 7 人 · 士气低于 22 可能离队</span></div>' +
      '<div class="members">' + members + '</div></div>' +

      '<div class="card"><div class="cardhead"><h2>厂牌与合约</h2><span class="sub">签约获得预付款和渠道，但销量会被抽成</span></div>' +
      labelHtml + '</div>' +

      '<div class="card"><div class="cardhead"><h2>乐队数据</h2></div>' +
      '<div class="statgrid">' +
      '<div class="statcell"><small>演出场次</small><b>' + (state.stats.shows || 0) + '</b></div>' +
      '<div class="statcell"><small>累计销量</small><b>' + E.fmtNum(state.stats.units || 0) + '</b></div>' +
      '<div class="statcell"><small>最高评分</small><b class="amber">' + (state.stats.bestRating ? state.stats.bestRating.toFixed(1) : '—') + '</b></div>' +
      '<div class="statcell"><small>累计收入</small><b class="green">' + E.fmtMoney(state.stats.revenue || 0) + '</b></div>' +
      '<div class="statcell"><small>累计支出</small><b class="red">' + E.fmtMoney(state.stats.expense || 0) + '</b></div>' +
      '</div></div>' +
      '</div>';
  }

  /* ---------------- studio ---------------- */
  function creditSelect(roleId, member) {
    const role = ROLE_MAP[roleId];
    const options = state.band.members.map(m =>
      '<option value="' + m.id + '"' + (member && member.id === m.id ? ' selected' : '') + '>' + esc(m.name) + ' · ' + (ROLE_MAP[m.role] || {}).name + '</option>'
    ).join('');
    return '<label class="field">' + role.name + '<select name="credit_' + roleId + '"><option value="">客座 / 录音室乐手</option>' + options + '</select></label>';
  }

  function renderStudio() {
    const demos = state.songs.filter(s => !s.recorded && !s.releaseId);
    const ready = state.songs.filter(s => s.recorded && !s.releaseId);
    const roleMatch = rid => state.band.members.find(m => m.role === rid) || null;

    const defaultProducer = state.band.members.slice().sort((a, b) => b.creativity - a.creativity)[0];
    const creditFields = D.ROLES.map(r => creditSelect(r.id, r.id === 'producer' ? defaultProducer : roleMatch(r.id))).join('');

    const demoHtml = demos.length ? demos.map(s => {
      const g = genreOf(s.genre);
      return '<div class="releasecard" style="margin-bottom:10px;flex-wrap:wrap">' +
        cover(s.title, s.genre, 'sm') +
        '<div class="info"><div class="ttl">' + esc(s.title) + '</div>' +
        '<div class="meta">' + esc(g.name) + (s.subgenre ? ' · ' + esc(s.subgenre) : '') + ' · ' + E.fmtDur(s.duration) + ' · ' + s.tempo + ' BPM · ' + esc(s.theme) + '</div>' +
        '<div class="meta">demo 质量 <b style="color:var(--amber)">' + s.quality.overall + '</b> · 词曲 ' + s.quality.writing + ' · 演奏 ' + s.quality.performance + '</div></div>' +
        '<button class="btn tiny" data-act="song-detail" data-id="' + s.id + '" style="align-self:center">详情</button>' +
        '<form class="row" data-form="record" data-id="' + s.id + '" style="width:100%;margin-top:8px;justify-content:flex-end">' +
        '<select name="budget" style="width:118px"><option value="0">预算 ¥0</option><option value="1500">¥1,500</option><option value="4000" selected>¥4,000</option><option value="8000">¥8,000</option><option value="15000">¥15,000</option><option value="30000">¥30,000</option></select>' +
        '<select name="days" style="width:88px"><option value="2">2 天</option><option value="3" selected>3 天</option><option value="5">5 天</option><option value="8">8 天</option></select>' +
        '<button class="btn small primary">录音</button></form>' +
        '</div>';
    }).join('') : '<div class="empty">还没有 demo。先在下面写一首歌。</div>';

    const readyHtml = ready.length ? ready.map(s =>
      '<div class="releasecard" style="margin-bottom:10px;flex-wrap:wrap">' + cover(s.title, s.genre, 'sm') +
      '<div class="info"><div class="ttl">' + esc(s.title) + '</div>' +
      '<div class="meta">' + esc(genreOf(s.genre).name) + ' · ' + E.fmtDur(s.duration) + ' · 录于 ' + E.fmtDay(s.recordedDay) + '</div>' +
      '<div class="meta">最终质量 <b style="color:var(--green)">' + s.quality.overall + '</b> · 演奏 ' + s.quality.performance + ' / 词曲 ' + s.quality.writing + ' / 制作 ' + s.quality.production + ' / 原创 ' + s.quality.originality + '</div></div>' +
      '<button class="btn tiny" data-act="song-detail" data-id="' + s.id + '" style="align-self:center">详情</button>' +
      '<span class="pill green">待发行</span></div>'
    ).join('') : '<div class="empty">没有完成录音的歌曲。</div>';

    return '<div class="view">' + pagehead('创作室', '写歌、填词、指定每个位置的负责人，然后进录音室。',
      '<div class="row"><button class="btn small ghost" data-act="nav" data-view="release">去发行</button></div>') +

      '<div class="card"><div class="cardhead"><h2>创作新歌</h2><span class="sub">创作期 ¥220 / 天 · 风格与题材完全自由</span></div>' +
      '<form data-form="song"><div class="formgrid">' +
      '<div class="formrow">' +
      '<label class="field">歌名<input name="title" placeholder="给这首歌一个名字" maxlength="40" required></label>' +
      '<label class="field">风格<select name="genre">' + genreOptions(state.band.genre) + '</select></label>' +
      '<label class="field">子风格 / 标签<input name="subgenre" placeholder="例如：盯鞋、噪音流行、后硬核" maxlength="24"></label>' +
      '<label class="field">主题<select name="theme">' + D.THEMES.map(t => '<option>' + t + '</option>').join('') + '</select></label>' +
      '</div>' +
      '<div class="formrow">' +
      '<label class="field">时长（分）<input name="durMin" type="number" min="0" max="30" value="3"></label>' +
      '<label class="field">时长（秒）<input name="durSec" type="number" min="0" max="59" value="30"></label>' +
      '<label class="field">速度 BPM<input name="tempo" type="number" min="40" max="260" value="120"></label>' +
      '<label class="field">调性<select name="keySig">' + D.KEYS.map(k => '<option>' + k + '</option>').join('') + '</select></label>' +
      '<label class="field">曲式<select name="structure">' + D.STRUCTURES.map(x => '<option>' + x + '</option>').join('') + '</select></label>' +
      '<label class="field">语言<select name="language">' + D.LANGUAGES.map(x => '<option>' + x + '</option>').join('') + '</select></label>' +
      '</div>' +
      '<div class="eyebrow" style="margin-top:4px">乐器负责人</div>' +
      '<div class="formrow">' + creditFields + '</div>' +
      '<label class="field">歌词 / 备注（可留空）<textarea name="lyrics" placeholder="写下歌词，或记录这首歌的动机、编曲想法……" maxlength="2000"></textarea></label>' +
      '<div class="row"><label class="row" style="gap:6px;font-size:12px;color:var(--muted)"><input type="checkbox" name="explicit"> 露骨内容（Explicit）</label>' +
      '<label class="field" style="flex:1;min-width:120px">创作周期<select name="days"><option value="3">3 天</option><option value="5">5 天</option><option value="7" selected>7 天</option><option value="10">10 天</option><option value="14">14 天</option></select></label>' +
      '<button class="btn primary" style="align-self:flex-end">开始创作</button></div>' +
      '</div></form></div>' +

      '<div class="grid g2">' +
      '<div class="card"><div class="cardhead"><h2>Demo</h2><span class="sub">' + demos.length + ' 首待录制</span></div>' + demoHtml + '</div>' +
      '<div class="card"><div class="cardhead"><h2>已完成录音</h2><span class="sub">' + ready.length + ' 首待发行</span></div>' + readyHtml + '</div>' +
      '</div>' +

      '<div class="card"><div class="cardhead"><h2>创作说明</h2></div>' +
      '<div class="grid g3">' +
      '<div><div class="eyebrow">演奏</div><p class="sub">由各位置成员的演奏能力、乐队默契与士气决定。空缺的位置会由客座乐手补上，但水平有限。</p></div>' +
      '<div><div class="eyebrow">词曲</div><p class="sub">由成员的创作能力、创作天数、与乐队主风格的契合度，以及主题的新鲜度决定。</p></div>' +
      '<div><div class="eyebrow">制作</div><p class="sub">录音预算、录音天数、制作人能力，以及录音室折扣都会影响最终成品的质感。</p></div>' +
      '</div></div>' +
      '</div>';
  }

  function showSongDetail(id) {
    const s = state.songs.find(x => x.id === id);
    if (!s) return;
    const g = genreOf(s.genre);
    const creditRows = D.ROLES.map(r => {
      const mid = s.credits ? s.credits[r.id] : null;
      return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:7px 0"><span class="sub">' + r.name + '</span><span>' + (mid ? esc(memberName(mid)) : '<span class="muted">客座乐手</span>') + '</span></div>';
    }).join('');
    const release = s.releaseId ? state.releases.find(r => r.id === s.releaseId) : null;
    const status = release ? (release.status === 'released' ? '已发行于《' + esc(release.title) + '》' : '已定档《' + esc(release.title) + '》') : s.recorded ? '已完成录音，待发行' : 'Demo，待录制';
    showModal('<div class="modal wide"><div class="mhead"><h2>' + esc(s.title) + '</h2><button class="close-x" data-act="close-modal">×</button></div>' +
      '<div class="mbody">' +
      '<div class="row" style="align-items:flex-start;gap:18px;margin-bottom:16px">' + cover(s.title, s.genre, 'lg') +
      '<div class="flex1"><div class="sub" style="font-size:12.5px">' + esc(g.name) + (s.subgenre ? ' / ' + esc(s.subgenre) : '') + '</div>' +
      '<div class="row" style="margin-top:8px"><span class="pill">' + E.fmtDur(s.duration) + '</span><span class="pill">' + s.tempo + ' BPM</span><span class="pill">' + esc(s.keySig) + '</span><span class="pill">' + esc(s.structure) + '</span><span class="pill">' + esc(s.language) + '</span>' + (s.explicit ? '<span class="pill red">Explicit</span>' : '') + '</div>' +
      '<div class="sub" style="margin-top:10px">主题：' + esc(s.theme) + ' · ' + status + '</div>' +
      '<div class="ratingbig" style="font-size:26px;margin-top:10px">' + (s.quality ? s.quality.overall : '—') + ' <small>综合质量 / 100</small></div></div></div>' +
      '<div class="bars" style="margin-bottom:16px">' +
      bar('演奏', s.quality.performance, 100, '') + bar('词曲', s.quality.writing, 100, 'amber') + bar('制作', s.quality.production, 100, 'blue') + bar('原创', s.quality.originality, 100, 'green') + '</div>' +
      '<div class="grid g2">' +
      '<div><div class="eyebrow" style="margin-bottom:4px">乐器负责人</div>' + creditRows + '</div>' +
      '<div><div class="eyebrow" style="margin-bottom:4px">歌词 / 备注</div><div class="lyrics">' + (s.lyrics ? esc(s.lyrics) : '<span class="muted">没有填写歌词。</span>') + '</div></div>' +
      '</div></div><div class="mfoot"><button class="btn" data-act="close-modal">关闭</button></div></div>');
  }

  /* ---------------- release ---------------- */
  function availableSongs() {
    return state.songs.filter(s => s.recorded && !s.releaseId);
  }

  function renderRelease() {
    const songs = availableSongs();
    const songChecks = songs.length ? songs.map(s =>
      '<label class="row" style="gap:8px;padding:8px 0;border-bottom:1px solid var(--line);font-size:12.5px">' +
      '<input type="checkbox" name="songs" value="' + s.id + '">' +
      '<span class="flex1">' + esc(s.title) + ' <span class="muted">· ' + esc(genreOf(s.genre).name) + ' · ' + E.fmtDur(s.duration) + '</span></span>' +
      '<span class="pill">质量 ' + s.quality.overall + '</span></label>'
    ).join('') : '<div class="empty">没有可发行的歌曲。先写歌并完成录音。</div>';

    const scheduled = state.releases.filter(r => r.status === 'scheduled');
    const released = state.releases.filter(r => r.status === 'released').sort((a, b) => b.day - a.day);

    const scheduledHtml = scheduled.length ? scheduled.map(r => {
      const g = E.releaseGenre(state, r);
      return '<div class="releasecard" style="margin-bottom:10px">' + cover(r.title, g) +
        '<div class="info"><div class="ttl">' + esc(r.title) + '</div>' +
        '<div class="meta">' + D.RELEASE_TYPES[r.type].name + ' · ' + (FORMAT_MAP[r.format] || {}).name + ' · ' + r.songIds.length + ' 首</div>' +
        '<div class="meta">' + E.fmtDay(r.day) + ' 发行 · 还有 ' + Math.max(0, r.day - state.day) + ' 天</div></div>' +
        '<span class="pill amber">已定档</span></div>';
    }).join('') : '<div class="empty">没有排期的发行计划。</div>';

    const releasedHtml = released.length ? released.map(r => {
      const g = E.releaseGenre(state, r);
      return '<div class="releasecard" style="margin-bottom:10px">' + cover(r.title, g) +
        '<div class="info"><div class="ttl">' + esc(r.title) + '</div>' +
        '<div class="meta">' + D.RELEASE_TYPES[r.type].name + ' · ' + (FORMAT_MAP[r.format] || {}).name + ' · ' + E.fmtDay(r.day) + '</div>' +
        '<div class="nums"><div><b>' + (r.rating ? r.rating.toFixed(1) : '—') + '</b>RYM 评分</div>' +
        '<div><b>' + E.fmtNum(r.units) + '</b>销量</div>' +
        '<div><b>' + (r.chartPeak ? '#' + r.chartPeak : '—') + '</b>最高排名</div>' +
        '<div><b>' + E.fmtNum(r.ratingCount) + '</b>评分人数</div></div></div>' +
        '<div style="align-self:center"><button class="btn small" data-act="release-detail" data-id="' + r.id + '">查看评价</button></div></div>';
    }).join('') : '<div class="empty">还没有发行过任何作品。</div>';

    return '<div class="view">' + pagehead('发行', '单曲、EP 或专辑。决定格式、宣传预算和发行档期。',
      '<div class="row"><span class="pill">待发行歌曲 ' + songs.length + ' 首</span></div>') +

      '<div class="card"><div class="cardhead"><h2>策划一次发行</h2><span class="sub">歌曲一旦发行，就不能再次用于其他作品</span></div>' +
      '<form data-form="release"><div class="formgrid">' +
      '<div class="formrow">' +
      '<label class="field">唱片名<input name="title" placeholder="专辑 / EP / 单曲名" maxlength="40" required></label>' +
      '<label class="field">类型<select name="type"><option value="single">单曲（1 首）</option><option value="EP">EP（2–5 首）</option><option value="album" selected>专辑（4–18 首）</option></select></label>' +
      '<label class="field">格式<select name="format"><option value="digital" selected>数字发行 · 制作费 ¥500</option><option value="cd">CD · 制作费 ¥6,000</option><option value="vinyl">黑胶 · 制作费 ¥12,000</option></select></label>' +
      '<label class="field">发行日期<input type="date" name="date" value="' + E.isoDay(state.day + 14) + '" min="' + E.isoDay(state.day + 1) + '"></label>' +
      '<label class="field">宣传预算<select name="marketing"><option value="0">¥0</option><option value="2000">¥2,000</option><option value="8000" selected>¥8,000</option><option value="20000">¥20,000</option><option value="60000">¥60,000</option></select></label>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="eyebrow">选择歌曲</div>' + songChecks +
      '<div class="costline"><span>发行费用 = 格式制作费 + 宣传预算</span><b>' + (state.mode === 'sandbox' ? '沙盒模式不计费' : '根据所选格式计算') + '</b></div>' +
      '<div class="row"><span class="hint flex1">建议专辑总时长 35–60 分钟；EP 10–30 分钟。时长过短会影响评分中的整体性。</span><button class="btn primary">确认发行</button></div>' +
      '</div></form></div>' +

      '<div class="grid g2">' +
      '<div class="card"><div class="cardhead"><h2>待发行</h2><span class="sub">' + scheduled.length + ' 个计划</span></div>' + scheduledHtml + '</div>' +
      '<div class="card"><div class="cardhead"><h2>已发行</h2><span class="sub">' + released.length + ' 张唱片</span></div>' + releasedHtml + '</div>' +
      '</div></div>';
  }

  function showReleaseDetail(id) {
    const r = state.releases.find(x => x.id === id);
    if (!r || !r.rating) return;
    const g = genreOf(E.releaseGenre(state, r));
    const info = r.ratingInfo || {};
    const songs = r.songIds.map(sid => state.songs.find(s => s.id === sid)).filter(Boolean);
    const maxBin = Math.max.apply(null, r.histogram.concat([1]));
    const hist = r.histogram.map((n, i) =>
      '<div class="bar"><i style="height:' + Math.max(1, n / maxBin * 100) + '%"></i><span>' + (0.5 + i * 0.5) + '</span></div>'
    ).join('');
    const reviewHtml = (r.reviews || []).map(v =>
      '<div class="review"><div class="rhead"><b>' + esc(v.name) + '</b><span class="sc">' + v.score.toFixed(1) + ' / 5</span></div>' +
      '<p>' + esc(v.text) + '</p><div class="meta2">' + E.shortDay(v.day) + ' · 有用 ' + v.likes + '</div></div>'
    ).join('');
    const trackHtml = songs.map((s, i) =>
      '<div class="songrow"><div class="no">' + (i + 1) + '</div><div><div class="nm">' + esc(s.title) + '</div>' +
      '<div class="sub">' + esc(genreOf(s.genre).name) + ' · ' + E.fmtDur(s.duration) + ' · 质量 ' + s.quality.overall + '</div></div>' +
      '<button class="btn tiny" data-act="song-detail" data-id="' + s.id + '">详情</button></div>'
    ).join('');

    showModal('<div class="modal wide"><div class="mhead"><h2>' + esc(r.title) + '</h2><button class="close-x" data-act="close-modal">×</button></div>' +
      '<div class="mbody">' +
      '<div class="row" style="align-items:flex-start;gap:20px;margin-bottom:14px">' +
      cover(r.title, g.id, 'lg') +
      '<div class="flex1"><div class="ratingbig">' + r.rating.toFixed(1) + ' <small>/ 5.0 · RYM 式评分</small></div>' +
      '<div class="stars" style="font-size:15px;margin:6px 0">' + stars(r.rating) + '</div>' +
      '<div class="sub">' + D.RELEASE_TYPES[r.type].name + ' · ' + (FORMAT_MAP[r.format] || {}).name + ' · ' + E.fmtDay(r.day) + ' · ' + E.fmtNum(r.ratingCount) + ' 人评分</div>' +
      '<div class="row" style="margin-top:10px"><span class="pill amber">首周 ' + E.fmtNum(r.firstWeek) + '</span><span class="pill green">累计 ' + E.fmtNum(r.units) + '</span><span class="pill">最高 #' + (r.chartPeak || '—') + '</span></div></div></div>' +

      '<div class="eyebrow">评分构成</div>' +
      '<div class="bars" style="margin:10px 0 16px">' +
      bar('演奏', info.performance || 0, 100, '') +
      bar('制作', info.production || 0, 100, 'blue') +
      bar('原创', info.originality || 0, 100, 'amber') +
      bar('整体', r.rating / 5 * 100, 100, 'green') +
      '</div>' +
      '<div class="grid g2" style="margin-bottom:14px">' +
      '<div><div class="eyebrow">评分分布</div><div class="histogram">' + hist + '</div><div class="hint">0.5 — 5.0（满分 5）</div></div>' +
      '<div><div class="eyebrow">数据</div><div class="sub" style="margin-top:8px">平均歌曲质量：' + (info.avgQuality || '—') + ' / 100<br>整体一致性：' + (info.cohesion || '—') + ' / 100<br>讨论热度：' + (info.hype || '—') + ' / 100<br>总时长：' + E.fmtDur(info.runtime || 0) + '</div></div>' +
      '</div>' +

      '<div class="eyebrow">曲目</div><div class="tracklist">' + trackHtml + '</div>' +
      '<div class="divider"></div><div class="eyebrow">用户评论</div>' + reviewHtml +
      '</div><div class="mfoot"><button class="btn" data-act="close-modal">关闭</button></div></div>');
  }

  /* ---------------- concert ---------------- */
  function renderConcert() {
    const b = state.band;
    const scheduled = state.concerts.filter(c => c.status === 'scheduled').sort((a, b2) => a.day - b2.day);
    const past = state.concerts.filter(c => c.status === 'done').sort((a, b2) => b2.day - a.day);
    const venueOptions = D.VENUES.map(v => {
      const ok = b.fame >= v.minFame;
      return '<option value="' + v.id + '"' + (v.id === 'club' ? ' selected' : '') + (ok ? '' : ' disabled') + '>' +
        v.name + ' · 容量 ' + E.fmtNum(v.cap) + (ok ? '' : ' · 需要名气 ' + v.minFame) + '</option>';
    }).join('');

    const scheduledHtml = scheduled.length ? scheduled.map(c => {
      const v = VENUE_MAP[c.venueId];
      return '<div class="releasecard" style="margin-bottom:10px">' + cover(v.name, b.genre, 'sm') +
        '<div class="info"><div class="ttl">' + esc(v.name) + '</div>' +
        '<div class="meta">' + E.fmtDay(c.day) + ' · 还有 ' + Math.max(0, c.day - state.day) + ' 天 · 票价 ' + E.fmtMoney(c.price) + '</div>' +
        '<div class="meta">宣传预算 ' + E.fmtMoney(c.promo || 0) + ' · 容量 ' + E.fmtNum(v.cap) + '</div></div>' +
        '<span class="pill amber">已预订</span></div>';
    }).join('') : '<div class="empty">没有预订中的演出。</div>';

    const pastHtml = past.length ? past.slice(0, 12).map(c => {
      const v = VENUE_MAP[c.venueId];
      return '<div class="releasecard" style="margin-bottom:10px">' + cover(v.name, b.genre, 'sm') +
        '<div class="info"><div class="ttl">' + esc(v.name) + '</div>' +
        '<div class="meta">' + E.fmtDay(c.day) + ' · 到场 ' + E.fmtNum(c.attendance || 0) + ' / ' + E.fmtNum(v.cap) + (c.soldOut ? ' · 售罄' : '') + '</div>' +
        '<div class="meta">净收入 <span style="color:' + (c.profit >= 0 ? 'var(--green)' : 'var(--red2)') + '">' + E.fmtMoney(c.profit || 0) + '</span></div></div>' +
        '<span class="pill">' + (c.attendance >= v.cap * 0.96 ? '售罄' : '已完成') + '</span></div>';
    }).join('') : '<div class="empty">还没有演出记录。</div>';

    return '<div class="view">' + pagehead('演出', '从地下俱乐部到体育场。票价、宣传和档期都会影响到场人数。',
      '<div class="row"><span class="pill">累计 ' + (state.stats.shows || 0) + ' 场</span></div>') +

      '<div class="card"><div class="cardhead"><h2>预订演出</h2><span class="sub">周末场次观众更多 · 名气决定可用的场地</span></div>' +
      '<form data-form="concert"><div class="formgrid"><div class="formrow">' +
      '<label class="field">场地<select name="venueId" data-venue-select>' + venueOptions + '</select></label>' +
      '<label class="field">日期<input type="date" name="date" value="' + E.isoDay(state.day + 21) + '" min="' + E.isoDay(state.day + 1) + '"></label>' +
      '<label class="field">票价（¥）<input type="number" name="price" min="10" max="2000" value="50"></label>' +
      '<label class="field">宣传预算<select name="promo"><option value="0">¥0</option><option value="2000" selected>¥2,000</option><option value="8000">¥8,000</option><option value="20000">¥20,000</option></select></label>' +
      '</div><div class="row"><span class="hint flex1">场地租金与按人头计算的成本会在演出当天结算。周五、周六观众更多；票价过高会压低到场率。</span><button class="btn primary">预订</button></div>' +
      '</div></form></div>' +

      '<div class="grid g2">' +
      '<div class="card"><div class="cardhead"><h2>待演出</h2><span class="sub">' + scheduled.length + ' 场</span></div>' + scheduledHtml + '</div>' +
      '<div class="card"><div class="cardhead"><h2>演出记录</h2><span class="sub">最近 ' + Math.min(12, past.length) + ' 场</span></div>' + pastHtml + '</div>' +
      '</div>' +

      '<div class="card"><div class="cardhead"><h2>场地一览</h2></div><div class="tablewrap"><table class="charttable">' +
      '<thead><tr><th>场地</th><th>容量</th><th>租金</th><th>建议票价</th><th>名气要求</th></tr></thead><tbody>' +
      D.VENUES.map(v => '<tr><td>' + v.name + '</td><td class="num">' + E.fmtNum(v.cap) + '</td><td class="num">' + E.fmtMoney(v.rent) + '</td><td class="num">' + E.fmtMoney(v.basePrice) + '</td><td class="num">' + v.minFame + '</td></tr>').join('') +
      '</tbody></table></div></div>' +
      '</div>';
  }

  /* ---------------- chart ---------------- */
  function renderChart() {
    const chart = E.computeChart(state);
    const rivals = E.activeRivalAlbums(state);
    const chartHtml = chart.length ? '<div class="tablewrap"><table class="charttable minw"><thead><tr><th>#</th><th>专辑</th><th>乐队</th><th>评分</th><th>本周销量</th></tr></thead><tbody>' +
      chart.map(e => '<tr class="' + (e.isPlayer ? 'player' : '') + '"><td class="rank ' + (e.rank <= 3 ? 'top' : '') + '">' + e.rank + '</td><td>' + esc(e.title) + (e.isPlayer ? ' <span class="pill red">你</span>' : '') + '</td><td class="dim">' + esc(e.artist) + '</td><td class="num">' + (e.rating ? e.rating.toFixed(1) : '—') + '</td><td class="num">' + E.fmtNum(e.units) + '</td></tr>').join('') +
      '</tbody></table></div>' : '<div class="empty">榜单还没有生成。推进到每周结算日后会出现首周榜单。</div>';

    const rivalRows = rivals.map(({ rival, latest }) => {
      let units = 0;
      if (latest) {
        const idx = Math.floor((state.day - latest.releaseDay) / 7);
        if (idx >= 0 && idx < 52) units = Math.round(latest.firstWeek * Math.pow(latest.decay, idx));
      }
      return '<div class="rivalrow"><div class="nm">' + esc(rival.name) + '<div class="sub">' + esc(GENDER_SHORT[rival.gender] || '') + ' · ' + esc(rival.city) + '</div></div>' +
        '<div class="dim">' + esc(genreOf(rival.genre).name) + '</div>' +
        '<div class="dim">' + rival.fame + '</div>' +
        '<div class="dim">' + E.fmtNum(rival.fanbase) + '</div>' +
        '<div class="dim">' + (latest ? esc(latest.title) + ' · <span style="color:var(--amber)">' + latest.rating.toFixed(1) + '</span>' : '—') + (units ? '<div class="sub">本周 ' + E.fmtNum(units) + '</div>' : '') + '</div></div>';
    }).join('');

    const history = (state.chartHistory || []).slice(0, 6).map(h =>
      '<div class="tlitem"><div class="d">第 ' + (h.week + 1) + ' 周</div><div class="t">' +
      h.top.map(t => (t.isPlayer ? '<b>' + esc(t.title) + '（你）</b>' : esc(t.title) + ' — ' + esc(t.artist))).join('<br>') + '</div></div>'
    ).join('');

    return '<div class="view">' + pagehead('榜单与竞争', '每周结算一次专辑榜。销量、评分和对手的发行都会改变排名。',
      '<div class="row"><span class="pill">当前第 ' + (Math.floor(state.day / 7) + 1) + ' 周</span></div>') +

      '<div class="card"><div class="cardhead"><h2>本周专辑榜 TOP 10</h2><span class="sub">实时估算 · 每周结算</span></div>' + chartHtml + '</div>' +

      '<div class="card"><div class="cardhead"><h2>竞争乐队</h2><span class="sub">世界的其他乐队也在发片</span></div>' +
      '<div class="rivalrow"><div class="hd">乐队</div><div class="hd">风格</div><div class="hd">名气</div><div class="hd">粉丝</div><div class="hd">最新专辑</div></div>' +
      rivalRows + '</div>' +

      '<div class="card"><div class="cardhead"><h2>榜单历史</h2></div>' + (history || '<div class="empty">还没有历史记录。</div>') + '</div>' +
      '</div>';
  }

  /* ---------------- finance ---------------- */
  function renderFinance() {
    const city = cityOf();
    const burn = Math.round((1200 + state.band.members.length * 350 + 500) * city.cost);
    const txHtml = state.transactions.length ? state.transactions.slice(0, 80).map(t =>
      '<tr><td class="dim">' + E.shortDay(t.day) + '</td><td>' + esc(t.label) + '</td><td class="num" style="color:' + (t.amount >= 0 ? 'var(--green)' : 'var(--red2)') + '">' + (t.amount >= 0 ? '+' : '') + E.fmtMoney(t.amount) + '</td></tr>'
    ).join('') : '<tr><td colspan="3" class="empty">还没有收支记录。</td></tr>';

    return '<div class="view">' + pagehead('财务', '现实模式里，每一笔钱都要算清楚。',
      '<div class="row"><span class="pill ' + (state.mode === 'sandbox' ? 'green' : 'amber') + '">' + (state.mode === 'sandbox' ? '沙盒：资金无限' : '现实模式') + '</span></div>') +

      '<div class="statgrid" style="margin-bottom:14px">' +
      '<div class="statcell"><small>可用资金</small><b class="amber">' + (state.mode === 'sandbox' ? '∞' : E.fmtMoney(state.money)) + '</b></div>' +
      '<div class="statcell"><small>累计收入</small><b class="green">' + E.fmtMoney(state.stats.revenue || 0) + '</b></div>' +
      '<div class="statcell"><small>累计支出</small><b class="red">' + E.fmtMoney(state.stats.expense || 0) + '</b></div>' +
      '<div class="statcell"><small>账面净值</small><b>' + E.fmtMoney((state.stats.revenue || 0) - (state.stats.expense || 0)) + '</b></div>' +
      '<div class="statcell"><small>每月固定开销</small><b>' + E.fmtMoney(burn) + '</b></div>' +
      '<div class="statcell"><small>累计销量</small><b>' + E.fmtNum(state.stats.units || 0) + '</b></div>' +
      '</div>' +

      '<div class="card"><div class="cardhead"><h2>收支流水</h2><span class="sub">最近 ' + Math.min(80, state.transactions.length) + ' 笔</span></div>' +
      '<div class="tablewrap"><table class="charttable"><thead><tr><th>日期</th><th>项目</th><th class="right">金额</th></tr></thead><tbody>' + txHtml + '</tbody></table></div></div>' +

      '<div class="card"><div class="cardhead"><h2>成本参考</h2></div><div class="grid g3">' +
      '<div><div class="eyebrow">固定开销</div><p class="sub">每月 1 日结算房租、生活费和排练室：' + E.fmtMoney(burn) + '。成员越多越贵。</p></div>' +
      '<div><div class="eyebrow">制作</div><p class="sub">创作 ¥220/天；录音 ¥450/天 + 制作预算。宣传与格式制作费在发行时支付。</p></div>' +
      '<div><div class="eyebrow">演出</div><p class="sub">场地租金 + 到场人数成本。票房与周边收入在演出当天结算。</p></div>' +
      '</div></div>' +
      '</div>';
  }

  /* ---------------- settings ---------------- */
  function renderSettings() {
    return '<div class="view">' + pagehead('设置与存档', '自动保存在浏览器本地。也可以导出存档备份。') +
      '<div class="grid g2">' +
      '<div class="card"><div class="cardhead"><h2>游戏</h2></div>' +
      '<div class="row" style="margin-bottom:10px"><button class="btn" data-act="help">玩法说明</button><button class="btn" data-act="export">导出存档</button>' +
      '<button class="btn" data-act="import-trigger">导入存档</button><input type="file" id="import-file" accept=".json,application/json" hidden></div>' +
      '<div class="hint">存档包含乐队、歌曲、发行、演出、对手与财务数据。导入会覆盖当前进度。</div>' +
      '<div class="divider"></div>' +
      '<button class="btn danger" data-act="reset-confirm">重新开始</button>' +
      '</div>' +
      '<div class="card"><div class="cardhead"><h2>当前世界</h2></div>' +
      '<div class="statgrid">' +
      '<div class="statcell"><small>模式</small><b>' + (state.mode === 'sandbox' ? '沙盒' : '现实') + '</b></div>' +
      '<div class="statcell"><small>游戏日期</small><b>' + E.fmtDay(state.day) + '</b></div>' +
      '<div class="statcell"><small>乐队</small><b>' + esc(state.band.name) + '</b></div>' +
      '<div class="statcell"><small>对手</small><b>' + state.rivals.length + ' 支</b></div>' +
      '</div></div>' +
      '</div>' +
      '<div class="card"><div class="cardhead"><h2>关于</h2></div>' +
      '<p class="sub">《乐队人生 / BAND LIFE》是一款乐队经营模拟游戏。所有评分、销量与对手均为模拟数据，与现实中的乐队、厂牌、网站无关。RYM 式评分仅借用社区评分的呈现方式。</p>' +
      '</div></div>';
  }

  function showHelp() {
    showModal('<div class="modal wide"><div class="mhead"><h2>玩法说明</h2><button class="close-x" data-act="close-modal">×</button></div>' +
      '<div class="mbody">' +
      '<h3 style="margin-bottom:6px">时间</h3><p class="sub">从 2026 年 1 月 1 日开始。写歌、录音、排练、休息和演出都会推进时间。每周结算专辑榜，每月 1 日结算固定开销。</p>' +
      '<h3 style="margin:14px 0 6px">创作</h3><p class="sub">自己决定歌名、时长、BPM、调性、主题、曲式、语言、歌词，以及每个乐器位置由谁负责。成员的演奏、创作能力与乐队默契决定 demo 质量；录音预算和制作人决定最终质感。</p>' +
      '<h3 style="margin:14px 0 6px">发行与评分</h3><p class="sub">单曲、EP、专辑可以自由选择数字、CD 或黑胶，并安排未来的发行日期。发行后会得到一个 0.5–5.0 的 RYM 式评分，分数由歌曲质量、整体一致性、原创性、讨论热度和随机波动共同决定。评分越高，首周销量越高。</p>' +
      '<h3 style="margin:14px 0 6px">销量与榜单</h3><p class="sub">销量每周按衰减曲线结算。榜单前十由你和 11 支对手乐队的当周销量竞争产生。对手会持续发片，名气与粉丝也会变化。</p>' +
      '<h3 style="margin:14px 0 6px">演出</h3><p class="sub">场地从 150 人的地下俱乐部到 35,000 人的体育场。到场人数取决于粉丝、名气、票价、宣传、城市和星期几。演出能提升名气、粉丝与成员能力，但会消耗体力。</p>' +
      '<h3 style="margin:14px 0 6px">现实 / 沙盒</h3><p class="sub">现实模式需要支付固定开销和制作费，资金不足时无法进行相应操作；沙盒模式资金无限，可以自由试验。厂牌合约会提供预付款和渠道，但会抽走销量收入。</p>' +
      '<h3 style="margin:14px 0 6px">随机事件</h3><p class="sub">排练、录音、发片和日常生活都可能触发事件。有些只需要接受结果，有些需要你做出选择，选择会影响金钱、名气、口碑、士气和成员关系。</p>' +
      '</div><div class="mfoot"><button class="btn" data-act="close-modal">知道了</button></div></div>');
  }

  function showDecision() {
    if (!state.pendingDecision) return;
    const ev = D.DECISIONS.find(d => d.id === state.pendingDecision.id);
    if (!ev) { state.pendingDecision = null; return; }
    const opts = ev.options.map((o, i) =>
      '<button class="decision-opt" data-act="decide" data-index="' + i + '"><b>' + esc(o.label) + '</b><small>' + esc(o.hint) + '</small></button>'
    ).join('');
    showModal('<div class="modal decision-modal"><div class="mhead"><div><div class="eyebrow">需要你决定</div><h2>' + esc(ev.title) + '</h2></div><span class="pill red">时间暂停</span></div>' +
      '<div class="mbody"><p style="margin-top:0;color:#d7d0dc;line-height:1.8">' + esc(ev.text) + '</p>' + opts + '</div></div>', { locked: true });
  }

  /* ---------------- actions ---------------- */
  function afterAction(msg) {
    save();
    render();
    if (state.pendingDecision) { showDecision(); return; }
    if (msg) toast(msg, 'ok');
  }

  function actionResult(res, successMsg) {
    if (!res || !res.ok) {
      toast((res && res.msg) || '操作失败。', 'err');
      return false;
    }
    afterAction(successMsg);
    return true;
  }

  function advance(n) {
    if (state.pendingDecision) { showDecision(); return; }
    const from = state.day;
    E.advanceDays(state, n);
    save();
    render();
    if (state.pendingDecision) { showDecision(); return; }
    if (state.day === from) toast('时间没有推进。', 'warn');
    else toast('时间推进至 ' + E.fmtDay(state.day) + '。', 'ok');
  }

  function advanceNext() {
    if (state.pendingDecision) { showDecision(); return; }
    const next = E.nextEventDay(state);
    const days = next == null ? 7 : Math.max(1, next - state.day);
    advance(days);
  }

  function readCredits(fd) {
    const credits = {};
    D.ROLES.forEach(r => {
      const v = fd.get('credit_' + r.id);
      if (v) credits[r.id] = v;
    });
    return credits;
  }

  function submitSong(form) {
    const fd = new FormData(form);
    const dur = (Number(fd.get('durMin')) || 0) * 60 + (Number(fd.get('durSec')) || 0);
    const res = E.writeSong(state, {
      title: fd.get('title'),
      genre: fd.get('genre'),
      subgenre: fd.get('subgenre'),
      theme: fd.get('theme'),
      duration: dur || 210,
      tempo: Number(fd.get('tempo')) || 120,
      keySig: fd.get('keySig'),
      structure: fd.get('structure'),
      language: fd.get('language'),
      lyrics: fd.get('lyrics'),
      explicit: fd.get('explicit') === 'on',
      credits: readCredits(fd),
      days: Number(fd.get('days')) || 7
    });
    if (!res.ok) { toast(res.msg, 'err'); return; }
    afterAction('《' + res.song.title + '》写完了，demo 质量 ' + res.song.quality.overall + '。');
  }

  function submitRecord(form) {
    const fd = new FormData(form);
    const res = E.recordSong(state, form.dataset.id, {
      budget: Number(fd.get('budget')) || 0,
      days: Number(fd.get('days')) || 3
    });
    actionResult(res, res.ok ? '《' + res.song.title + '》录音完成，最终质量 ' + res.song.quality.overall + '。' : '');
  }

  function submitRelease(form) {
    const fd = new FormData(form);
    const songs = fd.getAll('songs');
    const date = E.dayFromISO(fd.get('date'));
    if (isNaN(date)) { toast('选择有效的发行日期。', 'err'); return; }
    const res = E.createRelease(state, {
      title: fd.get('title'),
      type: fd.get('type'),
      format: fd.get('format'),
      marketing: Number(fd.get('marketing')) || 0,
      songIds: songs,
      day: date
    });
    actionResult(res, res.ok ? '《' + res.release.title + '》已定档 ' + E.fmtDay(res.release.day) + '。' : '');
  }

  function submitConcert(form) {
    const fd = new FormData(form);
    const date = E.dayFromISO(fd.get('date'));
    if (isNaN(date)) { toast('选择有效的演出日期。', 'err'); return; }
    const res = E.scheduleConcert(state, {
      venueId: fd.get('venueId'),
      price: Number(fd.get('price')) || 50,
      promo: Number(fd.get('promo')) || 0,
      day: date
    });
    actionResult(res, res.ok ? '演出已预订：' + E.fmtDay(date) + '。' : '');
  }

  function downloadSave() {
    const json = BG.main.exportJSON();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'band-life-' + E.isoDay(state.day) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('存档已导出。', 'ok');
  }

  /* ---------------- events ---------------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (el) {
      const act = el.dataset.act;
      if (act === 'mode') {
        syncCreation();
        creation.mode = el.dataset.mode;
        renderCreation();
        return;
      }
      if (act === 'roll-name') { syncCreation(); creation.name = randomBandName(); renderCreation(); return; }
      if (act === 'add-member') {
        syncCreation();
        if (creation.members.length >= 7) { toast('最多 7 名成员。', 'warn'); return; }
        const free = D.ROLES.filter(r => !creation.members.some(m => m.role === r.id));
        if (!free.length) { toast('所有位置都已有人。', 'warn'); return; }
        creation.members.push({ name: E.chineseName('mixed'), role: free[0].id, skill: E.ri(9, 15) });
        renderCreation();
        return;
      }
      if (act === 'del-member') {
        syncCreation();
        if (creation.members.length <= 3) { toast('至少保留 3 名成员。', 'warn'); return; }
        creation.members.splice(Number(el.dataset.index), 1);
        renderCreation();
        return;
      }
      if (act === 'reroll') {
        syncCreation();
        creation.members.forEach(m => { m.skill = E.ri(9, 16); });
        renderCreation();
        return;
      }
      if (act === 'start-game') { startGame(); return; }
    }
    if (!state) return;

    const target = e.target.closest('[data-act]');
    if (!target) {
      if (e.target === overlay && !overlay.dataset.locked) closeModal();
      return;
    }
    const act = target.dataset.act;
    switch (act) {
      case 'nav': view = target.dataset.view; render(); break;
      case 'advance': advance(Number(target.dataset.days) || 1); break;
      case 'advance-next': advanceNext(); break;
      case 'rehearse': actionResult(E.rehearse(state, 3), '连续排练了 3 天。'); break;
      case 'rest': actionResult(E.rest(state, 3), '休息了 3 天。'); break;
      case 'social': actionResult(E.socialMedia(state), '发了一条动态。'); break;
      case 'radio': actionResult(E.radioPromo(state, 5000), '媒体宣传完成。'); break;
      case 'merch': actionResult(E.merch(state, 8000), '周边开始制作。'); break;
      case 'work': actionResult(E.work(state), '零工结束，账户里多了 ¥2,200。'); break;
      case 'recruit': actionResult(E.recruit(state), '新成员加入。'); break;
      case 'fire-member': {
        if (confirm('确定让这名成员离开乐队吗？')) {
          actionResult(E.fireMember(state, target.dataset.id), '成员已离队。');
        }
        break;
      }
      case 'sign-label': {
        const lb = D.LABELS.find(l => l.id === target.dataset.id);
        if (lb && confirm('签约「' + lb.name + '」？抽成 ' + Math.round(lb.cut * 100) + '%，合约 720 天。')) {
          actionResult(E.signLabel(state, lb.id), '签约完成。');
        }
        break;
      }
      case 'decide': {
        const res = E.resolveDecision(state, Number(target.dataset.index));
        if (!res.ok) { toast(res.msg, 'err'); break; }
        closeModal();
        afterAction('事件已处理。');
        break;
      }
      case 'release-detail': showReleaseDetail(target.dataset.id); break;
      case 'song-detail': showSongDetail(target.dataset.id); break;
      case 'close-modal': closeModal(); break;
      case 'help': showHelp(); break;
      case 'export': downloadSave(); break;
      case 'import-trigger': {
        const input = document.getElementById('import-file');
        if (input) input.click();
        break;
      }
      case 'reset-confirm':
        showModal('<div class="modal"><div class="mhead"><h2>重新开始？</h2></div><div class="mbody"><p class="sub">当前进度、乐队、作品和存档都会被清除。这个操作无法撤销。</p></div>' +
          '<div class="mfoot"><button class="btn" data-act="close-modal">取消</button><button class="btn primary" data-act="confirm-reset">确认重新开始</button></div></div>');
        break;
      case 'confirm-reset': closeModal(); BG.main.reset(); break;
      default: break;
    }
  });

  document.addEventListener('submit', e => {
    if (!state) return;
    const form = e.target;
    if (!form.dataset || !form.dataset.form) return;
    e.preventDefault();
    if (state.pendingDecision) { showDecision(); return; }
    switch (form.dataset.form) {
      case 'song': submitSong(form); break;
      case 'record': submitRecord(form); break;
      case 'release': submitRelease(form); break;
      case 'concert': submitConcert(form); break;
      default: break;
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'import-file') {
      const file = t.files && t.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const res = BG.main.importJSON(String(reader.result));
        if (!res.ok) toast(res.msg, 'err');
        else toast('存档已导入。', 'ok');
      };
      reader.readAsText(file);
      t.value = '';
      return;
    }
    if (t.matches('[data-venue-select]') && state) {
      const v = VENUE_MAP[t.value];
      const form = t.closest('form');
      const priceInput = form && form.querySelector('input[name="price"]');
      if (v && priceInput) priceInput.value = v.basePrice;
    }
  });

  BG.ui = { start, creation: startCreation, render, toast };
})();

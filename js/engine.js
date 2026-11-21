(function () {
  const BG = window.BG = window.BG || {};
  const D = BG.data;

  const DAY_MS = 86400000;
  const EPOCH_MS = Date.UTC(2026, 0, 1);
  const ROLE_BY_ID = {};
  D.ROLES.forEach(r => { ROLE_BY_ID[r.id] = r; });
  const GENRE_BY_ID = {};
  D.GENRES.forEach(g => { GENRE_BY_ID[g.id] = g; });
  const VENUE_BY_ID = {};
  D.VENUES.forEach(v => { VENUE_BY_ID[v.id] = v; });
  const FORMAT_BY_ID = {};
  D.FORMATS.forEach(f => { FORMAT_BY_ID[f.id] = f; });

  /* ---------------- utils ---------------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const round1 = v => Math.round(v * 10) / 10;
  const uid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function dateOf(day) {
    const d = new Date(EPOCH_MS + day * DAY_MS);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), dow: d.getUTCDay() };
  }
  function fmtDay(day) {
    const x = dateOf(day);
    return x.y + ' 年 ' + x.m + ' 月 ' + x.d + ' 日';
  }
  function shortDay(day) {
    const x = dateOf(day);
    return x.m + '/' + x.d;
  }
  function isoDay(day) {
    const x = dateOf(day);
    return x.y + '-' + String(x.m).padStart(2, '0') + '-' + String(x.d).padStart(2, '0');
  }
  function dayFromISO(str) {
    if (!str) return NaN;
    const p = str.split('-').map(Number);
    if (p.length !== 3 || p.some(isNaN)) return NaN;
    return Math.round((Date.UTC(p[0], p[1] - 1, p[2]) - EPOCH_MS) / DAY_MS);
  }
  function fmtMoney(n) {
    const a = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (a >= 100000000) return sign + '¥' + (a / 100000000).toFixed(2) + ' 亿';
    if (a >= 10000) return sign + '¥' + (a / 10000).toFixed(1) + ' 万';
    return sign + '¥' + Math.round(a).toLocaleString('en-US');
  }
  function fmtNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return Math.round(n).toLocaleString('en-US');
  }
  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }
  function fmtStars(r) {
    const full = Math.round(r * 2) / 2;
    let s = '';
    for (let i = 1; i <= 5; i++) s += (full >= i ? '★' : (full >= i - 0.5 ? '⯨' : '☆'));
    return s;
  }

  /* ---------------- names ---------------- */
  function chineseName(gender) {
    const g = gender === 'f' ? D.GIVEN_F : gender === 'm' ? D.GIVEN_M : (Math.random() < 0.5 ? D.GIVEN_F : D.GIVEN_M);
    return pick(D.SURNAMES) + pick(g);
  }
  function westernName(gender) {
    const g = gender === 'f' ? D.EN_F : D.EN_M;
    return pick(g) + ' ' + pick(['Reed', 'Hale', 'Vance', 'Stone', 'Kerr', 'Lane', 'Frost', 'Mercer', 'Doyle', 'Blake', 'Shaw', 'Rhodes']);
  }
  function rivalName(used) {
    for (let tries = 0; tries < 40; tries++) {
      let n;
      if (Math.random() < 0.55) {
        n = pick(D.BAND_A) + pick(D.BAND_B);
      } else {
        n = 'The ' + pick(D.EN_BAND_1) + ' ' + pick(D.EN_BAND_2);
      }
      if (!used.has(n)) { used.add(n); return n; }
    }
    return 'The Nameless ' + ri(10, 99);
  }
  function albumTitle() {
    return pick(D.ALBUM_A) + pick(D.ALBUM_B);
  }
  function songTitle() {
    const a = pick(D.SONG_A), b = pick(D.SONG_B);
    return (a + b).replace('的的', '的');
  }

  function makeMember(name, role, skill) {
    const s = clamp(Math.round(skill), 1, 20);
    return {
      id: uid('m'),
      name,
      role,
      skill: s,
      creativity: clamp(Math.round(s + rnd(-3, 3)), 1, 20),
      stage: clamp(Math.round(s + rnd(-2, 4)), 1, 20),
      stamina: 100,
      morale: 70,
      exp: 0,
      age: ri(19, 34)
    };
  }

  function memberSkill(m) { return m ? m.skill : 9; }
  function memberById(state, id) { return state.band.members.find(m => m.id === id); }
  function bandMorale(state) {
    const ms = state.band.members;
    if (!ms.length) return 0;
    return ms.reduce((a, m) => a + m.morale, 0) / ms.length;
  }
  function bandStamina(state) {
    const ms = state.band.members;
    if (!ms.length) return 0;
    return ms.reduce((a, m) => a + m.stamina, 0) / ms.length;
  }
  function addFans(state, n) { state.band.fanbase = Math.max(0, state.band.fanbase + n); }
  function addFame(state, n) { state.band.fame = clamp(state.band.fame + n, 0, 100); }
  function addCred(state, n) { state.band.cred = clamp(state.band.cred + n, 0, 100); }

  /* ---------------- log / money ---------------- */
  function log(state, text, type) {
    state.log.unshift({ day: state.day, text, type: type || 'info' });
    if (state.log.length > 260) state.log.length = 260;
  }
  function tx(state, amount, label) {
    state.transactions.unshift({ day: state.day, amount, label });
    if (state.transactions.length > 240) state.transactions.length = 240;
  }
  function canAfford(state, amount) {
    return state.mode === 'sandbox' || amount <= 0 || state.money >= amount;
  }
  function charge(state, amount, label, force) {
    amount = Math.round(amount);
    if (amount <= 0) return true;
    if (state.mode === 'sandbox') {
      state.stats.expense += amount;
      tx(state, -amount, label);
      return true;
    }
    if (!force && state.money < amount) return false;
    state.money -= amount;
    state.stats.expense += amount;
    tx(state, -amount, label);
    return true;
  }
  function earn(state, amount, label) {
    amount = Math.round(amount);
    if (amount <= 0) return;
    if (state.mode === 'sandbox') {
      state.stats.revenue += amount;
      tx(state, amount, label);
      return;
    }
    state.money += amount;
    state.stats.revenue += amount;
    tx(state, amount, label);
  }

  /* ---------------- rivals ---------------- */
  function makeRival(state, usedNames) {
    const gender = Math.random() < 0.36 ? 'female' : Math.random() < 0.72 ? 'male' : 'mixed';
    const genre = pick(D.GENRES.slice(0, 36));
    const fame = clamp(rnd(3, 55), 2, 76);
    const fanbase = Math.round(60 + Math.pow(fame, 2.3) * 0.6 * rnd(0.7, 1.4));
    const rv = {
      id: uid('r'),
      name: rivalName(usedNames),
      gender,
      genre: genre.id,
      city: pick(D.CITIES).name,
      fame: round1(fame),
      fanbase,
      cred: Math.round(clamp(rnd(35, 85), 20, 96)),
      albums: [],
      nextDay: Math.round(rnd(20, 280)),
      memberCount: ri(3, 6)
    };
    const past = ri(1, 4);
    for (let i = 0; i < past; i++) {
      const r = round1(clamp(2.1 + fame / 55 + rnd(-0.85, 1.15), 1.8, 4.8));
      rv.albums.push({
        id: uid('ra'),
        title: albumTitle(),
        rating: r,
        releaseDay: -ri(200, 1100),
        firstWeek: Math.round(fanbase * 0.45 * Math.exp((r - 3) * 0.9) * rnd(0.6, 1.4)),
        decay: rnd(0.74, 0.86)
      });
    }
    return rv;
  }

  function rivalRelease(state, rv) {
    const g = GENRE_BY_ID[rv.genre] || D.GENRES[0];
    const rating = round1(clamp(1.9 + rv.fame / 52 + rnd(-0.9, 1.2), 1.6, 4.9));
    const reach = rv.fanbase * 0.45 + Math.pow(rv.fame, 1.6) * 1.2;
    const firstWeek = Math.max(5, Math.round(reach * Math.exp((rating - 3) * 0.95) * g.pop * rnd(0.7, 1.3)));
    const title = albumTitle();
    rv.albums.push({
      id: uid('ra'),
      title,
      rating,
      releaseDay: state.day,
      firstWeek,
      decay: rnd(0.72, 0.85)
    });
    rv.fame = round1(clamp(rv.fame + (rating - 2.8) * 2.2 + rnd(-0.5, 1.5), 1, 97));
    rv.fanbase = Math.round(rv.fanbase * (0.97 + rating * 0.02) + firstWeek * 0.7 / (1 + rv.fanbase / 40000));
    rv.nextDay = state.day + Math.round(clamp(rnd(180, 560) - rv.fame * 2.5, 70, 520));
    if (rv.fame > 42) {
      log(state, '「' + rv.name + '」发行新专辑《' + title + '》，首周售出 ' + fmtNum(firstWeek) + ' 张。', 'world');
    }
  }

  /* ---------------- new game ---------------- */
  function newGame(cfg) {
    const used = new Set();
    const state = {
      version: 1,
      mode: cfg.mode === 'sandbox' ? 'sandbox' : 'reality',
      day: 0,
      money: 100000,
      band: {
        name: cfg.name,
        gender: cfg.gender,
        genre: cfg.genre,
        city: cfg.city,
        fame: 4,
        cred: 50,
        chemistry: 52,
        fanbase: 150,
        members: [],
        label: null,
        formedDay: 0,
        lastActivityDay: 0,
        studioDiscount: 0
      },
      songs: [],
      releases: [],
      concerts: [],
      rivals: [],
      log: [],
      chart: [],
      chartWeek: -1,
      chartHistory: [],
      transactions: [],
      stats: { revenue: 0, expense: 0, units: 0, shows: 0, bestRating: 0 },
      pendingDecision: null,
      seenEvents: [],
      merch: null,
      flags: {}
    };
    cfg.members.forEach(m => {
      state.band.members.push(makeMember(m.name, m.role, m.skill));
    });
    for (let i = 0; i < 11; i++) state.rivals.push(makeRival(state, used));
    // 让世界一开始就有近期作品
    for (let i = 0; i < 4; i++) {
      const rv = state.rivals[i];
      const g = GENRE_BY_ID[rv.genre] || D.GENRES[0];
      const rating = round1(clamp(2.0 + rv.fame / 55 + rnd(-0.7, 1.1), 1.8, 4.8));
      rv.albums.push({
        id: uid('ra'),
        title: albumTitle(),
        rating,
        releaseDay: -ri(0, 26),
        firstWeek: Math.max(5, Math.round((rv.fanbase * 0.45 + Math.pow(rv.fame, 1.6) * 1.2) * Math.exp((rating - 3) * 0.9) * g.pop * rnd(0.7, 1.2))),
        decay: rnd(0.73, 0.85)
      });
    }
    const city = D.CITIES.find(c => c.id === cfg.city) || D.CITIES[0];
    log(state, '「' + cfg.name + '」在' + city.name + '成立，' + cfg.members.length + ' 个人，一套借来的设备，和几首还没写完的歌。', 'good');
    log(state, cfg.mode === 'sandbox' ? '沙盒模式：资金不受限制，可以自由实验。' : '现实模式：账户里有 ¥100,000，房租和排练室都要钱。', 'info');
    return state;
  }

  /* ---------------- quality / rating ---------------- */
  function songCreditMembers(state, song) {
    const out = [];
    const seen = new Set();
    Object.keys(song.credits || {}).forEach(role => {
      if (role === 'producer') return;
      const id = song.credits[role];
      const m = id ? memberById(state, id) : null;
      if (m && !seen.has(m.id)) { seen.add(m.id); out.push(m); }
    });
    return out;
  }

  function computeQuality(state, song, opts) {
    opts = opts || {};
    const final = opts.stage === 'final';
    const credits = song.credits || {};
    let wsum = 0, skillSum = 0;
    Object.keys(ROLE_BY_ID).forEach(role => {
      if (role === 'producer') return;
      const roleDef = ROLE_BY_ID[role];
      const m = credits[role] ? memberById(state, credits[role]) : null;
      const w = roleDef.weight;
      wsum += w;
      skillSum += (m ? m.skill : 9) * w;
    });
    const weightedSkill = wsum ? skillSum / wsum : 9;
    const morale = bandMorale(state);
    let performance = weightedSkill * 4.35 + state.band.chemistry * 0.12 + rnd(-4, 4);
    if (morale < 45) performance -= (45 - morale) * 0.18;
    if (opts.staminaPenalty) performance -= 6;

    const creatives = songCreditMembers(state, song);
    let csum = 0;
    if (creatives.length) creatives.forEach(m => { csum += m.creativity; });
    const avgCreate = creatives.length ? csum / creatives.length : 10;
    const bandGenre = state.band.genre;
    let affinity = 0;
    if (song.genre === bandGenre) affinity = 6;
    else {
      const g1 = GENRE_BY_ID[song.genre], g2 = GENRE_BY_ID[bandGenre];
      const rock1 = g1 && D.GENRES.slice(0, 36).some(x => x.id === g1.id);
      const rock2 = g2 && D.GENRES.slice(0, 36).some(x => x.id === g2.id);
      affinity = rock1 && rock2 ? 0 : -4;
    }
    const recent = state.songs.filter(x => x.theme === song.theme && state.day - x.writingDay < 120).length;
    const novelty = Math.max(-8, 3 - recent * 3);
    const writingDays = song.writingDays || opts.days || 3;
    const writing = 18 + avgCreate * 3.3 + Math.min(14, writingDays * 1.3) + affinity + novelty + rnd(-5, 5);

    const producerMember = credits.producer ? memberById(state, credits.producer) : null;
    const producerSkill = producerMember ? (producerMember.creativity * 0.6 + producerMember.skill * 0.4) : avgCreate;
    let production;
    if (final) {
      const budget = opts.budget || 0;
      production = 20 + Math.min(26, Math.sqrt(budget / 500) * 4.5) + producerSkill * 1.7 + Math.min(10, (opts.days || 3) * 1.2) + rnd(-3, 3);
      if (state.band.studioDiscount > 0) production += 3;
    } else {
      production = 30 + producerSkill * 0.8 + rnd(-4, 4);
    }

    const originality = 12 + avgCreate * 2.4 + Math.min(8, writingDays * 0.6) + (recent === 0 ? 5 : 0) + rnd(-5, 8);

    let overall = performance * 0.32 + writing * 0.32 + production * 0.24 + originality * 0.12;
    if (song.language === '纯器乐') overall += song.duration > 300 ? 2 : -1;
    if (song.duration < 90) overall -= 4;
    const clampQ = v => Math.round(clamp(v, 18, 98));
    return {
      performance: clampQ(performance),
      writing: clampQ(writing),
      production: clampQ(production),
      originality: clampQ(originality),
      overall: clampQ(overall)
    };
  }

  function releaseGenre(state, release) {
    const songs = release.songIds.map(id => state.songs.find(s => s.id === id)).filter(Boolean);
    if (!songs.length) return state.band.genre;
    const counts = {};
    songs.forEach(s => { counts[s.genre] = (counts[s.genre] || 0) + 1; });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  }

  function scoreRelease(state, release) {
    const songs = release.songIds.map(id => state.songs.find(s => s.id === id)).filter(Boolean);
    const type = D.RELEASE_TYPES[release.type];
    const totalDur = songs.reduce((a, s) => a + s.duration, 0);
    let qsum = 0, wsum = 0, perf = 0, prod = 0, orig = 0;
    songs.forEach(s => {
      const w = Math.max(60, s.duration);
      qsum += s.quality.overall * w;
      wsum += w;
      perf += s.quality.performance;
      prod += s.quality.production;
      orig += s.quality.originality;
    });
    const avgQ = wsum ? qsum / wsum : 50;
    const n = Math.max(1, songs.length);
    perf /= n; prod /= n; orig /= n;

    const genreCount = {};
    songs.forEach(s => { genreCount[s.genre] = (genreCount[s.genre] || 0) + 1; });
    const dominance = Math.max.apply(null, Object.values(genreCount)) / n;
    let cohesion = 0.45 + dominance * 0.45;
    if (n === 1) cohesion = 0.75;

    let runtimeScore = 0;
    if (release.type === 'album') {
      if (totalDur < 1500) runtimeScore = -0.28;
      else if (totalDur < 2100) runtimeScore = -0.1;
      else if (totalDur > 4200) runtimeScore = -0.15;
    } else if (release.type === 'EP') {
      if (totalDur < 480) runtimeScore = -0.15;
      if (totalDur > 2400) runtimeScore = -0.12;
    }

    const b = state.band;
    const hype = clamp(b.fame / 100 + release.marketing / 60000 + (b.label ? b.label.promo * 0.08 : 0), 0, 1.3);
    const rand = rnd(-0.18, 0.18);
    let raw = 0.45
      + (avgQ / 100) * 3.9
      + (cohesion - 0.62) * 0.55
      + (orig - 50) / 100 * 0.32
      + runtimeScore
      + hype * 0.12
      + rand;
    if (b.cred > 70) raw += 0.05;
    const rating = round1(clamp(raw, 0.5, 5));
    return {
      rating,
      avgQuality: Math.round(avgQ),
      performance: Math.round(perf),
      production: Math.round(prod),
      originality: Math.round(orig),
      cohesion: round1(cohesion * 100),
      runtime: totalDur,
      hype: Math.round(hype * 100)
    };
  }

  function buildRatingCount(state, release, rating) {
    const b = state.band;
    const count = Math.round(clamp(
      b.fanbase * 0.14 + b.fame * 22 + release.marketing / 180 + rnd(0, 120),
      12, 250000
    ));
    const bins = [];
    for (let i = 0; i < 10; i++) {
      const center = 0.25 + i * 0.5;
      const w = Math.exp(-Math.pow(center - rating, 2) / (2 * 0.62 * 0.62));
      bins.push(w);
    }
    const wsum = bins.reduce((a, b2) => a + b2, 0);
    const counts = bins.map(w => Math.round(count * w / wsum));
    return { count, bins: counts };
  }

  function reviewText(score, song, genre, band) {
    let tier;
    if (score < 2.0) tier = 'terrible';
    else if (score < 2.8) tier = 'poor';
    else if (score < 3.4) tier = 'mixed';
    else if (score < 4.1) tier = 'good';
    else if (score < 4.6) tier = 'great';
    else tier = 'classic';
    const list = D.REVIEW_TIERS[tier];
    return pick(list).replace(/\{song\}/g, '《' + song + '》').replace(/\{genre\}/g, genre).replace(/\{band\}/g, band);
  }

  function buildReviews(state, release, ratingInfo) {
    const songs = release.songIds.map(id => state.songs.find(s => s.id === id)).filter(Boolean);
    const g = GENRE_BY_ID[releaseGenre(state, release)];
    const count = ri(3, 6);
    const reviews = [];
    for (let i = 0; i < count; i++) {
      const sc = round1(clamp(ratingInfo.rating + rnd(-1.35, 1.15), 0.5, 5));
      reviews.push({
        name: pick(D.REVIEWERS),
        score: sc,
        text: reviewText(sc, songs.length ? pick(songs).title : release.title, g ? g.name : '摇滚', state.band.name),
        likes: pick(D.REVIEW_LIKES),
        day: release.day
      });
    }
    reviews.sort((a, b) => b.likes - a.likes);
    return reviews;
  }

  /* ---------------- release ---------------- */
  function createRelease(state, data) {
    const type = D.RELEASE_TYPES[data.type];
    if (!type) return { ok: false, msg: '未知的发行类型。' };
    if (!data.title || !String(data.title).trim()) return { ok: false, msg: '给这张唱片取个名字。' };
    const songs = data.songIds.map(id => state.songs.find(s => s.id === id)).filter(Boolean);
    if (songs.length < type.min || songs.length > type.max) {
      return { ok: false, msg: type.name + '需要 ' + type.min + ' 到 ' + type.max + ' 首歌。' };
    }
    if (songs.some(s => !s.recorded)) return { ok: false, msg: '还有歌曲没有完成录音。' };
    if (songs.some(s => s.releaseId)) return { ok: false, msg: '有歌曲已经发行过了。' };
    if (data.day < state.day + 1) return { ok: false, msg: '发行日期至少要在明天之后。' };
    const fmt = FORMAT_BY_ID[data.format] || D.FORMATS[0];
    const marketing = Math.max(0, Math.round(data.marketing || 0));
    const cost = fmt.cost + marketing;
    if (!canAfford(state, cost)) return { ok: false, msg: '资金不足，发行与宣传需要 ' + fmtMoney(cost) + '。' };
    charge(state, cost, '发行《' + data.title + '》筹备');
    const release = {
      id: uid('rel'),
      title: String(data.title).trim(),
      type: data.type,
      format: fmt.id,
      songIds: songs.map(s => s.id),
      day: data.day,
      marketing,
      status: 'scheduled',
      rating: null,
      firstWeek: 0,
      units: 0,
      reviews: [],
      ratingCount: 0,
      histogram: [],
      chartPeak: null,
      lastPayoutWeek: -1,
      createdAt: state.day
    };
    state.releases.push(release);
    songs.forEach(s => { s.releaseId = release.id; s.scheduledDay = data.day; });
    log(state, '《' + release.title + '》定档 ' + fmtDay(data.day) + '，' + type.name + '，' + fmt.name + '。', 'release');
    return { ok: true, release };
  }

  function releaseRevenue(state, release, units) {
    const fmt = FORMAT_BY_ID[release.format] || D.FORMATS[0];
    const price = fmt.price[release.type] || 20;
    const unitNet = fmt.id === 'digital' ? price * fmt.margin : price - (fmt.unitCost || 0);
    let gross = units * unitNet;
    if (state.band.label) gross *= (1 - state.band.label.cut);
    return gross;
  }

  function doRelease(state, release) {
    const info = scoreRelease(state, release);
    release.rating = info.rating;
    release.ratingInfo = info;
    release.status = 'released';
    release.releasedDay = release.day;
    release.ratingData = buildRatingCount(state, release, info.rating);
    release.ratingCount = release.ratingData.count;
    release.histogram = release.ratingData.bins;
    release.reviews = buildReviews(state, release, info);

    const b = state.band;
    const genreId = releaseGenre(state, release);
    const g = GENRE_BY_ID[genreId] || D.GENRES[0];
    const fmt = FORMAT_BY_ID[release.format];
    const reach = b.fanbase * 0.5 + Math.pow(b.fame, 1.85) * 2.2 + (b.label ? b.label.reach * 0.35 : 0);
    const ratingF = Math.exp((info.rating - 3.0) * 0.98);
    const marketingF = 1 + Math.min(2.4, release.marketing / 25000);
    let firstWeek = reach * ratingF * marketingF * g.pop * fmt.mult * rnd(0.85, 1.15);
    firstWeek = Math.max(3, Math.round(firstWeek));
    release.firstWeek = firstWeek;
    release.units = firstWeek;
    release.decay = release.type === 'album' ? rnd(0.83, 0.86) : release.type === 'EP' ? rnd(0.78, 0.82) : rnd(0.68, 0.74);

    const revenue = releaseRevenue(state, release, firstWeek);
    earn(state, revenue, '《' + release.title + '》首周销量');
    state.stats.units += firstWeek;

    const fameGain = clamp(info.rating * 1.5 + Math.sqrt(firstWeek) / 4 + (info.rating >= 4.3 ? 2 : 0), 0.5, 12);
    addFame(state, fameGain);
    const conversion = 2.4 / (1 + b.fanbase / 60000);
    addFans(state, firstWeek * conversion + info.rating * 35);
    if (info.rating >= 4.2) addCred(state, 4);
    else if (info.rating < 2.6) addCred(state, -3);
    state.band.lastActivityDay = state.day;
    if (info.rating > (state.stats.bestRating || 0)) state.stats.bestRating = info.rating;

    const type = D.RELEASE_TYPES[release.type];
    log(state, '《' + release.title + '》（' + type.name + '）正式发行。RYM 评分 ' + info.rating.toFixed(1) + ' / 5，首周销量 ' + fmtNum(firstWeek) + ' 张，收入 ' + fmtMoney(revenue) + '。', 'release');
    if (info.rating >= 4.3) log(state, '评论界对《' + release.title + '》反应热烈，称其为「一次真正的突破」。', 'good');
    if (info.rating < 2.5) log(state, '《' + release.title + '》口碑不佳，社交平台上出现不少失望的声音。', 'bad');
    // 成员士气
    b.members.forEach(m => { m.morale = clamp(m.morale + (info.rating - 3) * 4, 0, 100); });
    b.chemistry = clamp(b.chemistry + (info.rating - 3) * 1.5, 0, 100);
    if (state.band.label) {
      log(state, '厂牌「' + state.band.label.name + '」发来贺电，并开始安排后续宣传。', 'info');
    }
  }

  /* ---------------- chart ---------------- */
  function weeklyUnits(album, weekIndex) {
    if (!album || weekIndex < 0 || weekIndex > 51) return 0;
    return album.firstWeek * Math.pow(album.decay, weekIndex);
  }

  function computeChart(state) {
    const b = state.band;
    const entries = [];
    state.releases.forEach(r => {
      if (r.status !== 'released') return;
      const idx = Math.floor((state.day - r.day) / 7);
      const units = weeklyUnits(r, idx);
      if (units > 0.5) {
        entries.push({
          title: r.title,
          artist: b.name,
          units: Math.round(units),
          rating: r.rating,
          isPlayer: true,
          releaseId: r.id
        });
      }
    });
    state.rivals.forEach(rv => {
      rv.albums.forEach(a => {
        if (a.releaseDay > state.day) return;
        const idx = Math.floor((state.day - a.releaseDay) / 7);
        const units = weeklyUnits(a, idx);
        if (units > 0.5) {
          entries.push({
            title: a.title,
            artist: rv.name,
            units: Math.round(units),
            rating: a.rating,
            isPlayer: false
          });
        }
      });
    });
    entries.sort((a, b2) => b2.units - a.units);
    const top = entries.slice(0, 10);
    top.forEach((e, i) => { e.rank = i + 1; });
    return top;
  }

  function chartTick(state) {
    const chart = computeChart(state);
    state.chart = chart;
    state.chartWeek = Math.floor(state.day / 7);
    chart.forEach(e => {
      if (!e.isPlayer) return;
      const r = state.releases.find(x => x.id === e.releaseId);
      if (!r) return;
      if (!r.chartPeak || e.rank < r.chartPeak) {
        r.chartPeak = e.rank;
        if (e.rank === 1) log(state, '《' + r.title + '》登上本周专辑榜冠军。', 'good');
      }
    });
    // 玩家周销量已计入首周，后续周结算
    state.releases.forEach(r => {
      if (r.status !== 'released') return;
      const idx = Math.floor((state.day - r.day) / 7);
      if (idx < 1) return;
      if (idx === r.lastPayoutWeek) return;
      const units = Math.round(weeklyUnits(r, idx));
      r.lastPayoutWeek = idx;
      if (units > 0) {
        r.units += units;
        state.stats.units += units;
        const revenue = releaseRevenue(state, r, units);
        earn(state, revenue, '《' + r.title + '》销量');
      }
    });
    state.chartHistory.unshift({
      week: state.chartWeek,
      day: state.day,
      top: chart.slice(0, 3).map(e => ({ title: e.title, artist: e.artist, units: e.units, isPlayer: e.isPlayer }))
    });
    if (state.chartHistory.length > 60) state.chartHistory.length = 60;
    if (chart[0]) log(state, '第 ' + (Math.floor(state.day / 7) + 1) + ' 周专辑榜更新：冠军《' + chart[0].title + '》。', 'world');
  }

  /* ---------------- concerts ---------------- */
  function scheduleConcert(state, data) {
    const v = VENUE_BY_ID[data.venueId];
    if (!v) return { ok: false, msg: '场地无效。' };
    if (state.band.fame < v.minFame) return { ok: false, msg: '名气不足，' + v.name + '暂时不会接你们的演出（需要名气 ' + v.minFame + '）。' };
    if (data.day < state.day + 1) return { ok: false, msg: '演出日期至少要在明天之后。' };
    const price = Math.max(10, Math.round(data.price || v.basePrice));
    const promo = Math.max(0, Math.round(data.promo || 0));
    if (!canAfford(state, promo)) return { ok: false, msg: '宣传预算不足。' };
    charge(state, promo, '演出宣传');
    const concert = {
      id: uid('c'),
      venueId: v.id,
      day: data.day,
      price,
      promo,
      status: 'scheduled',
      createdAt: state.day
    };
    state.concerts.push(concert);
    log(state, '已预订 ' + fmtDay(data.day) + ' 在' + v.name + '的演出，票价 ' + fmtMoney(price) + '。', 'show');
    return { ok: true, concert };
  }

  function doConcert(state, concert) {
    const v = VENUE_BY_ID[concert.venueId];
    const b = state.band;
    const city = D.CITIES.find(c => c.id === b.city) || D.CITIES[0];
    const dow = dateOf(concert.day).dow;
    const weekend = (dow === 5 || dow === 6) ? 1.22 : 1;
    const stamina = bandStamina(state);
    const staminaF = stamina < 35 ? 0.7 : stamina < 55 ? 0.85 : 1;
    const priceF = clamp(1.55 - concert.price / (v.basePrice * 1.9), 0.35, 1.2);
    const promoF = 1 + Math.min(0.8, concert.promo / 6000);
    const baseDraw = (b.fanbase * 0.12 + b.fame * 14) * city.scene * (0.7 + b.fame / 120 + b.cred / 300);
    let attendance = Math.round(baseDraw * priceF * promoF * weekend * staminaF * rnd(0.78, 1.2));
    attendance = clamp(attendance, 0, v.cap);
    const merchPerHead = 10 + b.fame * 0.4;
    const gross = attendance * concert.price + attendance * merchPerHead;
    const cost = v.rent + attendance * v.per + concert.promo;
    const profit = gross - cost;
    if (profit >= 0) earn(state, profit, v.name + '演出');
    else forceCharge(state, -profit, v.name + '演出亏损');

    const ratingAvg = state.releases.filter(r => r.status === 'released');
    const drawQuality = ratingAvg.length ? ratingAvg[ratingAvg.length - 1].rating : 2.8;
    const fameGain = clamp(0.4 + attendance / 600 + drawQuality * 0.35, 0, 4.5);
    const fanGain = attendance * 0.65 + (concert.promo / 200);
    addFame(state, fameGain);
    addFans(state, fanGain);
    b.members.forEach(m => {
      m.stamina = clamp(m.stamina - rnd(12, 24), 0, 100);
      m.morale = clamp(m.morale + (attendance > v.cap * 0.6 ? 4 : 1.5), 0, 100);
      m.exp += 1.4;
      if (m.exp >= 6 && m.skill < 20) { m.skill += 1; m.exp = 0; log(state, m.name + '在密集演出中进步了，演奏能力提升到 ' + m.skill + '。', 'good'); }
    });
    b.chemistry = clamp(b.chemistry + 1.2, 0, 100);
    b.lastActivityDay = concert.day;
    b.formedDay = b.formedDay;
    state.stats.shows = (state.stats.shows || 0) + 1;
    concert.status = 'done';
    concert.attendance = attendance;
    concert.gross = gross;
    concert.profit = profit;
    concert.soldOut = attendance >= v.cap * 0.96;
    log(state, '在' + v.name + '演出：到场 ' + fmtNum(attendance) + ' 人 / 容量 ' + fmtNum(v.cap) + '，' + (profit >= 0 ? '净收入 ' + fmtMoney(profit) : '亏损 ' + fmtMoney(-profit)) + '。', profit >= 0 ? 'show' : 'bad');
    if (attendance < v.cap * 0.12) {
      log(state, '台下稀稀拉拉。回程的车上没人说话，士气受到打击。', 'bad');
      b.members.forEach(m => { m.morale = clamp(m.morale - 4, 0, 100); });
    }
    if (concert.soldOut) log(state, v.name + '售罄。主办方当场提出下次合作。', 'good');
  }

  function forceCharge(state, amount, label) {
    if (state.mode === 'sandbox') { state.stats.expense += amount; return; }
    state.money -= amount;
    state.stats.expense += amount;
    tx(state, -amount, label);
  }

  /* ---------------- time ---------------- */
  function processDay(state) {
    state.day++;
    // 发行
    state.releases.forEach(r => {
      if (r.status === 'scheduled' && r.day <= state.day) doRelease(state, r);
    });
    // 演出
    state.concerts.forEach(c => {
      if (c.status === 'scheduled' && c.day <= state.day) doConcert(state, c);
    });
    // 对手发行
    state.rivals.forEach(rv => {
      if (state.day >= rv.nextDay) rivalRelease(state, rv);
    });
    // 周结算
    if (state.day % 7 === 0) chartTick(state);
    // 月结算
    if (dateOf(state.day).d === 1) monthlyTick(state);
    // 成员恢复
    state.band.members.forEach(m => { m.stamina = clamp(m.stamina + 1.4, 0, 100); });
    // 厂牌合约
    if (state.band.label && state.day >= state.band.label.until) {
      log(state, '与「' + state.band.label.name + '」的合约到期，你们重新成为独立乐队。', 'info');
      state.band.label = null;
    }
    if (state.day - (state.band.lastActivityDay || 0) > 120) {
      addFame(state, -0.02);
    }
    maybeEvent(state);
  }

  function advanceDays(state, n) {
    const messages = [];
    const start = state.day;
    for (let i = 0; i < n; i++) {
      if (state.pendingDecision) break;
      processDay(state);
    }
    messages.push({ from: start, to: state.day });
    return { ok: true, messages, pending: state.pendingDecision ? true : false };
  }

  function monthlyTick(state) {
    const b = state.band;
    const city = D.CITIES.find(c => c.id === b.city) || D.CITIES[0];
    const living = Math.round((1200 + b.members.length * 350 + 500) * city.cost);
    forceCharge(state, living, '生活与排练室开支');
    log(state, '月度结算：生活、房租与排练室共支出 ' + fmtMoney(living) + '。' + (state.money < 0 ? '账户已经透支。' : '账户余额 ' + fmtMoney(state.money) + '。'), state.money < 0 ? 'bad' : 'money');
    if (state.merch && state.day < state.merch.until) {
      const income = Math.round(b.fanbase * 0.03 * state.merch.level * rnd(0.8, 1.2));
      earn(state, income, '周边销售');
      log(state, '周边仓库清点：本月卖出 ' + fmtMoney(income) + '。', 'money');
    }
    // 士气与流失
    b.members.forEach(m => {
      if (b.fanbase > 2000) m.morale = clamp(m.morale + 0.5, 0, 100);
      else m.morale = clamp(m.morale - 0.4, 0, 100);
      if (state.money < 0) m.morale = clamp(m.morale - 5, 0, 100);
    });
    const quitters = b.members.filter(m => m.morale < 22 && b.members.length > 2 && Math.random() < 0.18);
    quitters.forEach(m => {
      b.members = b.members.filter(x => x.id !== m.id);
      log(state, m.name + '退出了乐队。行李收拾得很安静，只留下一把备用拨片。', 'bad');
      addFans(state, -Math.round(b.fanbase * 0.02));
    });
    if (b.members.length < 3) {
      log(state, '乐队只剩 ' + b.members.length + ' 个人了。再找点人吧。', 'bad');
    }
    // 不活跃衰减
    if (state.day - (b.lastActivityDay || 0) > 60) {
      b.fanbase = Math.max(10, b.fanbase * 0.982);
      addFame(state, -0.15);
      b.chemistry = clamp(b.chemistry - 0.6, 0, 100);
    }
    // 成员技能练习带来的缓慢成长
    b.members.forEach(m => {
      m.exp += 0.15;
      if (m.exp >= 8 && m.skill < 20) { m.skill += 1; m.exp = 0; }
    });
  }

  function maybeEvent(state) {
    if (state.pendingDecision) return;
    if (state.day < 6) return;
    if (Math.random() > 0.022) return;
    if (Math.random() < 0.34) {
      triggerDecision(state);
    } else {
      autoEvent(state);
    }
  }

  function autoEvent(state) {
    const avail = D.AUTO_EVENTS.filter(e => !state.seenEvents.includes(e.id));
    const pool = avail.length ? avail : D.AUTO_EVENTS;
    const ev = pick(pool);
    state.seenEvents.unshift(ev.id);
    if (state.seenEvents.length > 12) state.seenEvents.length = 12;
    if (ev.money) {
      if (ev.money > 0) earn(state, ev.money, '突发事件：' + ev.id);
      else forceCharge(state, -ev.money, '突发事件');
    }
    if (ev.fans) addFans(state, ev.fans);
    if (ev.fame) addFame(state, ev.fame);
    if (ev.chemistry) state.band.chemistry = clamp(state.band.chemistry + ev.chemistry, 0, 100);
    if (ev.morale) state.band.members.forEach(m => { m.morale = clamp(m.morale + ev.morale, 0, 100); });
    if (ev.skill) state.band.members.forEach(m => { m.exp += ev.skill; });
    log(state, ev.text, ev.money < 0 ? 'bad' : 'good');
  }

  function triggerDecision(state) {
    const avail = D.DECISIONS.filter(d => !state.seenEvents.includes(d.id));
    const pool = avail.length ? avail : D.DECISIONS;
    const ev = pick(pool);
    state.seenEvents.unshift(ev.id);
    if (state.seenEvents.length > 12) state.seenEvents.length = 12;
    state.pendingDecision = { id: ev.id, day: state.day };
    log(state, '【需要决定】' + ev.title, 'info');
  }

  function resolveDecision(state, index) {
    const pd = state.pendingDecision;
    if (!pd) return { ok: false, msg: '没有待决事件。' };
    const ev = D.DECISIONS.find(d => d.id === pd.id);
    if (!ev || !ev.options[index]) return { ok: false, msg: '选项无效。' };
    const b = state.band;
    const opt = ev.options[index];
    switch (pd.id) {
      case 'festival_offer':
        if (index === 0) {
          earn(state, 9000, '音乐节演出费');
          addFame(state, 2.6); addFans(state, 320);
          b.members.forEach(m => { m.stamina = clamp(m.stamina - 16, 0, 100); m.morale = clamp(m.morale + 3, 0, 100); });
          log(state, '你们在音乐节演了四十分钟。台上风声很大，但台下有人跟着唱。', 'good');
        } else {
          b.chemistry = clamp(b.chemistry + 1, 0, 100);
          log(state, '你们婉拒了邀约。那天晚上排练效果出奇地好。', 'info');
        }
        break;
      case 'brand_deal':
        if (index === 0) {
          earn(state, 120000, '品牌代言');
          addFame(state, 3); addFans(state, 2200); addCred(state, -8);
          log(state, '广告上线了。歌里的那句词被改得面目全非，但账户里多了二十万。', 'money');
        } else {
          addCred(state, 4); addFans(state, 80);
          log(state, '你们拒绝了代言。那句歌词一个字都没改。', 'good');
        }
        break;
      case 'fight':
        if (index === 0) {
          b.chemistry = clamp(b.chemistry + 9, 0, 100);
          b.members.forEach(m => { m.morale = clamp(m.morale + 5, 0, 100); });
          log(state, '你们把话说开，直到凌晨。第二天排练时，那首歌突然有了新的样子。', 'good');
        } else {
          b.members.forEach(m => { m.morale = clamp(m.morale - 7, 0, 100); });
          b.chemistry = clamp(b.chemistry - 3, 0, 100);
          log(state, '你们谁也没先开口。那首新歌后来一直没有录完。', 'bad');
        }
        break;
      case 'bad_review':
        if (index === 0) {
          addFame(state, 2.5); addFans(state, 260); addCred(state, -4);
          log(state, '你在社交平台上回击了那篇乐评。转发很多，争论也很多。', 'info');
        } else {
          addCred(state, 3);
          log(state, '你们没有回应，只是把下一首歌写得更好了。', 'good');
        }
        break;
      case 'cover_collab':
        if (index === 0) {
          earn(state, 60000, '翻唱授权');
          addFans(state, 1800); addCred(state, -5); addFame(state, 1.5);
          log(state, '翻唱版登上热搜。新的听众涌进来，老乐迷在评论区表达不满。', 'money');
        } else {
          addCred(state, 3); addFans(state, 60);
          log(state, '你们拒绝了翻唱。原版在夜里继续被一小部分人反复播放。', 'info');
        }
        break;
      case 'throat':
        if (index === 0) {
          forceCharge(state, 8000, '取消演出的退款');
          b.members.forEach(m => { m.stamina = clamp(m.stamina + 18, 0, 100); m.morale = clamp(m.morale + 4, 0, 100); });
          log(state, '演出取消，退票和道歉花了一些钱。主唱休息了几天，嗓子恢复了。', 'info');
        } else {
          addFame(state, 0.8);
          const singer = b.members.find(m => m.role === 'vocals');
          if (singer) { singer.stamina = clamp(singer.stamina - 35, 0, 100); singer.morale = clamp(singer.morale - 8, 0, 100); }
          log(state, '主唱硬撑着唱完了。最后两首歌几乎是喊出来的，台下却更兴奋了。', 'info');
        }
        break;
      case 'studio_offer':
        if (index === 0) {
          b.studioDiscount = 2;
          addFans(state, -20);
          log(state, '你们接受了录音室的折扣。下一次录音的制作费会减半，宣传片里会出现你们排练的片段。', 'info');
        } else {
          addCred(state, 2);
          log(state, '你们礼貌地拒绝了，继续用那间熟悉的地下室。', 'info');
        }
        break;
      case 'tour_offer':
        if (index === 0) {
          earn(state, 16000, '巡演开场嘉宾');
          addFame(state, 4); addFans(state, 1600); addCred(state, 1);
          b.members.forEach(m => { m.stamina = clamp(m.stamina - 28, 0, 100); });
          log(state, '跟着巡演跑了三座城市。每场都有陌生人在台下举起手机。', 'good');
        } else {
          b.chemistry = clamp(b.chemistry + 2, 0, 100);
          log(state, '你们留在本地写歌。排练室的灯连续亮了几个晚上。', 'info');
        }
        break;
      default:
        break;
    }
    state.pendingDecision = null;
    return { ok: true };
  }

  /* ---------------- song creation ---------------- */
  function writeSong(state, data) {
    if (!data.title || !data.title.trim()) return { ok: false, msg: '歌曲需要一个名字。' };
    if (!data.genre || !GENRE_BY_ID[data.genre]) return { ok: false, msg: '请选择音乐风格。' };
    const days = clamp(Math.round(data.days || 3), 1, 30);
    const cost = days * 220;
    if (!canAfford(state, cost)) return { ok: false, msg: '创作期间的伙食与排练费不足。' };
    charge(state, cost, '创作《' + data.title + '》');
    advanceDays(state, days);
    const song = {
      id: uid('s'),
      title: data.title.trim(),
      genre: data.genre,
      subgenre: data.subgenre || '',
      duration: clamp(Math.round(data.duration || 210), 30, 1800),
      tempo: clamp(Math.round(data.tempo || 120), 40, 260),
      keySig: data.keySig || 'E',
      theme: data.theme || '孤独',
      structure: data.structure || '主歌—副歌',
      language: data.language || '中文',
      explicit: !!data.explicit,
      lyrics: data.lyrics || '',
      credits: data.credits || {},
      writingDays: days,
      writingDay: state.day - days,
      recorded: false,
      releaseId: null,
      quality: { performance: 40, writing: 40, production: 30, originality: 40, overall: 40 }
    };
    song.quality = computeQuality(state, song, { stage: 'demo', days });
    state.songs.push(song);
    state.band.lastActivityDay = state.day;
    const credited = songCreditMembers(state, song);
    credited.forEach(m => { m.exp += 1.2; m.creativity = clamp(m.creativity + (Math.random() < 0.18 ? 1 : 0), 1, 20); });
    log(state, '写完了《' + song.title + '》，' + fmtDur(song.duration) + '，' + (GENRE_BY_ID[song.genre] || {}).name + '。demo 质量评分 ' + song.quality.overall + '。', 'good');
    return { ok: true, song };
  }

  function recordSong(state, songId, opts) {
    const song = state.songs.find(s => s.id === songId);
    if (!song) return { ok: false, msg: '找不到这首歌。' };
    if (song.recorded) return { ok: false, msg: '这首歌已经录完了。' };
    if (song.releaseId) return { ok: false, msg: '这首歌已经安排发行。' };
    const days = clamp(Math.round(opts.days || 3), 1, 30);
    let budget = Math.max(0, Math.round(opts.budget || 0));
    const discount = state.band.studioDiscount > 0;
    const cost = days * 450 + (discount ? Math.round(budget / 2) : budget);
    if (!canAfford(state, cost)) return { ok: false, msg: '录音需要 ' + fmtMoney(cost) + '。' };
    charge(state, cost, '录制《' + song.title + '》');
    advanceDays(state, days);
    if (discount) state.band.studioDiscount--;
    song.budget = budget;
    song.recordingDays = days;
    song.recorded = true;
    song.recordedDay = state.day;
    song.quality = computeQuality(state, song, { stage: 'final', days, budget, staminaPenalty: bandStamina(state) < 40 });
    const credited = songCreditMembers(state, song);
    credited.forEach(m => {
      m.exp += 2;
      m.stamina = clamp(m.stamina - 5, 0, 100);
      if (m.exp >= 6 && m.skill < 20) { m.skill += 1; m.exp = 0; log(state, m.name + '的演奏水平提升到 ' + m.skill + '。', 'good'); }
    });
    state.band.chemistry = clamp(state.band.chemistry + 0.8, 0, 100);
    state.band.lastActivityDay = state.day;
    log(state, '《' + song.title + '》录制完成。最终质量 ' + song.quality.overall + '（演奏 ' + song.quality.performance + ' / 词曲 ' + song.quality.writing + ' / 制作 ' + song.quality.production + ' / 原创 ' + song.quality.originality + '）。', 'good');
    return { ok: true, song };
  }

  /* ---------------- band activities ---------------- */
  function rehearse(state, days) {
    days = clamp(Math.round(days || 3), 1, 14);
    const cost = days * 320;
    if (!canAfford(state, cost)) return { ok: false, msg: '排练室费用不足。' };
    charge(state, cost, '排练 ' + days + ' 天');
    advanceDays(state, days);
    if (state.pendingDecision) return { ok: false, msg: '排练期间发生了需要处理的事情。' };
    state.band.chemistry = clamp(state.band.chemistry + days * 1.6, 0, 100);
    state.band.members.forEach(m => {
      m.exp += days * 0.7;
      m.stamina = clamp(m.stamina - days * 2, 0, 100);
      m.morale = clamp(m.morale + days * 0.4, 0, 100);
      if (m.exp >= 6 && m.skill < 20) { m.skill += 1; m.exp = 0; log(state, m.name + '在排练中突破了自己，演奏能力提升到 ' + m.skill + '。', 'good'); }
    });
    state.band.lastActivityDay = state.day;
    log(state, '连续排练了 ' + days + ' 天。默契度提升到 ' + Math.round(state.band.chemistry) + '。', 'good');
    return { ok: true };
  }

  function rest(state, days) {
    days = clamp(Math.round(days || 3), 1, 21);
    advanceDays(state, days);
    state.band.members.forEach(m => {
      m.stamina = clamp(m.stamina + days * 10, 0, 100);
      m.morale = clamp(m.morale + days * 1.2, 0, 100);
    });
    log(state, '休息了 ' + days + ' 天。有人回家，有人去看了别人的演出。', 'info');
    return { ok: true };
  }

  function work(state) {
    advanceDays(state, 3);
    earn(state, 2200, '临时打工');
    state.band.members.forEach(m => {
      m.stamina = clamp(m.stamina - 9, 0, 100);
      m.morale = clamp(m.morale - 1, 0, 100);
    });
    log(state, '乐队成员去打了三天零工，挣了 ' + fmtMoney(2200) + '。排练室暂时保住了。', 'money');
    return { ok: true };
  }

  function socialMedia(state) {
    if (!canAfford(state, 200)) return { ok: false, msg: '连网费都不够了。' };
    charge(state, 200, '社交媒体维护');
    advanceDays(state, 1);
    const gain = Math.round(rnd(15, 70) + state.band.fame * 2);
    addFans(state, gain);
    addFame(state, rnd(0.05, 0.3));
    state.band.lastActivityDay = state.day;
    log(state, '你们在社交平台上发了一段排练片段，新增 ' + gain + ' 位关注者。', 'good');
    return { ok: true };
  }

  function radioPromo(state, budget) {
    budget = Math.max(1000, Math.round(budget || 5000));
    if (!canAfford(state, budget)) return { ok: false, msg: '宣传预算不足。' };
    charge(state, budget, '电台与媒体宣传');
    advanceDays(state, 2);
    addFame(state, clamp(budget / 10000, 0.3, 4));
    addFans(state, Math.round(budget / 8));
    state.band.lastActivityDay = state.day;
    log(state, '投入 ' + fmtMoney(budget) + ' 做了一轮电台和媒体宣传，知名度上升。', 'good');
    return { ok: true };
  }

  function merch(state, budget) {
    budget = Math.max(1000, Math.round(budget || 5000));
    if (!canAfford(state, budget)) return { ok: false, msg: '制作周边的资金不足。' };
    charge(state, budget, '制作周边');
    const level = clamp(budget / 4000, 0.4, 6);
    state.merch = { until: state.day + 210, level, budget };
    advanceDays(state, 2);
    log(state, '设计并生产了一批周边（T 恤、贴纸、黑胶袋）。未来几个月会持续带来收入。', 'money');
    return { ok: true };
  }

  function recruit(state) {
    if (state.band.members.length >= 7) return { ok: false, msg: '乐队已经满员了（最多 7 人）。' };
    const freeRoles = D.ROLES.filter(r => !state.band.members.some(m => m.role === r.id));
    if (!freeRoles.length) return { ok: false, msg: '所有位置都有人了。' };
    const role = pick(freeRoles);
    const gender = state.band.gender === 'female' ? 'f' : state.band.gender === 'male' ? 'm' : (Math.random() < 0.5 ? 'f' : 'm');
    const name = Math.random() < 0.7 ? chineseName(gender) : westernName(gender);
    const skill = ri(8, 15);
    const fee = 1500 + skill * 400;
    if (!canAfford(state, fee)) return { ok: false, msg: '签约费不足（' + fmtMoney(fee) + '）。' };
    charge(state, fee, '招募 ' + name);
    const m = makeMember(name, role.id, skill);
    state.band.members.push(m);
    addFans(state, 12);
    advanceDays(state, 2);
    log(state, name + '加入乐队，担任' + role.name + '。签约费 ' + fmtMoney(fee) + '。', 'good');
    return { ok: true, member: m };
  }

  function fireMember(state, id) {
    const m = memberById(state, id);
    if (!m) return { ok: false, msg: '找不到成员。' };
    if (state.band.members.length <= 2) return { ok: false, msg: '至少保留两名成员。' };
    state.band.members = state.band.members.filter(x => x.id !== id);
    state.band.chemistry = clamp(state.band.chemistry - 5, 0, 100);
    addFans(state, -Math.round(state.band.fanbase * 0.01));
    log(state, m.name + '离开了乐队。' + m.name + '带走了自己的音箱和几首歌的署名。', 'bad');
    return { ok: true };
  }

  function signLabel(state, labelId) {
    if (state.band.label) return { ok: false, msg: '你们已经签约了。' };
    const lb = D.LABELS.find(l => l.id === labelId);
    if (!lb) return { ok: false, msg: '找不到这个厂牌。' };
    if (state.band.fame < lb.minFame) return { ok: false, msg: '名气还不够，厂牌没有兴趣。' };
    state.band.label = {
      id: lb.id, name: lb.name, cut: lb.cut, reach: lb.reach, promo: lb.promo,
      since: state.day, until: state.day + 720
    };
    earn(state, lb.advance, lb.name + '预付版税');
    addFame(state, 1.5);
    log(state, '正式签约「' + lb.name + '」。预付 ' + fmtMoney(lb.advance) + '，抽成 ' + Math.round(lb.cut * 100) + '%，合约 720 天。', 'good');
    return { ok: true };
  }

  function getLabelOffers(state) {
    if (state.band.label) return [];
    return D.LABELS.filter(l => state.band.fame >= l.minFame);
  }

  /* ---------------- helpers exposed to UI ---------------- */
  function upcoming(state, limit) {
    const items = [];
    state.releases.forEach(r => { if (r.status === 'scheduled') items.push({ day: r.day, text: '发行《' + r.title + '》', type: 'release' }); });
    state.concerts.forEach(c => { if (c.status === 'scheduled') items.push({ day: c.day, text: (VENUE_BY_ID[c.venueId] || {}).name + '演出', type: 'show' }); });
    items.sort((a, b) => a.day - b.day);
    return limit ? items.slice(0, limit) : items;
  }

  function nextEventDay(state) {
    const up = upcoming(state);
    return up.length ? up[0].day : null;
  }

  function activeRivalAlbums(state) {
    return state.rivals.map(rv => {
      const latest = rv.albums.slice().sort((a, b) => b.releaseDay - a.releaseDay)[0];
      return { rival: rv, latest };
    }).sort((a, b) => b.rival.fame - a.rival.fame);
  }

  function weekUnitsOfRelease(state, r) {
    const idx = Math.floor((state.day - r.day) / 7);
    return Math.round(weeklyUnits(r, idx));
  }

  function totalPredictedUnits(state, r) {
    let sum = r.firstWeek;
    for (let i = 1; i <= 40; i++) sum += weeklyUnits(r, i);
    return Math.round(sum);
  }

  BG.engine = {
    // utils
    clamp, rnd, ri, pick, round1, uid,
    dateOf, fmtDay, shortDay, isoDay, dayFromISO, fmtMoney, fmtNum, fmtDur, fmtStars,
    chineseName, westernName, makeMember,
    memberById, memberSkill, bandMorale, bandStamina,
    // lifecycle
    newGame, advanceDays, processDay,
    // actions
    writeSong, recordSong, createRelease, scheduleConcert,
    rehearse, rest, socialMedia, radioPromo, merch, recruit, fireMember, signLabel, work,
    resolveDecision,
    // info
    computeQuality, scoreRelease, releaseGenre, upcoming, nextEventDay,
    activeRivalAlbums, weekUnitsOfRelease, totalPredictedUnits, getLabelOffers,
    buildRatingCount, computeChart,
    // constants refs
    GENRES: D.GENRES, ROLES: D.ROLES, VENUES: D.VENUES, LABELS: D.LABELS,
    FORMATS: D.FORMATS, RELEASE_TYPES: D.RELEASE_TYPES, DECISIONS: D.DECISIONS
  };
})();

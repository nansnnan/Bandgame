(function () {
  const BG = window.BG = window.BG || {};
  const KEY = 'bandlife.save.v1';
  let state = null;
  let ticking = false;

  function save(s) {
    if (s) state = s;
    if (!state) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('保存失败', e); }
  }

  function validate(s) {
    return s && s.version && s.band && s.band.name && Array.isArray(s.band.members) && Array.isArray(s.songs);
  }

  BG.main = {
    getState() { return state; },
    save,
    boot() {
      let raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
      if (raw) {
        try {
          const s = JSON.parse(raw);
          if (validate(s)) {
            state = s;
            BG.ui.start(s);
            return;
          }
        } catch (e) {
          console.warn('存档损坏，开始新游戏', e);
        }
      }
      BG.ui.creation();
    },
    startNew(s) {
      state = s;
      save(s);
      BG.ui.start(s);
    },
    reset() {
      state = null;
      try { localStorage.removeItem(KEY); } catch (e) {}
      BG.ui.creation();
    },
    exportJSON() {
      if (!state) return null;
      return JSON.stringify(state, null, 2);
    },
    importJSON(text) {
      let s;
      try { s = JSON.parse(text); } catch (e) { return { ok: false, msg: '文件不是有效的 JSON。' }; }
      if (!validate(s)) return { ok: false, msg: '这不是一份有效的乐队人生存档。' };
      state = s;
      save(s);
      BG.ui.start(s);
      return { ok: true };
    },
    saveNow() { save(state); }
  };

  window.addEventListener('beforeunload', () => { if (state) save(state); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state) save(state); });
  document.addEventListener('DOMContentLoaded', () => { BG.main.boot(); });
})();

/* Algebra Monsters — game engine and screens.
   Progress is saved in this browser only (localStorage). Everything still works if saving is blocked. */
(function () {
  'use strict';
  var Mon = window.GameMon, GQ = window.GameQ, root = document.getElementById('game');
  if (!Mon || !GQ || !root) return;

  // ---------------------------------------------------------------- helpers
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(s) { return window.HS && window.HS.fmt ? window.HS.fmt(s) : esc(s); }
  function $(s, r) { return (r || document).querySelector(s); }
  var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // ---------------------------------------------------------------- save data
  var KEY = 'hs-algebra-game-v1', S;
  function fresh() { return { v: 1, name: '', party: [], box: [], dex: {}, badges: {}, balls: 5, potions: 2, sfx: true, music: false, uid: 1, stats: { won: 0, ok: 0, total: 0, best: 0, bosses: 0, caught: 0, byL: {} } }; }
  function load() {
    var j = null; try { j = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (j && j.v === 1 && j.box) { S = j; S.stats = S.stats || fresh().stats; S.stats.byL = S.stats.byL || {}; S.badges = S.badges || {}; S.dex = S.dex || {}; } else S = fresh();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function hasSave() { return S.box.length > 0; }
  load();

  // ---------------------------------------------------------------- monster maths
  function stageOf(lv) { return lv >= 12 ? 2 : lv >= 6 ? 1 : 0; }
  function nameOf(sp, lv, boss) { var s = Mon.BY[sp], st = stageOf(lv); return boss ? s.name : (st === 2 ? 'Mega ' : st === 1 ? 'Super ' : '') + s.name; }
  function maxHP(lv) { return 45 + 6 * lv; }
  function xpNeed(lv) { return 20 + 12 * lv; }
  function foeHP(lv, boss) { return boss ? 100 + 16 * lv : 40 + 7 * lv; }
  var MAXLV = 30;
  function monById(id) { for (var i = 0; i < S.box.length; i++) if (S.box[i].id === id) return S.box[i]; return null; }
  function partyMons() { return S.party.map(monById).filter(Boolean); }
  function addMon(sp, lv) {
    var m = { id: S.uid++, sp: sp, lv: lv, xp: 0 }; S.box.push(m); S.dex[sp] = 2;
    if (S.party.length < 3) S.party.push(m.id);
    save(); return m;
  }
  function seen(sp) { if (!S.dex[sp]) { S.dex[sp] = 1; save(); } }
  var MOVES = [
    { id: 'zap', name: 'Quick Zap', ico: '⚡', pow: 20, pp: Infinity, hard: false, desc: 'Reliable hit. Never runs out.' },
    { id: 'slam', name: 'Power Slam', ico: '💥', pow: 36, pp: 6, hard: true, risk: 1.6, desc: 'Big hit, harder question. A wrong answer hurts more.' },
    { id: 'mend', name: 'Mend', ico: '💚', heal: 0.35, pp: 3, hard: false, desc: 'Answer correctly to heal 35% of your HP.' },
    { id: 'blast', name: 'Equation Blast', ico: '🌟', pow: 65, pp: Infinity, combo: 3, hard: true, desc: 'Needs a 3-answer streak. Huge damage.' }
  ];
  var PRAISE = ['Nice one!', 'Spot on!', 'Brilliant!', 'Algebra master!', 'Correct!', 'You nailed it!', 'Smart move!'];

  // ---------------------------------------------------------------- sound (all synthesised, no files)
  var AC = null, musicTimer = null, musicMode = null, musicStep = 0;
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    return AC;
  }
  function tone(f, t0, d, type, vol, to) {
    var c = ac(); if (!c) return; var o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.05);
  }
  function noise(t0, d, vol) {
    var c = ac(); if (!c) return; var n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0);
    for (var i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = vol || 0.12; s.connect(g); g.connect(c.destination); s.start(c.currentTime + t0);
  }
  var SFX = {
    click: function () { tone(740, 0, 0.05, 'square', 0.05); },
    good: function () { tone(523, 0, 0.09, 'square', 0.07); tone(659, 0.09, 0.09, 'square', 0.07); tone(784, 0.18, 0.16, 'square', 0.07); },
    bad: function () { tone(180, 0, 0.22, 'sawtooth', 0.07, 90); },
    hit: function () { noise(0, 0.18, 0.16); tone(220, 0, 0.14, 'square', 0.07, 80); },
    hurt: function () { noise(0, 0.22, 0.18); tone(150, 0, 0.2, 'sawtooth', 0.07, 60); },
    heal: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, i * 0.07, 0.12, 'triangle', 0.08); }); },
    crit: function () { tone(880, 0, 0.06, 'square', 0.07); tone(1320, 0.06, 0.12, 'square', 0.07); },
    level: function () { [523, 659, 784, 1046, 784, 1046, 1318].forEach(function (f, i) { tone(f, i * 0.1, 0.16, 'square', 0.07); }); },
    catchOk: function () { [392, 523, 659, 784, 1046].forEach(function (f, i) { tone(f, i * 0.11, 0.2, 'triangle', 0.1); }); },
    wobble: function () { tone(300, 0, 0.1, 'triangle', 0.08, 220); },
    faint: function () { tone(400, 0, 0.5, 'sawtooth', 0.07, 60); },
    evolve: function () { for (var i = 0; i < 10; i++) tone(300 + i * 80, i * 0.12, 0.14, 'square', 0.06); tone(1400, 1.3, 0.5, 'triangle', 0.1); },
    win: function () { [523, 523, 523, 784, 659, 784, 1046].forEach(function (f, i) { tone(f, i * 0.13, 0.18, 'square', 0.07); }); },
    start: function () { [392, 523, 659].forEach(function (f, i) { tone(f, i * 0.08, 0.1, 'square', 0.06); }); }
  };
  function sfx(n) { if (!S.sfx) return; try { if (SFX[n]) SFX[n](); } catch (e) {} }
  var TUNES = {
    map: { step: 230, root: 220, wave: 'triangle', vol: 0.05, prog: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]], pat: [0, 1, 2, 1, 2, 1, 0, 2] },
    battle: { step: 150, root: 196, wave: 'square', vol: 0.03, prog: [[0, 3, 7], [0, 3, 7], [-2, 2, 5], [-4, 0, 3]], pat: [0, 2, 1, 2, 0, 2, 1, 2] },
    boss: { step: 120, root: 175, wave: 'sawtooth', vol: 0.028, prog: [[0, 3, 6], [0, 3, 6], [-1, 2, 5], [-3, 0, 3]], pat: [0, 1, 2, 1, 0, 2, 2, 1] }
  };
  function music(mode) {
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
    musicMode = mode; if (!S.music || !mode) return;
    var tune = TUNES[mode]; musicStep = 0;
    (function loop() {
      if (!S.music || musicMode !== mode) return;
      var chord = tune.prog[Math.floor(musicStep / 8) % tune.prog.length], n = chord[tune.pat[musicStep % 8]];
      var f = tune.root * Math.pow(2, n / 12) * 2;
      tone(f, 0, tune.step / 1000 * 1.6, tune.wave, tune.vol);
      if (musicStep % 4 === 0) tone(tune.root * Math.pow(2, chord[0] / 12) / 2, 0, tune.step / 1000 * 3, 'triangle', tune.vol * 1.6);
      musicStep++; musicTimer = setTimeout(loop, tune.step);
    })();
  }

  // ---------------------------------------------------------------- generic UI plumbing
  var waiter = null, menuRes = null, menuItems = null, curQ = null, goRes = null, inBattle = false;
  function screen(html, cls) { root.className = 'g-root ' + (cls || ''); root.innerHTML = html; waiter = menuRes = curQ = goRes = null; if (/battle/.test(cls || '')) { try { root.scrollIntoView({ block: 'start' }); } catch (e) {} } }
  function say(text, opt) {
    opt = opt || {};
    return new Promise(function (res) {
      var el = $('#msg'); if (!el) return res(); $('#acts').innerHTML = ''; el.className = 'msg' + (opt.cls ? ' ' + opt.cls : '');
      if (opt.html) { el.innerHTML = text; }
      var i = 0, timer = null, w = { res: res, typing: !opt.html && !reduce };
      function done() { if (timer) clearInterval(timer); w.typing = false; if (!opt.html) el.textContent = text; if (opt.auto) { waiter = null; setTimeout(res, opt.auto); } else { el.insertAdjacentHTML('beforeend', ' <span class="more">▼</span>'); } }
      w.finish = done; waiter = w;
      if (opt.html || reduce) { done(); return; }
      el.textContent = ''; timer = setInterval(function () { i += 2; el.textContent = text.slice(0, i); if (i >= text.length) done(); }, 16);
    });
  }
  function advance() {
    if (!waiter) return false;
    if (waiter.typing) { waiter.finish(); return true; }
    var r = waiter.res; waiter = null; sfx('click'); r(); return true;
  }
  function menu(items, prompt, cls) {
    return new Promise(function (res) {
      var m = $('#msg'); if (prompt != null) { m.className = 'msg'; m.innerHTML = prompt; }
      menuItems = items; menuRes = res;
      $('#acts').innerHTML = '<div class="menu ' + (cls || '') + '">' + items.map(function (it, i) {
        return '<button class="mbtn' + (it.cls ? ' ' + it.cls : '') + '" data-act="pick" data-i="' + i + '"' + (it.disabled ? ' disabled' : '') + '><span class="k">' + (i + 1) + '</span><span class="mt"><b>' + it.label + '</b>' + (it.sub ? '<small>' + it.sub + '</small>' : '') + '</span></button>';
      }).join('') + '</div>';
    });
  }
  function waitGo() { return new Promise(function (r) { goRes = r; }); }
  function anim(el, cls, ms, keep) { if (!el) return sleep(0); el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); return sleep(reduce ? Math.min(ms, 80) : ms).then(function () { if (!keep) el.classList.remove(cls); }); }
  function pop(el) { if (!el) return; el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }

  var A = {}; // click handlers
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (t && A[t.getAttribute('data-act')]) { A[t.getAttribute('data-act')](t, e); return; }
    if (e.target.closest('#panel') && waiter) advance();
  });
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA') return;
    if (curQ && !curQ.done && /^[1-4]$/.test(e.key)) { var b = root.querySelectorAll('.opt')[Number(e.key) - 1]; if (b) { e.preventDefault(); b.click(); } return; }
    if (menuRes && /^[1-9]$/.test(e.key)) { var mb = root.querySelectorAll('.mbtn')[Number(e.key) - 1]; if (mb && !mb.disabled) { e.preventDefault(); mb.click(); } return; }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
      if (goRes) { e.preventDefault(); var g = goRes; goRes = null; sfx('click'); g(); return; }
      if (waiter) { e.preventDefault(); advance(); }
    }
  });
  A.pick = function (t) {
    if (!menuRes) return; var it = menuItems[Number(t.getAttribute('data-i'))]; if (!it || it.disabled) return;
    var r = menuRes; menuRes = null; sfx('click'); r(it.v);
  };
  A.go = function () { if (goRes) { var g = goRes; goRes = null; sfx('click'); g(); } };
  A.ans = function (t) {
    if (!curQ || curQ.done) return; curQ.done = true;
    var i = Number(t.getAttribute('data-i')), ok = curQ.opts[i] === curQ.q.c, q = curQ;
    root.querySelectorAll('.opt').forEach(function (b, k) { b.disabled = true; if (q.opts[k] === q.q.c) b.classList.add('right'); });
    if (!ok) t.classList.add('wrong');
    var tm = $('.timer i'); if (tm) tm.style.animationPlayState = 'paused';
    sfx(ok ? 'good' : 'bad');
    setTimeout(function () { curQ = null; q.res({ ok: ok, ms: Date.now() - q.t0, picked: q.opts[i] }); }, ok ? 550 : 850);
  };
  A.sfx = function () { S.sfx = !S.sfx; save(); refreshToggles(); if (S.sfx) sfx('click'); };
  A.music = function () { S.music = !S.music; save(); refreshToggles(); if (S.music) music(inBattle ? musicMode || 'battle' : 'map'); else music(null); };
  function refreshToggles() {
    root.querySelectorAll('[data-act="sfx"]').forEach(function (b) { b.setAttribute('aria-pressed', S.sfx); b.textContent = S.sfx ? '🔊' : '🔇'; b.title = S.sfx ? 'Sound effects on' : 'Sound effects off'; });
    root.querySelectorAll('[data-act="music"]').forEach(function (b) { b.setAttribute('aria-pressed', S.music); b.textContent = S.music ? '🎵' : '🎶'; b.classList.toggle('off', !S.music); b.title = S.music ? 'Music on' : 'Music off'; });
  }
  function toggles() { return '<button class="tbtn" data-act="sfx" aria-label="Toggle sound effects"></button><button class="tbtn" data-act="music" aria-label="Toggle music"></button>'; }

  // ---------------------------------------------------------------- questions
  function makeQuestionPicker(zone) {
    var used = {}, bank = shuf(GQ.bankFor(zone));
    return function (hard) {
      var q = null, tries = 0;
      if (!hard && bank.length && Math.random() < 0.4) { while (bank.length && !q) { var c = bank.shift(); if (!used[c.q]) q = { q: c.q, c: c.c, w: c.w, e: c.e, l: c.l }; } }
      while (!q && tries++ < 20) { var g = GQ.gen(zone, hard); if (g && !used[g.q]) q = g; }
      if (!q) { var b2 = GQ.bankFor(zone); var c2 = pick(b2.length ? b2 : [{ q: 'Simplify 2x + 3x.', c: '5x', w: ['6x', '5x^2', '6x^2'], e: 'Add the coefficients: 2 + 3 = 5.', l: 1 }]); q = { q: c2.q, c: c2.c, w: c2.w, e: c2.e, l: c2.l }; }
      used[q.q] = 1; return q;
    };
  }
  function recordAnswer(q, ok) {
    var st = S.stats; st.total++; if (ok) st.ok++;
    var l = q.l || 1, a = st.byL[l] || (st.byL[l] = [0, 0]); a[1]++; if (ok) a[0]++;
  }
  function ask(q, tag) {
    return new Promise(function (res) {
      var opts = shuf([q.c].concat(q.w));
      var m = $('#msg'); m.className = 'msg q'; m.innerHTML = '<div class="qtag">' + tag + '</div><div class="qtxt">' + fmt(q.q) + '</div>';
      $('#acts').innerHTML = '<div class="timer" title="Answer in under 7 seconds for a speed bonus"><i></i></div><div class="opts">' + opts.map(function (o, i) {
        return '<button class="opt" data-act="ans" data-i="' + i + '"><span class="k">' + (i + 1) + '</span><span class="ot">' + fmt(o) + '</span></button>';
      }).join('') + '</div>';
      curQ = { opts: opts, q: q, res: res, t0: Date.now(), done: false };
    });
  }
  async function explain(q) {
    $('#msg').className = 'msg q';
    $('#acts').innerHTML = '<div class="explain"><b>The answer is <span class="ans">' + fmt(q.c) + '</span></b><p>' + fmt(q.e || '') + '</p><button class="btn" data-act="go">Got it ▶</button></div>';
    await waitGo();
  }

  // ---------------------------------------------------------------- title + setup screens
  function titleScreen() {
    inBattle = false; music(null);
    var show = ['varrie', 'plusling', 'captain', 'expo', 'coeffy'];
    screen('<div class="title">' +
      '<div class="tbar">' + toggles() + '</div>' +
      '<div class="logo"><small>Headstart Algebra presents</small><h1>Algebra <em>Monsters</em></h1><p>Answer algebra questions to power up your monsters, win battles and catch them all!</p></div>' +
      '<div class="parade">' + show.map(function (id, i) { return '<div class="pm" style="--d:' + (i * 0.35) + 's">' + Mon.svg(id, id === 'captain' ? 2 : 0) + '</div>'; }).join('') + '</div>' +
      '<div class="tbtns">' + (hasSave() ? '<button class="btn big" data-act="continue">▶ Continue</button><button class="btn alt" data-act="newgame">New game</button>' : '<button class="btn big" data-act="newgame">▶ Start your adventure</button>') + '</div>' +
      '<details class="how"><summary>How to play</summary><ol><li><b>Pick a zone.</b> Each of the 7 zones matches one lesson.</li><li><b>Fight:</b> choose a move, then answer the algebra question. Right answer = your monster attacks. Wrong answer = it hits you (and you see why).</li><li><b>Build a streak.</b> 3 in a row earns a Combo Shield and unlocks Equation Blast. Answer in under 7 seconds for a speed bonus.</li><li><b>Catch them all.</b> Weaken a wild monster, then use a Mathball from the Bag and answer to catch it.</li><li><b>Level up and evolve</b> at Lv 6 and Lv 12. Beat each zone boss for a badge and a new team-mate.</li></ol></details>' +
      '<p class="fine">Your monsters are saved on this device. Press 1–4 to answer, Enter to continue.</p></div>', 'g-title');
    refreshToggles();
  }
  A.continue = function () { sfx('start'); mapScreen(); };
  A.newgame = function () {
    if (hasSave() && !A._confirmNew) { A._confirmNew = true; var b = root.querySelector('[data-act="newgame"]'); b.textContent = 'Really erase my save?'; b.classList.add('danger'); setTimeout(function () { A._confirmNew = false; }, 4000); return; }
    A._confirmNew = false; var keep = { sfx: S.sfx, music: S.music }; S = fresh(); S.sfx = keep.sfx; S.music = keep.music; save(); nameScreen();
  };
  function nameScreen() {
    screen('<div class="setup"><h2>Welcome, trainer!</h2><p>What should we call you?</p><form id="nf"><input id="nm" maxlength="14" placeholder="Your name" autocomplete="off" aria-label="Your name"><button class="btn big" type="submit">Next ▶</button></form></div>', 'g-setup');
    var nm = $('#nm'); nm.focus();
    $('#nf').addEventListener('submit', function (e) { e.preventDefault(); S.name = (nm.value || 'Trainer').trim().slice(0, 14) || 'Trainer'; save(); sfx('start'); starterScreen(); });
  }
  function starterScreen() {
    var st = Mon.SPECIES.filter(function (s) { return s.starter; });
    screen('<div class="setup"><h2>Choose your first monster, ' + esc(S.name) + '!</h2><p>Don\'t worry, you can catch many more.</p><div class="starters">' + st.map(function (s) {
      return '<button class="starter" data-act="starter" data-id="' + s.id + '"><div class="sv">' + Mon.svg(s.id, 0) + '</div><b>' + s.name + '</b><span>' + esc(s.blurb) + '</span></button>';
    }).join('') + '</div></div>', 'g-setup');
  }
  A.starter = function (t) {
    var id = t.getAttribute('data-id'); var m = addMon(id, 5); S.balls = 5; S.potions = 2; save(); sfx('catchOk');
    screen('<div class="setup"><h2>' + Mon.BY[id].name + ' joins your team!</h2><div class="sv big">' + Mon.svg(id, 0) + '</div><p>Win battles to level up. At Lv 6 and Lv 12 your monster evolves!</p><button class="btn big" data-act="tomap">Let\'s go ▶</button></div>', 'g-setup');
  };
  A.tomap = function () { mapScreen(); };

  // ---------------------------------------------------------------- map screen
  function bagBar() {
    return '<div class="pill">🎒 Mathballs <b>' + S.balls + '</b></div><div class="pill">🧪 Potions <b>' + S.potions + '</b></div>';
  }
  function mapScreen(msg) {
    inBattle = false; music('map');
    var badges = Object.keys(S.badges).length, party = partyMons();
    var rec = function (z) { var b = 3 + 2 * (z - 1); return 'Lv ' + b + '–' + (b + 2); };
    var nextZ = 1; for (var zz = 1; zz <= 7; zz++) { if (!S.badges[zz]) { nextZ = zz; break; } if (zz === 7) nextZ = 0; }
    var cards = '';
    for (var z = 1; z <= 7; z++) {
      var Z = Mon.ZONES[z], boss = Mon.bossOf(z), wild = Mon.ofZone(z), won = !!S.badges[z];
      var caught = wild.filter(function (s) { return S.dex[s.id] === 2; }).length;
      cards += '<article class="zcard' + (z === nextZ ? ' next' : '') + (won ? ' won' : '') + ([3, 4, 6, 7].indexOf(z) >= 0 ? ' dk' : '') + '" style="--s1:' + Z.sky[0] + ';--s2:' + Z.sky[1] + ';--zh:' + Z.hue + '" id="zone-' + z + '">' +
        '<div class="zhead"><span class="zn">' + z + '</span><div><h3>' + Z.icon + ' ' + Z.name + '</h3><small>Lesson ' + z + ' · ' + esc(Z.lesson) + '</small></div>' + (won ? '<span class="badge" title="Badge earned">🏅</span>' : '') + '</div>' +
        '<div class="zmon">' + wild.map(function (s) { return '<span class="zm" title="' + (S.dex[s.id] ? s.name : '???') + '">' + Mon.svg(s.id, 0, { silhouette: S.dex[s.id] !== 2 }) + '</span>'; }).join('') +
        '<span class="zm boss" title="' + (S.dex[boss.id] ? boss.name : '???') + '">' + Mon.svg(boss.id, 0, { silhouette: S.dex[boss.id] !== 2 }) + '</span></div>' +
        '<p class="zinfo">Wild monsters ' + rec(z) + ' · caught ' + caught + '/' + wild.length + (z === 7 ? ' · mixed questions from all lessons' : '') + '</p>' +
        '<div class="zbtns"><button class="btn small" data-act="explore" data-z="' + z + '">🌿 Explore</button><button class="btn small alt" data-act="boss" data-z="' + z + '">⚔️ ' + (won ? 'Rematch ' : 'Boss: ') + esc(boss.name.split(' ').slice(-1)[0]) + '</button><a class="zl" href="lesson-' + z + '.html">📘 Lesson ' + z + '</a></div>' +
        (z === nextZ ? '<div class="flag">Next up!</div>' : '') + '</article>';
    }
    screen('<div class="map">' +
      '<div class="mhead"><div><small>Trainer</small><b>' + esc(S.name || 'Trainer') + '</b></div><div class="pills">' + bagBar() + '<div class="pill">🏅 Badges <b>' + badges + '/7</b></div></div><div class="mtools"><button class="btn small alt" data-act="team">🐾 Team</button><button class="btn small alt" data-act="dex">📖 Mathdex</button><button class="btn small alt" data-act="card">🪪 Trainer card</button>' + toggles() + '</div></div>' +
      (msg ? '<div class="mmsg">' + msg + '</div>' : '') +
      '<div class="mteam">' + party.map(function (m) { return '<div class="tm"><div class="tv">' + Mon.svg(m.sp, stageOf(m.lv)) + '</div><b>' + esc(nameOf(m.sp, m.lv)) + '</b><small>Lv ' + m.lv + '</small></div>'; }).join('') + '</div>' +
      '<h2 class="mh2">Choose where to battle <small>Each zone matches a lesson. Win the boss to earn a badge and recruit it!</small></h2>' +
      '<div class="zones">' + cards + '</div></div>', 'g-map');
    refreshToggles();
    var zp = /[?&]z=([1-7])/.exec(location.search);
    if (zp && !A._zdone) { A._zdone = true; var el = $('#zone-' + zp[1]); if (el) { el.classList.add('pulse'); setTimeout(function () { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }, 150); } }
  }
  A.explore = function (t) { sfx('start'); startBattle(Number(t.getAttribute('data-z')), 'wild'); };
  A.boss = function (t) { sfx('start'); startBattle(Number(t.getAttribute('data-z')), 'boss'); };

  // ---------------------------------------------------------------- team / dex / trainer card
  function teamScreen() {
    var inP = {}; S.party.forEach(function (id) { inP[id] = 1; });
    var sorted = S.box.slice().sort(function (a, b) { return (inP[b.id] ? 1 : 0) - (inP[a.id] ? 1 : 0) || b.lv - a.lv; });
    screen('<div class="screen"><div class="shead"><h2>🐾 Your monsters</h2><button class="btn small alt" data-act="tomap">← Back to map</button></div><p class="hint">Pick up to 3 monsters to take into battle (tap to add or remove). ' + S.party.length + '/3 selected. Monsters evolve at Lv 6 and Lv 12.</p><div class="tgrid">' + sorted.map(function (m) {
      var sp = Mon.BY[m.sp], st = stageOf(m.lv), pct = m.lv >= MAXLV ? 100 : Math.round(100 * m.xp / xpNeed(m.lv));
      return '<button class="tcard' + (inP[m.id] ? ' on' : '') + '" data-act="toggle" data-id="' + m.id + '" aria-pressed="' + !!inP[m.id] + '"><div class="tv">' + Mon.svg(m.sp, st) + '</div><b>' + esc(nameOf(m.sp, m.lv)) + '</b><small>Lv ' + m.lv + ' · ' + maxHP(m.lv) + ' HP</small><div class="xpbar"><i style="width:' + pct + '%"></i></div>' + (inP[m.id] ? '<span class="tag">In team</span>' : '') + '</button>';
    }).join('') + '</div></div>', 'g-screen');
  }
  A.team = function () { teamScreen(); };
  A.toggle = function (t) {
    var id = Number(t.getAttribute('data-id')), i = S.party.indexOf(id);
    if (i >= 0) { if (S.party.length > 1) S.party.splice(i, 1); } else if (S.party.length < 3) S.party.push(id);
    save(); sfx('click'); teamScreen();
  };
  function dexScreen(sel) {
    var caught = Mon.SPECIES.filter(function (s) { return S.dex[s.id] === 2; }).length;
    var d = sel && Mon.BY[sel] && S.dex[sel] ? Mon.BY[sel] : null, detail = '';
    if (d) detail = '<div class="ddetail"><div class="dv">' + Mon.svg(d.id, d.boss ? 2 : 0, { silhouette: S.dex[d.id] !== 2 }) + '</div><div><h3>' + (S.dex[d.id] === 2 ? d.name : '???') + (d.boss ? ' <span class="tag">Boss</span>' : '') + '</h3><small>' + (d.starter ? 'Starter' : Mon.ZONES[d.z].icon + ' ' + Mon.ZONES[d.z].name + ' · Lesson ' + d.z) + '</small>' + (d.title ? '<small> · ' + d.title + '</small>' : '') + '<p>' + (S.dex[d.id] === 2 ? esc(d.blurb) : 'Catch this monster to learn about it.') + '</p></div></div>';
    screen('<div class="screen"><div class="shead"><h2>📖 Mathdex <small>' + caught + '/' + Mon.SPECIES.length + ' caught</small></h2><button class="btn small alt" data-act="tomap">← Back to map</button></div>' + detail + '<div class="dgrid">' + Mon.SPECIES.map(function (s) {
      var k = S.dex[s.id] || 0;
      return '<button class="dcell' + (k === 2 ? ' got' : '') + (sel === s.id ? ' sel' : '') + '" data-act="dexpick" data-id="' + s.id + '" aria-label="' + (k ? s.name : 'Unknown monster') + '"><div class="dv">' + Mon.svg(s.id, s.boss ? 2 : 0, { silhouette: k !== 2 }) + '</div><small>' + (k ? s.name : '???') + '</small></button>';
    }).join('') + '</div></div>', 'g-screen');
  }
  A.dex = function () { dexScreen(); };
  A.dexpick = function (t) { sfx('click'); dexScreen(t.getAttribute('data-id')); };
  function cardScreen() {
    var st = S.stats, acc = st.total ? Math.round(100 * st.ok / st.total) : 0, weakest = null, wv = 101;
    var rows = '';
    for (var l = 1; l <= 7; l++) {
      var a = st.byL[l] || [0, 0], p = a[1] ? Math.round(100 * a[0] / a[1]) : null;
      if (a[1] >= 5 && p < wv) { wv = p; weakest = l; }
      rows += '<div class="arow"><span>Lesson ' + l + '</span><div class="abar"><i style="width:' + (p || 0) + '%;background:hsl(' + Mon.ZONES[l].hue + ',70%,52%)"></i></div><b>' + (p === null ? '–' : p + '%') + '</b><small>' + a[1] + ' qs</small></div>';
    }
    var badgeRow = ''; for (var z = 1; z <= 7; z++) badgeRow += '<span class="bdg' + (S.badges[z] ? ' on' : '') + '" style="--zh:' + Mon.ZONES[z].hue + '" title="' + Mon.ZONES[z].name + '">' + (S.badges[z] ? Mon.ZONES[z].icon : '?') + '</span>';
    screen('<div class="screen"><div class="shead"><h2>🪪 Trainer card</h2><button class="btn small alt" data-act="tomap">← Back to map</button></div>' +
      '<div class="tcardbox"><div class="who"><b>' + esc(S.name || 'Trainer') + '</b><small>' + S.box.length + ' monsters · ' + Mon.SPECIES.filter(function (s) { return S.dex[s.id] === 2; }).length + '/' + Mon.SPECIES.length + ' in the Mathdex</small></div><div class="bdgs">' + badgeRow + '</div>' +
      '<div class="stats"><div><b>' + st.won + '</b><small>Battles won</small></div><div><b>' + st.total + '</b><small>Questions answered</small></div><div><b>' + acc + '%</b><small>Accuracy</small></div><div><b>' + st.best + '</b><small>Best streak</small></div><div><b>' + st.caught + '</b><small>Monsters caught</small></div><div><b>' + st.bosses + '</b><small>Bosses beaten</small></div></div>' +
      '<h3>Accuracy by lesson</h3><div class="alist">' + rows + '</div>' +
      (weakest ? '<p class="tip">💡 Your trickiest topic so far is <b>Lesson ' + weakest + '</b>. <a href="lesson-' + weakest + '.html">Revise it</a> then come back and battle in Zone ' + weakest + '!</p>' : '<p class="tip">Answer a few more questions in each zone and your best and trickiest topics will show up here.</p>') +
      '<button class="btn small alt danger-soft" data-act="reset">Reset all progress</button></div></div>', 'g-screen');
  }
  A.card = function () { cardScreen(); };
  A.reset = function (t) {
    if (!A._r) { A._r = true; t.textContent = 'Tap again to erase everything'; t.classList.add('danger'); setTimeout(function () { A._r = false; }, 4000); return; }
    A._r = false; var keep = { sfx: S.sfx, music: S.music }; S = fresh(); S.sfx = keep.sfx; S.music = keep.music; save(); titleScreen();
  };

  // ---------------------------------------------------------------- battle scene
  var B = null;
  function sceneHTML(z) {
    var Z = Mon.ZONES[z];
    return '<div class="bwrap"><div class="scene" id="scene" style="--s1:' + Z.sky[0] + ';--s2:' + Z.sky[1] + ';--g1:' + Z.ground + ';--g2:' + Z.ground2 + '">' +
      '<span class="dc d1">' + Z.decor[0] + '</span><span class="dc d2">' + Z.decor[1] + '</span><span class="dc d3">' + Z.decor[2] + '</span><span class="dc d4">' + Z.decor[3] + '</span>' +
      '<div class="plat pf"></div><div class="plat pm"></div>' +
      '<div class="mon foe" id="foe"></div><div class="mon me" id="me"></div>' +
      '<div class="hud hf" id="hf"></div><div class="hud hm" id="hm"></div><div class="fxl" id="fxl"></div><div class="stag" id="stag"></div>' +
      '<div class="btools">' + toggles() + '</div></div>' +
      '<div class="panel" id="panel"><div class="msg" id="msg"></div><div class="acts" id="acts"></div></div></div>';
  }
  function bar(cur, max, cls) { var p = Math.max(0, Math.round(100 * cur / max)); return '<div class="hpbar ' + cls + '"><i class="' + (p <= 25 ? 'low' : p <= 50 ? 'mid' : '') + '" style="width:' + p + '%"></i></div>'; }
  function setHud() {
    var f = B.foe, m = B.me;
    $('#hf').innerHTML = '<div class="hn"><b>' + esc(nameOf(f.sp, f.lv, f.boss)) + '</b><span>Lv ' + f.lv + '</span></div>' + (f.boss ? '<div class="btitle">👑 ' + esc(Mon.BY[f.sp].title) + '</div>' : '') + bar(f.hp, f.max, 'foebar');
    var mon = m.mon, pct = mon.lv >= MAXLV ? 100 : Math.round(100 * mon.xp / xpNeed(mon.lv));
    $('#hm').innerHTML = '<div class="hn"><b>' + esc(nameOf(mon.sp, mon.lv)) + '</b><span>Lv ' + mon.lv + '</span></div>' + bar(m.hp, m.max, 'mebar') + '<div class="hnum">' + Math.max(0, m.hp) + ' / ' + m.max + ' HP</div><div class="xpbar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="cmb">' + (B.combo > 0 ? '<span class="flame">🔥 Streak ×' + B.combo + '</span>' : '') + (B.shield ? '<span class="shld">🛡️ Shield</span>' : '') + '</div>';
  }
  function drawMons() {
    var f = B.foe, mon = B.me.mon;
    $('#foe').innerHTML = Mon.svg(f.sp, f.boss ? 2 : stageOf(f.lv));
    $('#me').innerHTML = Mon.svg(mon.sp, stageOf(mon.lv));
  }
  function floatNum(side, text, cls) {
    var el = document.createElement('div'); el.className = 'fnum ' + side + ' ' + (cls || ''); el.textContent = text; var l = $('#fxl'); if (!l) return; l.appendChild(el); setTimeout(function () { el.remove(); }, 1300);
  }
  function burst(side, chars) {
    if (reduce) return; var l = $('#fxl'); if (!l) return;
    for (var i = 0; i < 9; i++) { var s = document.createElement('span'); s.className = 'pt ' + side; s.textContent = pick(chars); s.style.setProperty('--dx', ri(-90, 90) + 'px'); s.style.setProperty('--dy', ri(-110, -20) + 'px'); l.appendChild(s); (function (x) { setTimeout(function () { x.remove(); }, 1000); })(s); }
  }
  function stagBanner(text) { var e = $('#stag'); if (!e) return Promise.resolve(); e.textContent = text; return anim(e, 'show', 1100); }

  async function startBattle(zoneN, kind) {
    var party = partyMons(); if (!party.length) { mapScreen(); return; }
    inBattle = true;
    var Z = Mon.ZONES[zoneN], boss = kind === 'boss', sp = boss ? Mon.bossOf(zoneN) : pick(Mon.ofZone(zoneN));
    var base = 3 + 2 * (zoneN - 1), flv = boss ? base + 4 : base + ri(0, 2);
    seen(sp.id);
    B = {
      zone: zoneN, kind: kind, boss: boss, pick: makeQuestionPicker(zoneN), combo: 0, shield: false, round: 0,
      foe: { sp: sp.id, lv: flv, boss: boss, max: foeHP(flv, boss), hp: foeHP(flv, boss) },
      team: party.map(function (m) { return { mon: m, hp: maxHP(m.lv), max: maxHP(m.lv), pp: { slam: 6, mend: 3 }, fainted: false }; }), bestCombo: 0, answered: 0, correct: 0
    };
    B.me = B.team[0];
    screen(sceneHTML(zoneN), 'g-battle'); refreshToggles(); drawMons(); setHud();
    music(boss ? 'boss' : 'battle'); sfx('start');
    var fe = $('#foe'), me = $('#me'); fe.classList.add('enter'); me.classList.add('enter');
    if (boss) { await say('⚔️ ' + sp.name + ', the ' + sp.title + ', blocks your path!'); await say('“' + sp.taunt + '”'); }
    else await say('A wild ' + nameOf(sp.id, flv) + ' (Lv ' + flv + ') appeared!');
    await say('Go, ' + nameOf(B.me.mon.sp, B.me.mon.lv) + '!', { auto: 500 });
    var result = await battleLoop();
    await endBattle(result);
  }

  function foeDamage(mult) {
    var f = B.foe, d = f.boss ? 14 + B.zone * 3 + Math.round(f.lv * 0.8) : 8 + B.zone * 2 + Math.round(f.lv * 0.6);
    return Math.max(1, Math.round(d * (mult || 1) * (0.9 + Math.random() * 0.2)));
  }
  async function foeAttack(mult, label) {
    var f = B.foe, fs = Mon.BY[f.sp], fe = $('#foe'), me = $('#me');
    await say((label || (fs.name.split(' ').slice(-1)[0] + ' attacks!')), { auto: 380 });
    await anim(fe, 'lunge-f', 420);
    if (B.shield) {
      B.shield = false; setHud(); sfx('crit'); floatNum('me', 'BLOCKED', 'blk'); await anim($('#scene'), 'flash', 300);
      await say('🛡️ Your Combo Shield blocked the attack!'); return;
    }
    var d = foeDamage(mult); sfx('hurt'); B.me.hp = Math.max(0, B.me.hp - d); floatNum('me', '-' + d, 'dmg');
    anim(me, 'hit', 480); await anim($('#scene'), 'shake', 380); setHud();
    await say('It dealt ' + d + ' damage.', { auto: 400 });
  }
  async function playerHit(pow, extra) {
    var mon = B.me.mon, fe = $('#foe'), me = $('#me');
    await anim(me, 'lunge-m', 420); sfx(extra.crit ? 'crit' : 'hit');
    var d = Math.round(pow * (1 + 0.05 * mon.lv) * (1 + Math.min(B.combo, 5) * 0.05) * (extra.quick ? 1.25 : 1) * (0.92 + Math.random() * 0.16));
    B.foe.hp = Math.max(0, B.foe.hp - d); floatNum('foe', '-' + d, extra.quick ? 'crit' : 'dmg'); burst('foe', ['✨', '⭐', '💥']);
    anim(fe, 'hit', 480); await anim($('#scene'), 'shake', 320); setHud(); return d;
  }
  async function mainMenu() {
    var f = B.foe;
    var act = await menu([
      { label: '⚔️ Fight', sub: 'Pick a move, answer to attack', v: 'fight' },
      { label: '🎒 Bag', sub: 'Mathballs ' + S.balls + ' · Potions ' + S.potions, v: 'bag' },
      { label: '🔄 Team', sub: 'Swap your monster', v: 'team' },
      { label: B.boss ? '🏳️ Retreat' : '🏃 Run', sub: B.boss ? 'Leave the battle' : 'Escape the battle', v: 'run' }
    ], 'What will <b>' + esc(nameOf(B.me.mon.sp, B.me.mon.lv)) + '</b> do?', 'compact');
    return act;
  }
  async function pickMove() {
    var items = MOVES.map(function (m) {
      var ppLeft = m.pp === Infinity ? null : B.me.pp[m.id], dis = false, sub = m.desc;
      if (ppLeft !== null) { sub += ' (PP ' + ppLeft + ')'; if (ppLeft <= 0) dis = true; }
      if (m.combo && B.combo < m.combo) { dis = true; sub = 'Needs a streak of ' + m.combo + ' (now ' + B.combo + ')'; }
      if (m.id === 'mend' && B.me.hp >= B.me.max) { dis = true; sub = 'Already at full HP'; }
      return { label: m.ico + ' ' + m.name, sub: sub, v: m, disabled: dis, cls: m.hard ? 'hardm' : '' };
    });
    items.push({ label: '← Back', v: null, cls: 'back' });
    return menu(items, 'Choose a move');
  }
  async function bagMenu() {
    var items = [
      { label: '⚪ Mathball', sub: B.boss ? 'Bosses can\'t be caught yet. Beat them to recruit them!' : 'Answer a question to try to catch it (' + S.balls + ' left)', v: 'ball', disabled: B.boss || S.balls <= 0 },
      { label: '🧪 Potion', sub: 'Heal 40 HP (' + S.potions + ' left)', v: 'potion', disabled: S.potions <= 0 || B.me.hp >= B.me.max },
      { label: '← Back', v: null, cls: 'back' }];
    return menu(items, 'Your bag');
  }
  async function teamMenu(forced) {
    var items = B.team.map(function (t, i) {
      var dis = t.fainted || t === B.me;
      return { label: esc(nameOf(t.mon.sp, t.mon.lv)) + ' <span class="lvl">Lv ' + t.mon.lv + '</span>', sub: t.fainted ? 'Fainted' : (t === B.me ? 'In battle' : t.hp + ' / ' + t.max + ' HP'), v: t, disabled: dis };
    });
    if (!forced) items.push({ label: '← Back', v: null, cls: 'back' });
    return menu(items, forced ? 'Choose your next monster!' : 'Swap to which monster?');
  }
  async function swapTo(t) {
    var me = $('#me'); await say('Come back, ' + nameOf(B.me.mon.sp, B.me.mon.lv) + '!', { auto: 350 });
    me.classList.add('out'); await sleep(250); B.me = t; B.combo = 0; B.shield = false; drawMons(); setHud(); me.classList.remove('out'); pop(me);
    await say('Go, ' + nameOf(t.mon.sp, t.mon.lv) + '!', { auto: 450 });
  }

  async function battleLoop() {
    while (true) {
      var act = await mainMenu();
      if (act === 'run') { if (B.boss) { await say('You retreat. The boss will be waiting...'); } else await say('Got away safely!'); return 'run'; }
      if (act === 'team') { var tt = await teamMenu(false); if (tt) { await swapTo(tt); } continue; }
      if (act === 'bag') {
        var it = await bagMenu(); if (!it) continue;
        if (it === 'potion') {
          S.potions--; save(); B.me.hp = Math.min(B.me.max, B.me.hp + 40); sfx('heal'); floatNum('me', '+40', 'heal'); burst('me', ['💚', '✨']); setHud();
          await say('You used a Potion. +40 HP!'); await foeAttack(0.5, 'The enemy takes advantage!');
        } else {
          var r = await throwBall(); if (r === 'caught') return 'caught';
        }
        if (B.me.hp <= 0) { var o = await handleFaint(); if (o === 'lost') return 'lost'; }
        continue;
      }
      var mv = await pickMove(); if (!mv) continue;
      var q = B.pick(mv.hard), hard = mv.hard;
      if (mv.pp !== Infinity) B.me.pp[mv.id]--;
      var res = await ask(q, mv.ico + ' ' + mv.name + (hard ? ' · tough question' : ''));
      recordAnswer(q, res.ok); B.answered++; if (res.ok) B.correct++;
      if (res.ok) {
        B.combo++; if (B.combo > B.bestCombo) B.bestCombo = B.combo; if (B.combo > S.stats.best) S.stats.best = B.combo;
        var quick = res.ms < 7000, msgPre = pick(PRAISE) + (quick ? ' ⚡ Speed bonus!' : '');
        if (mv.heal) {
          var hv = Math.round(B.me.max * mv.heal); B.me.hp = Math.min(B.me.max, B.me.hp + hv); sfx('heal'); floatNum('me', '+' + hv, 'heal'); burst('me', ['💚', '✨']); setHud();
          await say(msgPre + ' ' + esc(nameOf(B.me.mon.sp, B.me.mon.lv)) + ' healed ' + hv + ' HP!');
        } else {
          if (mv.combo) { await stagBanner('EQUATION BLAST!'); }
          await say(msgPre, { auto: 420 });
          await playerHit(mv.pow, { quick: quick, crit: mv.combo || quick });
          if (mv.combo) { B.combo = 0; }
        }
        if (B.combo === 3 && !B.shield) { B.shield = true; setHud(); sfx('crit'); await say('🛡️ Streak of 3! You earned a Combo Shield.'); }
        setHud(); save();
        if (B.foe.hp <= 0) return 'won';
        if (B.foe.hp <= B.foe.max * 0.5 && B.boss) { await foeAttack(0.45, esc(Mon.BY[B.foe.sp].name) + ' fights back, enraged!'); if (B.me.hp <= 0) { var o2 = await handleFaint(); if (o2 === 'lost') return 'lost'; } }
        if (!B.boss && B.foe.hp <= B.foe.max * 0.5 && !B.hinted && S.balls > 0) { B.hinted = true; await say('💡 It looks weak. Try a Mathball from the Bag!'); }
      } else {
        B.combo = 0; setHud(); await explain(q);
        if (mv.heal) { await say('The healing fizzled out...', { auto: 300 }); }
        await foeAttack(mv.risk || 1);
        if (B.me.hp <= 0) { var o3 = await handleFaint(); if (o3 === 'lost') return 'lost'; }
      }
      save();
    }
  }
  async function handleFaint() {
    var me = $('#me'); sfx('faint'); await anim(me, 'faint', 700, true); B.me.fainted = true;
    await say(esc(nameOf(B.me.mon.sp, B.me.mon.lv)) + ' fainted!');
    var alive = B.team.filter(function (t) { return !t.fainted; });
    if (!alive.length) return 'lost';
    var tt = await teamMenu(true); B.me = tt; B.combo = 0; B.shield = false; me.classList.remove('faint'); drawMons(); setHud(); pop(me);
    await say('Go, ' + nameOf(tt.mon.sp, tt.mon.lv) + '!', { auto: 450 }); return 'ok';
  }
  async function throwBall() {
    S.balls--; save(); B.hinted = true;
    var q = B.pick(false), res;
    var low = B.foe.hp <= B.foe.max * 0.5;
    res = await ask(q, '⚪ Mathball · ' + (low ? 'it is weak, so a correct answer will catch it!' : 'a correct answer gives you a chance'));
    recordAnswer(q, res.ok); B.answered++; if (res.ok) B.correct++;
    if (!res.ok) { B.combo = 0; setHud(); await explain(q); await say('The Mathball missed!', { auto: 400 }); await foeAttack(1); return 'miss'; }
    var fe = $('#foe'), sc = $('#scene');
    var ball = document.createElement('div'); ball.className = 'ball'; sc.appendChild(ball); sfx('click'); await sleep(550);
    fe.classList.add('suck'); await sleep(450);
    var success = low || Math.random() < 0.45, shakes = success ? 3 : ri(1, 2);
    for (var i = 0; i < shakes; i++) { ball.classList.remove('wob'); void ball.offsetWidth; ball.classList.add('wob'); sfx('wobble'); await sleep(750); }
    if (success) {
      sfx('catchOk'); ball.classList.add('done'); burst('foe', ['⭐', '✨', '🎉']);
      var f = B.foe, m = addMon(f.sp, f.lv); S.stats.caught++; save();
      await say('Gotcha! ' + nameOf(f.sp, f.lv) + ' was caught!'); ball.remove();
      await say(S.party.indexOf(m.id) >= 0 ? 'It joined your team.' : 'It was sent to your collection. Pick your team any time from the map.');
      await giveXP(0.6); return 'caught';
    }
    ball.remove(); fe.classList.remove('suck'); sfx('bad'); await say('Oh no! It broke free!', { auto: 400 }); await foeAttack(1); return 'miss';
  }

  async function giveXP(share) {
    var f = B.foe, base = Math.round((f.lv * 10 + 25) * (f.boss ? 2 : 1) * (share || 1));
    for (var i = 0; i < B.team.length; i++) {
      var t = B.team[i], mon = t.mon, gain = t === B.me || !t.fainted ? base : Math.round(base * 0.5);
      if (mon.lv >= MAXLV) continue;
      var before = stageOf(mon.lv), up = 0; mon.xp += gain;
      while (mon.lv < MAXLV && mon.xp >= xpNeed(mon.lv)) { mon.xp -= xpNeed(mon.lv); mon.lv++; up++; }
      if (i === 0 || t === B.me) await say(esc(nameOf(mon.sp, mon.lv - up)) + ' gained ' + gain + ' XP!', { auto: 500 });
      if (up) {
        sfx('level'); if (t === B.me) { t.max = maxHP(mon.lv); t.hp = t.max; setHud(); burst('me', ['⬆️', '✨', '⭐']); }
        await say('🎉 ' + esc(nameOf(mon.sp, mon.lv - up)) + ' grew to Lv ' + mon.lv + '!');
        if (stageOf(mon.lv) > before) await evolve(t, before);
      }
    }
    save();
  }
  async function evolve(t, oldStage) {
    var mon = t.mon, me = $('#me'); if (t !== B.me) { await say('✨ ' + esc(nameOf(mon.sp, mon.lv)) + ' evolved!'); return; }
    await say('What? ' + esc(Mon.BY[mon.sp].name) + ' is evolving!'); sfx('evolve');
    me.classList.add('evolving'); await sleep(reduce ? 200 : 1300); me.innerHTML = Mon.svg(mon.sp, stageOf(mon.lv)); await sleep(reduce ? 100 : 700); me.classList.remove('evolving'); burst('me', ['✨', '🌟', '⭐']);
    sfx('level'); await say('✨ It evolved into ' + esc(nameOf(mon.sp, mon.lv)) + '! It is stronger now.');
  }
  async function endBattle(result) {
    var rewardsHTML = '';
    if (result === 'won') {
      music(null); sfx('win'); var f = B.foe; S.stats.won++;
      await anim($('#foe'), 'faint', 700, true);
      await say(esc(nameOf(f.sp, f.lv, f.boss)) + ' was defeated!');
      await giveXP(1);
      if (B.boss) {
        S.stats.bosses++; var first = !S.badges[B.zone]; S.badges[B.zone] = 1; S.balls += 3; S.potions += 2; save();
        if (first) { await stagBanner('BADGE EARNED!'); sfx('level'); await say('🏅 You earned the ' + Mon.ZONES[B.zone].name + ' badge! +3 Mathballs, +2 Potions.'); }
        else await say('+3 Mathballs, +2 Potions for the rematch win!');
        if (S.dex[f.sp] !== 2) { var m = addMon(f.sp, f.lv); S.stats.caught++; await say('👑 ' + Mon.BY[f.sp].name + ' respects your skill and joins you!'); }
        if (Object.keys(S.badges).length === 7 && first) await say('🏆 You have all 7 badges! You are a true Algebra Champion!');
      } else {
        var b = Math.random() < 0.6 ? 1 : 0, p = Math.random() < 0.25 ? 1 : 0; S.balls += b; S.potions += p; save();
        if (b || p) await say('You found ' + (b ? '1 Mathball' : '') + (b && p ? ' and ' : '') + (p ? '1 Potion' : '') + '!');
      }
    } else if (result === 'lost') {
      sfx('faint'); await say('All your monsters fainted... You rush to the healer.');
    }
    var acc = B.answered ? Math.round(100 * B.correct / B.answered) : 0;
    var tip = '';
    if (result === 'lost') tip = 'Tip: 📘 <a href="lesson-' + (B.zone === 7 ? 1 : B.zone) + '.html">review the lesson</a> then try again. Your team is fully healed.';
    var summary = '';
    if (B.answered) summary = '<b>Last battle:</b> ' + B.correct + '/' + B.answered + ' correct (' + acc + '%) · best streak ' + B.bestCombo + '. ' + tip;
    else if (result === 'run') summary = '';
    save(); B = null; mapScreen(summary);
  }

  // ---------------------------------------------------------------- go
  A.home = titleScreen;
  if (hasSave() && /[?&]z=[1-7]/.test(location.search)) { mapScreen(); } else titleScreen();
})();

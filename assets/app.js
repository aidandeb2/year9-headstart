/* Headstart Algebra — shared script.
   Progress is saved in this browser only (localStorage). Everything still works if saving is blocked. */
(function () {
  var KEY = 'hs-algebra-v1', mem = null;
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)); } catch (e) { mem = null; }
    mem = mem || {}; mem.checks = mem.checks || {}; mem.done = mem.done || {}; mem.best = mem.best || {};
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(load())); } catch (e) {} }
  var HS = window.HS = { load: load, save: save, total: 7 };

  // ---- shared escaping + maths formatting (^2 -> superscript, [a|b] -> fraction)
  HS.fmt = function (s) {
    s = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/\^(\d+)/g, '<sup>$1</sup>');
    s = s.replace(/\[([^|\]]+)\|([^\]]+)\]/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
    return s;
  };

  function criteriaCount(n) {
    var s = load(), c = 0, t = 0;
    for (var i = 0; i < 12; i++) { var k = 'c' + n + '-' + i; if (k in s.checks || document.querySelector('[data-key="' + k + '"]')) { t++; if (s.checks[k]) c++; } }
    return [c, t];
  }

  var page = document.body.getAttribute('data-page');

  // ---- strip + tiles: mark finished lessons
  function paintDone() {
    var s = load();
    document.querySelectorAll('[data-lesson-link]').forEach(function (a) {
      a.classList.toggle('done', !!s.done[a.getAttribute('data-lesson-link')]);
    });
  }

  // ---- lesson page
  if (page === 'lesson') {
    var n = document.body.getAttribute('data-lesson'), st = load();
    var boxes = document.querySelectorAll('input[data-key]');
    var meter = document.getElementById('meter'), mtext = document.getElementById('mtext'), done = document.getElementById('donebtn');
    function refresh() {
      var c = 0; boxes.forEach(function (b) { if (b.checked) c++; });
      if (meter) meter.style.width = (boxes.length ? c / boxes.length * 100 : 0) + '%';
      if (mtext) mtext.textContent = c === boxes.length ? 'All ticked. Nice work! Try the quiz to prove it.' : c + ' of ' + boxes.length + ' ticked';
    }
    boxes.forEach(function (b) {
      b.checked = !!st.checks[b.getAttribute('data-key')];
      b.addEventListener('change', function () { st.checks[b.getAttribute('data-key')] = b.checked; save(); refresh(); });
    });
    refresh();
    function paintBtn() {
      if (!done) return;
      var d = !!st.done[n];
      done.textContent = d ? '✓ Lesson finished (click to undo)' : 'Mark lesson as finished';
      done.classList.toggle('ok', d); done.classList.toggle('alt', !d);
    }
    if (done) done.addEventListener('click', function () { st.done[n] = !st.done[n]; if (!st.done[n]) delete st.done[n]; save(); paintBtn(); paintDone(); });
    paintBtn();
    st.last = Number(n); save();

    // captions: built from window.CAPTIONS so they also work from a local folder
    document.querySelectorAll('video[data-captions]').forEach(function (v) {
      var cues = (window.CAPTIONS || {})[v.getAttribute('data-captions')]; if (!cues) return;
      try {
        var tr = v.addTextTrack('captions', 'English', 'en');
        cues.forEach(function (c) { tr.addCue(new VTTCue(c[0], c[1], c[2])); });
        tr.mode = 'showing';
      } catch (e) {}
    });
    // video helpers: chapter buttons, speed buttons
    document.querySelectorAll('[data-seek]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = document.getElementById(b.getAttribute('data-video'));
        if (!v) return; v.currentTime = parseFloat(b.getAttribute('data-seek')); v.play();
        v.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    });
    document.querySelectorAll('[data-speed]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = document.getElementById(b.getAttribute('data-video')); if (!v) return;
        v.playbackRate = parseFloat(b.getAttribute('data-speed'));
        document.querySelectorAll('[data-speed][data-video="' + v.id + '"]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      });
    });
  }

  // ---- home page: progress ring, per-tile bars, continue button
  if (page === 'home') {
    var s2 = load(), doneN = 0;
    document.querySelectorAll('.tile[data-lesson]').forEach(function (t) {
      var ln = t.getAttribute('data-lesson'), crit = Number(t.getAttribute('data-crit')), c = 0;
      for (var i = 0; i < crit; i++) if (s2.checks['c' + ln + '-' + i]) c++;
      var bar = t.querySelector('.bar i'); if (bar) bar.style.width = (crit ? c / crit * 100 : 0) + '%';
      var tx = t.querySelector('.ptext'); if (tx) tx.textContent = c + '/' + crit + ' goals ticked';
      if (s2.done[ln]) { t.classList.add('done'); doneN++; }
    });
    var pct = Math.round(doneN / HS.total * 100), ring = document.getElementById('ring');
    if (ring) { ring.style.setProperty('--p', pct); ring.firstElementChild.textContent = doneN + '/' + HS.total; }
    var pt = document.getElementById('ptext');
    if (pt) pt.textContent = doneN === 0 ? 'No lessons finished yet. Let’s go!' : doneN === HS.total ? 'All 7 lessons finished. Fantastic!' : doneN + ' of 7 lessons finished.';
    var go = document.getElementById('gobtn');
    if (go && s2.last) { go.href = 'lesson-' + s2.last + '.html'; go.textContent = 'Continue Lesson ' + s2.last + ' →'; }
    var bests = [], k;
    for (k in s2.best) bests.push(k);
    var bt = document.getElementById('besttext');
    if (bt && bests.length) bt.textContent = 'Quiz best' + (s2.best.all != null ? ' (mixed): ' + s2.best.all + '%' : ': ' + s2.best[bests[0]] + '%');
    var rs = document.getElementById('reset');
    if (rs) rs.addEventListener('click', function () {
      if (confirm('Clear all your ticks, finished lessons and quiz scores on this device?')) { mem = {}; try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }
    });
  }
  paintDone();

  // ---- glossary search
  var gs = document.getElementById('gsearch');
  if (gs) {
    var arts = document.querySelectorAll('.gl article'), none = document.getElementById('gnone');
    gs.addEventListener('input', function () {
      var q = gs.value.trim().toLowerCase(), shown = 0;
      arts.forEach(function (a) { var ok = !q || a.textContent.toLowerCase().indexOf(q) > -1; a.classList.toggle('hidden', !ok); if (ok) shown++; });
      if (none) none.classList.toggle('hidden', shown > 0);
    });
  }
  var pr = document.getElementById('printbtn');
  if (pr) pr.addEventListener('click', function () { window.print(); });
})();

/* Headstart Algebra — quiz. Questions live in quiz-data.js (window.QUIZ). */
(function () {
  var root = document.getElementById('quiz'); if (!root || !window.QUIZ) return;
  var fmt = HS.fmt, st = HS.load();
  var LABELS = { all: 'Mixed (all lessons)' };
  var SHORT = window.QUIZ_LESSONS || {};
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var params = new URLSearchParams(location.search), sel = params.get('l') || 'all';
  if (sel !== 'all' && !/^[1-7]$/.test(sel)) sel = 'all';
  var qs = [], idx = 0, score = 0, missed = [], answered = false, count = 10;

  function setup() {
    var h = '<div class="card setup"><h2>Check your skills</h2><p>Pick a lesson, or mix them all. Every answer comes with an explanation, so wrong answers still teach you something.</p>';
    h += '<div class="pick" role="group" aria-label="Choose lesson">';
    h += '<button class="chip" data-l="all" aria-pressed="' + (sel === 'all') + '">Mixed</button>';
    for (var i = 1; i <= 7; i++) h += '<button class="chip" data-l="' + i + '" aria-pressed="' + (sel == i) + '">L' + i + ' ' + (SHORT[i] || '') + '</button>';
    h += '</div>';
    var avail = window.QUIZ.filter(function (q) { return sel === 'all' || q.l == sel; }).length;
    h += '<p class="note">' + avail + ' questions available' + (st.best[sel] != null ? ' · your best: <b>' + st.best[sel] + '%</b>' : '') + '</p>';
    h += '<p style="margin-top:18px"><button class="btn" id="start">Start quiz →</button></p></div>';
    root.innerHTML = h;
    root.querySelectorAll('[data-l]').forEach(function (b) { b.addEventListener('click', function () { sel = b.getAttribute('data-l'); setup(); }); });
    document.getElementById('start').addEventListener('click', start);
  }
  function start() {
    var pool = window.QUIZ.filter(function (q) { return sel === 'all' || q.l == sel; });
    qs = shuffle(pool).slice(0, sel === 'all' ? 12 : 10); idx = 0; score = 0; missed = []; show();
  }
  function show() {
    answered = false; var q = qs[idx];
    var opts = shuffle([q.c].concat(q.w));
    var h = '<div class="qbox" style="margin-top:0"><div class="qtop"><span>Question ' + (idx + 1) + ' of ' + qs.length + '</span><span>Lesson ' + q.l + '</span></div>';
    h += '<div class="qprog"><i style="width:' + (idx / qs.length * 100) + '%"></i></div>';
    h += '<div class="card"><p class="qq">' + fmt(q.q) + '</p><div class="opts">';
    opts.forEach(function (o, i) { h += '<button class="opt" data-o="' + i + '"><span class="k">' + (i + 1) + '</span><span>' + fmt(o) + '</span></button>'; });
    h += '</div><div id="fb" aria-live="polite"></div></div></div>';
    root.innerHTML = h;
    root.querySelectorAll('.opt').forEach(function (b, i) { b.addEventListener('click', function () { pick(b, opts[i], q); }); });
    root._opts = opts; root._q = q;
  }
  function pick(btn, val, q) {
    if (answered) return; answered = true;
    var ok = val === q.c; if (ok) score++; else missed.push(q);
    root.querySelectorAll('.opt').forEach(function (b, i) {
      b.disabled = true;
      if (root._opts[i] === q.c) b.classList.add('right');
      else if (b === btn) b.classList.add('wrongpick');
    });
    var last = idx === qs.length - 1;
    document.getElementById('fb').innerHTML = '<div class="fb ' + (ok ? 'good' : 'bad') + '"><b>' + (ok ? 'Correct!' : 'Not quite.') + '</b>' + fmt(q.e) +
      '</div><p style="margin:16px 0 0"><button class="btn" id="next">' + (last ? 'See my result' : 'Next question →') + '</button></p>';
    var nx = document.getElementById('next'); nx.focus();
    nx.addEventListener('click', function () { idx++; if (idx < qs.length) show(); else finish(); });
  }
  function finish() {
    var pct = Math.round(score / qs.length * 100);
    if (st.best[sel] == null || pct > st.best[sel]) { st.best[sel] = pct; HS.save(); }
    var msg = pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Strong work.' : pct >= 50 ? 'Getting there. Review the ones you missed.' : 'Good start. Reread the lesson, watch the video, then try again.';
    var h = '<div class="qbox" style="margin-top:0"><div class="card"><h2 style="margin-top:0">Your result</h2><div class="score">' + score + ' / ' + qs.length + '</div><p>' + msg + ' <span class="note">(' + pct + '%)</span></p>';
    if (missed.length) {
      h += '<h3>Questions to review</h3><div class="rev">';
      missed.forEach(function (q) { h += '<div><small>Lesson ' + q.l + '</small><br>' + fmt(q.q) + '<br><b>Answer: ' + fmt(q.c) + '</b><br><small>' + fmt(q.e) + '</small></div>'; });
      h += '</div>';
    }
    h += '<p class="row" style="margin-top:20px"><button class="btn" id="again">Try again</button><button class="btn alt" id="change">Change lesson</button></p></div></div>';
    root.innerHTML = h;
    document.getElementById('again').addEventListener('click', start);
    document.getElementById('change').addEventListener('click', setup);
    window.scrollTo({ top: 0 });
  }
  document.addEventListener('keydown', function (e) {
    if (!/^[1-4]$/.test(e.key) || answered || !root._opts) return;
    var b = root.querySelectorAll('.opt')[Number(e.key) - 1]; if (b) b.click();
  });
  setup();
})();

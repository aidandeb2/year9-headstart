/* Algebra Monsters — question generator.
   Makes fresh algebra questions for each lesson so a battle never runs out. Also mixes in the quiz bank (quiz-data.js).
   Maths format: x^2 is x squared. Every generated question carries a "v" field that the checker script uses to prove the answer is right. */
(function () {
  'use strict';
  var M = '−';
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function sgn(pNeg) { return Math.random() < pNeg ? -1 : 1; }
  function nz(max, pNeg) { return ri(1, max) * sgn(pNeg === undefined ? 0.4 : pNeg); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
  function num(n) { return (n < 0 ? M : '') + Math.abs(n); }

  // ---- monomials: {c: coefficient, v: {letter: power}}
  function mono(c, v) { var o = {}, k; if (v) for (k in v) if (v[k] !== 0) o[k] = v[k]; return { c: c, v: o }; }
  function V(l, n) { var o = {}; o[l] = n === undefined ? 1 : n; return o; }
  function mul(a, b) { var v = {}, k; for (k in a.v) v[k] = a.v[k]; for (k in b.v) v[k] = (v[k] || 0) + b.v[k]; return mono(a.c * b.c, v); }
  function div(a, b) { var v = {}, k; for (k in a.v) v[k] = a.v[k]; for (k in b.v) v[k] = (v[k] || 0) - b.v[k]; for (k in v) if (v[k] < 0) return null; return mono(a.c / b.c, v); }
  function pow(a, n) { var r = mono(1, {}); for (var i = 0; i < n; i++) r = mul(r, a); return r; }
  function lett(v) { return Object.keys(v).sort().map(function (k) { return v[k] > 0 ? k + (v[k] > 1 ? '^' + v[k] : '') : ''; }).join(''); }
  function body(m) { var L = lett(m.v), a = Math.abs(m.c); return L === '' ? String(a) : (a === 1 ? '' : String(a)) + L; }
  function fm(m) { return (m.c < 0 ? M : '') + body(m); }
  function fp(ms) {
    for (var i = 0; i < ms.length; i++) if (!ms[i] || ms[i].c === 0 || !isFinite(ms[i].c)) return null;
    var s = '';
    ms.forEach(function (m, i) { s += i === 0 ? fm(m) : (m.c < 0 ? ' ' + M + ' ' : ' + ') + body(m); });
    return s;
  }
  function C(n) { return mono(n, {}); }
  function deg(m) { var d = 0, k; for (k in m.v) d += m.v[k]; return d; }
  function collect(ms) {
    var map = {}, order = [];
    ms.forEach(function (m) { var k = lett(m.v); if (!(k in map)) { map[k] = mono(0, m.v); order.push(k); } map[k].c += m.c; });
    var out = order.map(function (k) { return map[k]; }).filter(function (m) { return m.c !== 0; });
    out.sort(function (a, b) { var da = deg(a), db = deg(b); if (da !== db) return db - da; return lett(a.v) < lett(b.v) ? -1 : 1; });
    return out;
  }
  function build(q, c, cands, e, v, l) {
    if (c == null) return null;
    var seen = {}, w = [];
    seen[c] = 1;
    shuf(cands).forEach(function (s) { if (s != null && !seen[s]) { seen[s] = 1; w.push(s); } });
    if (w.length < 3) return null;
    return { q: q, c: c, w: w.slice(0, 3), e: e, v: v || {}, l: l, gen: true };
  }
  function bump(n) { return n + (n > 0 ? 1 : -1); }

  // ================= Lesson 1: adding and subtracting terms
  function gLike(hard) {
    var pr = pick([['x', 'y'], ['a', 'b'], ['m', 'n'], ['p', 'q'], ['x', 'y'], ['s', 't']]), u = pr[0], w = pr[1];
    var a, b, c, d, su, sw, k1 = 0, k2 = 0, sk = 0, t;
    for (t = 0; t < 60; t++) {
      a = nz(9); b = nz(9); c = nz(9); d = nz(9); su = a + c; sw = b + d;
      if (hard) { k1 = nz(9); k2 = nz(9); sk = k1 + k2; } else sk = 1;
      if (su !== 0 && sw !== 0 && sk !== 0 && Math.abs(su) <= 14 && Math.abs(sw) <= 14) break;
    }
    if (su === 0 || sw === 0 || sk === 0) return null;
    function U(n) { return mono(n, V(u)); } function W(n) { return mono(n, V(w)); }
    function tail(ms, ks) { return hard ? ms.concat(ks) : ms; }
    var terms = shuf(tail([U(a), W(b), U(c), W(d)], [C(k1), C(k2)]));
    var expr = fp(terms);
    var ans = fp(tail([U(su), W(sw)], [C(sk)]));
    var mash = su + sw !== 0 ? su + sw : Math.abs(su) + Math.abs(sw);
    var ux = a - c; if (ux === 0 || ux === su) ux = bump(su);
    var cands = [
      fp(tail([mono(mash, V2(u, w))], [C(sk)])),
      fp(tail([U(ux), W(sw)], [C(sk)])),
      fp(tail([U(su), W(-sw)], [C(sk)])),
      fp(tail([U(su), W(b - d === 0 || b - d === sw ? bump(sw) : b - d)], [C(sk)])),
      fp(tail([U(sw), W(su)], [C(sk)]))
    ];
    var e = u + ' terms: ' + fp([U(a), U(c)]) + ' = ' + fm(U(su)) + '. ' + w + ' terms: ' + fp([W(b), W(d)]) + ' = ' + fm(W(sw)) + '.' +
      (hard ? ' Numbers: ' + fp([C(k1), C(k2)]) + ' = ' + num(sk) + '.' : '') + ' ' + u + ' and ' + w + ' are unlike terms, so they stay separate.';
    return build('Simplify ' + expr + '.', ans, cands, e, { eq: [expr, ans] }, 1);
  }
  function V2(a, b) { var o = {}; o[a] = 1; o[b] = 1; return o; }

  function gCoeff() {
    var pr = pick([['x', 'y'], ['a', 'b'], ['m', 'n'], ['p', 'q']]), u = pr[0], w = pr[1];
    var cu = nz(9), cw = Math.random() < 0.4 ? pick([-1, 1]) : nz(9, 0.5), k = nz(9);
    var target = pick([u, w]), ans = target === u ? cu : cw, other = target === u ? cw : cu;
    var pieces = [mono(cu, V(u)), mono(cw, V(w))];
    if (Math.random() < 0.5) pieces.push(mono(nz(6), V(u, 2)));
    pieces = shuf(pieces); pieces.push(C(k));
    var expr = fp(pieces);
    var cands = [num(-ans), num(other), num(k), '1', num(Math.abs(ans) + 1), num(ans === 1 ? 2 : ans === -1 ? -2 : ans + 1)];
    var e = 'The coefficient is the number multiplying the letter, and the sign in front belongs to it. ' + (Math.abs(ans) === 1 ? (ans === 1 ? target + ' means 1' + target + '.' : M + target + ' means ' + M + '1' + target + '.') : 'Here the term is ' + fm(mono(ans, V(target))) + '.');
    return build('In ' + expr + ', what is the coefficient of ' + target + '?', num(ans), cands, e, { coeff: [expr, target, ans] }, 1);
  }

  // ================= Lesson 2: multiplying terms
  function shared2(hard) {
    var ls = shuf(['a', 'b', 'x', 'y', 'm', 'n', 'p']).slice(0, 2), mp = hard ? 4 : 3;
    var A = mono(nz(9, 0.45), {}), B = mono(nz(9, 0.45), {});
    A.v[ls[0]] = ri(1, mp); B.v[ls[0]] = ri(1, mp);
    if (Math.random() < 0.65) A.v[ls[1]] = ri(1, mp);
    if (Math.random() < 0.55) B.v[ls[1]] = ri(1, mp);
    return [A, B];
  }
  function gMul(hard) {
    var t = pick(hard ? [1, 1, 3, 5] : [1, 1, 2, 3, 4, 5]), A, B, P, k, e, cands, q, ans;
    if (t === 1) {
      var ab = shared2(hard); A = ab[0]; B = ab[1]; P = mul(A, B);
      var mx = {}, mm = {};
      for (k in P.v) { mx[k] = Math.max(A.v[k] || 0, B.v[k] || 0); mm[k] = (A.v[k] && B.v[k]) ? A.v[k] * B.v[k] : P.v[k]; }
      q = 'Simplify ' + fm(A) + ' × ' + fm(B) + '.'; ans = fm(P);
      cands = [fm(mono(A.c + B.c, P.v)), fm(mono(-P.c, P.v)), fm(mono(P.c, mx)), fm(mono(P.c, mm))];
      var lines = [];
      Object.keys(P.v).sort().forEach(function (L) { lines.push(A.v[L] && B.v[L] ? L + ': ' + A.v[L] + ' + ' + B.v[L] + ' = ' + P.v[L] : L + ': only in one term, so it stays as ' + L + (P.v[L] > 1 ? '^' + P.v[L] : '')); });
      e = 'Multiply the coefficients: ' + num(A.c) + ' × ' + num(B.c) + ' = ' + num(P.c) + '. Add the indices of matching letters. ' + lines.join('; ') + '.';
      return build(q, ans, cands, e, { eq: [fm(A) + ' × ' + fm(B), ans] }, 2);
    }
    if (t === 2) {
      var L = pick(['a', 'b', 'x', 'y', 'm', 'n', 'p', 'w']), m = ri(2, 6), n = ri(2, 6);
      q = 'Simplify ' + L + '^' + m + ' × ' + L + '^' + n + '.'; ans = L + '^' + (m + n);
      cands = [L + '^' + (m * n), (m + n) + L, L + '^' + (m + n - 1), '2' + L + '^' + (m + n)];
      e = 'Multiplying with the same base means adding the indices: ' + m + ' + ' + n + ' = ' + (m + n) + '.';
      return build(q, ans, cands, e, { eq: [L + '^' + m + ' × ' + L + '^' + n, ans] }, 2);
    }
    if (t === 3) {
      var c = pick([2, 2, 3, 3, 4, 5]), nn = c >= 4 ? 2 : ri(2, 3), p = ri(1, 3), ls = shuf(['a', 'b', 'g', 'h', 'x', 'y', 'm']).slice(0, 2);
      A = mono(c, V(ls[0], p)); if (Math.random() < 0.5) A.v[ls[1]] = ri(1, 2);
      var R = pow(A, nn), inner = fm(A), outerP = {}, plus = {};
      for (k in A.v) { outerP[k] = A.v[k] * nn; plus[k] = A.v[k] + nn; }
      q = 'Simplify (' + inner + ')^' + nn + '.'; ans = fm(R);
      cands = [fm(mono(c * nn, outerP)), fm(mono(c, outerP)), fm(mono(R.c, plus)), fm(mono(c * nn, plus))];
      e = 'The power applies to everything inside the brackets. ' + c + '^' + nn + ' = ' + R.c + '. For each letter, multiply the indices.' + ' So (' + inner + ')^' + nn + ' = ' + ans + '.';
      return build(q, ans, cands, e, { eq: ['(' + inner + ')^' + nn, ans] }, 2);
    }
    if (t === 4) {
      var l2 = shuf(['x', 'y', 'a', 'b', 'm', 'n']).slice(0, 2);
      var Lm = mono(ri(2, 9), V(l2[0], hard ? ri(1, 2) : 1)), Wm = mono(ri(2, 9), V(l2[1], 1)); P = mul(Lm, Wm);
      var dbl = {}; for (k in P.v) dbl[k] = P.v[k] * 2;
      q = 'A rectangle has length ' + fm(Lm) + ' and width ' + fm(Wm) + '. What is its area?'; ans = fm(P);
      cands = [fm(mono(Lm.c + Wm.c, P.v)), fp([mono(2 * Lm.c, Lm.v), mono(2 * Wm.c, Wm.v)]), fm(mono(P.c, dbl)), fp([Lm, Wm])];
      e = 'Area = length × width = ' + fm(Lm) + ' × ' + fm(Wm) + ' = ' + ans + '. (Adding the sides, or doubling them, gives a perimeter-style answer, not an area.)';
      return build(q, ans, cands, e, { eq: [fm(Lm) + ' × ' + fm(Wm), ans] }, 2);
    }
    var ab2 = shared2(false); A = ab2[0]; B = ab2[1]; P = mul(A, B);
    q = 'What goes in the box?   ' + fm(A) + ' × □ = ' + fm(P); ans = fm(B);
    var withA = mul(B, mono(1, A.v));
    cands = [fm(mono(P.c, B.v)), fm(mono(B.c, P.v)), fm(mono(A.c, B.v)), fm(withA)];
    e = 'Work out what is missing: the coefficient is ' + num(P.c) + ' ÷ ' + num(A.c) + ' = ' + num(B.c) + ', and the letters left over give ' + ans + '. Check: ' + fm(A) + ' × ' + ans + ' = ' + fm(P) + '.';
    return build(q, ans, cands, e, { eq: [fm(A) + ' × ' + ans, fm(P)] }, 2);
  }

  // ================= Lesson 3: checkpoint (mixed like terms with indices)
  function gCollect() {
    var u = pick(['x', 'a', 'm', 'p', 'y']), c1, c2, c3, c4, s2, s1, t;
    for (t = 0; t < 60; t++) {
      c1 = nz(6); c2 = nz(6); c3 = nz(9); c4 = nz(9); s2 = c1 + c2; s1 = c3 + c4;
      if (s2 !== 0 && s1 !== 0 && s2 !== s1) break;
    }
    if (!s2 || !s1) return null;
    var terms = shuf([mono(c1, V(u, 2)), mono(c3, V(u)), mono(c2, V(u, 2)), mono(c4, V(u))]);
    var expr = fp(terms), ans = fp([mono(s2, V(u, 2)), mono(s1, V(u))]);
    var cands = [fp([mono(s2, V(u, 2)), mono(-s1, V(u))]), fm(mono(s2 + s1, V(u, 3))), fm(mono(s2 + s1, V(u, 2))), fp([mono(s2, V(u)), mono(s1, V(u, 2))]), fm(mono(c1 + c2 + c3 + c4, V(u, 3)))];
    var e = u + '² terms: ' + fp([mono(c1, V(u, 2)), mono(c2, V(u, 2))]) + ' = ' + fm(mono(s2, V(u, 2))) + '. ' + u + ' terms: ' + fp([mono(c3, V(u)), mono(c4, V(u))]) + ' = ' + fm(mono(s1, V(u))) + '. ' + u + '² and ' + u + ' are not like terms, so both stay.';
    return build('Simplify ' + expr + '.', ans, cands, e, { eq: [expr, ans] }, 3);
  }

  // ================= Lesson 4: dividing terms
  function gDiv(hard) {
    var t = pick(hard ? [1, 1, 1, 2] : [1, 1, 2]), k, e, cands, q, ans;
    if (t === 2) {
      var L = pick(['a', 'b', 'x', 'y', 'm', 'n', 'p', 'w']), n = ri(1, 4), m = n + ri(1, 5);
      q = 'Simplify ' + L + '^' + m + ' ÷ ' + (n === 1 ? L : L + '^' + n) + '.';
      var d0 = m - n; ans = d0 === 1 ? L : L + '^' + d0;
      cands = [L + '^' + (m + n), L + '^' + (m * n), d0 === 1 ? null : d0 + L, d0 + 1 > 1 ? L + '^' + (d0 + 1) : null, d0 > 1 ? L + '^' + (d0 - 1) : '1'];
      if (d0 === 1) cands.push('1');
      e = 'Dividing with the same base means subtracting the indices: ' + m + ' − ' + n + ' = ' + d0 + '.';
      return build(q, ans, cands, e, { mul: [ans, n === 1 ? L : L + '^' + n, L + '^' + m] }, 4);
    }
    var pool = shuf(['a', 'b', 'x', 'y', 'm', 'n', 'p']), dv = {}, qv = {}, tries, N, D, Q;
    for (tries = 0; tries < 60; tries++) {
      dv = {}; qv = {};
      var dl = ri(0, 2); for (var i = 0; i < dl; i++) dv[pool[i]] = ri(1, 2);
      D = mono(ri(2, hard ? 12 : 9) * sgn(0.3), dv);
      var ql = ri(1, 3); for (i = 0; i < ql; i++) { var pw = ri(0, 3); if (pw) qv[pool[i]] = pw; }
      Q = mono(nz(hard ? 9 : 7, 0.4), qv);
      N = mul(Q, D);
      var ok = Math.abs(N.c) <= 99, mxp = 0; for (k in N.v) mxp = Math.max(mxp, N.v[k]);
      if (ok && mxp <= 6 && Object.keys(N.v).length >= 1) break; N = null;
    }
    if (!N) return null;
    q = 'Simplify ' + fm(N) + ' ÷ ' + fm(D) + '.'; ans = fm(Q);
    var added = {}; for (k in N.v) added[k] = N.v[k] + (D.v[k] || 0);
    cands = [fm(mono(Q.c, added)), fm(mono(-Q.c, Q.v)), fm(mono(N.c - D.c, Q.v)), fm(mono(Q.c, N.v)), fm(mono(N.c / (D.c > 0 ? 1 : -1), Q.v))];
    var lines = [];
    Object.keys(N.v).sort().forEach(function (L) { var r = (N.v[L] - (D.v[L] || 0)); lines.push(L + ': ' + N.v[L] + ' − ' + (D.v[L] || 0) + ' = ' + r + (r === 0 ? ' (so ' + L + ' disappears)' : '')); });
    e = 'Divide the coefficients: ' + num(N.c) + ' ÷ ' + num(D.c) + ' = ' + num(Q.c) + (Q.c < 0 ? ' (different signs give a negative)' : '') + '. Subtract the indices: ' + lines.join('; ') + '.';
    return build(q, ans, cands, e, { mul: [ans, fm(D), fm(N)] }, 4);
  }

  // ================= Lesson 5: expanding brackets
  function gExp(hard) {
    var t = pick(hard ? [3, 3, 4, 2] : [1, 1, 2, 3, 4]), u = pick(['a', 'x', 'm', 'p', 't', 'c']), e, cands, q, ans;
    if (t === 1) {
      var k = nz(9, 0.35); if (Math.abs(k) < 2) k = k < 0 ? -3 : 3;
      var a = ri(1, 6) * sgn(0.2), b = nz(9, 0.5), K = C(k), t1 = mono(a, V(u)), t2 = C(b);
      var expr = fm(K) + '(' + fp([t1, t2]) + ')';
      ans = fp([mono(k * a, V(u)), C(k * b)]);
      cands = [fp([mono(k * a, V(u)), t2]), fp([mono(k * a, V(u)), C(-k * b)]), fp([mono(k + a === 0 ? 1 : k + a, V(u)), C(k + b === 0 ? 1 : k + b)]), fm(mono(k * a, V(u)))];
      e = 'Multiply every term inside the bracket by ' + num(k) + ': ' + num(k) + ' × ' + fm(t1) + ' = ' + fm(mono(k * a, V(u))) + ' and ' + num(k) + ' × ' + num(b) + ' = ' + num(k * b) + '. ' + (k < 0 && b < 0 ? 'Two negatives make a positive.' : (k < 0 ? 'The negative outside flips each sign.' : ''));
      return build('Expand ' + expr + '.', ans, cands, e, { eq: [expr, ans] }, 5);
    }
    if (t === 2) {
      var w = pick(['n', 'q', 'y', 'b']), Km = mono(nz(9, 0.4), V(u)); if (Math.abs(Km.c) < 2) Km.c = Km.c < 0 ? -2 : 2;
      var first = mono(ri(1, 6) * sgn(0.2), V(Math.random() < 0.6 ? u : w)), second = mono(nz(9, 0.5), Math.random() < 0.6 ? V(w) : {});
      if (lett(first.v) === lett(second.v)) second = C(second.c);
      var ex = fm(Km) + '(' + fp([first, second]) + ')';
      var P1 = mul(Km, first), P2 = mul(Km, second);
      ans = fp([P1, P2]);
      cands = [fp([mono(P1.c, first.v), P2]), fp([P1, mono(-P2.c, P2.v)]), fp([P1, mono(Km.c * second.c, second.v)]), fp([mono(Km.c + first.c === 0 ? 1 : Km.c + first.c, P1.v), P2])];
      e = fm(Km) + ' × ' + fm(first) + ' = ' + fm(P1) + ' (multiply the numbers and the letters). ' + fm(Km) + ' × ' + fm(second) + ' = ' + fm(P2) + '.';
      return build('Expand ' + ex + '.', ans, cands, e, { eq: [ex, ans] }, 5);
    }
    var sig = t === 4 ? -1 : 1, p = ri(2, 6), r = t === 4 && Math.random() < 0.4 ? 1 : ri(2, 6), s1 = nz(9, 0.4), s2 = nz(9, 0.5);
    var co = p + sig * r, ko = p * s1 + sig * r * s2;
    if (co === 0 || ko === 0) return null;
    function br(n, s) { return (n === 1 ? '' : n) + '(' + fp([mono(1, V(u)), C(s)]) + ')'; }
    var expr2 = br(p, s1) + (sig === 1 ? ' + ' : ' ' + M + ' ') + br(r, s2);
    ans = fp([mono(co, V(u)), C(ko)]);
    var wrongOp = p - sig * r;
    cands = [fp([mono(co, V(u)), C(p * s1 - sig * r * s2)]), fp([mono(wrongOp === 0 ? 1 : wrongOp, V(u)), C(ko)]), fp([mono(co, V(u)), C(s1 + sig * s2)]), fp([mono(co, V(u)), C(p * s1 + sig * s2)])];
    var secondEx = fp([mono(sig * r, V(u)), C(sig * r * s2)]);
    e = 'Expand each bracket: ' + fp([mono(p, V(u)), C(p * s1)]) + ' and ' + secondEx + (sig === -1 ? ' (the minus in front flips every sign inside)' : '') + '. Collect like terms: ' + u + ' terms give ' + fm(mono(co, V(u))) + ' and the numbers give ' + fp([C(p * s1), C(sig * r * s2)]) + ' = ' + num(ko) + '.';
    return build('Simplify ' + expr2 + '.', ans, cands, e, { eq: [expr2, ans] }, 5);
  }

  // ================= Lesson 6: factorising
  function smallestPrime(n) { for (var p = 2; p <= n; p++) if (n % p === 0) return p; return n; }
  function gHcf() {
    var tries, G, c1, c2, A, B, s, ans;
    for (tries = 0; tries < 80; tries++) {
      G = pick([2, 3, 4, 5, 6]); c1 = G * ri(1, 5); c2 = G * ri(1, 5);
      if (c1 === c2 || gcd(c1, c2) !== G) continue;
      var pool = shuf(['a', 'b', 'c', 'x', 'y', 'm', 'n']); s = pool[0];
      A = mono(c1, V(s, ri(1, 3))); B = mono(c2, V(s, ri(1, 3)));
      if (Math.random() < 0.5) { var s2 = pool[1], x1 = ri(1, 2), x2 = ri(1, 2); A.v[s2] = x1; B.v[s2] = x2; }
      if (Math.random() < 0.6) A.v[pool[2]] = ri(1, 2);
      if (Math.random() < 0.4) B.v[pool[3]] = ri(1, 2);
      var mins = {}, maxs = {}, k;
      for (k in A.v) if (B.v[k]) { mins[k] = Math.min(A.v[k], B.v[k]); maxs[k] = Math.max(A.v[k], B.v[k]); }
      ans = mono(G, mins);
      var cands = [fm(mono(G, maxs)), fm(mono(lcm(c1, c2), mins)), fm(mono(Math.min(c1, c2), mins)), fm(mono(1, mins))];
      var extra = Object.keys(A.v).filter(function (z) { return !B.v[z]; });
      if (extra.length) cands.push(fm(mul(ans, mono(1, V(extra[0], A.v[extra[0]])))));
      var e = 'Find the HCF of the numbers: HCF of ' + c1 + ' and ' + c2 + ' is ' + G + '. For each letter in BOTH terms, take the lowest power. Letters that are not in both terms are left out. So the HCF is ' + fm(ans) + '.';
      var r = build('What is the HCF of ' + fm(A) + ' and ' + fm(B) + '?', fm(ans), cands, e, { hcf: [fm(A), fm(B), fm(ans)] }, 6);
      if (r) return r;
    }
    return null;
  }
  function gFac(hard) {
    if (Math.random() < 0.2) return gHcf();
    var tries, k;
    for (tries = 0; tries < 120; tries++) {
      var L = shuf(['a', 'b', 'm', 'n', 'p', 'x', 'y', 'z', 'w']);
      var hc = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]), hv = {};
      if (Math.random() < 0.65 || hc === 1) hv[L[0]] = ri(1, hard ? 3 : 2);
      if (hc === 1 && !Object.keys(hv).length) continue;
      var h = mono(hc, hv);
      var set1 = pick([L[0], L[1], L[1]]), set2 = pick([null, null, L[2], L[1]]);
      if (set2 === set1) set2 = null;
      var t1 = mono(ri(1, 6), V(set1)), t2 = mono(nz(9, 0.5), set2 ? V(set2) : {});
      if (gcd(t1.c, t2.c) !== 1) continue;
      var E1 = mul(h, t1), E2 = mul(h, t2);
      if (Math.abs(E1.c) > 90 || Math.abs(E2.c) > 90) continue;
      var expr = fp([E1, E2]), hs = body(h), ans = hs + '(' + fp([t1, t2]) + ')';
      var hh = [], Lh = Object.keys(h.v)[0];
      if (h.c > 1 && Lh) { hh.push(mono(h.c, {})); hh.push(mono(1, h.v)); if (h.v[Lh] >= 2) hh.push(mono(h.c, V(Lh, h.v[Lh] - 1))); }
      else if (h.c > 1 && smallestPrime(h.c) !== h.c) hh.push(mono(smallestPrime(h.c), {}));
      else if (h.c === 1 && Lh && h.v[Lh] >= 2) hh.push(mono(1, V(Lh, h.v[Lh] - 1)));
      if (!hh.length) continue;
      var part = pick(hh), p1 = body(part) + '(' + fp([div(E1, part), div(E2, part)]) + ')';
      var p2 = hs + '(' + fp([t1, mono(-t2.c, t2.v)]) + ')', p3 = hs + '(' + fp([t1, E2]) + ')', p4 = hs + '(' + fp([E1, t2]) + ')';
      var e = 'The HCF of ' + fm(E1) + ' and ' + fm(E2) + ' is ' + hs + '. Take it out the front and divide each term by it: ' + fm(E1) + ' ÷ ' + hs + ' = ' + fm(t1) + ' and ' + fm(E2) + ' ÷ ' + hs + ' = ' + fm(t2) + '. Always check by expanding. (Taking out only part of the HCF is not fully factorised.)';
      var r = build('Fully factorise ' + expr + '.', ans, [p1, p2, p3, p4], e, { fac: [expr, ans], incomplete: [p1] }, 6);
      if (r) return r;
    }
    return null;
  }

  // ================= public API
  var GEN = {
    1: [gLike, gLike, gCoeff], 2: [gMul], 3: [gLike, gCollect, gMul, gCollect], 4: [gDiv], 5: [gExp], 6: [gFac],
    7: [gLike, gMul, gDiv, gExp, gFac, gCollect, gExp, gFac]
  };
  function gen(zone, hard) {
    for (var i = 0; i < 30; i++) { var q = pick(GEN[zone])(!!hard); if (q) return q; }
    return null;
  }
  function bankFor(zone) {
    var all = window.QUIZ || [];
    if (zone === 7) return all.slice();
    return all.filter(function (q) { return q.l === zone; });
  }
  window.GameQ = { gen: gen, bankFor: bankFor, _g: { gLike: gLike, gCoeff: gCoeff, gMul: gMul, gCollect: gCollect, gDiv: gDiv, gExp: gExp, gFac: gFac, gHcf: gHcf } };
})();

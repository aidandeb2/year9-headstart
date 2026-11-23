/* Algebra Monsters — the creatures. Every monster is drawn from code (SVG), so there are no image files.
   To add a monster, copy a line in SPECIES and change the numbers. All creatures are original. */
(function () {
  'use strict';
  var ZONES = [
    null,
    { n: 1, name: 'Like-Term Meadow', lesson: 'Adding & subtracting terms', hue: 130, icon: '🌼', sky: ['#9fdcff', '#d9f6ff'], ground: '#7fd46e', ground2: '#5cb85a', decor: ['🌳', '🌼', '☁️', '🦋'], boss: 'captain' },
    { n: 2, name: 'Product Peaks', lesson: 'Multiplying terms', hue: 24, icon: '⛰️', sky: ['#ffb27a', '#ffe0b5'], ground: '#b9a38c', ground2: '#9b8670', decor: ['⛰️', '🌋', '☁️', '🔥'], boss: 'multiplex' },
    { n: 3, name: 'Checkpoint Canyon', lesson: 'Checkpoint', hue: 272, icon: '🚩', sky: ['#7a6bd6', '#e3a6e8'], ground: '#e0b777', ground2: '#c99a5b', decor: ['🌵', '🚩', '🪨', '⭐'], boss: 'warden' },
    { n: 4, name: 'Quotient Quarry', lesson: 'Dividing terms', hue: 180, icon: '💎', sky: ['#2c4a5c', '#4b7d8c'], ground: '#8e9aa3', ground2: '#707c86', decor: ['💎', '⛏️', '🪨', '✨'], boss: 'divizilla' },
    { n: 5, name: 'Expansion Isles', lesson: 'Expanding', hue: 330, icon: '🏝️', sky: ['#ffb8d6', '#ffe9f3'], ground: '#f6dc9a', ground2: '#e8c678', decor: ['🌴', '🐚', '☁️', '🌺'], boss: 'expandra' },
    { n: 6, name: 'Factor Forest', lesson: 'Factorising', hue: 215, icon: '🌲', sky: ['#2c5a4a', '#6fae8f'], ground: '#4f9a5f', ground2: '#3c7f4b', decor: ['🌲', '🍄', '🌿', '🦉'], boss: 'rex' },
    { n: 7, name: "Champion's Summit", lesson: 'Review of everything', hue: 48, icon: '👑', sky: ['#171a45', '#4a3a8c'], ground: '#f3c64d', ground2: '#d4a42c', decor: ['⭐', '✨', '🌙', '🏆'], boss: 'polynomia' }
  ];
  var SYM = { 1: '+', 2: '×', 3: '★', 4: '÷', 5: '( )', 6: ')(', 7: '∞' };

  // id, name, zone, hue shift, body shape, eyes, mouth, head gear, extras, pattern, symbol, blurb
  function S(id, name, z, hue, shape, eyes, mouth, top, extra, pat, sym, blurb, extraOpts) {
    var o = { id: id, name: name, z: z, hue: hue, shape: shape, eyes: eyes, mouth: mouth, top: top, extra: extra, pat: pat, sym: sym, blurb: blurb };
    if (extraOpts) for (var k in extraOpts) o[k] = extraOpts[k];
    return o;
  }
  var SPECIES = [
    // starters
    S('varrie', 'Varrie', 0, 212, 'round', 2, 'smile', 'antenna', ['feet', 'arms'], 'belly', 'x', 'A cheerful blob that can be any number. It never stays the same for long.', { starter: 1 }),
    S('coeffy', 'Coeffy', 0, 100, 'bean', 2, 'open', 'ears', ['feet', 'tail'], 'spots', '3', 'Loves to stand in front of things and multiply them.', { starter: 1 }),
    S('expo', 'Expo', 0, 8, 'pear', 2, 'fang', 'horns', ['feet', 'tail'], 'belly', '²', 'Tiny, but its power grows every time you raise it.', { starter: 1 }),
    // zone 1
    S('plusling', 'Plusling', 1, 135, 'blob', 2, 'smile', 'ears', ['feet', 'tail'], 'belly', '+', 'Happiest when it is joining like terms together.'),
    S('termite', 'Termite', 1, 95, 'squat', 2, 'open', 'antenna', ['feet'], 'stripes', '', 'Munches through messy expressions until only the like terms are left.'),
    S('coefcub', 'Coefcub', 1, 160, 'round', 2, 'smile', 'ears', ['feet', 'arms'], 'spots', '5', 'The number out the front is its favourite part of any term.'),
    S('captain', 'Captain Combine', 1, 120, 'tall', 2, 'fang', 'crown', ['feet', 'arms', 'cape'], 'belly', '+', 'Leads the Meadow. Only unbeatable if you forget to collect like terms.', { boss: 1, title: 'Meadow Guardian', taunt: 'Unlike terms can never be combined! Or can they? Show me!' }),
    // zone 2
    S('timesaur', 'Timesaur', 2, 20, 'squat', 2, 'fang', 'spikes', ['feet', 'tail'], 'stripes', '×', 'Stomps two terms together and adds their indices.'),
    S('doublet', 'Doublet', 2, 40, 'round', 3, 'open', 'horns', ['feet'], 'spots', '', 'Three eyes means it checks every sign twice.'),
    S('squarelet', 'Squarelet', 2, 5, 'blob', 1, 'smile', 'fin', ['feet', 'arms'], 'belly', '²', 'A cyclops that loves to raise things to a power.'),
    S('multiplex', 'Multiplex', 2, 15, 'tall', 3, 'fang', 'crown', ['arms', 'wings', 'feet'], 'stripes', '×', 'Multiplies everything it touches, including its own attacks.', { boss: 1, title: 'Peak Champion', taunt: 'Coefficients times coefficients, indices plus indices. Do you remember?' }),
    // zone 3
    S('tickit', 'Tickit', 3, 280, 'bean', 2, 'smile', 'antenna', ['feet', 'tail'], 'belly', '✓', 'Ticks off every correct step, and spots mistakes instantly.'),
    S('markle', 'Markle', 3, 250, 'pear', 2, 'open', 'ears', ['feet', 'arms'], 'spots', '', 'Gives you a score out of ten. Be nice to it.'),
    S('gradeon', 'Gradeon', 3, 300, 'squat', 2, 'fang', 'spikes', ['feet', 'tail'], 'stripes', 'A', 'Only accepts excellent working.'),
    S('warden', 'Warden Verify', 3, 265, 'tall', 2, 'fang', 'crown', ['feet', 'arms', 'cape'], 'belly', '★', 'Guards the Checkpoint. Always asks: did you check your answer?', { boss: 1, title: 'Checkpoint Warden', taunt: 'Everything so far, in one battle. Prove it!' }),
    // zone 4
    S('splitz', 'Splitz', 4, 175, 'round', 2, 'open', 'ears', ['feet', 'tail'], 'belly', '÷', 'Splits into equal groups. Never leaves a remainder.'),
    S('quotie', 'Quotie', 4, 195, 'bean', 2, 'smile', 'antenna', ['feet', 'arms'], 'spots', '', 'Subtracts indices faster than you can blink.'),
    S('remaindle', 'Remaindle', 4, 160, 'blob', 1, 'fang', 'horns', ['feet'], 'stripes', '1', 'If everything cancels it turns into a 1, never a 0.'),
    S('divizilla', 'Divizilla', 4, 185, 'squat', 2, 'fang', 'crown', ['wings', 'feet', 'tail'], 'belly', '÷', 'Divides big monsters into small ones for breakfast.', { boss: 1, title: 'Quarry King', taunt: 'Divide the numbers, subtract the indices. Easy... if you remember!' }),
    // zone 5
    S('brackette', 'Brackette', 5, 335, 'round', 2, 'smile', 'ears', ['feet', 'arms'], 'belly', '( )', 'Wears brackets as earmuffs.'),
    S('spreadle', 'Spreadle', 5, 310, 'pear', 2, 'open', 'fin', ['feet', 'tail'], 'spots', '', 'Spreads one multiplier across every term in the bracket.'),
    S('fanout', 'Fanout', 5, 350, 'blob', 3, 'smile', 'spikes', ['feet'], 'stripes', '', 'Its tail fans out into as many terms as you like.'),
    S('expandra', 'Madam Expandra', 5, 325, 'tall', 2, 'fang', 'crown', ['wings', 'feet', 'arms'], 'belly', '( )', 'Opens brackets with a flick of her tail.', { boss: 1, title: 'Isle Queen', taunt: 'Multiply EVERY term inside the bracket. Even the negative one!' }),
    // zone 6
    S('hcfox', 'H-C-Fox', 6, 205, 'pear', 2, 'smile', 'ears', ['feet', 'tail'], 'belly', '', 'Sniffs out the highest common factor of anything.'),
    S('primate', 'Primate', 6, 230, 'bean', 2, 'open', 'antenna', ['feet', 'arms', 'tail'], 'spots', '', 'Swings between factors on a vine.'),
    S('commonly', 'Commonly', 6, 190, 'round', 2, 'smile', 'horns', ['feet'], 'stripes', ')(', 'Pulls out whatever its terms have in common.'),
    S('rex', 'Factorus Rex', 6, 220, 'squat', 2, 'fang', 'crown', ['wings', 'feet', 'tail'], 'belly', ')(', 'Takes out the HCF and puts the brackets back.', { boss: 1, title: 'Forest Lord', taunt: 'Take out the WHOLE highest common factor. Then check by expanding!' }),
    // zone 7
    S('algebrat', 'Algebrat', 7, 50, 'round', 2, 'fang', 'spikes', ['feet', 'tail'], 'stripes', 'a', 'Argues about everything. Usually loses to like terms.'),
    S('mixton', 'Mixton', 7, 30, 'blob', 3, 'open', 'horns', ['feet', 'arms'], 'spots', '', 'A bit of every lesson in one tidy package.'),
    S('revisaur', 'Revisaur', 7, 65, 'tall', 2, 'smile', 'antenna', ['feet', 'tail', 'wings'], 'belly', '∞', 'Remembers everything. Never stops revising.'),
    S('polynomia', 'Grand Master Polynomia', 7, 45, 'squat', 3, 'fang', 'crown', ['wings', 'feet', 'arms', 'tail', 'cape'], 'belly', '∞', 'The champion of all Algebra Monsters. Has mastered all seven lessons.', { boss: 1, title: 'Grand Champion', taunt: 'Add, multiply, divide, expand, factorise... can you do it ALL?' })
  ];
  var BY = {}; SPECIES.forEach(function (s) { BY[s.id] = s; });
  function ofZone(z) { return SPECIES.filter(function (s) { return s.z === z && !s.boss; }); }
  function bossOf(z) { return SPECIES.filter(function (s) { return s.z === z && s.boss; })[0]; }

  var SHAPES = {
    blob: { d: 'M100 40 C150 40 170 90 168 125 C166 165 135 178 100 178 C65 178 34 165 32 125 C30 90 50 40 100 40Z', top: 40, ey: 96, my: 124, hw: 66, bel: 140 },
    round: { d: 'M100 52 C150 52 168 92 166 124 C164 160 136 178 100 178 C64 178 36 160 34 124 C32 92 50 52 100 52Z', top: 52, ey: 104, my: 130, hw: 64, bel: 148 },
    tall: { d: 'M100 24 C140 24 152 70 150 118 C148 160 130 178 100 178 C70 178 52 160 50 118 C48 70 60 24 100 24Z', top: 24, ey: 76, my: 102, hw: 50, bel: 132 },
    squat: { d: 'M100 70 C158 68 178 100 176 134 C174 168 142 178 100 178 C58 178 26 168 24 134 C22 100 42 68 100 70Z', top: 70, ey: 114, my: 140, hw: 74, bel: 152 },
    pear: { d: 'M100 34 C114 34 120 46 144 112 C162 156 148 178 100 178 C52 178 38 156 56 112 C80 46 86 34 100 34Z', top: 34, ey: 104, my: 130, hw: 54, bel: 150 },
    bean: { d: 'M62 58 C92 24 150 38 160 90 C170 140 142 178 96 178 C50 178 28 142 38 102 C42 82 48 70 62 58Z', top: 36, ey: 92, my: 120, hw: 62, bel: 144 }
  };
  function hsl(h, s, l) { return 'hsl(' + Math.round(((h % 360) + 360) % 360) + ',' + s + '%,' + l + '%)'; }

  function eyeSVG(cx, cy, r, mood) {
    var lid = mood === 'sad' ? '<path d="M' + (cx - r) + ' ' + (cy - r * 0.2) + ' L' + (cx + r) + ' ' + (cy - r * 0.9) + '" stroke="#1b2742" stroke-width="3" fill="none"/>' : '';
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" stroke="#1b2742" stroke-width="3.5"/>' +
      '<circle cx="' + (cx + r * 0.18) + '" cy="' + (cy + r * 0.1) + '" r="' + (r * 0.55) + '" fill="#1b2742"/>' +
      '<circle cx="' + (cx + r * 0.38) + '" cy="' + (cy - r * 0.2) + '" r="' + (r * 0.2) + '" fill="#fff"/>' + lid;
  }

  // stage: 0, 1 or 2 (evolutions). Returns an SVG string (viewBox 200x200).
  function svg(id, stage, opts) {
    var s = BY[id], z = s.z ? ZONES[s.z] : null; opts = opts || {}; stage = stage || 0;
    var sh = SHAPES[s.shape], H = s.hue;
    var base = hsl(H, 68, 60), dark = hsl(H, 55, 28), mid = hsl(H, 62, 46), lite = hsl(H, 85, 86), acc = hsl(H + 150, 80, 62), acc2 = hsl(H + 40, 90, 62);
    if (opts.silhouette) { base = '#2a2f45'; dark = '#171b2c'; mid = '#222740'; lite = '#2a2f45'; acc = '#2a2f45'; acc2 = '#2a2f45'; }
    var st = 'stroke="' + dark + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
    var out = '', k, i;
    var has = function (e) { return s.extra.indexOf(e) >= 0; };
    var cx = 100;
    // aura for fully evolved / boss
    if (stage >= 2 || s.boss) out += '<ellipse cx="100" cy="112" rx="96" ry="88" fill="' + hsl(H + 20, 100, 70) + '" opacity=".22"/>';
    // wings (behind)
    if (has('wings') || stage >= 2) {
      var wy = sh.ey + 4;
      out += '<path d="M' + (100 - sh.hw + 8) + ' ' + wy + ' C28 ' + (wy - 62) + ' 6 ' + (wy - 40) + ' 10 ' + (wy - 6) + ' C16 ' + (wy + 24) + ' 42 ' + (wy + 30) + ' ' + (100 - sh.hw + 6) + ' ' + (wy + 26) + 'Z" fill="' + acc + '" ' + st + '/>' +
        '<path d="M' + (100 + sh.hw - 8) + ' ' + wy + ' C172 ' + (wy - 62) + ' 194 ' + (wy - 40) + ' 190 ' + (wy - 6) + ' C184 ' + (wy + 24) + ' 158 ' + (wy + 30) + ' ' + (100 + sh.hw - 6) + ' ' + (wy + 26) + 'Z" fill="' + acc + '" ' + st + '/>';
    }
    if (has('cape')) out += '<path d="M' + (100 - sh.hw + 6) + ' ' + (sh.ey + 20) + ' L' + (100 + sh.hw - 6) + ' ' + (sh.ey + 20) + ' L' + (100 + sh.hw + 10) + ' 186 L' + (100 - sh.hw - 10) + ' 186Z" fill="' + hsl(H + 180, 70, 45) + '" ' + st + '/>';
    // tail
    if (has('tail')) out += '<path d="M' + (100 + sh.hw - 6) + ' 150 C196 150 198 108 176 98" fill="none" stroke="' + dark + '" stroke-width="15" stroke-linecap="round"/><path d="M' + (100 + sh.hw - 6) + ' 150 C196 150 198 108 176 98" fill="none" stroke="' + base + '" stroke-width="7" stroke-linecap="round"/><circle cx="176" cy="97" r="9" fill="' + acc2 + '" ' + st + '/>';
    // feet
    if (has('feet')) out += '<ellipse cx="70" cy="177" rx="22" ry="11" fill="' + mid + '" ' + st + '/><ellipse cx="130" cy="177" rx="22" ry="11" fill="' + mid + '" ' + st + '/>';
    // head gear that sits behind the body
    var tw = sh.hw, T = sh.top;
    if (s.top === 'horns') out += '<path d="M' + (100 - tw * 0.55) + ' ' + (T + 14) + ' L' + (100 - tw * 0.9) + ' ' + (T - 22) + ' L' + (100 - tw * 0.2) + ' ' + (T + 6) + 'Z" fill="' + acc2 + '" ' + st + '/><path d="M' + (100 + tw * 0.55) + ' ' + (T + 14) + ' L' + (100 + tw * 0.9) + ' ' + (T - 22) + ' L' + (100 + tw * 0.2) + ' ' + (T + 6) + 'Z" fill="' + acc2 + '" ' + st + '/>';
    if (s.top === 'ears') out += '<path d="M' + (100 - tw * 0.95) + ' ' + (T + 6) + ' L' + (100 - tw * 0.75) + ' ' + (T - 24) + ' L' + (100 - tw * 0.25) + ' ' + (T + 8) + 'Z" fill="' + base + '" ' + st + '/><path d="M' + (100 - tw * 0.8) + ' ' + (T + 2) + ' L' + (100 - tw * 0.72) + ' ' + (T - 12) + ' L' + (100 - tw * 0.45) + ' ' + (T + 4) + 'Z" fill="' + lite + '"/><path d="M' + (100 + tw * 0.95) + ' ' + (T + 6) + ' L' + (100 + tw * 0.75) + ' ' + (T - 24) + ' L' + (100 + tw * 0.25) + ' ' + (T + 8) + 'Z" fill="' + base + '" ' + st + '/><path d="M' + (100 + tw * 0.8) + ' ' + (T + 2) + ' L' + (100 + tw * 0.72) + ' ' + (T - 12) + ' L' + (100 + tw * 0.45) + ' ' + (T + 4) + 'Z" fill="' + lite + '"/>';
    if (s.top === 'antenna') out += '<path d="M' + (100 - 22) + ' ' + (T + 6) + ' Q' + (100 - 36) + ' ' + (T - 20) + ' ' + (100 - 30) + ' ' + (T - 30) + '" fill="none" ' + st + '/><circle cx="' + (100 - 30) + '" cy="' + (T - 32) + '" r="9" fill="' + acc2 + '" ' + st + '/><path d="M' + (100 + 22) + ' ' + (T + 6) + ' Q' + (100 + 36) + ' ' + (T - 20) + ' ' + (100 + 30) + ' ' + (T - 30) + '" fill="none" ' + st + '/><circle cx="' + (100 + 30) + '" cy="' + (T - 32) + '" r="9" fill="' + acc2 + '" ' + st + '/>';
    if (s.top === 'spikes' || stage >= 1) {
      var n = s.top === 'spikes' ? 5 : 3, sp = '';
      for (i = 0; i < n; i++) { var px = 100 + (i - (n - 1) / 2) * 20, py = T + 6 + Math.abs(i - (n - 1) / 2) * 3; sp += '<path d="M' + (px - 10) + ' ' + (py + 8) + ' L' + px + ' ' + (py - (stage >= 1 ? 26 : 20)) + ' L' + (px + 10) + ' ' + (py + 8) + 'Z" fill="' + (s.top === 'spikes' ? acc2 : acc) + '" ' + st + '/>'; }
      out += sp;
    }
    if (s.top === 'fin') out += '<path d="M' + (100 - 30) + ' ' + (T + 10) + ' Q100 ' + (T - 40) + ' ' + (100 + 30) + ' ' + (T + 10) + 'Z" fill="' + acc + '" ' + st + '/>';
    // body
    out += '<path d="' + sh.d + '" fill="' + base + '" ' + st + '/>';
    // belly
    if (s.pat === 'belly' || s.pat === 'stripes') out += '<ellipse cx="100" cy="' + (sh.bel + 2) + '" rx="' + (sh.hw * 0.62) + '" ry="' + (s.shape === 'squat' ? 22 : 26) + '" fill="' + lite + '" opacity="' + (s.pat === 'belly' ? 1 : 0.85) + '"/>';
    if (s.pat === 'spots') for (i = 0; i < 5; i++) out += '<circle cx="' + (100 + [-38, 34, -22, 40, 8][i]) + '" cy="' + (sh.ey + [30, 24, 52, 52, 66][i]) + '" r="' + [8, 6, 7, 5, 6][i] + '" fill="' + mid + '" opacity=".55"/>';
    if (s.pat === 'stripes') for (i = 0; i < 3; i++) out += '<path d="M' + (100 - sh.hw * 0.7 + i * 4) + ' ' + (sh.ey + 14 + i * 14) + ' Q100 ' + (sh.ey + 4 + i * 14) + ' ' + (100 + sh.hw * 0.7 - i * 4) + ' ' + (sh.ey + 14 + i * 14) + '" fill="none" stroke="' + mid + '" stroke-width="5" opacity=".6" stroke-linecap="round"/>';
    // arms
    if (has('arms')) out += '<ellipse cx="' + (100 - sh.hw + 2) + '" cy="' + (sh.ey + 38) + '" rx="12" ry="17" fill="' + base + '" ' + st + ' transform="rotate(18 ' + (100 - sh.hw + 2) + ' ' + (sh.ey + 38) + ')"/><ellipse cx="' + (100 + sh.hw - 2) + '" cy="' + (sh.ey + 38) + '" rx="12" ry="17" fill="' + base + '" ' + st + ' transform="rotate(-18 ' + (100 + sh.hw - 2) + ' ' + (sh.ey + 38) + ')"/>';
    // symbol on belly
    if (s.sym && !opts.silhouette) {
      var fs = s.sym.length > 1 ? 24 : 34;
      out += '<text x="100" y="' + (sh.bel + 14) + '" text-anchor="middle" font-family="Lexend,system-ui,sans-serif" font-weight="800" font-size="' + fs + '" fill="' + dark + '">' + s.sym + '</text>';
    }
    // face
    var ey = sh.ey, mood = s.boss ? 'sad' : '';
    if (!opts.silhouette) {
      if (s.eyes === 1) out += eyeSVG(100, ey, 20, mood);
      else if (s.eyes === 2) out += eyeSVG(100 - 22, ey, 13, mood) + eyeSVG(100 + 22, ey, 13, mood ? 'sad' : '').replace(/L\d+\.?\d* \d+\.?\d*"/, function (m) { return m; });
      else out += eyeSVG(100 - 28, ey + 4, 11, mood) + eyeSVG(100 + 28, ey + 4, 11, mood) + eyeSVG(100, ey - 16, 11, mood);
      var my = sh.my;
      if (s.mouth === 'smile') out += '<path d="M' + (100 - 15) + ' ' + my + ' Q100 ' + (my + 17) + ' ' + (100 + 15) + ' ' + my + '" fill="none" stroke="' + dark + '" stroke-width="4" stroke-linecap="round"/>';
      if (s.mouth === 'open') out += '<path d="M' + (100 - 14) + ' ' + my + ' Q100 ' + (my + 28) + ' ' + (100 + 14) + ' ' + my + 'Z" fill="' + dark + '" stroke="' + dark + '" stroke-width="3" stroke-linejoin="round"/><path d="M' + (100 - 8) + ' ' + (my + 11) + ' Q100 ' + (my + 6) + ' ' + (100 + 8) + ' ' + (my + 11) + ' Q100 ' + (my + 20) + ' ' + (100 - 8) + ' ' + (my + 11) + 'Z" fill="#ff7a8a"/>';
      if (s.mouth === 'fang') out += '<path d="M' + (100 - 18) + ' ' + my + ' Q100 ' + (my + 14) + ' ' + (100 + 18) + ' ' + my + '" fill="none" stroke="' + dark + '" stroke-width="4" stroke-linecap="round"/><path d="M' + (100 - 13) + ' ' + (my + 5) + ' L' + (100 - 9) + ' ' + (my + 16) + ' L' + (100 - 5) + ' ' + (my + 8) + 'Z" fill="#fff" stroke="' + dark + '" stroke-width="2"/><path d="M' + (100 + 13) + ' ' + (my + 5) + ' L' + (100 + 9) + ' ' + (my + 16) + ' L' + (100 + 5) + ' ' + (my + 8) + 'Z" fill="#fff" stroke="' + dark + '" stroke-width="2"/>';
      // cheeks
      out += '<circle cx="' + (100 - sh.hw * 0.62) + '" cy="' + (my - 4) + '" r="7" fill="#ff8aa0" opacity=".45"/><circle cx="' + (100 + sh.hw * 0.62) + '" cy="' + (my - 4) + '" r="7" fill="#ff8aa0" opacity=".45"/>';
    }
    // crown on top (bosses)
    if (s.top === 'crown') {
      var cy = T - 6;
      out += '<path d="M' + (100 - 30) + ' ' + (cy + 14) + ' L' + (100 - 34) + ' ' + (cy - 22) + ' L' + (100 - 14) + ' ' + (cy - 4) + ' L100 ' + (cy - 28) + ' L' + (100 + 14) + ' ' + (cy - 4) + ' L' + (100 + 34) + ' ' + (cy - 22) + ' L' + (100 + 30) + ' ' + (cy + 14) + 'Z" fill="#ffd23f" stroke="' + (opts.silhouette ? '#171b2c' : '#8a5a00') + '" stroke-width="5" stroke-linejoin="round"/>' +
        (opts.silhouette ? '' : '<circle cx="100" cy="' + (cy - 30) + '" r="5" fill="#ff5d6c" stroke="#8a5a00" stroke-width="2"/><circle cx="' + (100 - 34) + '" cy="' + (cy - 24) + '" r="4" fill="#5dc7ff" stroke="#8a5a00" stroke-width="2"/><circle cx="' + (100 + 34) + '" cy="' + (cy - 24) + '" r="4" fill="#5dc7ff" stroke="#8a5a00" stroke-width="2"/>');
    }
    // sparkles for stage 2
    if (stage >= 2 && !opts.silhouette) out += '<text x="28" y="40" font-size="22">✨</text><text x="162" y="52" font-size="18">✨</text>';
    var scale = 0.86 + stage * 0.07;
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + s.name + '"><g transform="translate(100 190) scale(' + scale + ') translate(-100 -190)">' + out + '</g></svg>';
  }

  window.GameMon = { ZONES: ZONES, SPECIES: SPECIES, BY: BY, ofZone: ofZone, bossOf: bossOf, svg: svg, SYM: SYM };
})();

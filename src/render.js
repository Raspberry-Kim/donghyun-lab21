/* 화면 그리기 */
(function () {
  'use strict';
  const DS = window.DS, W = DS.W, H = DS.H, S = DS.S, ART = DS.ART, PI = Math.PI, TH = DS.TERRAIN_H;
  const FONT = "Gaegu, 'Nanum Pen Script', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  DS.FONT = FONT;

  function Render(cv) {
    this.cv = cv; cv.width = W * S; cv.height = H * S;
    this.c = cv.getContext('2d', { alpha: false, desynchronized: true });
    this.paper = DS.makePaper(W * S, H * S, 11);
    this.terrain = null; this.turn = 0; this.jr = DS.RNG(77);
  }
  const R = Render.prototype;

  R.prepare = function (stage) {
    if (this.terrain) { this.terrain.width = this.terrain.height = 0; this.terrain = null; }      // 앞 장의 땅 그림은 버린다
    this.terrain = DS.makeTerrain(stage);
    const st = DS.STAGES[stage], need = {};
    st.events.forEach(e => { if (e.boss) { const b = DS.BOSSES[e.boss]; need[b.spr] = 1; (b.parts || []).forEach(p => need[p.spr] = 1); if (b.dome) need.b_dome = 1; } else { const d = DS.ENEMIES[e.type]; need[d.spr] = 1; if (d.tur) need[d.tur] = 1; } });
    Object.keys(need).forEach(n => ART.get(n));
  };
  R.warm = function () {
    ['p38', 'hayate', 'pancake', 'eb_s', 'eb_l', 'eb_n', 'ps_a', 'ps_w', 'ps_m', 'ps_r', 'disc', 'beam', 'wing', 'ring', 'swirl', 'it_p', 'it_b', 'it_m', 'ic_bomb', 'hit', 'scorch', 'prop', 'rotor', 'cloud0', 'cloud1', 'cloud2'].forEach(n => ART.get(n));
    ['s', 'm', 'l'].forEach(k => { for (let i = 0; i < DS.BOOM[k]; i++) ART.get('boom_' + k + i); });
  };

  R.spr = function (name, x, y, rot, sx, sy, fi, alpha) {
    const s = ART.get(name), c = this.c, f = s.frames[(fi || 0) % s.frames.length];
    if (alpha != null) c.globalAlpha = alpha;
    if (rot || (sx != null && sx !== 1) || (sy != null && sy !== 1)) {
      c.save(); c.translate(x * S, y * S); if (rot) c.rotate(rot); c.scale(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy);
      c.drawImage(f, -s.w * S / 2, -s.h * S / 2); c.restore();
    } else c.drawImage(f, Math.round((x - s.w / 2) * S), Math.round((y - s.h / 2) * S));
    if (alpha != null) c.globalAlpha = 1;
    return s;
  };
  R.props = function (s, x, y, rot, t, sx) {
    const pr = s.o.props; if (!pr) return;
    const c = this.c, fy = s.o.flipY ? -1 : 1, cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
    for (let i = 0; i < pr.length; i++) {
      const q = pr[i], px = q[0] * (sx || 1), py = q[1] * fy, ps = ART.get(q[3] ? 'rotor' : 'prop'), f = ps.frames[((t >> 1) + i) % ps.frames.length], r = q[2] * S;
      const wx = x + px * cr - py * sr, wy = y + px * sr + py * cr;
      c.drawImage(f, Math.round(wx * S - r), Math.round(wy * S - r), r * 2, r * 2);
    }
  };
  R.text = function (txt, x, y, px, align, alpha, weight) {
    const c = this.c; c.font = (weight || 700) + ' ' + Math.round(px * S) + 'px ' + FONT; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.wordSpacing = (-px * S * 0.14).toFixed(1) + 'px';
    c.globalAlpha = (alpha == null ? 1 : alpha) * 0.35; c.fillStyle = DS.FILL;
    c.lineWidth = Math.min(px * 0.22, 3) * S; c.strokeStyle = DS.FILL; c.lineJoin = 'round'; c.globalAlpha = (alpha == null ? 1 : alpha) * 0.8; c.strokeText(txt, x * S, y * S);
    c.globalAlpha = (alpha == null ? 1 : alpha) * 0.9; c.fillStyle = DS.INK; c.fillText(txt, x * S, y * S); c.globalAlpha = 1;
  };

  R.enemy = function (e, g) {
    const d = e.def, fi = ((g.t / 10) | 0) + e.id, al = e.flash > 0 ? 0.45 : null;
    let x = e.x, y = e.y;
    if (e.dying) { x += (this.jr() - 0.5) * 2; y += (this.jr() - 0.5) * 2; }
    if (d.isTur) { this.spr(d.spr, x, y, e.ta + PI / 2, 1, 1, fi, al); return; }
    const s = this.spr(d.spr, x, y, d.rot ? e.rot : 0, 1, 1, fi, al);
    this.props(s, x, y, d.rot ? e.rot : 0, g.t + e.id);
    if (d.tur) this.spr(d.tur, x, y + (d.turY || 0), e.ta + PI / 2, 1, 1, fi, al);
    if (e.boss && e.bd.dome && e.open) this.spr('b_dome', x, y, 0, 1, 1, fi, al);
  };

  R.draw = function (g) {
    const c = this.c;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    c.drawImage(this.paper, 0, 0);
    if (!g) return;
    const shx = g.shake > 0 ? Math.round((this.jr() - 0.5) * Math.min(8, g.shake) * 0.9 * S) : 0, shy = g.shake > 0 ? Math.round((this.jr() - 0.5) * Math.min(8, g.shake) * 0.9 * S) : 0;
    c.setTransform(1, 0, 0, 1, shx, shy);
    const t = g.t, p = g.pl, E = g.enemies;
    this.backdrop(g.scroll, g.mode === 'intro' ? Math.min(1, g.modeT / 60) : 1);
    for (let i = 0; i < g.decals.length; i++) { const d = g.decals[i]; if (!d.par) this.spr('scorch', d.x, d.y, i, d.s, d.s, 0, 0.8); }
    for (let i = 0; i < E.length; i++) if (E[i].ground && !E[i].dead) this.enemy(E[i], g);
    for (let i = 0; i < g.decals.length; i++) { const d = g.decals[i]; if (d.par) this.spr('scorch', d.x, d.y, i, d.s, d.s, 0, 0.9); }
    this.fxs(g, true);
    for (let i = 0; i < g.clouds.length; i++) { const q = g.clouds[i]; this.spr('cloud' + q.k, q.x, q.y, 0, 1, 1, 0, 0.7); }
    for (let i = 0; i < g.items.length; i++) { const it = g.items[i]; this.spr(it.k === 'P' ? 'it_p' : it.k === 'B' ? 'it_b' : 'it_m', it.x, it.y, it.k === 'M' ? it.t * 0.08 : Math.sin(it.t * 0.1) * 0.15, 1, 1, (t / 8) | 0); }
    for (let i = 0; i < E.length; i++) if (!E[i].ground && !E[i].dead) this.enemy(E[i], g);

    // 내 탄
    for (let i = 0; i < g.shots.length; i++) { const s = g.shots[i]; this.spr(s.spr, s.x, s.y, s.rot, 1, 1, (t >> 2) + i); }
    if (g.beam) {
      const b = g.beam, s = ART.get('beam'), k = b.hw * 2 / 22, fade = Math.min(1, (b.life - b.t) / 8, b.t / 3);
      c.globalAlpha = Math.max(0.15, fade * 0.62);
      for (let y = p.y - 12 - 24, i = 0; y > -30; y -= 46, i++) { const f = s.frames[((t >> 1) + i) % s.frames.length]; c.drawImage(f, Math.round((p.x - s.w * k / 2) * S), Math.round((y - s.h / 2) * S), s.w * k * S, s.h * S); }
      c.globalAlpha = 1;
    }
    if (g.bombT > 0) {
      if (g.bombK === 'pancake') { const k = g.bombR / 29; this.spr('swirl', g.bx, g.by, t * 0.21, k, k, t >> 2, 0.42); this.spr('ring', g.bx, g.by, -t * 0.1, k * 1.03, k * 1.03, t >> 2, 0.6); }
      else if (g.bombK === 'hayate') g.wings.forEach((w, i) => { const s = this.spr('wing', w.x, w.y, 0, 1, 1, (t >> 3) + i); this.props(s, w.x, w.y, 0, t + i); });
    }
    // 주인공
    if (p.dead <= 0 && !(p.inv > 0 && g.bombT <= 0 && p.ctrl && g.mode !== 'clear' && ((t >> 2) & 1))) {
      const sx = 1 - 0.17 * Math.abs(p.bank), s = this.spr(g.plane.spr, p.x, p.y, 0, sx, 1, (t / 10) | 0);
      this.props(s, p.x, p.y, 0, t, sx);
      if (p.chg > 0) {
        const CH = DS.CH, lv = p.chg >= CH[2] ? 3 : p.chg >= CH[1] ? 2 : p.chg >= CH[0] ? 1 : 0;
        const a0 = lv === 0 ? 0 : CH[lv - 1], a1 = lv >= 3 ? CH[2] : CH[lv], fr = lv >= 3 ? 1 : (p.chg - a0) / (a1 - a0);
        c.strokeStyle = DS.INK; c.lineCap = 'round';
        for (let i = 0; i <= lv && i < 3; i++) {
          const rr = (15 + i * 3.4 + Math.sin(t * 0.5 + i) * 0.5) * S;
          c.globalAlpha = i < lv ? 0.85 : 0.55; c.lineWidth = (i < lv ? 1.0 : 0.6) * S;
          c.beginPath(); c.arc(p.x * S, p.y * S, rr, -PI / 2 + i * 0.4, -PI / 2 + i * 0.4 + 2 * PI * (i < lv ? 1 : fr)); c.stroke();
        }
        c.globalAlpha = 1;
      }
    }
    // 적탄
    for (let i = 0; i < g.bullets.length; i++) { const b = g.bullets[i]; if (b.bt === 'n') this.spr('eb_n', b.x, b.y, Math.atan2(b.vy, b.vx) - PI / 2, 1, 1, 0); else this.spr(b.bt === 'l' ? 'eb_l' : 'eb_s', b.x, b.y, 0, 1, 1, (t >> 3) + i); }
    this.fxs(g, false);
    for (let i = 0; i < g.pops.length; i++) { const q = g.pops[i]; this.text(q.txt, q.x, q.y, 9, 'center', Math.min(1, (50 - q.t) / 15)); }
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (g.flash > 0) { c.globalAlpha = Math.min(0.8, g.flash / 12); c.fillStyle = '#fbf8ee'; c.fillRect(0, 0, W * S, H * S); c.globalAlpha = 1; }
    this.hud(g);
    if (this.turn > 0) this.pageTurn(this.turn);
  };

  R.backdrop = function (scroll, alpha) {
    if (!this.terrain) return;
    const c = this.c, o = Math.round((scroll % TH) * S);
    if (alpha < 1) c.globalAlpha = alpha;
    c.drawImage(this.terrain, 0, o); c.drawImage(this.terrain, 0, o - TH * S);
    c.globalAlpha = 1;
  };
  /* 연필로 두 번 그은 네모 */
  R.box = function (x, y, w, h, seed, lw, alpha, fill) {
    const c = this.c, j = (n) => ((DS.hash('b' + (seed * 31 + n)) % 1000) / 1000 - 0.5) * 1.6 * S;
    if (fill != null) { c.globalAlpha = fill; c.fillStyle = DS.FILL; c.fillRect(x * S, y * S, w * S, h * S); }
    c.strokeStyle = DS.INK; c.lineCap = 'round'; c.lineWidth = (lw || 0.8) * S;
    for (let k = 0; k < 2; k++) {
      c.globalAlpha = (alpha == null ? 0.8 : alpha) * (k ? 0.5 : 1);
      const a = k * 8, x0 = x * S, y0 = y * S, x1 = (x + w) * S, y1 = (y + h) * S;
      c.beginPath();
      c.moveTo(x0 + j(a), y0 + j(a + 1)); c.lineTo(x1 + j(a + 2), y0 + j(a + 3)); c.lineTo(x1 + j(a + 4), y1 + j(a + 5)); c.lineTo(x0 + j(a + 6), y1 + j(a + 7)); c.closePath(); c.stroke();
    }
    c.globalAlpha = 1;
  };
  R.wash = function (alpha) { const c = this.c; c.globalAlpha = alpha; c.drawImage(this.paper, 0, 0); c.globalAlpha = 1; };

  R.fxs = function (g, ground) {
    for (let i = 0; i < g.fx.length; i++) {
      const f = g.fx[i]; if (!!f.g !== ground) continue;
      const k = Math.min(f.n - 1, (f.t / f.rate) | 0);
      if (f.k === 'hit') this.spr('hit', f.x, f.y, f.t, 1, 1, k); else this.spr(f.k + k, f.x, f.y, 0, 1, 1, 0);
    }
  };

  R.bar = function (x, y, w, h, fr) {
    const c = this.c; c.globalAlpha = 0.75; c.fillStyle = DS.FILL; c.fillRect(x * S, y * S, w * S, h * S);
    c.globalAlpha = 0.72; c.fillStyle = DS.INK; c.fillRect(x * S, y * S, w * fr * S, h * S);
    c.globalAlpha = 0.9; c.strokeStyle = DS.INK; c.lineWidth = 0.7 * S; c.strokeRect(x * S - 1, y * S - 1, w * S + 2, h * S + 2); c.globalAlpha = 1;
  };

  R.hud = function (g) {
    const c = this.c, p = g.pl, pad = n => ('0000000' + n).slice(-7);
    this.text(pad(g.score), 6, 9, 11, 'left');
    this.text('최고 ' + pad(g.hi), W - 6, 9, 9, 'right', 0.8);
    this.text('스테이지 ' + (g.stage + 1), 6, 21, 8, 'left', 0.75);
    const ps = ART.get(g.plane.spr);
    const lw = ps.w * 0.4, lh = ps.h * 0.4, ly = H - 11 - lh / 2;                       // 예비 기체: 넷까지는 그림으로, 그보다 많으면 그림 하나와 수
    if (g.lives > 4) { c.drawImage(ps.frames[0], Math.round(5 * S), Math.round(ly * S), lw * S, lh * S); this.text('×' + g.lives, 7 + lw, H - 10, 10, 'left'); }
    else for (let i = 0; i < g.lives; i++) c.drawImage(ps.frames[0], Math.round((5 + i * 15) * S), Math.round(ly * S), lw * S, lh * S);
    const bs = ART.get('ic_bomb');
    for (let i = 0; i < p.bombs; i++) c.drawImage(bs.frames[0], Math.round((W - 14 - i * 11) * S), Math.round((H - 19) * S), bs.w * S * 0.85, bs.h * S * 0.85);
    this.text('힘', W / 2 - 22, H - 9, 8, 'right', 0.8);
    for (let i = 0; i < 4; i++) { c.globalAlpha = 0.85; c.strokeStyle = DS.INK; c.lineWidth = 0.6 * S; c.strokeRect((W / 2 - 19 + i * 9) * S, (H - 13) * S, 7 * S, 7 * S); if (i <= p.power) { c.globalAlpha = 0.7; c.fillStyle = DS.INK; c.fillRect((W / 2 - 18 + i * 9) * S, (H - 12) * S, 5 * S, 5 * S); } }
    c.globalAlpha = 1;
    if (g.boss && g.boss.arrived && !g.boss.dying) { this.bar(46, 20, 148, 3.4, Math.max(0, g.boss.hp / g.boss.mhp)); }
    if (g.mode === 'intro') {
      const a = Math.min(1, g.modeT / 20, (130 - g.modeT) / 20);
      this.text(g.S.sub, W / 2, 104, 12, 'center', a); this.text(g.S.name, W / 2, 128, 25, 'center', a);
      c.globalAlpha = a * 0.8; c.strokeStyle = DS.INK; c.lineWidth = 0.8 * S; c.beginPath(); c.moveTo(62 * S, 146 * S); c.quadraticCurveTo(120 * S, 150 * S, 180 * S, 145 * S); c.stroke(); c.globalAlpha = 1;
    }
    if (g.warn > 0 && ((g.warn / 14) | 0) % 2 === 0) {
      this.text('큰 것이 온다', W / 2, 111, 23, 'center'); if (g.warnBoss) this.text(DS.BOSSES[g.warnBoss].name, W / 2, 129, 11, 'center', 0.9);
      c.strokeStyle = DS.INK; c.globalAlpha = 0.75; c.lineWidth = 0.9 * S;
      for (let x = 20; x < W - 20; x += 7) { c.beginPath(); c.moveTo(x * S, 96 * S); c.lineTo((x + 5) * S, 90 * S); c.moveTo(x * S, 142 * S); c.lineTo((x + 5) * S, 136 * S); c.stroke(); }
      c.globalAlpha = 1;
    }
    if (g.mode === 'clear' && g.modeT > 40) {
      const a = Math.min(1, (g.modeT - 40) / 20);
      this.text(g.S.name + ' 넘김', W / 2, 110, 22, 'center', a);
      if (g.modeT > 80) this.text('남은 기체·폭탄 보너스  ' + g.clearBonus, W / 2, 140, 10, 'center', a);
      if (g.modeT > 120) this.text('쓰러뜨린 적  ' + g.kills + ' / ' + g.spawned, W / 2, 156, 10, 'center', a);
    }
  };

  R.pageTurn = function (k) {      // 종이를 넘기는 전환 (k: 0→1)
    const c = this.c, x = Math.round(W * S * (1 - k));
    c.drawImage(this.paper, x, 0, W * S - x, H * S, x, 0, W * S - x, H * S);
    const gr = c.createLinearGradient(x - 26 * S, 0, x, 0); gr.addColorStop(0, 'rgba(40,40,40,0)'); gr.addColorStop(1, 'rgba(40,40,40,0.3)');
    c.fillStyle = gr; c.fillRect(x - 26 * S, 0, 26 * S, H * S);
    c.fillStyle = 'rgba(60,60,60,0.5)'; c.fillRect(x - 1, 0, 2, H * S);
  };

  DS.Render = Render;
})();

/* 게임 엔진 — 1초에 60걸음 고정 */
(function () {
  'use strict';
  const DS = window.DS, W = DS.W, H = DS.H, PI = Math.PI, RNG = DS.RNG;
  const CH = [30, 72, 120];          // 차지 단계에 이르는 걸음 수
  DS.CH = CH;

  const MV = {
    dive(e) { e.x += e.vx; e.y += e.vy; },
    sine(e) { e.y += e.vy; e.x = e.x0 + Math.sin(e.t * e.p.f + (e.p.ph || 0)) * e.p.a; },
    swoop(e) {
      if (!e.s1 && e.y < e.p.y) { e.y += e.vy; }
      else { e.s1 = 1; e.vx += e.p.dir * 0.07; e.vy -= 0.04; e.x += e.vx; e.y += e.vy; }
    },
    chase(e, g) { const dx = g.pl.x - e.x; if (e.y < g.pl.y - 30) e.vx += (dx > 0 ? 1 : -1) * 0.05; e.vx *= 0.965; e.x += e.vx; e.y += e.vy; },
    cross(e) { e.x += e.vx; e.y += e.vy; },
    hover(e) {
      if (e.t < e.p.wait) { e.x += (e.p.tx + Math.sin(e.t * 0.02 + e.id) * 10 - e.x) * 0.04; e.y += (e.p.ty - e.y) * 0.04; }
      else { e.hv = (e.hv || 0) - 0.03; e.y += e.hv; e.x += (e.x < W / 2 ? -0.4 : 0.4); }
    },
    ground(e, g) { e.y += g.scrollSpd + (e.vy || 0); e.x += e.vx; }
  };

  function Game(o) {
    this.planeIdx = o.plane; this.diffIdx = o.diff;
    this.plane = DS.PLANES[o.plane]; this.D = DS.DIFFS[o.diff];
    this.rng = RNG(20261122 + o.plane * 7 + o.diff * 13);
    this.hi = o.hi || 0; this.sfx = o.sfx || function () { };
    this.god = !!o.god; this.hits = 0;
    /* 출전 설정: 생명 수(기체 수, 1~9) · 폭탄 수(시작할 때와 새 기체가 나올 때 채우는 수, 0~5) */
    this.life0 = Math.max(1, Math.min(9, o.lives == null ? 3 : o.lives)); this.bomb0 = Math.max(0, Math.min(5, o.bombs == null ? 2 : o.bombs));
    this.score = 0; this.lives = this.life0 - 1; this.conts = 0; this.t = 0; this.eid = 0;
    this.nextExtend = 150000; this.totalT = 0;
    this.pl = { x: W / 2, y: H + 30, power: o.power || 0, bombs: this.bomb0, inv: 0, dead: 0, chg: 0, fireCd: 0, subCd: 0, bank: 0, ctrl: false, vx: 0, vy: 0 };
    this.startStage(o.stage || 0);
  }
  const G = Game.prototype;

  G.startStage = function (i) {
    this.stage = i; this.S = DS.STAGES[i];
    this.shots = []; this.enemies = []; this.bullets = []; this.items = []; this.fx = []; this.pops = []; this.decals = []; this.clouds = []; this.timers = []; this.wings = [];
    this.scroll = 0; this.scrollSpd = this.S.scroll; this.scrollTo = this.S.scroll;
    this.tl = this.S.events; this.ti = 0; this.st = 0; this.hold = false; this.boss = null;
    this.mode = 'intro'; this.modeT = 0; this.warn = 0; this.shake = 0; this.flash = 0;
    this.bombT = 0; this.beam = null; this.kills = 0; this.spawned = 0; this.medal = 0;
    this.sk = 1 + i * 0.06;          // 장이 넘어갈수록 조금씩 빨라진다
    const p = this.pl; p.x = W / 2; p.y = H + 30; p.ctrl = false; p.dead = 0; p.inv = 120; p.chg = 0;
  };

  /* 조금 뒤에 할 일. 저장할 수 있도록 함수가 아니라 자료로 적어 둔다: [종류, …] + 주인(적) */
  G.later = function (n, op, owner) { if (n <= 0) this.runOp(op, owner); else this.timers.push({ n: n, op: op, o: owner }); };
  G.runOp = function (op, e) {
    const k = op[0];
    if (k === 'aim') DS.PAT.aim(this, e.x + op[1], e.y + op[2], op[3], op[4], op[5], op[6]);
    else if (k === 'bul') this.bullet(e.x + op[1], e.y + op[2], op[3], op[4], op[5]);
    else if (k === 'torp') { const o = { reaim: op[2], sp2: op[3] }; this.bullet(e.x - 5, e.y + op[1], PI, 0.9, 'n', o); this.bullet(e.x + 5, e.y + op[1], 0, 0.9, 'n', o); }
    else if (k === 'fire') { if (e.fires && e.fires[op[1]]) this.fire(e, e.fires[op[1]].f); }
    else if (k === 'ring') DS.PAT.ring(this, e.x + op[1], e.y + op[2], op[3], op[4], op[5], op[6], op[7] ? { w: op[7], wt: op[8] } : null);
    else if (k === 'fan') DS.PAT.fan(this, e.x + op[1], e.y + op[2], op[3], op[4], op[5], op[6], op[7]);
    else if (k === 'spawn') { if (this.enemies.length < 48) this.spawnE(op[1], e.x + op[2], e.y + op[3], op[4]).brood = e.id; }      // 보스가 내보내는 작은 적
  };

  G.bullet = function (x, y, a, sp, bt, o) {
    if (this.bullets.length > 400) return;
    sp = sp * this.D.bs * this.sk;
    const b = { x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, bt: bt || 's', r: bt === 'l' ? 4.2 : bt === 'n' ? 2.2 : 2.7, a: a, t: 0 };
    if (o && o.reaim) { b.reaim = o.reaim; b.sp2 = o.sp2 * this.D.bs * this.sk; }
    if (o && o.w) { b.w = o.w; b.wt = o.wt || 60; }      // 휘는 탄: wt걸음 동안 걸음마다 w만큼 방향을 튼다
    this.bullets.push(b);
  };

  G.spawnE = function (type, x, y, o) {
    o = o || {};
    const def = DS.ENEMIES[type];
    const e = {
      id: ++this.eid, def: def, type: type, x: x, y: y, x0: x, vx: o.vx || 0, vy: o.vy == null ? (def.ground ? 0 : 1.4) : o.vy,
      hp: def.hp * this.D.hp, t: 0, mv: MV[o.mv || 'dive'], mvn: o.mv || 'dive', p: o.p || {}, drop: o.drop || def.drop, rot: 0, ta: PI / 2, flash: 0,
      ground: !!def.ground, dead: false, boxes: [[0, 0, def.hw, def.hh]], fires: null
    };
    e.mhp = e.hp;
    let f = o.fire === undefined ? def.fire : o.fire;
    if (def.zako && this.rng() > this.D.zp) f = null;
    if (f) e.fires = (Array.isArray(f) ? f : [f]).map(q => ({ f: q, c: q.at * (0.9 + 0.2 * this.rng()), n: 0 }));
    this.enemies.push(e); this.spawned++;
    return e;
  };

  G.spawnBoss = function (name, isMid) {
    const d = DS.BOSSES[name];
    const air = !d.ground;
    const sprH = DS.ART.get(d.spr).h;
    const e = {
      id: ++this.eid, def: { spr: d.spr, sc: d.sc, boom: 'l', hw: 0, hh: 0 }, bd: d, type: name, boss: true, mid: !!isMid,
      x: d.x || W / 2, y: -sprH / 2 - 10, x0: d.x || W / 2, vx: 0, vy: 0, hp: d.hp * this.D.hp, t: 0, p: {}, rot: 0, ta: PI / 2, flash: 0,
      ground: !air, dead: false, boxes: d.boxes, pi: 0, acts: null, arrived: false, dying: 0, leaving: false, open: false
    };
    e.mhp = e.hp;
    this.enemies.push(e); this.spawned++;
    (d.parts || []).forEach(pt => {
      const q = {
        id: ++this.eid, def: { spr: pt.spr, sc: 1000, boom: 'm', hw: pt.spr === 'bt_l' ? 9 : 6, hh: pt.spr === 'bt_l' ? 9 : 6, isTur: true }, type: 'part', parent: e, ox: pt.x, oy: pt.y,
        x: e.x + pt.x, y: e.y + pt.y, vx: 0, vy: 0, hp: pt.hp * this.D.hp, t: 0, p: {}, rot: 0, ta: PI / 2, flash: 0, ground: !air, dead: false
      };
      q.mhp = q.hp; q.boxes = [[0, 0, q.def.hw, q.def.hh]];
      q.fires = [{ f: pt.fire, c: pt.fire.at, n: 0 }];
      this.enemies.push(q); this.spawned++;
    });
    this.boss = e; this.hold = true;
    if (d.stop) this.scrollTo = 0;
    return e;
  };

  /* ── 한 걸음 ── */
  G.update = function (inp) {
    this.t++; this.modeT++; this.totalT++;
    const p = this.pl;
    if (this.mode === 'over' || this.mode === 'ending') { this.ambient(); return; }
    if (this.mode === 'intro') {
      if (p.y > H - 58) p.y -= 1.4;
      if (this.modeT > 130) { this.mode = 'play'; this.modeT = 0; p.ctrl = true; }
    } else if (this.mode === 'play') {
      if (!this.hold) {
        this.st++;
        while (this.ti < this.tl.length && this.tl[this.ti].t <= this.st) this.event(this.tl[this.ti++]);
      }
      if (this.warn > 0 && --this.warn === 0) this.spawnBoss(this.warnBoss, false);
    } else if (this.mode === 'clear') {
      if (this.modeT > 100) { p.ctrl = false; p.y -= 3.2; p.inv = 60; }
      if (this.modeT > 330 || (this.modeT > 150 && inp.shotEdge)) { this.mode = 'next'; this.modeT = 0; }
    } else if (this.mode === 'next') { this.ambient(); return; }

    this.scrollSpd += (this.scrollTo - this.scrollSpd) * 0.03;
    this.scroll += this.scrollSpd;
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const q = this.timers[i];
      if (q.o && (q.o.dead || q.o.dying)) { this.timers.splice(i, 1); continue; }
      if (--q.n <= 0) { this.timers.splice(i, 1); this.runOp(q.op, q.o); }
    }
    this.updPlayer(inp);
    this.updShots();
    this.updEnemies();
    this.updBullets();
    this.updBomb();
    this.updItems();
    this.ambient();
    if (this.score > this.hi) this.hi = this.score;
    if (this.score >= this.nextExtend) { this.nextExtend = this.nextExtend < 400000 ? 500000 : this.nextExtend + 500000; this.lives++; this.pop(p.x, p.y - 20, '1UP'); this.sfx('extend'); }
  };

  G.ambient = function () {
    if (this.shake > 0) this.shake--;
    if (this.flash > 0) this.flash--;
    for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.t++; if (f.g) f.y += this.scrollSpd; if (f.t >= f.n * f.rate) this.fx.splice(i, 1); }
    for (let i = this.pops.length - 1; i >= 0; i--) { const f = this.pops[i]; f.t++; f.y -= 0.4; if (f.t > 50) this.pops.splice(i, 1); }
    for (let i = this.decals.length - 1; i >= 0; i--) { const d = this.decals[i]; if (d.par) { d.x = d.par.x + d.ox; d.y = d.par.y + d.oy; } else d.y += this.scrollSpd; if (d.y > H + 30) this.decals.splice(i, 1); }
    if (this.rng() < 0.004 * this.S.cloud && this.clouds.length < 4) this.clouds.push({ x: this.rng() * W, y: -40, k: (this.rng() * 3) | 0, v: 0.9 + this.rng() * 0.6 });
    for (let i = this.clouds.length - 1; i >= 0; i--) { const c = this.clouds[i]; c.y += c.v + this.scrollSpd; if (c.y > H + 50) this.clouds.splice(i, 1); }
  };

  G.event = function (ev) {
    if (ev.k === 'mid') { this.spawnBoss(ev.boss, true); return; }
    if (ev.k === 'boss') { this.warn = 150; this.warnBoss = ev.boss; this.hold = true; this.sfx('warn'); return; }
    const def = DS.ENEMIES[ev.type];
    this.spawnE(ev.type, ev.x, ev.y == null ? (def.ground ? -24 : -16) : ev.y, ev);
  };

  /* ── 주인공 ── */
  G.updPlayer = function (inp) {
    const p = this.pl, pln = this.plane;
    if (p.dead > 0 || !p.ctrl) { inp.tdx = 0; inp.tdy = 0; }
    if (p.dead > 0) {
      if (--p.dead === 0) {
        if (this.mode === 'clear') this.respawn();      // 보스가 먼저 쓰러졌으면 기체를 잃지 않는다 (게임 오버 뒤에 빈 스테이지에 갇히던 일을 막는다)
        else if (this.lives > 0) { this.lives--; this.respawn(); }
        else { this.mode = 'over'; this.modeT = 0; }
      }
      return;
    }
    if (p.inv > 0) p.inv--;
    if (!p.ctrl) {
      if (this.mode === 'play' && p.y > H - 58) { p.y -= 2; if (p.y <= H - 58) p.ctrl = true; }
      p.bank *= 0.85; return;
    }
    let dx = (inp.r ? 1 : 0) - (inp.l ? 1 : 0), dy = (inp.d ? 1 : 0) - (inp.u ? 1 : 0);
    if (inp.ax || inp.ay) { dx = inp.ax; dy = inp.ay; }
    else if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    let mx = dx * pln.speed, my = dy * pln.speed;
    if (inp.tdx || inp.tdy) {         // 손가락으로 끈 만큼 따라간다 (남은 거리는 다음 걸음에)
      const c = 9, ax = Math.max(-c, Math.min(c, inp.tdx)), ay = Math.max(-c, Math.min(c, inp.tdy));
      mx += ax; my += ay; inp.tdx -= ax; inp.tdy -= ay;
    }
    const nx = p.x + mx, ny = p.y + my;
    p.x = Math.max(10, Math.min(W - 10, nx)); p.y = Math.max(18, Math.min(H - 14, ny));
    if (p.x !== nx) inp.tdx = 0; if (p.y !== ny) inp.tdy = 0;
    p.vx = mx; p.vy = my;
    p.bank += ((mx > 0.3 ? 1 : mx < -0.3 ? -1 : 0) - p.bank) * 0.2;
    if (p.fireCd > 0) p.fireCd--;
    if (p.subCd > 0) p.subCd--;
    if (inp.charge) {
      p.chg++;
      if (p.chg === CH[0] || p.chg === CH[1] || p.chg === CH[2]) this.sfx('chg');
    } else if (p.chg > 0) {
      const lv = p.chg >= CH[2] ? 3 : p.chg >= CH[1] ? 2 : p.chg >= CH[0] ? 1 : 0;
      p.chg = 0; if (lv) this.chargeShot(lv);
    }
    if (inp.shot && !inp.charge && p.fireCd <= 0) { this.fireMain(); p.fireCd = 5; }
    if (inp.bombEdge && p.bombs > 0 && this.bombT <= 0 && this.mode !== 'clear') this.useBomb();
  };

  G.respawn = function () {
    const p = this.pl; p.x = W / 2; p.y = H + 24; p.inv = 210; p.ctrl = false; p.bombs = Math.max(this.bomb0, p.bombs); p.chg = 0;
  };
  G.cont = function () { this.lives = this.life0 - 1; this.score = 0; this.conts++; this.nextExtend = 150000; this.mode = 'play'; this.respawn(); };

  G.shot = function (x, y, vx, vy, dmg, spr, o) {
    const s = { x: x, y: y, vx: vx, vy: vy, dmg: dmg, spr: spr, hw: 3, hh: 6, t: 0, rot: Math.atan2(vy, vx) + PI / 2 };
    if (o) Object.assign(s, o);
    this.shots.push(s); return s;
  };

  G.fireMain = function () {
    const p = this.pl, x = p.x, y = p.y - 10, L = p.power, V = 8.6, id = this.plane.id;
    const ang = (a, d, s, ox, oy) => this.shot(x + (ox || 0), y + (oy || 0), Math.sin(a) * V, -Math.cos(a) * V, d, s || 'ps_a');
    if (id === 'p38') {
      if (L < 2) { ang(0, 0.85, 'ps_a', -3.6); ang(0, 0.85, 'ps_a', 3.6); } else { this.shot(x - 3.4, y, 0, -V, 1.35, 'ps_w', { hw: 5 }); this.shot(x + 3.4, y, 0, -V, 1.35, 'ps_w', { hw: 5 }); }
      if (L >= 1) { ang(0, 0.85, 'ps_a', -10, 5); ang(0, 0.85, 'ps_a', 10, 5); }
      if (L >= 3) { ang(-0.07, 0.5, 'ps_a', -15, 8); ang(0.07, 0.5, 'ps_a', 15, 8); }
      if (L >= 1 && p.subCd <= 0) {
        p.subCd = L >= 2 ? 34 : 44;
        const n = L >= 3 ? 2 : 1;
        for (let i = 0; i < n; i++) [-1, 1].forEach(s => this.shot(x + s * 8, y + 8, s * (1.6 + i), -1.2, i ? 2 : 2.7, 'ps_m', { kind: 'hm', sp: 2.4, hw: 3 }));
      }
    } else if (id === 'hayate') {
      const n = 2 + L;
      for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2; ang(0, 1.15, 'ps_a', k * 3.3, Math.abs(k) * 1.6); }
      if (L >= 1 && p.subCd <= 0) { p.subCd = 36; [-1, 1].forEach(s => this.shot(x + s * 9, y + 8, 0, -2, 3.4 + L * 0.9, 'ps_m', { kind: 'ms', hw: 3 })); }
    } else if (id === 'shinden') {      // 기수의 기총 넷: 가장 좁게 모아 쏜다
      if (L < 2) { ang(0, 1.2, 'ps_a', -1.9); ang(0, 1.2, 'ps_a', 1.9); } else { this.shot(x - 2.3, y, 0, -V, 1.65, 'ps_w', { hw: 5 }); this.shot(x + 2.3, y, 0, -V, 1.65, 'ps_w', { hw: 5 }); }
      if (L >= 1) { const d = L >= 2 ? 1.04 : 0.86; ang(0, d, 'ps_a', -6.2, 4); ang(0, d, 'ps_a', 6.2, 4); }
      if (L >= 3) { ang(0, 0.86, 'ps_a', -9.8, 8); ang(0, 0.86, 'ps_a', 9.8, 8); }
      if (L >= 1 && p.subCd <= 0) {      // 달라붙는 탄: 맞은 적에 붙어 한동안 피해를 준다
        p.subCd = 48;
        (L >= 3 ? [-7, 7] : [p.subSide = -(p.subSide || 1)].map(s => s * 7)).forEach(ox => this.shot(x + ox, y + 8, 0, -2.6, 1.15, 'ps_h', { kind: 'st', hw: 3, hh: 5, tick: L >= 2 ? 0.86 : 0.7 }));
      }
    } else {
      const fan = L >= 3 ? [0, 0.13, -0.13, 0.27, -0.27, 0.42, -0.42] : L >= 2 ? [0, 0.14, -0.14, 0.3, -0.3] : [0, 0.16, -0.16];
      fan.forEach(a => ang(a, 0.8));
      if (L >= 1) { ang(0, 0.8, 'ps_a', -4, 2); ang(0, 0.8, 'ps_a', 4, 2); }
    }
    this.sfx('shot');
  };

  G.chargeShot = function (lv) {
    const p = this.pl, id = this.plane.id;
    this.sfx('charge');
    if (id === 'p38') {
      const n = [4, 7, 10][lv - 1];
      for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * (0.5 + lv * 0.22); this.shot(p.x + a * 16, p.y - 6, Math.sin(a) * 2.2, -Math.cos(a) * 2.2, 11, 'ps_r', { kind: 'rk', hw: 5, hh: 10, acc: 1.07 }); }
    } else if (id === 'hayate') {
      this.beam = { t: 0, life: [34, 58, 88][lv - 1], hw: [8, 10, 12][lv - 1], lv: lv };
    } else if (id === 'shinden') {      // 큰 밑그림 한 장이 앞으로 나아가며 지나는 적을 긋는다
      const k = lv - 1;
      this.shot(p.x, p.y - 8, 0, -1.2, [3.8, 5, 6.2][k], 'shin_g', { kind: 'gh', lv: lv, sc: [0.7, 0.95, 1.3][k], hw: [18, 25, 34][k], hh: [16, 22, 30][k], rot: 0 });
    } else {
      const n = lv + 1;
      for (let i = 0; i < n; i++) this.shot(p.x, p.y, 0, 0, 3.4, 'disc', { kind: 'disc', ang: i / n * 2 * PI, rad: 8, life: [70, 96, 124][lv - 1], hw: 11, hh: 11 });
    }
  };

  G.useBomb = function () {
    const p = this.pl; p.bombs--; this.bombT = 150; this.bombK = this.plane.id; p.inv = Math.max(p.inv, 190); this.flash = 10; this.shake = 12;
    this.bx = p.x; this.by = p.y; this.wings = [];
    this.clearBullets(false);
    if (this.bombK === 'hayate') for (let i = 0; i < 5; i++) this.wings.push({ x: 24 + i * 48, y: H + 20 + Math.abs(i - 2) * 16 });
    this.sfx('bomb');
  };
  G.clearBullets = function (toScore) {
    this.bullets.forEach(b => this.fx.push({ k: 'hit', x: b.x, y: b.y, t: 0, n: 2, rate: 4 }));
    this.bullets.length = 0;
  };
  G.updBomb = function () {
    const p = this.pl;
    if (this.beam) {
      const b = this.beam; b.t++;
      if (b.t > b.life || p.dead > 0) this.beam = null;
      else {
        const x0 = p.x - b.hw, x1 = p.x + b.hw, top = p.y - 12;
        this.enemies.forEach(e => { if (!e.dead && this.hitBox(e, x0, 0, x1, top)) this.hurt(e, 2.3, p.x, Math.min(top, e.y + 10)); });
        if (b.lv >= 2) for (let i = this.bullets.length - 1; i >= 0; i--) { const q = this.bullets[i]; if (q.x > x0 - 2 && q.x < x1 + 2 && q.y < top) { this.fx.push({ k: 'hit', x: q.x, y: q.y, t: 0, n: 2, rate: 4 }); this.bullets.splice(i, 1); } }
      }
    }
    if (this.bombT <= 0) return;
    this.bombT--; const t = 150 - this.bombT, k = this.bombK;
    if (k === 'pancake') {
      this.bx = p.x; this.by = p.y; const R = Math.min(170, 20 + t * 2.2); this.bombR = R;
      this.enemies.forEach(e => { if (!e.dead && Math.hypot(e.x - this.bx, e.y - this.by) < R + 20 && e.y > -30) this.hurt(e, 1.3, e.x, e.y); });
      for (let i = this.bullets.length - 1; i >= 0; i--) { const q = this.bullets[i]; if (Math.hypot(q.x - this.bx, q.y - this.by) < R) { this.fx.push({ k: 'hit', x: q.x, y: q.y, t: 0, n: 2, rate: 4 }); this.bullets.splice(i, 1); } }
    } else if (k === 'hayate') {
      this.wings.forEach((w, i) => {
        w.y -= 2.3;
        if (w.y > -20 && w.y < H && t % 4 === 0) { this.shot(w.x - 3, w.y - 10, 0, -9, 1.7, 'ps_a'); this.shot(w.x + 3, w.y - 10, 0, -9, 1.7, 'ps_a'); }
      });
      for (let i = this.bullets.length - 1; i >= 0; i--) { const q = this.bullets[i]; if (this.wings.some(w => Math.abs(q.x - w.x) < 26 && Math.abs(q.y - w.y) < 34)) { this.fx.push({ k: 'hit', x: q.x, y: q.y, t: 0, n: 2, rate: 4 }); this.bullets.splice(i, 1); } }
    } else if (k === 'shinden') {      // 번개 기둥 셋: 가운데는 기체를 따라오고 양옆은 벌어졌다 모인다
      const d = 22 + 66 * (0.5 - 0.5 * Math.cos(t * 0.09)), top = p.y - 10;
      this.wings = [0, -d, d].map(o => ({ x: Math.max(8, Math.min(W - 8, p.x + o)), y: top }));
      const hitX = x0 => this.wings.some(w => Math.abs(x0 - w.x) < 15);
      this.enemies.forEach(e => { if (!e.dead && e.y > -20 && this.wings.some(w => this.hitBox(e, w.x - 13, 0, w.x + 13, top))) this.hurt(e, 2.05, e.x, Math.min(top, e.y + 8)); });
      for (let i = this.bullets.length - 1; i >= 0; i--) { const q = this.bullets[i]; if (q.y < top + 6 && hitX(q.x)) { this.fx.push({ k: 'hit', x: q.x, y: q.y, t: 0, n: 2, rate: 4 }); this.bullets.splice(i, 1); } }
      if (t % 14 === 1) this.shake = Math.max(this.shake, 3);
      if (this.bombT <= 0) this.wings = [];
    } else {
      if (t % 9 === 0) {
        const row = t / 9, y = H - 30 - row * 20;
        if (y > -10) for (let i = 0; i < 5; i++) {
          const x = 24 + i * 48 + (this.rng() - 0.5) * 20, yy = y + (this.rng() - 0.5) * 12;
          this.boom(x, yy, 'm');
          this.enemies.forEach(e => { if (!e.dead && this.hitBox(e, x - 28, yy - 24, x + 28, yy + 24)) this.hurt(e, 13.5, x, yy); });
        }
        for (let i = this.bullets.length - 1; i >= 0; i--) if (this.bullets[i].y > y - 30) this.bullets.splice(i, 1);
        this.shake = 4; this.sfx('boom');
      }
    }
  };

  /* ── 내 탄 ── */
  G.hitBoxAt = function (e, x0, y0, x1, y1) {      // 닿은 상자를 돌려준다 (없으면 null)
    const bx = e.boxes;
    for (let i = 0; i < bx.length; i++) { const b = bx[i]; if (x1 > e.x + b[0] - b[2] && x0 < e.x + b[0] + b[2] && y1 > e.y + b[1] - b[3] && y0 < e.y + b[1] + b[3]) return b; }
    return null;
  };
  G.hitBox = function (e, x0, y0, x1, y1) { return !!this.hitBoxAt(e, x0, y0, x1, y1); };
  G.updShots = function () {
    const S = this.shots, E = this.enemies, p = this.pl;
    for (let i = S.length - 1; i >= 0; i--) {
      const s = S[i];
      if (s.hit) { S.splice(i, 1); continue; }      // 맞은 자리에서 한 걸음 보인 탄을 지운다
      s.t++;
      if (s.kind === 'disc') {
        if (s.t < s.life) { s.ang += 0.13; s.rad = Math.min(50, s.rad + 0.55); s.x = p.x + Math.cos(s.ang) * s.rad; s.y = p.y + Math.sin(s.ang) * s.rad; }
        else { s.y -= 6.5; }
        s.rot += 0.4;
        for (let k = this.bullets.length - 1; k >= 0; k--) { const q = this.bullets[k]; if (Math.abs(q.x - s.x) < 13 && Math.abs(q.y - s.y) < 13) { this.fx.push({ k: 'hit', x: q.x, y: q.y, t: 0, n: 2, rate: 4 }); this.bullets.splice(k, 1); } }
        if (this.t % 4 === 0) for (let j = 0; j < E.length; j++) { const e = E[j]; if (!e.dead && e.y > -20 && this.hitBox(e, s.x - s.hw, s.y - s.hh, s.x + s.hw, s.y + s.hh)) this.hurt(e, s.dmg, s.x, s.y); }
        if (s.y < -20) S.splice(i, 1);
        continue;
      }
      if (s.kind === 'gh') {      // 밑그림 돌진: 뚫고 지나가며 두 걸음마다 긋는다
        s.vy = Math.max(-3.4, s.vy * 1.09); s.y += s.vy;
        if (s.lv >= 2) for (let k = this.bullets.length - 1; k >= 0; k--) { const q = this.bullets[k]; if (Math.abs(q.x - s.x) < s.hw && Math.abs(q.y - s.y) < s.hh) { this.fx.push({ k: 'hit', x: q.x, y: q.y, t: 0, n: 2, rate: 4 }); this.bullets.splice(k, 1); } }
        if ((s.t & 1) === 0) for (let j = 0; j < E.length; j++) { const e = E[j]; if (!e.dead && e.y > -20 && this.hitBox(e, s.x - s.hw, s.y - s.hh, s.x + s.hw, s.y + s.hh)) this.hurt(e, s.dmg, e.x + (this.rng() - 0.5) * 10, Math.max(s.y - s.hh, Math.min(s.y + s.hh, e.y + 6))); }
        if (s.y < -s.hh - 20) S.splice(i, 1);
        continue;
      }
      if (s.kind === 'st' && s.stuck) {      // 붙은 탄: 적을 따라다니며 여섯 걸음마다 피해를 준다
        const e = s.tg;
        if (!e || e.dead || e.dying || --s.stuck <= 0) { this.fx.push({ k: 'hit', x: s.x, y: s.y, t: 0, n: 2, rate: 4 }); S.splice(i, 1); continue; }
        s.x = e.x + s.ox; s.y = e.y + s.oy;
        if (s.stuck % 6 === 0) this.hurt(e, s.tick, s.x, s.y);
        continue;
      }
      if (s.kind === 'hm') {
        if (s.t % 6 === 1 || (s.tg && s.tg.dead)) { let best = null, bd = 1e9; for (let j = 0; j < E.length; j++) { const e = E[j]; if (e.dead || e.dying || e.y < 0 || e.y > H) continue; const d = Math.hypot(e.x - s.x, e.y - s.y); if (d < bd) { bd = d; best = e; } } s.tg = best; }
        s.sp = Math.min(7, s.sp * 1.04);
        let ta = s.tg ? Math.atan2(s.tg.y - s.y, s.tg.x - s.x) : -PI / 2, ca = Math.atan2(s.vy, s.vx), da = ta - ca;
        while (da > PI) da -= 2 * PI; while (da < -PI) da += 2 * PI;
        ca += Math.max(-0.16, Math.min(0.16, da)); s.vx = Math.cos(ca) * s.sp; s.vy = Math.sin(ca) * s.sp; s.rot = ca + PI / 2;
        if (s.t > 150) { S.splice(i, 1); continue; }
      } else if (s.kind === 'ms') { s.vy = Math.max(-10, s.vy * 1.08); }
      else if (s.kind === 'st') { s.vy = Math.max(-9.5, s.vy * 1.09); }
      else if (s.kind === 'rk') { s.vx *= s.acc; s.vy *= s.acc; const v = Math.hypot(s.vx, s.vy); if (v > 9) { s.vx *= 9 / v; s.vy *= 9 / v; } }
      s.x += s.vx; s.y += s.vy;
      if (s.y < -16 || s.y > H + 16 || s.x < -16 || s.x > W + 16) { S.splice(i, 1); continue; }
      for (let j = 0; j < E.length; j++) {
        const e = E[j];
        if (e.dead || e.y < -30) continue;
        const b = this.hitBoxAt(e, s.x - s.hw, s.y - s.hh, s.x + s.hw, s.y + s.hh);
        if (b) {
          // 위로 가던 탄이 상자 아랫변을 넘었으면 닿은 자리로 되돌려 한 걸음 더 그린다 (닿기 전에 사라져 보이지 않게)
          const edge = e.y + b[1] + b[3] + s.hh; let touch = false;
          if (s.kind !== 'rk' && s.vy < -1 && s.y < edge && s.y - s.vy >= edge - 1) { const k = (edge - s.y) / -s.vy; s.x -= s.vx * k; s.y = edge; touch = true; }
          this.hurt(e, s.dmg, s.x, touch ? s.y - s.hh : s.y - 4);
          if (s.kind === 'rk') { this.boom(s.x, s.y - 6, 'm'); E.forEach(q => { if (q !== e && !q.dead && this.hitBox(q, s.x - 22, s.y - 26, s.x + 22, s.y + 16)) this.hurt(q, 5, q.x, q.y); }); }
          if (s.kind === 'st' && !e.dead && !e.dying) { s.stuck = 66; s.tg = e; s.ox = s.x - e.x; s.oy = Math.min(s.y - s.hh + 2, e.y + b[1] + b[3] - 1) - e.y; s.vx = s.vy = 0; s.x = e.x + s.ox; s.y = e.y + s.oy; }
          else if (touch) s.hit = 1; else S.splice(i, 1);
          break;
        }
      }
    }
  };

  G.hurt = function (e, dmg, hx, hy) {
    if (e.dead || e.dying) return;
    if (e.boss && !e.arrived) dmg *= 0.25;
    e.hp -= dmg; e.flash = 3;
    if ((this.t & 3) === 0 && hx != null) this.fx.push({ k: 'hit', x: hx + (this.rng() - 0.5) * 6, y: hy, t: 0, n: 2, rate: 3 });
    if (e.hp <= 0) this.kill(e);
  };
  G.boom = function (x, y, size, ground) { this.fx.push({ k: 'boom_' + size, x: x, y: y, t: 0, n: DS.BOOM[size], rate: size === 'l' ? 5 : 4, g: ground }); };
  G.pop = function (x, y, txt) { this.pops.push({ x: x, y: y, txt: txt, t: 0 }); };
  G.add = function (n) { this.score += n; };

  G.kill = function (e, silent) {
    if (e.boss) {
      e.dying = e.mid ? 70 : e.bd.last ? 270 : 150; this.clearBullets(); this.sfx('bossdie');
      this.enemies.forEach(q => { if ((q.parent === e || q.brood === e.id) && !q.dead) this.kill(q, true); });      // 포탑과, 보스가 내보낸 작은 적도 함께
      return;
    }
    e.dead = true;
    this.boom(e.x, e.y, e.def.boom, e.ground);
    if (e.ground) { this.decals.push({ x: e.x, y: e.y, s: e.def.isTur ? 0.6 : (e.def.hw > 9 ? 1 : 0.75), par: e.parent, ox: e.ox, oy: e.oy }); if (this.decals.length > 24) this.decals.shift(); }
    if (!silent) {
      this.add(e.def.sc); this.kills++;
      if (e.drop) this.item(e.drop, e.x, e.y);
      this.sfx(e.def.boom === 's' ? 'boom_s' : 'boom');
      if (e.def.boom !== 's') this.shake = Math.max(this.shake, 5);
      const bu = e.def.burst, p = this.pl;      // 기뢰: 터지면서 탄 고리를 남긴다 (폭탄을 쓰는 동안과 코앞에서는 남기지 않는다)
      if (bu && this.bombT <= 0 && p.dead <= 0 && e.y > 6 && e.y < H * 0.74 && Math.hypot(p.x - e.x, p.y - e.y) > 44) DS.PAT.ring(this, e.x, e.y, bu.n, bu.sp, bu.bt, this.rng() * 6);
    }
  };
  G.item = function (k, x, y) { this.items.push({ k: k, x: x, y: y, vx: k === 'M' ? 0 : (this.rng() < 0.5 ? -0.5 : 0.5), vy: k === 'M' ? -1.2 : -0.8, t: 0 }); };

  /* ── 적 ── */
  G.updEnemies = function () {
    const E = this.enemies, p = this.pl;
    for (let i = 0; i < E.length; i++) {
      const e = E[i]; if (e.dead) continue;
      e.t++; if (e.flash > 0) e.flash--;
      const ox = e.x, oy = e.y;
      if (e.parent) { e.x = e.parent.x + e.ox; e.y = e.parent.y + e.oy; }
      else if (e.boss) this.updBoss(e);
      else e.mv(e, this);
      if (e.def.rot) { const a = Math.atan2(e.y - oy, e.x - ox) - PI / 2; let d = a - e.rot; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; e.rot += d * 0.25; }
      if (e.def.tur || e.def.isTur) { const a = Math.atan2(p.y - e.y, p.x - e.x); let d = a - e.ta; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; e.ta += Math.max(-0.05, Math.min(0.05, d)); }
      if (e.fires && !(e.parent && (!e.parent.arrived || e.parent.dying || e.parent.leaving)) && e.y > 6 && e.y < H * 0.74 && e.x > 4 && e.x < W - 4 && p.dead <= 0) {
        for (let k = 0; k < e.fires.length; k++) {
          const fs = e.fires[k], f = fs.f;
          if (fs.done) continue;
          if (--fs.c <= 0) {
            fs.c = f.every * this.D.fr / this.sk * (0.9 + 0.2 * this.rng());
            this.fire(e, f);
            if (f.rep) for (let r = 1; r < f.rep; r++) this.later(r * f.gap, ['fire', k], e);
          }
        }
      }
      if (!e.boss && !e.parent && e.t > 40 && (e.y > H + 44 || e.x < -60 || e.x > W + 60 || e.y < -70)) e.dead = true;
      // 몸으로 부딪히기 (공중의 적만)
      if (!e.ground && !e.dying && p.dead <= 0 && p.inv <= 0 && p.ctrl) {
        const bx = e.boxes;
        for (let k = 0; k < bx.length; k++) { const b = bx[k]; if (Math.abs(p.x - e.x - b[0]) < b[2] * 0.7 + 1.5 && Math.abs(p.y - e.y - b[1]) < b[3] * 0.7 + 1.5) { this.die(); break; } }
      }
    }
    for (let i = E.length - 1; i >= 0; i--) if (E[i].dead) E.splice(i, 1);
  };

  G.fire = function (e, f) {
    if (e.dead) return;
    const P = DS.PAT; let x = e.x, y = e.y;
    if (e.def.tur || e.def.isTur) { const L = e.def.isTur ? 13 : 11; x += Math.cos(e.ta) * L; y += Math.sin(e.ta) * L + (e.def.turY || 0); }
    else y += e.def.hh * 0.6;
    if (Math.hypot(this.pl.x - x, this.pl.y - y) < 44) return;      // 코앞에서는 쏘지 않는다
    if (f.k === 'aim') P.aim(this, x, y, f.n, f.spr || 0, f.sp, f.bt);
    else if (f.k === 'fan') P.fan(this, x, y, PI / 2, f.n, f.spr, f.sp, f.bt);
    else if (f.k === 'ring') P.ring(this, x, y, f.n, f.sp, f.bt, this.rng() * 6);
    else if (f.k === 'spiral') P.ring(this, x, y, f.n, f.sp, f.bt, (e.sa = (e.sa || 0) + f.da));      // 쏠 때마다 조금씩 돌아가는 고리
    this.sfx('eshot');
  };

  G.updBoss = function (e) {
    const d = e.bd;
    if (e.dying > 0) {
      e.dying--;
      if (e.dying % (d.last ? 5 : 7) === 0) { const b = e.boxes[(this.rng() * e.boxes.length) | 0]; this.boom(e.x + b[0] + (this.rng() * 2 - 1) * b[2], e.y + b[1] + (this.rng() * 2 - 1) * b[3], this.rng() < 0.4 ? 'l' : 'm'); this.shake = 6; this.sfx('boom'); }
      e.y += e.ground ? 0 : 0.25;
      if (e.dying === 0) this.bossDead(e, true);
      return;
    }
    if (e.leaving) {
      if (d.leave === 'down') e.y += 2.2; else e.y -= 1.6;
      if (e.y < -160 || e.y > H + 160) this.bossDead(e, false);
      return;
    }
    if (!e.arrived) {
      e.y += Math.max(0.5, (d.ty - e.y) * 0.03);
      if (e.y >= d.ty - 1) { e.arrived = true; e.at = 0; }
      return;
    }
    e.at++;
    const sw = d.sway;
    e.x = e.x0 + Math.sin(e.at * sw[1]) * sw[0];
    e.y = d.ty + Math.sin(e.at * sw[1] * 1.7) * sw[2];
    if (e.mid && d.timeout && e.at > d.timeout) {
      if (d.leave === 'die') { this.kill(e); return; }
      e.leaving = true; return;
    }
    const fr = e.hp / e.mhp;
    while (e.pi < d.phases.length - 1 && fr <= d.phases[e.pi].until) { e.pi++; e.acts = null; this.boom(e.x, e.y, 'l'); this.shake = 14; this.clearBullets(); this.sfx('boom'); }
    const ph = d.phases[e.pi];
    if (ph.open) e.open = true;
    if (!e.acts) e.acts = ph.acts.map(a => ({ a: a, c: a.at || a.every }));
    if (this.pl.dead <= 0) for (let i = 0; i < e.acts.length; i++) { const q = e.acts[i]; if (--q.c <= 0) { q.c = q.a.every * (0.6 + 0.4 * this.D.fr) / this.sk; q.a.fn(e, this); this.sfx('eshot'); } }
  };

  G.bossDead = function (e, killed) {
    e.dead = true;
    this.enemies.forEach(q => { if (q.parent === e) q.dead = true; });
    this.decals = this.decals.filter(d => d.par !== e);
    if (killed) {
      for (let i = 0; i < 7; i++) { const b = e.boxes[i % e.boxes.length]; this.boom(e.x + b[0] + (this.rng() * 2 - 1) * b[2], e.y + b[1] + (this.rng() * 2 - 1) * b[3], 'l'); }
      this.add(e.def.sc); this.kills++; this.shake = 26; this.flash = 12; this.sfx('bigboom');
      this.item(e.mid ? 'P' : 'B', e.x - 12, Math.max(30, Math.min(150, e.y))); this.item('M', e.x + 12, Math.max(30, Math.min(150, e.y))); this.item('M', e.x, Math.max(20, Math.min(140, e.y - 14)));
    }
    this.clearBullets();
    this.boss = null; this.scrollTo = this.S.scroll;
    if (e.mid) this.hold = false;
    else { this.mode = 'clear'; this.modeT = 0; this.pl.inv = 400; this.clearBonus = 5000 + this.pl.bombs * 1000 + this.lives * 2000; this.add(this.clearBonus); this.sfx('clear'); }
  };

  /* ── 적탄 ── */
  G.updBullets = function () {
    const B = this.bullets, p = this.pl;
    for (let i = B.length - 1; i >= 0; i--) {
      const b = B[i]; b.t++;
      if (b.reaim && b.t === b.reaim) { const a = Math.atan2(p.y - b.y, p.x - b.x); b.vx = Math.cos(a) * b.sp2; b.vy = Math.sin(a) * b.sp2; b.a = a; }
      if (b.w && b.t <= b.wt) { const c = Math.cos(b.w), s = Math.sin(b.w), vx = b.vx * c - b.vy * s; b.vy = b.vx * s + b.vy * c; b.vx = vx; }
      b.x += b.vx; b.y += b.vy;
      if (b.y > H + 10 || b.y < -14 || b.x < -10 || b.x > W + 10) { B.splice(i, 1); continue; }
      if (p.dead <= 0 && p.inv <= 0 && p.ctrl) { const dx = b.x - p.x, dy = b.y - p.y, r = b.r * 0.62 + 1.7; if (dx * dx + dy * dy < r * r) { B.splice(i, 1); this.die(); if (!this.god) break; } }
    }
  };

  G.die = function () {
    const p = this.pl;
    if (this.god) { p.inv = 60; this.hits++; return; }
    p.dead = 70; p.chg = 0; this.beam = null;
    this.boom(p.x, p.y, 'm'); this.shake = 16; this.flash = 6; this.sfx('die');
    this.clearBullets();
    if (p.power > 0) { p.power--; this.item('P', p.x, p.y - 10); }
    this.medal = 0;
  };

  /* ── 아이템 ── */
  G.updItems = function () {
    const I = this.items, p = this.pl;
    for (let i = I.length - 1; i >= 0; i--) {
      const it = I[i]; it.t++;
      if (it.k === 'M') { it.vy = Math.min(1.3, it.vy + 0.035); }
      else { it.vy = Math.min(0.55, it.vy + 0.02); if (it.x < 12 || it.x > W - 12) it.vx = -it.vx; if (it.t < 700 && it.y > H - 30 && it.vy > 0) it.vy = -1.4; }
      const dx = p.x - it.x, dy = p.y - it.y, d = Math.hypot(dx, dy);
      if (p.dead <= 0 && d < 34) { it.x += dx / d * 2.6; it.y += dy / d * 2.6; } else { it.x += it.vx; it.y += it.vy; }
      if (p.dead <= 0 && d < 13) {
        if (it.k === 'P') { if (p.power < 3) { p.power++; this.pop(p.x, p.y - 18, '파워 업'); } else { this.add(2000); this.pop(p.x, p.y - 18, '2000'); } this.sfx('item'); }
        else if (it.k === 'B') { if (p.bombs < 5) { p.bombs++; this.pop(p.x, p.y - 18, '폭탄'); } else { this.add(2000); this.pop(p.x, p.y - 18, '2000'); } this.sfx('item'); }
        else { this.medal = Math.min(5, this.medal + 1); const v = 100 * Math.pow(2, this.medal); this.add(v); this.pop(it.x, it.y - 8, '' + v); this.sfx('medal'); }
        I.splice(i, 1); continue;
      }
      if (it.y > H + 14) { if (it.k === 'M') this.medal = 0; I.splice(i, 1); }
    }
  };

  /* 글로 보는 현재 상태 (자동 시험용) */
  G.text = function () {
    const p = this.pl, r = n => Math.round(n);
    return JSON.stringify({
      coord: '원점 왼쪽 위, x 오른쪽·y 아래, 240x320', mode: this.mode, stage: this.stage + 1, stageName: this.S.name, t: this.t, st: this.st,
      plane: this.plane.id, diff: this.D.id, score: this.score, lives: this.lives, conts: this.conts, hits: this.hits,
      player: { x: r(p.x), y: r(p.y), power: p.power + 1, bombs: p.bombs, inv: p.inv, dead: p.dead, charge: p.chg, ctrl: p.ctrl },
      boss: this.boss ? { name: this.boss.bd.name, hp: r(this.boss.hp), max: r(this.boss.mhp), x: r(this.boss.x), y: r(this.boss.y), phase: this.boss.pi + 1 } : null,
      enemies: this.enemies.filter(e => !e.boss).slice(0, 24).map(e => ({ k: e.type, x: r(e.x), y: r(e.y), hp: r(e.hp) })),
      bullets: this.bullets.slice(0, 60).map(b => [r(b.x), r(b.y)]), nBullets: this.bullets.length,
      items: this.items.map(i => ({ k: i.k, x: r(i.x), y: r(i.y) })), bomb: this.bombT, warn: this.warn
    });
  };

  /* ── 저장·불러오기 ──  함수와 서로 가리키는 것만 빼고 그대로 적는다. 적은 번호(id)로 다시 잇는다 */
  const SKIP = { plane: 1, D: 1, S: 1, tl: 1, rng: 1, sfx: 1, enemies: 1, shots: 1, decals: 1, timers: 1, boss: 1, god: 1 };
  G.save = function () {
    const o = {};
    for (const k in this) if (Object.prototype.hasOwnProperty.call(this, k) && !SKIP[k] && typeof this[k] !== 'function') o[k] = this[k];
    o.rng = this.rng.get();
    o.enemies = this.enemies.map(e => {
      const q = {};
      for (const k in e) { if (k === 'mv' || k === 'bd' || k === 'parent' || k === 'acts' || (k === 'def' && !e.boss && e.type !== 'part') || (k === 'boxes' && e.boss)) continue; q[k] = e[k]; }
      if (e.parent) q.parent = e.parent.id;
      if (e.acts) q.acts = e.acts.map(a => a.c);
      return q;
    });
    o.shots = this.shots.map(s => s.tg ? Object.assign({}, s, { tg: s.tg.dead || !s.tg.id ? -1 : s.tg.id }) : s);      // 이미 사라진 표적은 -1
    o.decals = this.decals.map(d => d.par ? Object.assign({}, d, { par: d.par.id }) : d);
    o.timers = this.timers.map(q => ({ n: q.n, op: q.op, o: q.o ? q.o.id : 0 }));
    o.boss = this.boss ? this.boss.id : 0;
    return JSON.parse(JSON.stringify(o));
  };
  const isN = v => typeof v === 'number' && isFinite(v), isI = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  Game.load = function (d, o) {
    o = o || {};
    const bad = m => { throw new Error(m); };
    if (!d || typeof d !== 'object') bad('판 정보가 없다.');
    if (!isI(d.planeIdx, 0, DS.PLANES.length - 1)) bad('기체 정보가 맞지 않는다.');
    if (!isI(d.diffIdx, 0, DS.DIFFS.length - 1)) bad('난이도 정보가 맞지 않는다.');
    if (!isI(d.stage, 0, DS.STAGES.length - 1)) bad('스테이지 정보가 맞지 않는다.');
    if (!isI(d.life0, 1, 9) || !isI(d.bomb0, 0, 5) || !isI(d.lives, 0, 99) || !isN(d.score) || d.score < 0) bad('생명·폭탄·점수 정보가 맞지 않는다.');
    if (['intro', 'play', 'clear'].indexOf(d.mode) < 0) bad('이어 할 수 없는 장면에서 저장한 판이다.');
    const p = d.pl;
    if (!p || !isN(p.x) || !isN(p.y) || !isI(p.power, 0, 3) || !isI(p.bombs, 0, 5)) bad('기체 상태가 맞지 않는다.');
    ['enemies', 'shots', 'bullets', 'items', 'fx', 'pops', 'decals', 'clouds', 'timers', 'wings'].forEach(k => { if (!Array.isArray(d[k]) || d[k].length > 2000) bad('판 정보가 맞지 않는다(' + k + ').'); });
    if (!isI(d.ti, 0, DS.STAGES[d.stage].events.length) || !isN(d.rng)) bad('진행 정보가 맞지 않는다.');
    d = JSON.parse(JSON.stringify(d));
    const g = new Game({ plane: d.planeIdx, diff: d.diffIdx, hi: Math.max(o.hi || 0, isN(d.hi) ? d.hi : 0), sfx: o.sfx, lives: d.life0, bombs: d.bomb0, stage: d.stage });
    const by = {};
    const E = d.enemies.map(q => {
      const e = Object.assign({}, q);
      if (!isI(e.id, 1, 1e9) || !isN(e.x) || !isN(e.y) || !isN(e.hp)) bad('적 정보가 맞지 않는다.');
      if (e.boss) {
        const b = DS.BOSSES[e.type]; if (!b || !e.def) bad('보스 정보가 맞지 않는다.');
        e.bd = b; e.boxes = b.boxes; if (!isI(e.pi, 0, b.phases.length - 1)) bad('보스 정보가 맞지 않는다.');
        e.acts = Array.isArray(q.acts) && q.acts.length === b.phases[e.pi].acts.length ? q.acts.map((c, i) => ({ a: b.phases[e.pi].acts[i], c: c })) : null;
      } else if (e.type === 'part') { if (!e.def || !Array.isArray(e.boxes)) bad('포탑 정보가 맞지 않는다.'); }
      else { e.def = DS.ENEMIES[e.type]; e.mv = MV[e.mvn]; if (!e.def || !e.mv || !Array.isArray(e.boxes)) bad('적 정보가 맞지 않는다.'); }
      by[e.id] = e; return e;
    });
    E.forEach(e => { if (e.parent != null) { e.parent = by[e.parent]; if (!e.parent) bad('포탑 정보가 맞지 않는다.'); } });
    const gone = { dead: true };
    delete d.plane; delete d.D; delete d.S; delete d.tl; delete d.sfx; delete d.god;
    Object.assign(g, d);
    g.hi = Math.max(g.hi, o.hi || 0);
    g.enemies = E;
    g.shots = d.shots.map(s => { if (s.tg != null) s.tg = by[s.tg] || gone; return s; });
    g.decals = d.decals.map(q => { if (q.par != null) q.par = by[q.par]; return q; });
    g.timers = d.timers.filter(q => by[q.o] && Array.isArray(q.op)).map(q => ({ n: q.n, op: q.op, o: by[q.o] }));
    g.boss = d.boss ? (by[d.boss] || null) : null;
    g.S = DS.STAGES[g.stage]; g.tl = g.S.events;
    g.rng = RNG(1); g.rng.set(d.rng);
    return g;
  };

  DS.Game = Game;
})();

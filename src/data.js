/* 기체·난이도·적·보스·스테이지 자료 */
(function () {
  'use strict';
  const DS = window.DS, W = DS.W, H = DS.H, PI = Math.PI;

  DS.TITLE = '동현스';
  DS.SUBTITLE = '연필로 그린 1945-2';
  DS.PLANES = [
    { id: 'pancake', name: 'XF5U 플라잉 팬케이크', short: 'XF5U', en: 'Vought XF5U Flying Pancake', spr: 'pancake', speed: 2.55, shot: '부채꼴로 넓게', charge: '팽이 원반', bomb: '소용돌이', bars: [3, 1, 3] },
    { id: 'hayate', name: 'Ki-84 하야테', short: 'Ki-84', en: 'Nakajima Ki-84 Hayate', spr: 'hayate', speed: 2.3, shot: '앞으로 곧게 모아서', charge: '굵은 획', bomb: '편대 지원', bars: [2, 3, 1] },
    { id: 'p38', name: 'P-38 라이트닝', short: 'P-38', en: 'Lockheed P-38 Lightning', spr: 'p38', speed: 2.3, shot: '고르게, 따라가는 로켓', charge: '로켓 다발', bomb: '융단 폭격', bars: [2, 2, 2] },
    { id: 'shinden', name: 'J7W 신덴', short: 'J7W', en: 'Kyushu J7W Shinden', spr: 'shinden', speed: 2.1, shot: '좁고 곧게, 달라붙는 탄', charge: '밑그림 돌진', bomb: '번개 기둥', bars: [1, 3, 1] }
  ];
  DS.DIFFS = [
    { id: 'monkey', name: '초급', sub: '탄이 드물고 느리다', bs: 0.6, fr: 2.1, cnt: 0.45, zp: 0.2, hp: 0.9 },
    { id: 'child', name: '중급', sub: '조금 더 자주 쏜다', rec: true, bs: 0.78, fr: 1.45, cnt: 0.7, zp: 0.5, hp: 1 },
    { id: 'easy', name: '상급', sub: '탄이 제 속도로 온다', bs: 0.95, fr: 1.0, cnt: 1, zp: 0.85, hp: 1.1 }
  ];

  /* ── 적 ── */
  const F = DS.FIRE = {
    z1: { k: 'aim', at: 46, every: 9999, n: 1, sp: 1.9 },
    z2: { k: 'aim', at: 34, every: 80, n: 1, sp: 2.0 },
    h1: { k: 'aim', at: 60, every: 85, n: 3, spr: 0.5, sp: 1.8 },
    t1: { k: 'fan', at: 50, every: 80, n: 5, spr: 1.2, sp: 1.7 },
    t2: { k: 'aim', at: 50, every: 95, n: 3, spr: 0.36, sp: 2.0, rep: 2, gap: 9 },
    c1: { k: 'aim', at: 40, every: 64, n: 2, spr: 0.2, sp: 2.2, bt: 'n' },
    hv: [{ k: 'ring', at: 70, every: 110, n: 12, sp: 1.45, bt: 'l' }, { k: 'aim', at: 120, every: 110, n: 3, spr: 0.4, sp: 2.0 }],
    g1: { k: 'aim', at: 70, every: 105, n: 1, sp: 1.7 },
    g2: { k: 'aim', at: 60, every: 115, n: 3, spr: 0.4, sp: 1.7 },
    b1: { k: 'aim', at: 50, every: 95, n: 2, spr: 0.25, sp: 1.8 },
    j1: { k: 'aim', at: 26, every: 70, n: 1, sp: 2.3, bt: 'n', rep: 2, gap: 7 },
    bk: [{ k: 'aim', at: 60, every: 120, n: 3, spr: 0.36, sp: 1.8, bt: 'l' }, { k: 'fan', at: 120, every: 120, n: 5, spr: 1.5, sp: 1.6 }],
    sp: { k: 'spiral', at: 50, every: 36, n: 5, sp: 1.5, da: 0.33 }      // 쏠 때마다 da만큼 돌아가는 고리
  };
  DS.ENEMIES = {
    zako: { spr: 'zako', hp: 2, sc: 100, hw: 8, hh: 7, boom: 's', rot: true, zako: true, fire: F.z1 },
    dart: { spr: 'dart', hp: 1.5, sc: 120, hw: 7, hh: 7, boom: 's', rot: true, zako: true, fire: null },
    heli: { spr: 'heli', hp: 5, sc: 200, hw: 7, hh: 9, boom: 's', fire: F.h1 },
    balloon: { spr: 'balloon', hp: 4, sc: 150, hw: 9, hh: 9, boom: 's', drop: 'P' },
    twin: { spr: 'twin', hp: 26, sc: 800, hw: 20, hh: 12, boom: 'm', fire: F.t1, drop: 'M' },
    canard: { spr: 'canard', hp: 15, sc: 500, hw: 13, hh: 12, boom: 'm', fire: F.c1 },
    heavy: { spr: 'heavy', hp: 85, sc: 2500, hw: 36, hh: 16, boom: 'l', fire: F.hv, drop: 'B' },
    tank: { spr: 'tank', hp: 6, sc: 200, hw: 9, hh: 11, boom: 's', ground: true, tur: 'tank_t', fire: F.g1, drop: 'M' },
    gun: { spr: 'gun', hp: 9, sc: 300, hw: 10, hh: 10, boom: 's', ground: true, tur: 'gun_t', fire: F.g2, drop: 'M' },
    boat: { spr: 'boat', hp: 8, sc: 300, hw: 6, hh: 18, boom: 'm', ground: true, tur: 'tank_t', turY: 6, fire: F.b1, drop: 'M' },
    truck: { spr: 'truck', hp: 4, sc: 150, hw: 6, hh: 10, boom: 's', ground: true, fire: null },
    jet: { spr: 'jet', hp: 3, sc: 180, hw: 6, hh: 9, boom: 's', rot: true, zako: true, fire: F.j1 },
    mine: { spr: 'mine', hp: 6, sc: 150, hw: 8, hh: 8, boom: 's', fire: null, burst: { n: 8, sp: 1.3, bt: 's' } },      // 터지면서 탄 고리를 남긴다
    bunker: { spr: 'bunker', hp: 22, sc: 600, hw: 13, hh: 12, boom: 'm', ground: true, tur: 'bt_s', fire: F.bk, drop: 'M' },
    spinner: { spr: 'spinner', hp: 30, sc: 900, hw: 12, hh: 12, boom: 'm', fire: F.sp, drop: 'M' }
  };

  /* ── 탄막 도우미 (g = 게임) ── */
  const P = DS.PAT = {
    cnt(g, n) { return n <= 1 ? 1 : Math.max(n >= 4 ? 2 : 1, Math.round(n * g.D.cnt)); },
    aimA(g, x, y) { return Math.atan2(g.pl.y - y, g.pl.x - x); },
    aim(g, x, y, n, spr, sp, bt, o) { n = P.cnt(g, n); const a0 = P.aimA(g, x, y); for (let i = 0; i < n; i++) g.bullet(x, y, a0 + (n > 1 ? (i / (n - 1) - 0.5) * spr : 0), sp, bt, o); },
    fan(g, x, y, ang, n, spr, sp, bt, o) { n = P.cnt(g, n); for (let i = 0; i < n; i++) g.bullet(x, y, ang + (n > 1 ? (i / (n - 1) - 0.5) * spr : 0), sp, bt, o); },
    ring(g, x, y, n, sp, bt, off, o) { n = P.cnt(g, n); for (let i = 0; i < n; i++) g.bullet(x, y, (off || 0) + i / n * 2 * PI, sp, bt, o); },
    burst(g, e, dx, dy, times, gap, n, spr, sp, bt) { for (let i = 0; i < times; i++) g.later(i * gap, ['aim', dx, dy, n, spr, sp, bt], e); },
    stream(g, e, dx, dy, times, gap, a0, da, sp, bt) { for (let i = 0; i < times; i++) g.later(i * gap, ['bul', dx, dy, a0 + da * i, sp, bt], e); },
    rain(g, n, sp, bt) { n = P.cnt(g, n); for (let i = 0; i < n; i++) g.bullet(16 + g.rng() * (W - 32), -6, PI / 2 + (g.rng() - 0.5) * 0.2, sp * (0.85 + 0.3 * g.rng()), bt); }
  };
  const D90 = PI / 2;
  const BOTH = (...b) => b.reduce((a, q) => a.concat([[-q[0], q[1], q[2], q[3]], q]), []);      // 왼쪽·오른쪽에 같은 상자

  /* ── 보스 ──  boxes: [dx, dy, 반너비, 반높이] (그림 가운데가 원점, 그림 밖으로 나가지 않게 — qa/hitbox.cjs가 견준다)  parts: 부술 수 있는 포탑 */
  DS.BOSSES = {
    s1mid: { name: '큰 비행정', spr: 'b_boat', hp: 460, sc: 8000, ty: 74, sway: [58, 0.011, 8], leave: 'up', timeout: 1900,
      boxes: [[0, -3, 6, 35], [0, 35, 4, 4], [0, 2, 60, 5], [0, 4, 34, 8], [0, -34, 18, 3]],      // 동체 · 기수 · 날개 · 날개 안쪽 · 꼬리 날개
      parts: [{ x: 0, y: 14, spr: 'bt_s', hp: 40, fire: { k: 'aim', at: 80, every: 80, n: 3, spr: 0.44, sp: 1.9 } }, { x: 0, y: -12, spr: 'bt_s', hp: 40, fire: { k: 'aim', at: 130, every: 100, n: 1, sp: 2.2, rep: 3, gap: 8, bt: 'n' } }],
      phases: [
        { until: 0.5, acts: [{ every: 150, at: 110, fn: (e, g) => [-31, -15, 15, 31].forEach(x => g.bullet(e.x + x, e.y + 16, D90, 1.5, 's')) }] },
        { until: 0, acts: [{ every: 120, at: 30, fn: (e, g) => P.ring(g, e.x, e.y + 34, 12, 1.4, 'l', g.rng() * 6) }, { every: 150, at: 90, fn: (e, g) => [-31, -15, 15, 31].forEach(x => g.bullet(e.x + x, e.y + 16, D90, 1.6, 's')) }] }
      ] },
    s1boss: { name: '전함', spr: 'b_ship', hp: 1500, sc: 30000, ground: true, ty: 46, sway: [22, 0.007, 16],
      boxes: [[0, -10, 24, 70], [0, -98, 16, 18], [0, 67, 20, 7], [0, 81, 16, 7], [0, 94, 12, 6], [0, 105, 8, 5], [0, 115, 3, 5]],      // 선체 · 고물 · 뱃머리로 갈수록 좁아지는 다섯 단 (그림의 윤곽을 따른다)
      parts: [{ x: 0, y: 70, spr: 'bt_l', hp: 100, fire: { k: 'aim', at: 100, every: 120, n: 3, spr: 0.5, sp: 1.7, bt: 'l' } }, { x: 0, y: 42, spr: 'bt_l', hp: 100, fire: { k: 'aim', at: 160, every: 120, n: 5, spr: 0.9, sp: 1.5 } },
        { x: -18, y: 15, spr: 'bt_s', hp: 45, fire: { k: 'aim', at: 130, every: 105, n: 1, sp: 2.2, rep: 2, gap: 9, bt: 'n' } }, { x: 18, y: 15, spr: 'bt_s', hp: 45, fire: { k: 'aim', at: 180, every: 105, n: 1, sp: 2.2, rep: 2, gap: 9, bt: 'n' } }],
      phases: [
        { until: 0.6, acts: [{ every: 180, at: 140, fn: (e, g) => P.fan(g, e.x, e.y + 8, D90, 7, 1.5, 1.5, 's') }] },
        { until: 0.28, acts: [{ every: 130, at: 40, fn: (e, g) => P.ring(g, e.x, e.y + 8, 16, 1.3, 'l', g.rng() * 6) }, { every: 210, at: 120, fn: (e, g) => { P.burst(g, e, -20, 60, 3, 10, 1, 0, 2.1, 'n'); P.burst(g, e, 20, 60, 3, 10, 1, 0, 2.1, 'n'); } }] },
        { until: 0, acts: [{ every: 100, at: 30, fn: (e, g) => P.ring(g, e.x, e.y + 8, 14, 1.5, 's', (e.k = (e.k || 0) + 0.2)) }, { every: 150, at: 80, fn: (e, g) => P.burst(g, e, 0, 150, 3, 12, 3, 0.5, 2.0, 's') }] }
      ] },
    s2mid: { name: '장갑 열차', spr: 'b_train', hp: 480, sc: 9000, ground: true, ty: 96, sway: [0, 0.012, 44], x: 120, leave: 'down', timeout: 1900,
      boxes: [[0, -22, 13, 56], [0, 58, 11, 22], [0, 81, 8, 2]],      // 화차 셋 · 기관차 · 기관차 앞
      parts: [{ x: 0, y: -62, spr: 'bt_s', hp: 45, fire: { k: 'aim', at: 90, every: 95, n: 2, spr: 0.24, sp: 1.9 } }, { x: 0, y: -22, spr: 'bt_s', hp: 45, fire: { k: 'aim', at: 130, every: 95, n: 3, spr: 0.5, sp: 1.7 } }, { x: 0, y: 18, spr: 'bt_s', hp: 45, fire: { k: 'aim', at: 170, every: 95, n: 1, sp: 2.2, rep: 3, gap: 8, bt: 'n' } }],
      phases: [{ until: 0.5, acts: [{ every: 170, at: 120, fn: (e, g) => P.ring(g, e.x, e.y + 74, 10, 1.3, 'l', 0.3) }] },
        { until: 0, acts: [{ every: 120, at: 30, fn: (e, g) => P.ring(g, e.x, e.y + 74, 12, 1.4, 'l', g.rng() * 6) }, { every: 160, at: 100, fn: (e, g) => P.fan(g, e.x, e.y + 74, D90, 5, 1.0, 1.9, 'n') }] }] },
    s2boss: { name: '육상 전함', spr: 'b_tank', hp: 1800, sc: 40000, ground: true, ty: 70, sway: [30, 0.008, 10],
      boxes: [[0, 1, 72, 59]],      // 무한궤도까지
      parts: [{ x: 0, y: 6, spr: 'bt_l', hp: 140, fire: { k: 'aim', at: 100, every: 125, n: 3, spr: 0.3, sp: 2.0, bt: 'l' } }, { x: -48, y: 20, spr: 'bt_s', hp: 55, fire: { k: 'aim', at: 140, every: 105, n: 2, spr: 0.2, sp: 1.9 } }, { x: 48, y: 20, spr: 'bt_s', hp: 55, fire: { k: 'aim', at: 190, every: 105, n: 2, spr: 0.2, sp: 1.9 } },
        { x: -30, y: -18, spr: 'gun_t', hp: 45, fire: { k: 'fan', at: 120, every: 140, n: 3, spr: 0.7, sp: 1.6 } }, { x: 30, y: -18, spr: 'gun_t', hp: 45, fire: { k: 'fan', at: 190, every: 140, n: 3, spr: 0.7, sp: 1.6 } }],
      phases: [
        { until: 0.58, acts: [{ every: 170, at: 130, fn: (e, g) => P.fan(g, e.x, e.y + 56, D90, 5, 1.3, 1.9, 'n') }] },
        { until: 0.25, acts: [{ every: 135, at: 40, fn: (e, g) => P.ring(g, e.x, e.y + 6, 14, 1.35, 'l', g.rng() * 6) }, { every: 200, at: 110, fn: (e, g) => P.rain(g, 6, 1.5, 's') }] },
        { until: 0, acts: [{ every: 90, at: 30, fn: (e, g) => P.burst(g, e, 0, 56, 2, 12, 3, 0.5, 2.0, 's') }, { every: 150, at: 70, fn: (e, g) => P.ring(g, e.x, e.y + 6, 18, 1.4, 'l', g.rng() * 6) }, { every: 230, at: 150, fn: (e, g) => P.rain(g, 7, 1.6, 's') }] }
      ] },
    s3mid: { name: '큰 폭격기', spr: 'b_bomber', hp: 560, sc: 10000, ty: 66, sway: [18, 0.012, 7], leave: 'up', timeout: 2000,
      boxes: [[0, -1, 6, 37], [0, 39, 3, 3], [0, 0, 96, 4], [0, 3, 70, 6], [0, -34, 22, 3]],      // 동체 · 기수 · 날개 · 날개 안쪽 · 꼬리 날개
      parts: [{ x: 0, y: 10, spr: 'bt_s', hp: 50, fire: { k: 'aim', at: 90, every: 90, n: 3, spr: 0.5, sp: 1.9 } }, { x: -42, y: 2, spr: 'bt_s', hp: 45, fire: { k: 'aim', at: 130, every: 110, n: 1, sp: 2.2, rep: 2, gap: 9, bt: 'n' } }, { x: 42, y: 2, spr: 'bt_s', hp: 45, fire: { k: 'aim', at: 180, every: 110, n: 1, sp: 2.2, rep: 2, gap: 9, bt: 'n' } }],
      phases: [{ until: 0.5, acts: [{ every: 160, at: 110, fn: (e, g) => [-67, -43, -19, 19, 43, 67].forEach((x, i) => g.later(i * 7, ['bul', x, 18, D90, 1.4, 's'], e)) }] },
        { until: 0, acts: [{ every: 125, at: 30, fn: (e, g) => P.ring(g, e.x, e.y + 36, 14, 1.4, 'l', g.rng() * 6) }, { every: 150, at: 90, fn: (e, g) => [67, 43, 19, -19, -43, -67].forEach((x, i) => g.later(i * 7, ['bul', x, 18, D90, 1.5, 's'], e)) }] }] },
    s3boss: { name: '큰 잠수함', spr: 'b_sub', hp: 2000, sc: 50000, ground: true, ty: 50, sway: [26, 0.008, 14],
      boxes: [[0, -6, 14, 80], [0, -96, 11, 10], [0, 85, 19, 5], [0, 99, 7, 9], [0, 111, 3, 3]],      // 선체 · 꼬리 · 앞 날개 · 뱃머리 · 뱃머리 끝
      parts: [{ x: 0, y: 30, spr: 'bt_l', hp: 130, fire: { k: 'aim', at: 100, every: 120, n: 3, spr: 0.44, sp: 1.9, bt: 'l' } }, { x: 0, y: -16, spr: 'bt_s', hp: 60, fire: { k: 'aim', at: 150, every: 100, n: 1, sp: 2.2, rep: 3, gap: 8, bt: 'n' } }],
      phases: [
        { until: 0.6, acts: [{ every: 190, at: 130, fn: (e, g) => [0, 1].forEach(i => g.later(i * 16, ['torp', 62 + i * 12, 40, 2.0], e)) }] },
        { until: 0.28, acts: [{ every: 150, at: 40, fn: (e, g) => [0, 1, 2].forEach(i => g.later(i * 14, ['torp', 62 + i * 12, 36, 2.1], e)) }, { every: 140, at: 100, fn: (e, g) => P.ring(g, e.x, e.y - 10, 14, 1.35, 'l', g.rng() * 6) }] },
        { until: 0, acts: [{ every: 170, at: 30, fn: (e, g) => { const a = g.rng() * 6; P.stream(g, e, 0, -10, 16, 5, a, 0.42, 1.5, 's'); P.stream(g, e, 0, -10, 16, 5, a + PI, 0.42, 1.5, 's'); } }, { every: 120, at: 90, fn: (e, g) => [0, 1, 2, 3].forEach(i => g.later(i * 12, ['torp', 62 + i * 12, 32, 2.2], e)) }] }
      ] },
    s4mid: { name: '비행선', spr: 'b_airship', hp: 600, sc: 11000, ty: 58, sway: [56, 0.007, 10], leave: 'up', timeout: 2000,
      boxes: [[0, -5, 28, 45], [0, -66, 21, 16], [0, -90, 30, 6], [0, 49, 26, 9], [0, 65, 22, 7], [0, 78, 15, 6], [0, 88, 10, 4], [0, 94, 4, 2]],      // 몸통 · 뒤쪽 · 꼬리 날개 · 앞으로 갈수록 좁아지는 다섯 단
      parts: [{ x: 0, y: -52, spr: 'bt_s', hp: 50, fire: { k: 'aim', at: 100, every: 110, n: 3, spr: 0.6, sp: 1.7 } }, { x: 0, y: 6, spr: 'bt_s', hp: 50, fire: { k: 'aim', at: 140, every: 100, n: 1, sp: 2.2, rep: 3, gap: 8, bt: 'n' } }, { x: 0, y: 54, spr: 'bt_s', hp: 50, fire: { k: 'aim', at: 180, every: 100, n: 3, spr: 0.4, sp: 1.9 } }],
      phases: [{ until: 0.5, acts: [{ every: 170, at: 110, fn: (e, g) => { P.fan(g, e.x - 32, e.y + 24, D90 + 0.3, 3, 0.6, 1.6, 's'); P.fan(g, e.x + 32, e.y + 24, D90 - 0.3, 3, 0.6, 1.6, 's'); } }] },
        { until: 0, acts: [{ every: 130, at: 30, fn: (e, g) => P.ring(g, e.x, e.y + 88, 14, 1.4, 'l', g.rng() * 6) }, { every: 150, at: 90, fn: (e, g) => { P.fan(g, e.x - 32, e.y + 24, D90 + 0.3, 4, 0.8, 1.7, 's'); P.fan(g, e.x + 32, e.y + 24, D90 - 0.3, 4, 0.8, 1.7, 's'); } }] }] },
    s4boss: { name: '큰 전익기', spr: 'b_wing', hp: 2200, sc: 60000, ty: 62, sway: [16, 0.012, 10],
      boxes: [[0, 4, 8, 34], [0, 41, 4, 3]].concat(BOTH([13, 1.5, 5, 25.5], [26, -2, 8, 21], [42, -6.5, 8, 17.5], [58, -14, 8, 14], [74, -21.5, 8, 11.5], [90, -29.5, 8, 7.5], [106, -35, 8, 5])),      // 동체 · 기수 · 뒤로 젖힌 날개를 일곱 단으로
      parts: [{ x: -34, y: 4, spr: 'bt_s', hp: 60, fire: { k: 'aim', at: 100, every: 105, n: 2, spr: 0.24, sp: 2.0 } }, { x: 34, y: 4, spr: 'bt_s', hp: 60, fire: { k: 'aim', at: 150, every: 105, n: 2, spr: 0.24, sp: 2.0 } },
        { x: -70, y: -14, spr: 'bt_s', hp: 60, fire: { k: 'aim', at: 130, every: 120, n: 3, spr: 0.6, sp: 1.7 } }, { x: 70, y: -14, spr: 'bt_s', hp: 60, fire: { k: 'aim', at: 190, every: 120, n: 3, spr: 0.6, sp: 1.7 } }],
      phases: [
        { until: 0.62, acts: [{ every: 200, at: 130, fn: (e, g) => P.stream(g, e, 0, 40, 12, 6, D90 - 0.8, 0.145, 1.7, 's') }] },
        { until: 0.3, acts: [{ every: 150, at: 40, fn: (e, g) => { P.ring(g, e.x - 100, e.y - 32, 9, 1.3, 'l', 0.2); P.ring(g, e.x + 100, e.y - 32, 9, 1.3, 'l', 0.5); } }, { every: 190, at: 120, fn: (e, g) => P.stream(g, e, 0, 40, 12, 6, D90 + 0.8, -0.145, 1.8, 's') }] },
        { until: 0, acts: [{ every: 95, at: 30, fn: (e, g) => P.burst(g, e, 0, 40, 3, 10, 3, 0.44, 2.1, 'n') }, { every: 140, at: 80, fn: (e, g) => P.ring(g, e.x, e.y, 18, 1.4, 'l', g.rng() * 6) }, { every: 240, at: 160, fn: (e, g) => P.rain(g, 7, 1.5, 's') }] }
      ] },
    s5mid: { name: '요새 관문', spr: 'b_gate', hp: 640, sc: 12000, ground: true, ty: 60, sway: [0, 0, 0], stop: true, leave: 'die', timeout: 2400,
      boxes: [[0, 4, 30, 30]],
      parts: [{ x: -84, y: 0, spr: 'bt_l', hp: 110, fire: { k: 'aim', at: 100, every: 130, n: 3, spr: 0.4, sp: 1.8, bt: 'l' } }, { x: 84, y: 0, spr: 'bt_l', hp: 110, fire: { k: 'aim', at: 165, every: 130, n: 3, spr: 0.4, sp: 1.8, bt: 'l' } },
        { x: -40, y: 6, spr: 'bt_s', hp: 55, fire: { k: 'aim', at: 130, every: 100, n: 1, sp: 2.2, rep: 2, gap: 9, bt: 'n' } }, { x: 40, y: 6, spr: 'bt_s', hp: 55, fire: { k: 'aim', at: 180, every: 100, n: 1, sp: 2.2, rep: 2, gap: 9, bt: 'n' } }],
      phases: [{ until: 0.5, acts: [{ every: 170, at: 120, fn: (e, g) => P.fan(g, e.x, e.y + 30, D90, 7, 1.7, 1.6, 's') }] },
        { until: 0, acts: [{ every: 120, at: 30, fn: (e, g) => P.fan(g, e.x, e.y + 30, D90, 9, 2.2, 1.6, 's') }, { every: 160, at: 90, fn: (e, g) => P.ring(g, e.x, e.y - 10, 14, 1.4, 'l', g.rng() * 6) }] }] },
    s5boss: { name: '흑연 요새', spr: 'b_fort', hp: 3000, sc: 100000, ground: true, ty: 88, sway: [0, 0, 0], stop: true, dome: true,
      boxes: [[0, 0, 34, 34]],
      parts: [{ x: -70, y: 70, spr: 'bt_l', hp: 130, fire: { k: 'aim', at: 100, every: 130, n: 3, spr: 0.36, sp: 1.9, bt: 'l' } }, { x: 70, y: 70, spr: 'bt_l', hp: 130, fire: { k: 'aim', at: 165, every: 130, n: 3, spr: 0.36, sp: 1.9, bt: 'l' } },
        { x: -70, y: -70, spr: 'bt_l', hp: 130, fire: { k: 'aim', at: 130, every: 150, n: 5, spr: 0.8, sp: 1.6 } }, { x: 70, y: -70, spr: 'bt_l', hp: 130, fire: { k: 'aim', at: 205, every: 150, n: 5, spr: 0.8, sp: 1.6 } }],
      phases: [
        { until: 0.7, acts: [{ every: 170, at: 140, fn: (e, g) => P.ring(g, e.x, e.y, 12, 1.3, 'l', g.rng() * 6) }] },
        { until: 0.36, open: true, acts: [{ every: 110, at: 50, fn: (e, g) => P.burst(g, e, 0, 0, 3, 10, 3, 0.4, 2.1, 'l') }, { every: 220, at: 140, fn: (e, g) => { const a = g.rng() * 6; P.stream(g, e, 0, 0, 20, 4, a, 0.34, 1.5, 's'); } }] },
        { until: 0, open: true, acts: [{ every: 120, at: 30, fn: (e, g) => { P.ring(g, e.x, e.y, 18, 1.45, 'l', (e.k = (e.k || 0) + 0.17)); } }, { every: 90, at: 70, fn: (e, g) => P.burst(g, e, 0, 0, 2, 9, 3, 0.5, 2.3, 'n') }, { every: 210, at: 150, fn: (e, g) => P.rain(g, 8, 1.6, 's') }, { every: 260, at: 200, fn: (e, g) => { const a = g.rng() * 6; P.stream(g, e, 0, 0, 18, 4, a, -0.36, 1.6, 's'); P.stream(g, e, 0, 0, 18, 4, a + PI, -0.36, 1.6, 's'); } }] }
      ] },
    /* 6·7장: 휘는 탄(w)과 보스가 내보내는 작은 적(spawn)을 쓴다 */
    s6mid: { name: '쌍회전익 건십', spr: 'b_gunship', hp: 700, sc: 13000, ty: 70, sway: [50, 0.012, 10], leave: 'up', timeout: 2100,
      boxes: [[0, -3, 8, 40], [0, 40, 4, 3], [0, 0.5, 42, 7]].concat(BOTH([52, 0, 7, 5])),      // 동체 · 기수 · 짧은 날개 · 회전날개 축
      parts: [{ x: -26, y: -2, spr: 'bt_s', hp: 55, fire: { k: 'aim', at: 90, every: 95, n: 2, spr: 0.24, sp: 2.0 } }, { x: 26, y: -2, spr: 'bt_s', hp: 55, fire: { k: 'aim', at: 140, every: 95, n: 2, spr: 0.24, sp: 2.0 } },
        { x: 0, y: 20, spr: 'bt_s', hp: 60, fire: { k: 'aim', at: 120, every: 100, n: 1, sp: 2.3, rep: 3, gap: 8, bt: 'n' } }],
      phases: [{ until: 0.5, acts: [{ every: 150, at: 100, fn: (e, g) => { P.fan(g, e.x - 52, e.y, D90 + 0.25, 5, 1.1, 1.6, 's'); P.fan(g, e.x + 52, e.y, D90 - 0.25, 5, 1.1, 1.6, 's'); } }] },
        { until: 0, acts: [{ every: 125, at: 30, fn: (e, g) => { P.ring(g, e.x - 52, e.y, 10, 1.35, 'l', 0.2, { w: 0.012, wt: 90 }); P.ring(g, e.x + 52, e.y, 10, 1.35, 'l', 0.5, { w: -0.012, wt: 90 }); } },
          { every: 170, at: 100, fn: (e, g) => P.stream(g, e, 0, 44, 10, 6, D90 - 0.6, 0.133, 1.8, 's') }] }] },
    s6boss: { name: '하늘 항모', spr: 'b_carrier', hp: 3400, sc: 120000, ty: 66, sway: [24, 0.008, 8],
      boxes: [[0, -6, 21, 80], [0, 80, 14, 6], [0, 89, 6, 3], [0, -4, 70, 11], [0, -86, 30, 7]],      // 선체 · 뱃머리 두 단 · 날개 · 꼬리 날개
      parts: [{ x: 0, y: 42, spr: 'bt_l', hp: 150, fire: { k: 'aim', at: 100, every: 125, n: 3, spr: 0.4, sp: 1.9, bt: 'l' } }, { x: 0, y: -50, spr: 'bt_l', hp: 150, fire: { k: 'aim', at: 160, every: 140, n: 5, spr: 0.9, sp: 1.6 } },
        { x: -44, y: -4, spr: 'bt_s', hp: 65, fire: { k: 'aim', at: 130, every: 105, n: 1, sp: 2.3, rep: 2, gap: 8, bt: 'n' } }, { x: 44, y: -4, spr: 'bt_s', hp: 65, fire: { k: 'aim', at: 185, every: 105, n: 1, sp: 2.3, rep: 2, gap: 8, bt: 'n' } },
        { x: -66, y: -6, spr: 'gun_t', hp: 55, fire: { k: 'fan', at: 120, every: 150, n: 3, spr: 0.7, sp: 1.6 } }, { x: 66, y: -6, spr: 'gun_t', hp: 55, fire: { k: 'fan', at: 195, every: 150, n: 3, spr: 0.7, sp: 1.6 } }],
      phases: [
        { until: 0.75, acts: [{ every: 240, at: 100, fn: (e, g) => [0, 1, 2].forEach(i => g.later(i * 16, ['spawn', 'dart', i % 2 ? 8 : -8, 84, { mv: 'chase', vy: 2.0 }], e)) },      // 갑판에서 뜨는 작은 적
          { every: 170, at: 150, fn: (e, g) => P.fan(g, e.x, e.y + 92, D90, 7, 1.6, 1.6, 's') }] },
        { until: 0.5, acts: [{ every: 150, at: 40, fn: (e, g) => { P.ring(g, e.x - 55, e.y + 22, 10, 1.3, 'l', 0.2, { w: 0.013, wt: 90 }); P.ring(g, e.x + 55, e.y + 22, 10, 1.3, 'l', 0.5, { w: -0.013, wt: 90 }); } },
          { every: 260, at: 130, fn: (e, g) => [-1, 1].forEach((s, i) => [0, 1].forEach(k => g.later(k * 18 + i * 9, ['spawn', 'jet', s * 8, 84, { mv: 'swoop', vy: 2.4, p: { y: 196, dir: s } }], e))) }] },
        { until: 0.25, acts: [{ every: 200, at: 40, fn: (e, g) => P.rain(g, 7, 1.5, 's') },
          { every: 190, at: 110, fn: (e, g) => { const a = g.rng() * 6; P.stream(g, e, 16, -10, 16, 5, a, 0.4, 1.5, 's'); P.stream(g, e, 16, -10, 16, 5, a + PI, 0.4, 1.5, 's'); } },
          { every: 120, at: 80, fn: (e, g) => P.burst(g, e, 0, 92, 3, 10, 3, 0.44, 2.1, 'n') }] },
        { until: 0, acts: [{ every: 110, at: 30, fn: (e, g) => { e.fl = -(e.fl || 1); P.ring(g, e.x, e.y, 16, 1.4, 'l', g.rng() * 6, { w: 0.014 * e.fl, wt: 100 }); } },
          { every: 95, at: 70, fn: (e, g) => P.burst(g, e, 0, 92, 2, 10, 3, 0.5, 2.2, 'n') },
          { every: 280, at: 160, fn: (e, g) => [-1, 1].forEach(s => g.later(0, ['spawn', 'mine', s * 60, 20, { mv: 'sine', vy: 0.75, p: { a: 14, f: 0.035 } }], e)) },
          { every: 240, at: 200, fn: (e, g) => P.rain(g, 7, 1.6, 's') }] }
      ] },
    s7mid: { name: '쌍동 폭격기', spr: 'b_twinboom', hp: 780, sc: 15000, ty: 64, sway: [28, 0.012, 8], leave: 'up', timeout: 2200,
      boxes: BOTH([34, -7, 5, 32], [34, 32, 3, 8]).concat([[0, 4, 5, 21], [0, 0.5, 84, 6], [0, -38, 40, 3]]),      // 동체 둘과 그 기수 · 가운데 포드 · 날개 · 꼬리 날개
      parts: [{ x: -34, y: 2, spr: 'bt_s', hp: 60, fire: { k: 'aim', at: 90, every: 100, n: 3, spr: 0.5, sp: 1.9 } }, { x: 34, y: 2, spr: 'bt_s', hp: 60, fire: { k: 'aim', at: 140, every: 100, n: 3, spr: 0.5, sp: 1.9 } },
        { x: 0, y: 2, spr: 'bt_s', hp: 60, fire: { k: 'aim', at: 120, every: 100, n: 1, sp: 2.3, rep: 3, gap: 8, bt: 'n' } }],
      phases: [{ until: 0.5, acts: [{ every: 170, at: 100, fn: (e, g) => { P.stream(g, e, -34, 44, 9, 6, D90 + 0.7, -0.16, 1.7, 's'); P.stream(g, e, 34, 44, 9, 6, D90 - 0.7, 0.16, 1.7, 's'); } }] },
        { until: 0, acts: [{ every: 130, at: 30, fn: (e, g) => { e.fl = -(e.fl || 1); P.ring(g, e.x, e.y + 26, 14, 1.4, 'l', g.rng() * 6, { w: 0.013 * e.fl, wt: 90 }); } },
          { every: 150, at: 95, fn: (e, g) => { P.burst(g, e, -34, 44, 3, 9, 1, 0, 2.2, 'n'); P.burst(g, e, 34, 44, 3, 9, 1, 0, 2.2, 'n'); } },
          { every: 230, at: 170, fn: (e, g) => [-64, 64].forEach(x => g.later(0, ['fan', x, 22, D90, 5, 1.0, 1.6, 's'], e)) }] }] },
    /* 끝판왕. 체력은 5장 보스의 두 배이고 다섯 단계로 바뀐다. 셋째 단계부터 가운데 뚜껑이 열려 흑심이 드러난다 */
    s7boss: { name: '흑심 대요새', spr: 'b_final', hp: 6000, sc: 300000, ty: 94, sway: [14, 0.008, 5], last: true, dome: 'b_core',
      boxes: [[0, -22, 44, 28], [0, 18, 38, 12], [0, 38, 30, 8], [0, 52, 20, 6], [0, 64, 12, 6], [0, 73, 5, 4]].concat(BOTH([62, -23.5, 20, 14.5], [89, -18, 7, 20], [104, -8, 8, 22], [101, 26, 8, 16], [99.5, 50, 6.5, 8], [98, 64, 5, 6])),      // 아래로 좁아지는 선체 여섯 단 · 날개 뿌리 · 어깨 · 바깥 날개 · 집게
      parts: [{ x: 0, y: 48, spr: 'bt_l', hp: 200, fire: { k: 'aim', at: 100, every: 120, n: 5, spr: 0.8, sp: 1.8, bt: 'l' } },
        { x: -58, y: -10, spr: 'bt_l', hp: 170, fire: { k: 'aim', at: 130, every: 130, n: 3, spr: 0.36, sp: 2.0, bt: 'l' } }, { x: 58, y: -10, spr: 'bt_l', hp: 170, fire: { k: 'aim', at: 195, every: 130, n: 3, spr: 0.36, sp: 2.0, bt: 'l' } },
        { x: -98, y: 30, spr: 'bt_s', hp: 85, fire: { k: 'aim', at: 150, every: 105, n: 1, sp: 2.3, rep: 3, gap: 8, bt: 'n' } }, { x: 98, y: 30, spr: 'bt_s', hp: 85, fire: { k: 'aim', at: 205, every: 105, n: 1, sp: 2.3, rep: 3, gap: 8, bt: 'n' } },
        { x: -30, y: -36, spr: 'gun_t', hp: 70, fire: { k: 'fan', at: 120, every: 150, n: 3, spr: 0.7, sp: 1.6 } }, { x: 30, y: -36, spr: 'gun_t', hp: 70, fire: { k: 'fan', at: 195, every: 150, n: 3, spr: 0.7, sp: 1.6 } }],
      phases: [
        { until: 0.8, acts: [{ every: 150, at: 100, fn: (e, g) => P.burst(g, e, 0, 80, 3, 10, 3, 0.44, 2.0, 's') },
          { every: 210, at: 170, fn: (e, g) => { P.fan(g, e.x - 98, e.y + 74, D90 - 0.3, 5, 0.9, 1.6, 's'); P.fan(g, e.x + 98, e.y + 74, D90 + 0.3, 5, 0.9, 1.6, 's'); } }] },      // 집게 끝에서 안쪽으로
        { until: 0.6, acts: [{ every: 125, at: 40, fn: (e, g) => P.ring(g, e.x, e.y, 16, 1.35, 'l', (e.k = (e.k || 0) + 0.19)) },
          { every: 250, at: 110, fn: (e, g) => [-1, 1].forEach((s, i) => [0, 1].forEach(k => g.later(k * 18 + i * 9, ['spawn', 'jet', s * 76, -30, { mv: 'swoop', vy: 2.4, p: { y: 150 + k * 30, dir: -s } }], e))) },
          { every: 190, at: 150, fn: (e, g) => { P.fan(g, e.x - 98, e.y + 74, D90 - 0.25, 3, 0.5, 2.2, 'n'); P.fan(g, e.x + 98, e.y + 74, D90 + 0.25, 3, 0.5, 2.2, 'n'); } }] },
        { until: 0.4, open: true, acts: [{ every: 210, at: 50, fn: (e, g) => { const a = g.rng() * 6; P.stream(g, e, 0, 0, 22, 4, a, 0.31, 1.5, 's'); P.stream(g, e, 0, 0, 22, 4, a + PI, 0.31, 1.5, 's'); } },
          { every: 150, at: 120, fn: (e, g) => { P.ring(g, e.x, e.y, 12, 1.3, 'l', 0.1, { w: 0.014, wt: 100 }); P.ring(g, e.x, e.y, 12, 1.3, 'l', 0.36, { w: -0.014, wt: 100 }); } },      // 두 방향으로 휘어 꽃 모양이 된다
          { every: 170, at: 90, fn: (e, g) => P.burst(g, e, 0, 80, 2, 10, 3, 0.4, 2.1, 'n') }] },
        { until: 0.2, open: true, acts: [{ every: 190, at: 40, fn: (e, g) => P.rain(g, 8, 1.5, 's') },
          { every: 105, at: 70, fn: (e, g) => P.burst(g, e, 0, 80, 3, 9, 3, 0.44, 2.2, 'n') },
          { every: 165, at: 120, fn: (e, g) => { P.fan(g, e.x - 98, e.y + 74, D90 - 0.45, 7, 1.5, 1.6, 's'); P.fan(g, e.x + 98, e.y + 74, D90 + 0.45, 7, 1.5, 1.6, 's'); } },
          { every: 320, at: 200, fn: (e, g) => [-1, 1].forEach(s => g.later(0, ['spawn', 'mine', s * 50, 90, { mv: 'sine', vy: 0.75, p: { a: 14, f: 0.035 } }], e)) }] },
        { until: 0, open: true, acts: [{ every: 105, at: 30, fn: (e, g) => { e.fl = -(e.fl || 1); P.ring(g, e.x, e.y, 18, 1.45, 'l', (e.k = (e.k || 0) + 0.17), { w: 0.013 * e.fl, wt: 100 }); } },
          { every: 85, at: 60, fn: (e, g) => P.burst(g, e, 0, 80, 3, 8, 3, 0.5, 2.3, 'n') },
          { every: 230, at: 150, fn: (e, g) => P.rain(g, 8, 1.6, 's') },
          { every: 260, at: 200, fn: (e, g) => { const a = g.rng() * 6; P.stream(g, e, 0, 0, 20, 4, a, -0.36, 1.6, 's'); P.stream(g, e, 0, 0, 20, 4, a + PI, -0.36, 1.6, 's'); } }] }
      ] }
  };

  /* ── 스테이지 시간표 ── */
  function TL() {
    const ev = [];
    const A = {
      e(t, type, x, o) { ev.push(Object.assign({ t: Math.round(t * 60), type: type, x: x }, o || {})); return A; },
      V(t, type, cx, n, o) { n = n || 5; for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2; A.e(t + Math.abs(k) * 0.2, type, cx + k * 22, Object.assign({ mv: 'dive', vy: 1.5 }, o || {})); } return A; },
      col(t, type, x, n, o, gap) { for (let i = 0; i < n; i++) A.e(t + i * (gap || 0.3), type, x, o); return A; },
      swL(t, type, n, o) { return A.col(t, type, 44, n || 4, Object.assign({ mv: 'swoop', vy: 2, p: { y: 104, dir: 1 } }, o || {})); },
      swR(t, type, n, o) { return A.col(t, type, W - 44, n || 4, Object.assign({ mv: 'swoop', vy: 2, p: { y: 104, dir: -1 } }, o || {})); },
      sine(t, type, x, n, o) { return A.col(t, type, x, n || 4, Object.assign({ mv: 'sine', vy: 1.2, p: { a: 30, f: 0.05 } }, o || {}), 0.36); },
      chase(t, x, n) { return A.col(t, 'dart', x, n || 3, { mv: 'chase', vy: 2.0 }, 0.4); },
      crL(t, type, y, n, o) { return A.col(t, type, -14, n || 4, Object.assign({ mv: 'cross', y: y, vx: 1.7, vy: 0.3 }, o || {}), 0.34); },
      crR(t, type, y, n, o) { return A.col(t, type, W + 14, n || 4, Object.assign({ mv: 'cross', y: y, vx: -1.7, vy: 0.3 }, o || {}), 0.34); },
      hov(t, type, x, y, wait, o) { return A.e(t, type, x, Object.assign({ mv: 'hover', p: { tx: x, ty: y, wait: wait || 280 } }, o || {})); },
      gr(t, type, x, o) { return A.e(t, type, x, Object.assign({ mv: 'ground' }, o || {})); },
      mine(t, x) { return A.e(t, 'mine', x, { mv: 'sine', vy: 0.75, p: { a: 14, f: 0.035 } }); },
      it(t, x, drop) { return A.e(t, 'balloon', x, { mv: 'sine', vy: 0.7, p: { a: 16, f: 0.03 }, drop: drop || 'P' }); },
      mid(t, name) { ev.push({ t: Math.round(t * 60), k: 'mid', boss: name }); return A; },
      boss(t, name) { ev.push({ t: Math.round(t * 60), k: 'boss', boss: name }); return A; },
      done() { ev.sort((a, b) => a.t - b.t); return ev; }
    };
    return A;
  }
  const Z2 = { fire: F.z2 };
  const JV = { mv: 'dive', vy: 2.3 }, JS = { vy: 2.6 }, JL = { vx: 2.4 }, JR = { vx: -2.4 };      // 빠른 적(jet)의 움직임

  DS.STAGES = [
    { name: '종이 바다', sub: '첫 장', scroll: 0.5, cloud: 0.25, events: TL()
      .V(2, 'zako', 120, 3).swL(5, 'zako').swR(8, 'zako').it(10, 120)
      .gr(12, 'boat', 60).gr(13.5, 'boat', 184).V(15, 'zako', 120, 5)
      .hov(18, 'heli', 70, 66, 240).hov(18.6, 'heli', 170, 66, 240).chase(21.5, 60).chase(23, 180)
      .hov(25, 'twin', 120, 62, 300).gr(27, 'boat', 36).gr(28, 'boat', 204).sine(29, 'zako', 80)
      .crL(32.5, 'zako', 50).crR(35, 'zako', 80).it(36.5, 70, 'B').hov(38, 'heli', 120, 80, 200)
      .mid(41, 's1mid')
      .V(43, 'zako', 80, 3).V(44.5, 'zako', 160, 3).chase(47, 120, 4)
      .hov(49.5, 'twin', 66, 60, 280).hov(51, 'twin', 174, 60, 280).gr(53, 'boat', 120).gr(54, 'boat', 50).gr(55, 'boat', 190)
      .swL(57, 'zako', 5).swR(59, 'zako', 5).it(61, 150)
      .hov(63, 'heli', 50, 60, 200).hov(63.4, 'heli', 120, 84, 200).hov(63.8, 'heli', 190, 60, 200).V(67, 'zako', 120, 5)
      .boss(72, 's1boss').done() },
    { name: '빗금 들판', sub: '둘째 장', scroll: 0.55, cloud: 0.3, events: TL()
      .V(2, 'zako', 70, 3).V(3.5, 'zako', 170, 3).gr(5, 'tank', 56).gr(6, 'tank', 190).it(7.5, 120)
      .chase(9, 60).chase(10.5, 180).gr(12, 'truck', 60, { vy: 0.5 }).gr(12.6, 'truck', 60, { vy: 0.5 }).gr(13.2, 'truck', 60, { vy: 0.5 })
      .hov(15, 'canard', 80, 70, 220).hov(16, 'canard', 160, 70, 220).swL(18.5, 'zako', 5, Z2).gr(20, 'tank', 30).gr(20.6, 'tank', 86).gr(21.2, 'tank', 160)
      .hov(23.5, 'twin', 120, 60, 300).crR(26, 'zako', 60, 5).crL(28, 'zako', 90, 5).it(29.5, 180, 'B')
      .gr(31, 'tank', 200).gr(31.6, 'tank', 150).sine(33, 'zako', 60).sine(34.5, 'zako', 180).hov(37, 'canard', 120, 76, 220)
      .mid(40, 's2mid')
      .V(42, 'zako', 120, 5, Z2).gr(44, 'tank', 40).gr(44.5, 'tank', 200).chase(46, 120, 4).hov(48.5, 'twin', 70, 62, 280).hov(49.5, 'twin', 170, 62, 280)
      .gr(52, 'truck', 180, { vy: 0.5 }).gr(52.6, 'truck', 180, { vy: 0.5 }).it(54, 60).swR(56, 'zako', 5, Z2).swL(58, 'zako', 5, Z2)
      .hov(60.5, 'canard', 60, 64, 200).hov(61, 'canard', 180, 64, 200).gr(63, 'tank', 70).gr(63.6, 'tank', 170).V(66, 'zako', 120, 5)
      .boss(71, 's2boss').done() },
    { name: '먹구름 항구', sub: '셋째 장', scroll: 0.55, cloud: 0.6, events: TL()
      .swR(2, 'zako', 4).gr(4, 'gun', 40).gr(5.5, 'boat', 180).hov(7, 'heli', 150, 70, 220).hov(7.5, 'heli', 200, 56, 220).it(9, 120)
      .gr(10.5, 'gun', 70).gr(11.5, 'gun', 24).chase(12.5, 160, 4).gr(14, 'boat', 150).gr(15, 'boat', 210)
      .hov(17, 'canard', 100, 66, 220).crL(19, 'zako', 60, 5, Z2).gr(21, 'gun', 50).hov(22.5, 'twin', 150, 62, 300)
      .hov(26, 'heavy', 120, 62, 420).gr(28, 'boat', 190).gr(30, 'gun', 30).gr(31, 'gun', 76).it(32.5, 170, 'P')
      .V(34.5, 'zako', 150, 5).hov(37, 'heli', 60, 60, 200).hov(37.4, 'heli', 180, 60, 200)
      .mid(40.5, 's3mid')
      .chase(42.5, 80).chase(43.5, 170).gr(45, 'gun', 40).gr(45.8, 'boat', 170).hov(47.5, 'canard', 70, 70, 220).hov(48, 'canard', 170, 70, 220)
      .swL(50.5, 'zako', 5, Z2).swR(52.5, 'zako', 5, Z2).it(54, 120, 'B').gr(55.5, 'gun', 60).gr(56.2, 'gun', 20).gr(57, 'boat', 200)
      .hov(59, 'twin', 80, 60, 280).hov(60, 'twin', 180, 76, 280).crR(63, 'zako', 70, 5).V(66, 'zako', 120, 5, Z2)
      .boss(71, 's3boss').done() },
    { name: '연필심 산맥', sub: '넷째 장', scroll: 0.62, cloud: 1.0, events: TL()
      .chase(2, 60).chase(3, 180).chase(4.2, 120).gr(5.5, 'gun', 60).gr(6.5, 'tank', 180).hov(8, 'heli', 70, 66, 220).hov(8.4, 'heli', 170, 66, 220)
      .it(10, 120).V(11.5, 'zako', 120, 5, Z2).hov(14, 'canard', 60, 60, 200).hov(14.5, 'canard', 180, 60, 200).gr(16.5, 'gun', 200).gr(17.2, 'gun', 30)
      .hov(19, 'twin', 120, 64, 300).swL(21.5, 'zako', 5, Z2).swR(23, 'zako', 5, Z2).gr(25, 'tank', 100).gr(25.6, 'tank', 140)
      .hov(27.5, 'heavy', 120, 60, 420).chase(30, 40).chase(31, 200).it(33, 60, 'B').crL(34.5, 'zako', 50, 5, Z2).crR(36, 'zako', 90, 5, Z2)
      .hov(38, 'heli', 120, 80, 200)
      .mid(41, 's4mid')
      .V(43, 'zako', 70, 3, Z2).V(44, 'zako', 170, 3, Z2).gr(45.5, 'gun', 50).gr(46.2, 'gun', 190).hov(48, 'canard', 120, 70, 220)
      .chase(50, 80, 4).chase(51.5, 160, 4).hov(54, 'twin', 60, 60, 280).hov(55, 'twin', 180, 60, 280).it(57, 120)
      .gr(58.5, 'tank', 30).gr(59.2, 'tank', 210).hov(61, 'heavy', 120, 66, 400).swL(64.5, 'zako', 5, Z2).swR(66, 'zako', 5, Z2)
      .boss(72, 's4boss').done() },
    { name: '흑연 요새', sub: '다섯째 장', scroll: 0.62, cloud: 0.2, events: TL()
      .gr(2, 'gun', 40).gr(2.6, 'gun', 200).V(4, 'zako', 120, 5, Z2).gr(6, 'tank', 80).gr(6.6, 'tank', 160).chase(8, 60, 4).chase(9, 180, 4)
      .it(10.5, 120).hov(12, 'canard', 60, 64, 220).hov(12.5, 'canard', 180, 64, 220).gr(14, 'gun', 30).gr(14.6, 'gun', 100).gr(15.2, 'gun', 210)
      .hov(17, 'twin', 80, 60, 300).hov(18, 'twin', 170, 76, 300).crL(20.5, 'zako', 56, 5, Z2).crR(22, 'zako', 96, 5, Z2).gr(24, 'tank', 120)
      .hov(25.5, 'heavy', 120, 60, 440).hov(28, 'heli', 40, 90, 220).hov(28.4, 'heli', 200, 90, 220).it(31, 180, 'B')
      .gr(32.5, 'gun', 60).gr(33.2, 'gun', 180).swL(34.5, 'zako', 5, Z2).swR(36, 'zako', 5, Z2).hov(38, 'canard', 120, 72, 200)
      .mid(41, 's5mid')
      .chase(43, 120, 5).gr(45, 'gun', 30).gr(45.6, 'gun', 210).hov(47, 'heavy', 80, 60, 420).hov(50, 'heavy', 168, 70, 420)
      .it(53, 120).V(55, 'zako', 120, 5, Z2).gr(57, 'tank', 50).gr(57.5, 'tank', 100).gr(58, 'tank', 150).gr(58.5, 'tank', 200)
      .hov(60.5, 'twin', 60, 60, 260).hov(61, 'twin', 180, 60, 260).hov(63, 'heli', 120, 90, 200).it(65.5, 60, 'B').chase(67, 80).chase(68, 170)
      .boss(73, 's5boss').done() },
    { name: '모눈 도시', sub: '여섯째 장', scroll: 0.6, cloud: 0.35, events: TL()
      .V(2, 'jet', 120, 5, JV).gr(3.5, 'bunker', 50).gr(4.5, 'bunker', 190).mine(6, 80).mine(6.6, 160).swL(8, 'jet', 5, JS).swR(9.5, 'jet', 5, JS)
      .it(11, 120).hov(12.5, 'spinner', 70, 70, 300).hov(13.5, 'spinner', 170, 70, 300).gr(15, 'tank', 30).gr(15.5, 'tank', 210).gr(16.5, 'gun', 86).gr(17, 'gun', 154)
      .chase(18.5, 60, 4).chase(19.5, 180, 4).hov(21, 'canard', 120, 64, 220).mine(22.5, 40).mine(23, 120).mine(23.5, 200)
      .hov(25, 'heavy', 120, 60, 440).crL(27.5, 'jet', 60, 5, JL).crR(29, 'jet', 96, 5, JR).gr(30.5, 'bunker', 120).it(32, 60, 'B')
      .hov(33.5, 'twin', 64, 60, 280).hov(34.3, 'twin', 176, 60, 280).V(36.5, 'jet', 120, 5, JV).gr(38, 'bunker', 40).gr(38.6, 'bunker', 200)
      .mid(41, 's6mid')
      .mine(43, 60).mine(43.5, 180).V(44.5, 'jet', 70, 3, JV).V(45.5, 'jet', 170, 3, JV).hov(47, 'spinner', 120, 76, 320).gr(48.5, 'gun', 30).gr(49, 'gun', 210)
      .hov(50.5, 'heavy', 76, 60, 420).hov(53, 'heavy', 164, 72, 420).it(55.5, 120).swL(57, 'jet', 5, JS).swR(58, 'jet', 5, JS)
      .gr(59.5, 'bunker', 60).gr(60, 'bunker', 180).mine(61.5, 100).mine(62, 140).hov(63, 'spinner', 50, 64, 280).hov(63.6, 'spinner', 190, 64, 280)
      .chase(66, 120, 5).it(67.5, 180, 'B').V(69, 'jet', 120, 5, JV)
      .boss(73.5, 's6boss').done() },
    { name: '백지 하늘', sub: '마지막 장', scroll: 0.62, cloud: 1.0, events: TL()      // 땅이 없는 장: 하늘의 적만 나온다
      .swL(2, 'jet', 5, JS).swR(3, 'jet', 5, JS).mine(4.5, 60).mine(5, 120).mine(5.5, 180).V(7, 'jet', 120, 5, JV)
      .hov(8.5, 'spinner', 60, 60, 300).hov(9, 'spinner', 180, 60, 300).chase(11, 120, 5).it(12.5, 120)
      .hov(14, 'heavy', 120, 58, 440).crL(16, 'jet', 70, 5, JL).crR(17, 'jet', 100, 5, JR).hov(19, 'canard', 50, 80, 220).hov(19.4, 'canard', 190, 80, 220)
      .mine(21, 30).mine(21.4, 90).mine(21.8, 150).mine(22.2, 210).hov(23.5, 'twin', 70, 60, 280).hov(24.3, 'twin', 170, 60, 280)
      .V(26.5, 'jet', 60, 3, JV).V(27.3, 'jet', 180, 3, JV).hov(29, 'spinner', 120, 84, 320).it(30.5, 180, 'B')
      .hov(32, 'heavy', 70, 60, 420).hov(33.5, 'heavy', 170, 60, 420).chase(36, 60, 4).chase(37, 180, 4).swL(38.5, 'jet', 5, JS)
      .mid(41, 's7mid')
      .V(43, 'jet', 120, 5, JV).mine(44.5, 70).mine(45, 170).hov(46, 'spinner', 40, 56, 300).hov(46.5, 'spinner', 120, 80, 300).hov(47, 'spinner', 200, 56, 300)
      .crL(50, 'jet', 50, 6, JL).crR(51, 'jet', 80, 6, JR).it(52.5, 120).hov(54, 'heavy', 120, 60, 440).hov(55.5, 'canard', 44, 90, 220).hov(56, 'canard', 196, 90, 220)
      .mine(58, 50).mine(58.4, 120).mine(58.8, 190).swL(60, 'jet', 6, JS).swR(61, 'jet', 6, JS).hov(62.5, 'twin', 60, 60, 260).hov(63, 'twin', 180, 60, 260)
      .chase(65, 120, 5).it(66.5, 60, 'B').it(67, 180).V(68.5, 'jet', 120, 5, JV)
      .boss(74, 's7boss').done() }
  ];
})();

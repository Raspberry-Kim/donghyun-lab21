/* 적·탄·아이템·효과 그림 */
(function () {
  'use strict';
  const DS = window.DS, def = DS.ART.def;
  const SH = (side, f, a, gap, ang) => ({ side: side || 'r', f: f == null ? 0.55 : f, a: a == null ? 0.5 : a, gap: gap || 1.2, ang: ang == null ? -0.95 : ang });
  const nac = (q, x, y0, y1, w, tone) => {
    q.poly([[x - w, y0], [x + w, y0], [x + w * 1.2, y0 + (y1 - y0) * 0.5], [x + w * 0.85, y1], [x - w * 0.85, y1], [x - w * 1.2, y0 + (y1 - y0) * 0.5]], { s: true, tone: tone == null ? 0.25 : tone, hatch: SH('r', 0.5, 0.55, 0.9) });
    q.ell(x, y0 - 0.5, w * 0.6, w * 0.6, { tone: 0.6, w: 0.3 });
  };
  DS.nac = nac;

  /* ── 작은 적 (기수가 아래를 보도록 뒤집어 그린다) ── */
  def('zako', 26, 24, p => {
    p.sym([[0, 5.6], [1.6, 5.4], [4.2, 6.2], [4.4, 7.6], [0, 8]], { s: true, tone: 0.2 });
    p.sym([[0, -3.6], [4, -3.6], [10, -2.1], [10.9, -0.6], [9.8, 0.7], [4, 1.7], [0, 2.1]], { s: true, tone: 0.16, hatch: SH('r', 0.5, 0.6, 1.0) });
    p.sym([[0, -9.2], [1.7, -8.2], [2.1, -4], [1.7, 2], [0.8, 7.6], [0, 8.8]], { s: true, tone: 0.3, hatch: SH('r', 0.5, 0.6, 0.9) });
    p.ell(0, -1, 1.15, 2.3, { tone: 0.65, w: 0.3 });
    p.mir(q => q.seg(6.4, -2.6, 6.6, 1, { w: 0.4, a: 0.7, passes: 1 }));
  }, { flipY: true, props: [[0, -9.8, 4.2]] });

  def('dart', 24, 22, p => {
    p.sym([[0, -9], [1.6, -6.6], [3, -2], [10, 4.6], [10.4, 6.4], [5.2, 5.6], [2, 6.8], [0, 6.2]], { s: true, tone: 0.3, hatch: SH('r', 0.5, 0.6, 1.0) });
    p.ell(0, -3, 1.05, 2.5, { tone: 0.7, w: 0.3 });
    p.seg(0, 0.6, 0, 6.6, { w: 0.5, a: 0.8 });
    p.mir(q => q.seg(3.4, 0.4, 7.6, 4.6, { w: 0.24, a: 0.5, passes: 1 }));
  }, { flipY: true });

  def('heli', 28, 34, p => {
    p.mir(q => q.seg(4.6, -7, 4.6, 3, { w: 0.5, a: 0.8 }));
    p.rect(0, 12.4, 6, 1.3, { tone: 0.4, w: 0.35 });
    p.sym([[0, -9.4], [2.6, -8.2], [3.9, -3], [3, 3], [1.1, 6.4], [0.8, 12.6], [0, 13]], { s: true, tone: 0.24, hatch: SH('r', 0.5, 0.6, 0.9) });
    p.sym([[0, -8.6], [2, -7.4], [2.6, -4.4], [0, -3.8]], { s: true, tone: 0.6, w: 0.3 });
    p.ell(0, 0, 1, 1, { tone: 0.8, w: 0.3 });
  }, { flipY: true, props: [[0, 0, 12, 1]] });

  def('balloon', 26, 26, p => {
    p.ell(0, 0, 10.5, 10.5, { tone: 0.05, hatch: SH('r', 0.6, 0.35, 1.5), w: 0.55 });
    for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.3; p.line([[0, 0], [Math.cos(a) * 5.4, Math.sin(a) * 5.4], [Math.cos(a + 0.12) * 10.3, Math.sin(a + 0.12) * 10.3]], { s: true, w: 0.25, a: 0.5, passes: 1 }); }
    p.rect(0, 0, 4.6, 4.6, { tone: 0.35, w: 0.4 });
    p.seg(-2.3, -2.3, 2.3, 2.3, { w: 0.25, a: 0.6, passes: 1 }); p.seg(2.3, -2.3, -2.3, 2.3, { w: 0.25, a: 0.6, passes: 1 });
  });

  /* ── 중형 ── */
  def('twin', 58, 44, p => {
    p.sym([[0, 12.4], [7.8, 13], [8.4, 15.6], [0, 16.2]], { s: true, tone: 0.18 });
    p.sym([[0, -5.2], [8, -5.6], [18, -4.2], [25.6, -1.7], [26.2, 0.6], [24, 2.1], [10, 3.6], [0, 4.2]], { s: true, tone: 0.14, hatch: SH('r', 0.52, 0.55, 1.1) });
    p.mir(q => nac(q, 10, -10.6, 5, 1.7));
    p.sym([[0, -16], [2.5, -14.4], [3.3, -8], [3.1, 2], [2.1, 10], [1, 16.6], [0, 17.6]], { s: true, tone: 0.26, hatch: SH('r', 0.5, 0.6, 0.9) });
    p.ell(0, -13.2, 1.8, 2.2, { tone: 0.6, w: 0.3 }); p.ell(0, -6.4, 1.6, 2.4, { tone: 0.6, w: 0.3 });
    p.ell(0, 3.4, 1.7, 1.7, { tone: 0.75, w: 0.35 });
    p.mir(q => { q.seg(15, -4.2, 15.4, 2.6, { w: 0.24, a: 0.5, passes: 1 }); q.seg(21, -2.8, 21.2, 2, { w: 0.24, a: 0.5, passes: 1 }); });
  }, { flipY: true, props: [[-10, -11.8, 5.8], [10, -11.8, 5.8]] });

  def('canard', 44, 40, p => {
    p.sym([[0, -0.4], [3, -0.4], [15.6, 6], [18.2, 9.2], [17.2, 11.4], [8, 10.2], [0, 10.8]], { s: true, tone: 0.16, hatch: SH('r', 0.52, 0.55, 1.0) });
    p.sym([[0, -11.6], [6.4, -10.4], [6.8, -8.6], [0, -8.2]], { s: true, tone: 0.2 });
    p.mir(q => q.rect(13, 10, 1.3, 5.6, { tone: 0.45, w: 0.35 }));
    p.sym([[0, -16.4], [1.7, -14], [2.7, -6], [3.1, 4], [2.5, 11.4], [0, 13.6]], { s: true, tone: 0.3, hatch: SH('r', 0.5, 0.6, 0.9) });
    p.ell(0, -4.6, 1.5, 3, { tone: 0.65, w: 0.3 });
    p.mir(q => q.seg(2.9, 1, 4.6, 1.2, { w: 0.6, a: 0.8, passes: 1 }));
  }, { flipY: true, props: [[0, 14.4, 5.6]] });

  def('heavy', 96, 66, p => {
    p.sym([[0, 22.6], [12.6, 23.2], [13.6, 27], [0, 28]], { s: true, tone: 0.18, hatch: SH('r', 0.6, 0.4, 1.2) });
    p.sym([[0, -8.2], [12, -8.6], [30, -6.2], [43, -3.1], [44.6, -0.4], [42, 1.7], [20, 5.2], [0, 6.8]], { s: true, tone: 0.13, hatch: SH('r', 0.52, 0.55, 1.2) });
    p.mir(q => { nac(q, 12.6, -14.6, 5.4, 2.2); nac(q, 27, -12.6, 4.6, 2.1); });
    p.sym([[0, -28.6], [3.1, -26.4], [4.6, -18], [4.6, 4], [3.5, 18], [1.6, 28.8], [0, 30.6]], { s: true, tone: 0.26, hatch: SH('r', 0.5, 0.6, 0.9) });
    p.ell(0, -25, 2.5, 2.6, { tone: 0.6, w: 0.3 }); p.rect(0, -19, 5, 3.2, { tone: 0.6, w: 0.3 });
    p.ell(0, -5, 2.4, 2.4, { tone: 0.75, w: 0.4 }); p.ell(0, 13, 2.3, 2.3, { tone: 0.75, w: 0.4 });
    p.mir(q => { q.seg(20, -7, 20.4, 4.6, { w: 0.24, a: 0.5, passes: 1 }); q.seg(35, -5, 35.3, 2.4, { w: 0.24, a: 0.5, passes: 1 }); q.ell(38, -1, 2, 2, { tone: 0.2, w: 0.25, paper: false }); });
    p.seg(-4, 8, 4, 8, { w: 0.24, a: 0.5, passes: 1 });
  }, { flipY: true, props: [[-12.6, -16, 6.6], [12.6, -16, 6.6], [-27, -14, 6.4], [27, -14, 6.4]] });

  /* ── 땅·바다의 적 ── */
  def('tank', 24, 28, p => {
    p.mir(q => q.poly([[4.6, -11], [9.6, -11], [9.8, 11], [4.6, 11]], { tone: 0.4, hatch: { ang: 0, gap: 1.25, a: 0.75, w: 0.34 }, w: 0.5 }));
    p.poly([[-5.6, -10], [5.6, -10], [6.4, -4], [6.4, 10.4], [-6.4, 10.4], [-6.4, -4]], { tone: 0.2, hatch: SH('r', 0.55, 0.5, 1.0) });
    p.seg(-4.6, 6.6, 4.6, 6.6, { w: 0.25, a: 0.6, passes: 1 }); p.seg(-4.6, 8.4, 4.6, 8.4, { w: 0.25, a: 0.6, passes: 1 });
  });
  def('tank_t', 14, 30, p => {
    p.poly([[-0.9, -13], [0.9, -13], [1, -2], [-1, -2]], { tone: 0.5, w: 0.4 });
    p.rect(0, -13.2, 2.6, 1.6, { tone: 0.6, w: 0.3 });
    p.poly([[-3.4, -3.6], [3.4, -3.6], [4.2, 0], [3, 4], [-3, 4], [-4.2, 0]], { s: false, tone: 0.34, hatch: SH('r', 0.5, 0.6, 0.9), w: 0.5 });
    p.ell(0.6, 1, 1.1, 1.1, { tone: 0.5, w: 0.25 });
  });
  def('gun', 26, 26, p => {
    p.ell(0, 0, 11, 11, { tone: 0.08, w: 0.55 });
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832; p.seg(Math.cos(a) * 7.8, Math.sin(a) * 7.8, Math.cos(a) * 10.8, Math.sin(a) * 10.8, { w: 0.3, a: 0.65, passes: 1, noOver: true }); }
    p.ell(0, 0, 7.6, 7.6, { tone: 0.22, hatch: SH('r', 0.5, 0.5, 1.1), w: 0.45 });
  });
  def('gun_t', 14, 30, p => {
    p.mir(q => q.poly([[0.7, -13], [2.1, -13], [2.2, -2], [0.6, -2]], { tone: 0.5, w: 0.36 }));
    p.ell(0, 0, 4.6, 4.6, { tone: 0.36, hatch: SH('r', 0.5, 0.6, 0.9), w: 0.5 });
    p.rect(0, 1.6, 4, 2, { tone: 0.5, w: 0.25 });
  });
  def('boat', 20, 44, p => {
    p.sym([[0, -20], [3.6, -14.6], [5.4, -4], [5.4, 13], [3.8, 19], [0, 19.6]], { s: true, tone: 0.18, hatch: SH('r', 0.56, 0.5, 1.0) });
    p.sym([[0, -15], [2.6, -11], [3.8, -3], [3.8, 12], [2.6, 16.6], [0, 17]], { s: true, tone: 0.06, paper: false, w: 0.3, a: 0.6, passes: 1 });
    p.rect(0, 5.4, 5.6, 8, { tone: 0.4, hatch: SH('r', 0.5, 0.6, 0.9), w: 0.4 });
    p.ell(0, 13.4, 1.5, 1.5, { tone: 0.6, w: 0.3 });
    p.mir(q => q.line([[6.4, -15], [8, -8], [8.6, 2]], { s: true, w: 0.25, a: 0.35, passes: 1 }));
  }, { flipY: true });
  def('truck', 16, 26, p => {
    p.rect(0, 3, 9.6, 14.4, { tone: 0.2, hatch: { ang: 0, gap: 1.6, a: 0.45 } });
    p.rect(0, -7.4, 8.8, 5.6, { tone: 0.42, hatch: SH('r', 0.5, 0.6, 0.9) });
    p.mir(q => { q.rect(5.6, -6.4, 1.6, 3.6, { tone: 0.75, w: 0.25 }); q.rect(5.6, 6.6, 1.6, 4, { tone: 0.75, w: 0.25 }); });
  }, { flipY: true });

  /* ── 6·7장의 적 ── */
  def('jet', 26, 28, p => {      // 뒤로 젖힌 날개의 빠른 적
    p.sym([[0, -1.6], [2.4, -1.8], [11, 5.4], [11.6, 7.8], [7, 7.2], [2.4, 6], [0, 6.4]], { s: true, tone: 0.22, hatch: SH('r', 0.5, 0.6, 1.0) });
    p.sym([[0, 8.2], [1.8, 8], [5.4, 10.8], [5.4, 12.4], [0, 12]], { s: true, tone: 0.3 });
    p.sym([[0, -12.8], [1.6, -10], [2.5, -4], [2.5, 6], [1.7, 11.6], [0, 12.8]], { s: true, tone: 0.36, hatch: SH('r', 0.5, 0.6, 0.9) });
    p.ell(0, -5.6, 1.1, 2.7, { tone: 0.72, w: 0.3 });
    p.mir(q => { q.poly([[2.4, -1], [4.2, 0.4], [4.2, 5], [2.4, 5.6]], { tone: 0.5, w: 0.34 }); q.seg(5.6, 2.6, 9.4, 6, { w: 0.24, a: 0.5, passes: 1 }); });
    p.rect(0, 12.4, 2.4, 1.4, { tone: 0.9, w: 0.3 });
  }, { flipY: true });
  def('mine', 26, 26, p => {      // 가시 돋친 공중 기뢰
    for (let i = 0; i < 8; i++) { const a = i * 0.7854 + 0.39, c = Math.cos(a), n = Math.sin(a); p.poly([[c * 6 - n * 1.5, n * 6 + c * 1.5], [c * 11.4, n * 11.4], [c * 6 + n * 1.5, n * 6 - c * 1.5]], { tone: 0.6, w: 0.4 }); }
    p.ell(0, 0, 7.6, 7.6, { tone: 0.46, hatch: SH('r', 0.5, 0.75, 0.85), w: 0.65 });
    p.ell(0, 0, 4.6, 4.6, { paper: false, w: 0.3, a: 0.6, passes: 1 });
    p.eraseEll(-2.4, -2.6, 1.7, 1.3, { a: 0.7 });
    p.ell(0, 0, 1.9, 1.9, { tone: 0.95, w: 0.3 });
  });
  def('bunker', 32, 30, p => {      // 지붕 위의 포대
    p.poly([[-9, -13], [9, -13], [14.4, -6.4], [14.4, 6.4], [9, 13], [-9, 13], [-14.4, 6.4], [-14.4, -6.4]], { tone: 0.18, hatch: SH('r', 0.55, 0.55, 1.15), w: 0.7 });
    p.poly([[-6.4, -9.4], [6.4, -9.4], [10.4, -4.6], [10.4, 4.6], [6.4, 9.4], [-6.4, 9.4], [-10.4, 4.6], [-10.4, -4.6]], { paper: false, w: 0.32, a: 0.7, passes: 1 });
    p.mir(q => { q.rect(12.6, 0, 2.6, 6.4, { tone: 0.62, w: 0.3 }); q.seg(9, -13, 6.4, -9.4, { w: 0.26, a: 0.5, passes: 1 }); q.seg(9, 13, 6.4, 9.4, { w: 0.26, a: 0.5, passes: 1 }); });
    p.rect(0, -11.4, 7, 2.2, { tone: 0.55, w: 0.3 }); p.rect(0, 11.4, 7, 2.2, { tone: 0.55, w: 0.3 });
    p.ell(0, 0, 7.2, 7.2, { tone: 0.3, hatch: SH('r', 0.5, 0.6, 1.0), w: 0.5 });
  });
  def('spinner', 40, 40, p => {      // 네 팔을 벌린 원반 포대기
    for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.7854, c = Math.cos(a), n = Math.sin(a);
      p.poly([[c * 8 - n * 3.6, n * 8 + c * 3.6], [c * 16.4 - n * 2, n * 16.4 + c * 2], [c * 16.4 + n * 2, n * 16.4 - c * 2], [c * 8 + n * 3.6, n * 8 - c * 3.6]], { tone: 0.34, hatch: SH('r', 0.5, 0.6, 0.9), w: 0.5 });
      p.ell(c * 16, n * 16, 2.7, 2.7, { tone: 0.66, w: 0.4 }); }
    p.ell(0, 0, 11.8, 11.8, { tone: 0.2, hatch: SH('r', 0.52, 0.6, 1.1), w: 0.7 });
    p.ell(0, 0, 8, 8, { paper: false, w: 0.3, a: 0.6, passes: 1 });
    for (let i = 0; i < 8; i++) { const a = i * 0.7854; p.seg(Math.cos(a) * 8.4, Math.sin(a) * 8.4, Math.cos(a) * 11.2, Math.sin(a) * 11.2, { w: 0.26, a: 0.55, passes: 1, noOver: true }); }
    p.ell(0, 0, 3.6, 3.6, { tone: 0.75, w: 0.4 });
  }, { props: [[0, 0, 13, 1]] });

  /* 보스에 얹는 포탑 */
  def('bt_s', 18, 30, p => {
    p.mir(q => q.poly([[0.8, -13.4], [2.4, -13.4], [2.5, -3], [0.7, -3]], { tone: 0.5, w: 0.4 }));
    p.poly([[-5, -4.4], [5, -4.4], [6.2, 0.4], [4.4, 5.6], [-4.4, 5.6], [-6.2, 0.4]], { tone: 0.36, hatch: SH('r', 0.5, 0.65, 0.9), w: 0.55 });
    p.rect(0, 2.4, 5.4, 2.4, { tone: 0.5, w: 0.25 });
  });
  def('bt_l', 30, 46, p => {
    [-4.6, 0, 4.6].forEach(x => { p.poly([[x - 1.2, -21], [x + 1.2, -21], [x + 1.4, -5], [x - 1.4, -5]], { tone: 0.5, w: 0.45 }); p.rect(x, -21.2, 3.2, 1.8, { tone: 0.65, w: 0.3 }); });
    p.poly([[-8.4, -7], [8.4, -7], [10.6, 0.6], [8.6, 9.6], [-8.6, 9.6], [-10.6, 0.6]], { tone: 0.34, hatch: SH('r', 0.5, 0.65, 0.95), w: 0.6 });
    p.rect(0, 5.4, 10, 3.6, { tone: 0.5, w: 0.3 });
    p.mir(q => q.ell(6, 0.6, 1.3, 1.3, { tone: 0.6, w: 0.25 }));
    p.seg(-7, -3.6, 7, -3.6, { w: 0.25, a: 0.6, passes: 1 });
  });

  /* ── 탄 ── */
  def('eb_s', 12, 12, p => {
    p.ell(0, 0, 4.4, 4.4, { line: false });
    p.ell(0, 0, 3.1, 3.1, { tone: 1, w: 0.7, a: 1, jit: 0.1 });
    p.eraseEll(-0.9, -0.9, 0.85, 0.85, { a: 0.75 });
  }, { grain: 0.12 });
  def('eb_l', 16, 16, p => {
    p.ell(0, 0, 6.4, 6.4, { line: false });
    p.ell(0, 0, 5, 5, { tone: 1, w: 0.8, a: 1, jit: 0.12 });
    p.eraseEll(0, 0, 2.3, 2.3, { a: 0.92 });
    p.ell(0, 0, 0.9, 0.9, { tone: 1, line: false, paper: false });
  }, { grain: 0.12 });
  def('eb_n', 10, 18, p => {
    p.sym([[0, -7.6], [3, -3], [3.2, 4], [0, 8]], { s: true, line: false });
    p.sym([[0, -6.4], [1.9, -2.6], [2, 3], [0, 6.8]], { s: true, tone: 1, w: 0.6, a: 1, jit: 0.1 });
    p.eraseEll(0, 2.6, 0.7, 1.6, { a: 0.7 });
  }, { grain: 0.12 });

  def('ps_a', 8, 18, p => {
    p.sym([[0, -8], [1.7, -5], [1.8, 6], [0, 7.6]], { s: true, tone: 0.0, w: 0.5, a: 0.8, jit: 0.12 });
    p.seg(0, -4.6, 0, 5, { w: 0.5, a: 0.5, passes: 1, noOver: true });
  }, { grain: 0.3 });
  def('ps_w', 12, 18, p => {
    p.mir(q => { q.poly([[1.4, -7.6], [3.6, -5], [3.7, 6], [1.4, 7.2]], { s: true, tone: 0, w: 0.5, a: 0.8, jit: 0.12 }); q.seg(2.5, -4, 2.5, 5, { w: 0.5, a: 0.5, passes: 1, noOver: true }); });
  }, { grain: 0.3 });
  def('ps_m', 10, 22, p => {
    p.mir(q => q.poly([[1.3, 3], [3.6, 6.6], [3.6, 8.4], [1.3, 7.4]], { tone: 0.3, w: 0.4 }));
    p.sym([[0, -9.6], [1.6, -6.6], [1.7, 7.6], [0, 8]], { s: true, tone: 0.12, hatch: SH('r', 0.5, 0.6, 0.8), w: 0.5 });
    p.seg(-1.5, -3.6, 1.5, -3.6, { w: 0.3, a: 0.7, passes: 1 });
  }, { grain: 0.3 });
  def('ps_r', 14, 30, p => {
    p.mir(q => q.poly([[2, 5], [5.6, 10], [5.6, 12.6], [2, 11]], { tone: 0.3, w: 0.45 }));
    p.sym([[0, -13.6], [2.4, -9], [2.6, 11], [0, 11.8]], { s: true, tone: 0.14, hatch: SH('r', 0.5, 0.6, 0.9), w: 0.55 });
    p.seg(-2.4, -5.6, 2.4, -5.6, { w: 0.3, a: 0.7, passes: 1 }); p.seg(-2.5, 4, 2.5, 4, { w: 0.3, a: 0.7, passes: 1 });
  }, { grain: 0.3 });
  def('ps_h', 10, 16, p => {      // 신덴의 달라붙는 탄: 갈고리 달린 짧은 살
    p.sym([[0, -6.8], [1.5, -3.6], [1.3, 5.6], [0, 6.2]], { s: true, tone: 0.3, w: 0.5 });
    p.mir(q => { q.seg(1.4, -3, 3.4, -0.6, { w: 0.45, a: 0.85, passes: 1 }); q.seg(1.3, 4, 3.2, 6.6, { w: 0.4, a: 0.7, passes: 1 }); });
  }, { grain: 0.3 });
  def('bolt', 26, 48, (p, i) => {      // 신덴 폭탄: 번개 한 토막 (위아래로 이어 붙인다)
    const r = p.rng, x = [0, 5.4, -3.6, 6.4, -5.8, 2.6, -4.4, 0], pts = x.map((v, k) => [k === 0 || k === 7 ? 0 : v + (r() - 0.5) * 2.4, -23 + k * 46 / 7]);
    p.line(pts, { w: 1.25, a: 0.95, jit: 0.5, passes: 2 });
    p.line(pts.map(q => [q[0] + 1.6, q[1]]), { w: 0.45, a: 0.55, jit: 0.8, passes: 1 });
    p.line([pts[3], [pts[3][0] + 4.4, pts[3][1] + 4.6], [pts[3][0] + 3, pts[3][1] + 9.6]], { w: 0.5, a: 0.7, passes: 1 });
    p.line([pts[4], [pts[4][0] - 4, pts[4][1] + 5], [pts[4][0] - 3.6, pts[4][1] + 9]], { w: 0.45, a: 0.6, passes: 1 });
  }, { noFill: true, boil: 3, grain: 0.35 });
  def('disc', 30, 30, p => {
    p.ell(0, 0, 12.6, 12.6, { tone: 0.04, w: 0.7 });
    p.scribble(0, 0, 11, { spiral: true, turns: 3.2, w: 0.45, a: 0.8 });
    for (let i = 0; i < 6; i++) { const a = i * 1.047; p.poly([[Math.cos(a) * 11.6, Math.sin(a) * 11.6], [Math.cos(a + 0.2) * 14.6, Math.sin(a + 0.2) * 14.6], [Math.cos(a + 0.42) * 11.8, Math.sin(a + 0.42) * 11.8]], { tone: 0.45, w: 0.4 }); }
    p.ell(0, 0, 2.2, 2.2, { tone: 0.7, w: 0.4 });
  });
  def('beam', 30, 48, p => {      // 하야테 차지샷: 굵은 연필 획
    const r = p.rng;
    p.rect(0, 0, 22, 52, { line: false });
    p.rect(0, 0, 22, 52, { line: false, paper: false, tone: 0.12 });
    for (let i = 0; i < 26; i++) { const x = -10.6 + r() * 21.2; p.line([[x, -25], [x + (r() - 0.5) * 1.6, 0], [x + (r() - 0.5) * 1.2, 25]], { s: true, w: 0.5 + r() * 0.5, a: 0.35 + r() * 0.5, passes: 1, noOver: true, jit: 0.5 }); }
    p.mir(q => q.line([[11, -25], [11.4, 0], [11, 25]], { s: true, w: 0.8, a: 0.95, noOver: true, jit: 0.45 }));
  }, { boil: 3, grain: 0.4 });
  def('wing', 26, 24, p => {      // 폭탄: 지원 편대기
    p.sym([[0, 6.4], [4, 7], [4.2, 8.6], [0, 9]], { s: true, tone: 0.06 });
    p.sym([[0, -3.6], [4, -3.7], [11, -2.2], [11.8, -0.6], [10.6, 0.8], [0, 2.2]], { s: true, tone: 0.04, hatch: SH('r', 0.56, 0.4, 1.3) });
    p.sym([[0, -9.6], [1.7, -8.4], [2, -3], [1.2, 6], [0, 9.6]], { s: true, tone: 0.08, hatch: SH('r', 0.5, 0.5, 1.0) });
    p.ell(0, -1.6, 1.1, 2.2, { tone: 0.45, w: 0.3 });
  }, { props: [[0, -10.2, 4.4]] });
  def('ring', 64, 64, p => {      // 팬케이크 폭탄·충격파 고리
    p.ell(0, 0, 29, 29, { paper: false, w: 0.9, a: 0.9, jit: 0.9, passes: 3 });
    p.ell(0, 0, 26, 26, { paper: false, w: 0.5, a: 0.5, jit: 1.2, passes: 2, ph: 1 });
  }, { noFill: true, boil: 3, grain: 0.4 });
  def('swirl', 64, 64, p => {
    p.scribble(0, 0, 29, { spiral: true, turns: 3.6, w: 0.9, a: 0.85, jit: 0.7 });
    p.scribble(0, 0, 27, { spiral: true, turns: 2.6, w: 0.5, a: 0.5, jit: 0.9 });
  }, { noFill: true, boil: 3, grain: 0.4 });

  /* ── 아이템 ── */
  def('it_p', 18, 18, p => {
    p.poly([[-6, -7, 1], [6, -7, 1], [7, -6], [7, 6], [6, 7, 1], [-6, 7, 1], [-7, 6], [-7, -6]], { tone: 0.0, w: 0.8, a: 1 });
    p.seg(-2.4, 4.4, -2.4, -4.4, { w: 1.0, a: 1, noOver: true });
    p.line([[-2.4, -4.4], [1.4, -4.4], [3, -2.2], [1.4, 0], [-2.4, 0]], { s: true, w: 1.0, a: 1, noOver: true });
  }, { grain: 0.25 });
  def('it_b', 18, 18, p => {
    p.ell(0, 0, 7.6, 7.6, { tone: 0.75, w: 0.8, a: 1, hatch: { ang: 0.8, gap: 0.8, a: 0.8 } });
    p.eraseEll(0, 0, 5.2, 5.2, { a: 0.94 });
    p.seg(-2, 3.6, -2, -3.6, { w: 0.9, a: 1, noOver: true });
    p.line([[-2, -3.6], [1, -3.6], [2.2, -1.9], [1, -0.2], [-2, -0.2]], { s: true, w: 0.9, a: 1, noOver: true });
    p.line([[-2, -0.2], [1.4, -0.2], [2.8, 1.7], [1.4, 3.6], [-2, 3.6]], { s: true, w: 0.9, a: 1, noOver: true });
  }, { grain: 0.25 });
  def('it_m', 16, 16, p => {
    const pts = []; for (let i = 0; i < 10; i++) { const a = -1.5708 + i * 0.6283, r = i % 2 ? 2.9 : 6.6; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    p.poly(pts, { tone: 0.1, hatch: SH('r', 0.5, 0.6, 0.9), w: 0.7, a: 1 });
  }, { grain: 0.3 });
  def('ic_bomb', 12, 16, p => {
    p.mir(q => q.poly([[1, 3], [3.6, 5.4], [3.6, 7], [1, 6]], { tone: 0.4, w: 0.4 }));
    p.sym([[0, -6.6], [2.6, -3], [2.4, 3.4], [0, 6]], { s: true, tone: 0.3, hatch: SH('r', 0.5, 0.7, 0.8), w: 0.6 });
  }, { boil: 1 });

  /* ── 폭발 ── */
  function boom(name, R, N, i) {
    const size = Math.ceil(R * 2.5 + 6);
    def(name + i, size, size, p => {
      const r = p.rng, t = i / (N - 1), rad = R * (0.3 + 0.7 * Math.sqrt(t));
      if (t < 0.55) {
        const n = 9 + ((R / 5) | 0), pts = [], ph = r() * 6.28;
        for (let k = 0; k < n * 2; k++) { const a = ph + k / (n * 2) * 6.2832, q = rad * (k % 2 ? 0.5 + 0.12 * r() : 0.92 + 0.3 * r()); pts.push([Math.cos(a) * q, Math.sin(a) * q]); }
        p.poly(pts, { tone: 0.02, w: 0.7 + R * 0.01, a: 1 - t * 0.4 });
        const pt2 = []; for (let k = 0; k < n * 2; k++) { const a = ph + 0.3 + k / (n * 2) * 6.2832, q = rad * 0.5 * (k % 2 ? 0.5 : 1); pt2.push([Math.cos(a) * q, Math.sin(a) * q]); }
        p.poly(pt2, { paper: false, tone: 0.3 * (1 - t), hatch: { ang: 0.6, gap: 1.1, a: 0.55 * (1 - t) }, w: 0.45, a: 0.8 });
      }
      if (t > 0.2) {
        const m = 4 + ((R / 6) | 0);
        for (let k = 0; k < m; k++) { const a = r() * 6.28, q = rad * (0.35 + 0.6 * r()) * (t < 0.55 ? 0.9 : 1); p.scribble(Math.cos(a) * q, Math.sin(a) * q, R * (0.2 + 0.2 * r()) * (1.3 - t * 0.5), { turns: 1.8, w: 0.45, a: 0.85 * (1.25 - t), jit: 0.3 }); }
      }
      const dn = 6 + ((R / 4) | 0);
      for (let k = 0; k < dn; k++) { const a = r() * 6.28, q0 = rad * (0.95 + 0.2 * r()), q1 = q0 + R * (0.1 + 0.2 * r()); p.seg(Math.cos(a) * q0, Math.sin(a) * q0, Math.cos(a) * q1, Math.sin(a) * q1, { w: 0.4, a: 0.9 * (1.1 - t), passes: 1, noOver: true }); }
    }, { boil: 1, noFill: false, grain: 0.4 });
  }
  DS.BOOM = { s: 6, m: 7, l: 8 };
  for (let i = 0; i < 6; i++) boom('boom_s', 9, 6, i);
  for (let i = 0; i < 7; i++) boom('boom_m', 18, 7, i);
  for (let i = 0; i < 8; i++) boom('boom_l', 34, 8, i);
  def('hit', 12, 12, p => {
    for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.4; p.seg(Math.cos(a) * 1.4, Math.sin(a) * 1.4, Math.cos(a) * 4.8, Math.sin(a) * 4.8, { w: 0.55, a: 0.9, passes: 1 }); }
  }, { noFill: true, boil: 2 });
  def('scorch', 34, 34, p => {
    p.scribble(0, 0, 12, { turns: 4, w: 0.7, a: 0.7, jit: 0.8 }); p.scribble(1, 1, 8, { turns: 3, w: 0.9, a: 0.8, jit: 0.6 });
    for (let i = 0; i < 9; i++) { const a = p.rng() * 6.28; p.seg(Math.cos(a) * 9, Math.sin(a) * 9, Math.cos(a) * 15, Math.sin(a) * 15, { w: 0.35, a: 0.6, passes: 1 }); }
  }, { noFill: true, boil: 1 });

  /* 프로펠러·회전날개 (돌아가는 모습 석 장) */
  def('prop', 22, 22, (p, i) => {
    p.ell(0, 0, 9.4, 9.4, { paper: false, w: 0.3, a: 0.35, passes: 1, jit: 0.2 });
    for (let k = 0; k < 3; k++) { const a = i * 0.7 + k * 2.094; p.poly([[0, 0], [Math.cos(a - 0.22) * 9, Math.sin(a - 0.22) * 9], [Math.cos(a + 0.22) * 9, Math.sin(a + 0.22) * 9]], { paper: false, tone: 0.2, line: false }); }
  }, { noFill: true, boil: 3, grain: 0.35 });
  def('prop6', 22, 22, (p, i) => {      // 신덴의 여섯 날 프로펠러
    p.ell(0, 0, 9.4, 9.4, { paper: false, w: 0.3, a: 0.35, passes: 1, jit: 0.2 });
    for (let k = 0; k < 6; k++) { const a = i * 0.35 + k * 1.0472; p.poly([[0, 0], [Math.cos(a - 0.15) * 9, Math.sin(a - 0.15) * 9], [Math.cos(a + 0.15) * 9, Math.sin(a + 0.15) * 9]], { paper: false, tone: 0.2, line: false }); }
  }, { noFill: true, boil: 3, grain: 0.35 });
  def('rotor', 30, 30, (p, i) => {
    p.ell(0, 0, 13.6, 13.6, { paper: false, w: 0.3, a: 0.3, passes: 1, jit: 0.2 });
    for (let k = 0; k < 2; k++) { const a = i * 1.05 + k * 1.5708; p.seg(Math.cos(a) * -13, Math.sin(a) * -13, Math.cos(a) * 13, Math.sin(a) * 13, { w: 0.7, a: 0.6, passes: 1, noOver: true }); }
  }, { noFill: true, boil: 3, grain: 0.35 });

  def('cloud0', 110, 60, p => cloud(p, 44, 20));
  def('cloud1', 80, 46, p => cloud(p, 30, 15));
  def('cloud2', 140, 70, p => cloud(p, 58, 24));
  function cloud(p, rx, ry) {
    const r = p.lay, n = 13, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * 6.2832, q = 0.82 + 0.3 * r(); pts.push([Math.cos(a) * rx * q, Math.sin(a) * ry * q]); if (r() < 0.8) { const b = a + 3.1416 / n; pts.push([Math.cos(b) * rx * q * 0.86, Math.sin(b) * ry * q * 0.86]); } }
    p.poly(pts, { s: true, w: 0.45, a: 0.55, hatch: { side: 'b', f: 0.62, ang: 0.2, gap: 1.8, a: 0.3 } });
    for (let i = 0; i < 4; i++) p.line([[-rx * 0.5 + r() * rx, -ry * 0.3 + r() * ry * 0.5], [-rx * 0.3 + r() * rx, -ry * 0.4 + r() * ry * 0.5]], { w: 0.3, a: 0.3, passes: 1 });
  }
})();

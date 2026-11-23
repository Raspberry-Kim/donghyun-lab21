/* 그림 등록부 — 모든 그림은 여기서 연필로 그려 미리 만들어 둔다 */
(function () {
  'use strict';
  const DS = window.DS, Pen = DS.Pen, RNG = DS.RNG;
  const ART = DS.ART = { defs: {}, cache: {} };
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  DS.hash = hash;
  function def(name, w, h, fn, o) { ART.defs[name] = { w: w, h: h, fn: fn, o: o || {} }; }
  ART.def = def;
  ART.get = function (name) {
    let s = ART.cache[name];
    if (s) return s;
    const d = ART.defs[name];
    if (!d) throw new Error('그림 없음: ' + name);
    const n = d.o.boil == null ? 2 : d.o.boil, frames = [];
    for (let i = 0; i < n; i++) {
      // 윤곽은 같은 씨앗으로 그리고, 두 번째 장은 선 흔들림만 다르게 한다 (손그림 떨림)
      const pen = new Pen(d.w, d.h, hash(name) + i * 7919, { flipY: d.o.flipY, k: d.o.k, noFill: d.o.noFill, ink: d.o.ink, zoom: d.o.zoom, bold: d.o.bold });
      pen.lay = RNG(hash(name) ^ 0x51ed);
      d.fn(pen, i);
      frames.push(pen.done(d.o.grain));
    }
    s = ART.cache[name] = { name: name, w: d.w, h: d.h, frames: frames, o: d.o };
    return s;
  };
  ART.drop = function (names) { names.forEach(n => { delete ART.cache[n]; }); };
  ART.clear = function () { Object.keys(ART.cache).forEach(n => { ART.cache[n].frames.forEach(f => { f.width = f.height = 0; }); delete ART.cache[n]; }); };      // 종이 색이 바뀌면 모두 다시 그린다

  const SH = (side, f, a, gap, ang) => ({ side: side || 'r', f: f == null ? 0.55 : f, a: a == null ? 0.45 : a, gap: gap || 1.3, ang: ang == null ? -0.95 : ang });

  /* ───────── 주인공 네 기종 (기수가 위) ───────── */
  def('p38', 42, 38, p => {
    p.rect(0, 13.4, 20, 3, { tone: 0.1, hatch: { ang: 0.4, gap: 1.2, a: 0.35 } });
    p.sym([[0, -3.4], [6, -3.6], [12, -2.8], [17.6, -0.8], [18.8, 1.1], [17.2, 2.6], [10, 3.7], [0, 4.3]], { s: true, tone: 0.05, hatch: SH('r', 0.56) });
    p.mir(q => {
      q.poly([[6.1, -10.6], [8.9, -10.6], [9.4, -4], [8.7, 6], [8.1, 15], [6.9, 15], [6.3, 6], [5.6, -4]], { s: true, tone: 0.1, hatch: SH('r', 0.5, 0.5, 1.0) });
      q.ell(7.5, -11.2, 1.35, 1.35, { tone: 0.55, w: 0.35 });
      q.rect(7.5, 15.4, 1.3, 4.2, { tone: 0.35, w: 0.35 });
      q.seg(7.5, -8, 7.5, -2.5, { w: 0.24, a: 0.5, passes: 1 });
      q.seg(12.5, -2, 12.8, 3, { w: 0.22, a: 0.45, passes: 1 });
    });
    p.sym([[0, -13.4], [1.5, -12.4], [2.4, -8], [2.5, 0], [1.8, 5], [0, 6.6]], { s: true, tone: 0.1, hatch: SH('r', 0.5, 0.5, 1.0) });
    p.ell(0, -2.6, 1.45, 3.1, { tone: 0.5, w: 0.35 });
    p.seg(-1.2, -9, 1.2, -9, { w: 0.24, a: 0.6, passes: 1 });
  }, { props: [[-7.5, -12.2, 5], [7.5, -12.2, 5]] });

  def('hayate', 38, 36, p => {
    p.sym([[0, 9.3], [2, 9.1], [6.3, 10.1], [6.8, 11.6], [5.6, 12.7], [0, 12.9]], { s: true, tone: 0.08, hatch: SH('r', 0.6, 0.4, 1.1) });
    p.sym([[0, -5.6], [4, -5.7], [11, -4.3], [16.2, -2.7], [17.2, -1.2], [16.2, 0.3], [9, 1.7], [0, 2.7]], { s: true, tone: 0.05, hatch: SH('r', 0.56) });
    p.mir(q => { q.ell(11.2, -1.5, 1.75, 1.75, { tone: 0.3, w: 0.3 }); q.seg(5, -5, 5.4, 1.6, { w: 0.22, a: 0.45, passes: 1 }); });
    p.sym([[0, -14.6], [1.3, -14], [3, -12.4], [3.2, -8], [2.7, -2], [1.9, 6], [0.9, 13], [0, 15.2]], { s: true, tone: 0.1, hatch: SH('r', 0.5, 0.55, 1.0) });
    p.line([[-3, -9.6], [0, -9.1], [3, -9.6]], { s: true, w: 0.3, a: 0.75 });
    p.ell(0, -1.4, 1.7, 3.7, { tone: 0.5, w: 0.35 });
    p.seg(0, 9, 0, 14.6, { w: 0.5, a: 0.8 });
    p.ell(0, -14.4, 1.2, 1.2, { tone: 0.55, w: 0.3 });
  }, { props: [[0, -15.2, 6.5]] });

  /* 모양은 그대로 두고 0.855배로 줄였다. 좌표는 처음 그림 그대로이고 그림 배율(zoom)로 줄인다.
     선 굵기는 줄지 않고, 선의 떨림은 모양과 함께 준다. 떨림이 줄면 겹친 두 줄이 좁아 보이므로
     펜을 조금 굵게(1.32 → 1.44) 잡아 다른 기체의 윤곽선과 같은 굵기로 맞췄다. 그림 칸 40x36과 맞는 점은 같다 */
  def('pancake', 40, 36, p => {
    p.mir(q => q.poly([[9.5, 6.6], [16.4, 7.8], [17, 10.6], [10.5, 11.2]], { s: true, tone: 0.1, hatch: SH('r', 0.4, 0.4, 1.1) }));
    p.mir(q => { q.poly([[7.6, -13.2], [9.8, -13.2], [10.7, -6], [6.7, -6]], { tone: 0.16 }); q.ell(8.7, -13.8, 1.4, 1.4, { tone: 0.55, w: 0.32 }); });
    p.sym([[0, -8.3], [5, -8.7], [10, -7.5], [13.7, -3], [14.3, 2], [12.1, 7], [7, 10.7], [2.5, 11.7], [0, 11.5]], { s: true, tone: 0.06, hatch: SH('r', 0.52, 0.48, 1.25) });
    p.mir(q => q.poly([[3, -8.3], [6.2, -8.4], [5.7, -6.9], [3.3, -6.8]], { tone: 0.6, w: 0.3 }));
    p.mir(q => q.poly([[4.6, 5.8], [6, 5.8], [6.2, 12.8], [4.8, 12.8]], { tone: 0.32, w: 0.34 }));
    p.sym([[0, -11.2], [1.6, -10.2], [2.1, -6], [1.5, -3], [0, -2.2]], { s: true, tone: 0.45, w: 0.36 });
    p.line([[-9.5, 2], [0, 3.5], [9.5, 2]], { s: true, w: 0.24, a: 0.5, passes: 1 });
    p.line([[-6, -4], [0, -1], [6, -4]], { s: true, w: 0.22, a: 0.4, passes: 1 });
  }, { zoom: 0.855, bold: 1.44, props: [[-7.4385, -12.654, 6.5, 'prop_s'], [7.4385, -12.654, 6.5, 'prop_s']] });

  /* J7W 신덴: 기수의 작은 앞날개, 뒤로 젖힌 주날개, 날개 위의 수직 꼬리 둘, 꼬리 끝의 여섯 날 프로펠러 */
  function shinden(p, g) {      // g: 밑그림(윤곽만)
    const H = (f, a, gap) => g ? null : SH('r', f, a, gap), tn = v => g ? 0 : v;
    p.sym([[0, 0.6], [3, 0.8], [8, 3.4], [16.4, 8.4], [18.6, 10.6], [18, 12.6], [10, 11.4], [3, 11.2], [0, 11.4]], { s: true, tone: tn(0.05), hatch: H(0.56) });
    p.mir(q => { q.poly([[9.3, 5.4], [10.5, 5.4], [10.9, 15.4], [9.6, 15.4]], { tone: tn(0.4), w: 0.34 }); if (!g) q.seg(13.6, 8.2, 16.6, 11.6, { w: 0.22, a: 0.45, passes: 1 }); });
    p.sym([[0, -13.4], [2.2, -13.6], [7.4, -12.4], [7.8, -10.8], [2.2, -10.2], [0, -10.2]], { s: true, tone: tn(0.08), hatch: H(0.6, 0.4, 1.1) });
    p.sym([[0, -17.8], [0.9, -16.6], [1.8, -11], [2.7, -3], [3.3, 5], [3, 10.6], [1.9, 13.4], [0, 14]], { s: true, tone: tn(0.1), hatch: H(0.5, 0.55, 1.0) });
    p.ell(0, -4.2, 1.55, 3.3, { tone: tn(0.5), w: 0.35 });
    if (g) return;
    p.mir(q => q.seg(0.75, -17.2, 0.75, -14.6, { w: 0.3, a: 0.75, passes: 1 }));
    p.mir(q => q.seg(3.1, 4.6, 5, 5.4, { w: 0.5, a: 0.7, passes: 1 }));
    p.seg(-2.6, 9.4, 2.6, 9.4, { w: 0.24, a: 0.55, passes: 1 });
  }
  def('shinden', 42, 40, p => shinden(p, false), { props: [[0, 15.2, 6.2, 6]] });
  def('shin_g', 84, 80, p => p.at(0, 0, 0, q => shinden(q, true), 2), { noFill: true, boil: 3, grain: 0.35 });      // 모아 쏘기: 큰 밑그림
})();

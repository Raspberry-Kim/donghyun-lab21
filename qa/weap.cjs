/* 기체 셋의 샷·모아 쏘기 세 단계·폭탄이 엔진에서 실제로 나가는지 (엔진만, 브라우저 없이) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { window: {}, console, Math, JSON, Object, Array, Number, isFinite, Error, Float32Array, Uint8Array };
ctx.window.DS = { BOOM: { s: 6, m: 7, l: 8 }, ART: { get: () => ({ w: 20, h: 20, frames: [0] }) } }; ctx.document = { createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }) };
vm.createContext(ctx);
for (const f of ['sketch.js', 'data.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx, { filename: f });
const DS = ctx.window.DS; let fail = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
const I = o => Object.assign({ l: 0, r: 0, u: 0, d: 0, ax: 0, ay: 0, tdx: 0, tdy: 0, shot: false, charge: false, shotEdge: false, bombEdge: false }, o);
const step = (g, n, o) => { for (let i = 0; i < n; i++) g.update(I(o)); };
const HOLD = [[29, 0], [30, 1], [71, 1], [72, 2], [119, 2], [120, 3], [400, 3]];
DS.PLANES.forEach((pl, plane) => {
  const fresh = power => { const g = new DS.Game({ plane, diff: 0, stage: 0, lives: 9, bombs: 5, power, god: true }); step(g, 200, {}); return g; };
  [0, 1, 2, 3].forEach(pw => { const g = fresh(pw); step(g, 2, { shot: true }); ok(g.shots.length > 0, pl.short + ' 힘 ' + (pw + 1) + ': 샷 ' + g.shots.length + '발'); });
  const res = HOLD.map(([n, want]) => {
    const g = fresh(0); step(g, n, { charge: true });
    const held = g.shots.length; step(g, 1, {});
    const lv = pl.id === 'hayate' ? (g.beam ? g.beam.lv : 0) : pl.id === 'p38' ? ({ 0: 0, 4: 1, 7: 2, 10: 3 })[g.shots.filter(s => s.kind === 'rk').length] : Math.max(0, g.shots.filter(s => s.kind === 'disc').length - 1);
    return { n, want, lv, held };
  });
  ok(res.every(r => r.lv === r.want && r.held === 0), pl.short + ' 모아 쏘기: ' + res.map(r => r.n + '걸음→' + r.lv + '단계').join(' · '));
  const g = fresh(0); g.bullets.push({ x: 20, y: 20, vx: 0, vy: 0, bt: 's', r: 2.7, a: 0, t: 0 });
  step(g, 1, { bombEdge: true });
  ok(g.pl.bombs === 4 && g.bombT > 0 && g.bullets.length === 0 && g.pl.inv >= 189, pl.short + ' 폭탄: 5→' + g.pl.bombs + ', 적탄 지움, 무적 ' + g.pl.inv + '걸음');
  step(g, 1, { bombEdge: true }); ok(g.pl.bombs === 4, pl.short + ' 폭탄이 나가는 동안에는 다시 쓰지 않는다');
});
console.log(fail ? fail + ' FAILED' : 'all ok'); process.exit(fail ? 1 : 0);

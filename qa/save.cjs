/* 저장 → 불러오기 뒤에도 판이 똑같이 흘러가는지 (엔진만, 브라우저 없이) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { window: {}, console, Math, JSON, Object, Array, Number, isFinite, Error, Float32Array, Uint8Array };
ctx.window.DS = { BOOM: { s: 6, m: 7, l: 8 }, ART: { get: () => ({ w: 20, h: 20, frames: [0] }) } }; ctx.document = { createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }) };
vm.createContext(ctx);
for (const f of ['sketch.js', 'data.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx, { filename: f });
const DS = ctx.window.DS, W = DS.W, H = DS.H;
function pilot(g, sloppy) {           // 단순한 자동 조종: 판 상태만 보고 정한다 (원본·복원본이 같은 입력을 받게)
  const p = g.pl, o = { l: 0, r: 0, u: 0, d: 0, ax: 0, ay: 0, tdx: 0, tdy: 0, shot: true, charge: false, shotEdge: g.t % 20 === 0, bombEdge: false };
  let tx = W / 2; const E = g.enemies; let best = -1e9;
  for (const e of E) { if (e.dead || e.dying || e.y < 0 || e.y > p.y - 24) continue; const v = e.y - Math.abs(e.x - p.x) * 0.5 + (e.boss ? 60 : 0); if (v > best) { best = v; tx = e.x; } }
  let dg = 0, away = 0;
  for (const b of g.bullets) { const ex = b.x + b.vx * 8 - p.x, ey = b.y + b.vy * 8 - p.y; if (ex * ex + ey * ey < 400) { dg++; away += ex < 0 ? 1 : -1; } }
  if (dg) { if (away > 0) o.r = 1; else o.l = 1; } else if (tx < p.x - 3) o.l = 1; else if (tx > p.x + 3) o.r = 1;
  if (p.y > H - 60) o.u = 1;
  const c = g.t % 300; o.charge = c > 60 && c < 190;
  if (!sloppy && dg > 3 && p.bombs > 0 && g.bombT <= 0 && p.inv <= 0) o.bombEdge = true;
  if (g.t % 700 === 350) o.bombEdge = true;
  return o;
}
function drive(g, n) {
  for (let i = 0; i < n; i++) {
    if (g.mode === 'next') { if (g.stage < DS.STAGES.length - 1) g.startStage(g.stage + 1); else return 'end'; }
    else if (g.mode === 'over') g.cont();
    g.update(pilot(g));
  }
}
let fails = 0, checks = 0, modes = {}, sawBoss = 0, sawTimer = 0, sawPart = 0, sawBomb = 0, sawBeam = 0, sawWing = 0, sawHome = 0, sawStick = 0, sawGhost = 0;
for (let plane = 0; plane < DS.PLANES.length; plane++) for (let diff = 0; diff < 3; diff++) for (let stage = 0; stage < 5; stage++) {
  const g = new DS.Game({ plane, diff, stage, lives: 9, bombs: 5, power: (plane + stage) % 4 });
  for (let seg = 0; seg < 14; seg++) {
    if (drive(g, 331 + seg * 53) === 'end') break;
    if (['intro', 'play', 'clear'].indexOf(g.mode) < 0) continue;
    const data = g.save(), txt = JSON.stringify(data);
    const g2 = DS.Game.load(JSON.parse(txt), {});
    modes[g.mode] = (modes[g.mode] || 0) + 1; if (g.boss) sawBoss++; if (g.timers.length) sawTimer++; if (g.enemies.some(e => e.type === 'part')) sawPart++; if (g.bombT > 0) sawBomb++; if (g.beam) sawBeam++; if (g.wings.length) sawWing++; if (g.shots.some(s => s.tg)) sawHome++; if (g.shots.some(s => s.stuck)) sawStick++; if (g.shots.some(s => s.kind === 'gh')) sawGhost++;
    const again = JSON.stringify(g2.save());
    checks++;
    if (again !== txt) { fails++; console.log('저장본이 다르다', plane, diff, stage, seg); const A = JSON.parse(txt), B = JSON.parse(again); for (const k in A) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) { const x = JSON.stringify(A[k]), y = JSON.stringify(B[k]); let i = 0; while (x[i] === y[i]) i++; console.log('  다른 항목:', k, x.slice(Math.max(0, i - 200), i + 120), '|', y.slice(Math.max(0, i - 60), i + 120)); } continue; }
    /* 복원본과 원본을 600걸음 나란히 돌린다 (원본은 그대로 이어 간다) */
    const a = DS.Game.load(JSON.parse(txt), {}); let ok = true;
    for (let i = 0; i < 600 && ok; i++) {
      for (const q of [a, g2]) { if (q.mode === 'next') { if (q.stage < DS.STAGES.length - 1) q.startStage(q.stage + 1); } else if (q.mode === 'over') q.cont(); }
      if (a.mode === 'next') break;
      a.update(pilot(a)); g2.update(pilot(g2));
    }
    /* 원본 g도 같은 600걸음 */
    const g3 = g; let st = true;
    for (let i = 0; i < 600; i++) { if (g3.mode === 'next') { if (g3.stage < DS.STAGES.length - 1) g3.startStage(g3.stage + 1); else break; } else if (g3.mode === 'over') g3.cont(); if (g3.mode === 'next') break; g3.update(pilot(g3)); }
    const t1 = g3.text(), t2 = g2.text(), s1 = JSON.stringify(g3.save()), s2 = JSON.stringify(g2.save());
    if (t1 !== t2 || s1 !== s2) { fails++; console.log('흐름이 갈렸다', { plane, diff, stage, seg, mode: data.mode, boss: !!data.boss }); if (fails < 3) { const A = JSON.parse(s1), B = JSON.parse(s2); for (const k in A) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) console.log('  다른 항목:', k, JSON.stringify(A[k]).slice(0, 160), '|', JSON.stringify(B[k]).slice(0, 160)); } }
  }
}
/* 망가진 저장본은 받지 않는다 */
const g0 = new DS.Game({ plane: 0, diff: 0 }); for (let i = 0; i < 400; i++) g0.update(pilot(g0));
const good = g0.save(); let rejected = 0; const bads = [null, {}, Object.assign({}, good, { planeIdx: 7 }), Object.assign({}, good, { stage: 9 }), Object.assign({}, good, { mode: 'over' }), Object.assign({}, good, { enemies: 'x' }), Object.assign({}, good, { pl: null }), Object.assign({}, good, { life0: 0 }), Object.assign({}, good, { rng: 'a' })];
bads.forEach(b => { try { DS.Game.load(b, {}); } catch (e) { rejected++; } });
if (rejected !== bads.length) { fails++; console.log('망가진 저장본을 받았다', rejected, bads.length); }
console.log(JSON.stringify({ checks, fails, modes, sawBoss, sawTimer, sawPart, sawBomb, sawBeam, sawWing, sawHome, sawStick, sawGhost, rejected, bytes: JSON.stringify(good).length }));
process.exit(fails ? 1 : 0);

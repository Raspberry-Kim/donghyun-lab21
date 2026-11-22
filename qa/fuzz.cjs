/* 마구 누르는 입력으로 일곱 스테이지를 돌려 본다 (엔진만, 브라우저 없이).
   생명 1·폭탄 0으로 자주 떨어지게 하고, 게임 오버가 되면 이어 한다.
   보는 것: 예외 · 숫자가 아닌 좌표 · 더 나아가지 못하고 멈춘 판 · 한없이 쌓이는 목록 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { window: {}, console, Math, JSON, Object, Array, Number, isFinite, Error, Float32Array, Uint8Array };
ctx.window.DS = { BOOM: { s: 6, m: 7, l: 8 }, ART: { get: () => ({ w: 20, h: 20, frames: [0] }) } }; ctx.document = { createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }) };
vm.createContext(ctx);
for (const f of ['sketch.js', 'data.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx, { filename: f });
const DS = ctx.window.DS; let fail = 0;
const RUNS = +(process.argv[2] || 18), LIMIT = 60 * 60 * 8;            // 스테이지 하나에 8분이 넘으면 멈춘 것으로 본다
function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const out = [];
for (let run = 0; run < RUNS; run++) {
  const r = rnd(run * 7919 + 13), plane = run % DS.PLANES.length, diff = ((run / DS.PLANES.length) | 0) % 3, lives = 1 + (run % 2), bombs = run % 3 === 0 ? 0 : 1;
  const g = new DS.Game({ plane, diff, stage: 0, lives, bombs });
  const inp = { l: 0, r: 0, u: 0, d: 0, ax: 0, ay: 0, tdx: 0, tdy: 0, shot: true, charge: false, shotEdge: false, bombEdge: false };
  let why = '', stageT = 0, idle = 0, lastSt = -1, steps = 0, overs = 0, stages = 0, maxLen = 0;
  try {
    for (; ;) {
      steps++; stageT++;
      if (steps % 9 === 0) { inp.l = r() < 0.35; inp.r = !inp.l && r() < 0.5; inp.u = r() < 0.3; inp.d = !inp.u && r() < 0.35; }
      if (steps % 50 === 0) inp.charge = r() < 0.3;
      inp.shotEdge = r() < 0.05; inp.bombEdge = r() < 0.004;
      if (r() < 0.002 && (g.mode === 'play' || g.mode === 'intro')) { const d = g.save(); const h = DS.Game.load(d, {}); const a = JSON.stringify(g.save()), b = JSON.stringify(h.save()); if (a !== b) { why = '저장하고 불러온 판이 다르다'; break; } }
      g.update(inp);
      if (g.mode === 'over') { if (g.modeT > 60) { g.cont(); overs++; } continue; }
      if (g.mode === 'next') { stages++; if (g.stage >= DS.STAGES.length - 1) break; g.startStage(g.stage + 1); stageT = 0; idle = 0; continue; }
      const p = g.pl;
      if (!isFinite(p.x) || !isFinite(p.y)) { why = '기체 좌표가 숫자가 아니다'; break; }
      for (const e of g.enemies) if (!isFinite(e.x) || !isFinite(e.y) || !isFinite(e.hp)) { why = '적 좌표가 숫자가 아니다 (' + e.type + ')'; break; }
      if (why) break;
      for (const k of ['enemies', 'shots', 'bullets', 'items', 'fx', 'pops', 'decals', 'clouds', 'timers']) { if (g[k].length > maxLen) maxLen = g[k].length; if (g[k].length > 900) { why = k + ' 목록이 ' + g[k].length + '개까지 쌓였다'; break; } }
      if (why) break;
      // 시간표도 멈췄고 보스도 예고도 없는데 판이 계속 play면 멈춘 것
      if (g.mode === 'play' && g.st === lastSt && !g.boss && g.warn <= 0) idle++; else idle = 0; lastSt = g.st;
      if (idle > 600) { why = '시간표가 멈춘 채 보스도 없다 (스테이지 ' + (g.stage + 1) + ', st ' + g.st + ')'; break; }
      if (stageT > LIMIT) { why = '스테이지 ' + (g.stage + 1) + '이(가) 8분 넘게 끝나지 않는다 (mode ' + g.mode + ', boss ' + (g.boss ? g.boss.type + ' hp ' + Math.round(g.boss.hp) : '없음') + ')'; break; }
    }
  } catch (e) { why = '예외: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | '); }
  const ok = !why && stages === DS.STAGES.length; if (!ok) fail++;
  out.push((ok ? 'ok   ' : 'FAIL ') + DS.PLANES[plane].short + ' ' + DS.DIFFS[diff].name + ' 생명 ' + lives + ' 폭탄 ' + bombs + ': ' + stages + '스테이지 · ' + Math.round(steps / 60) + '초 · 이어 하기 ' + overs + '번 · 가장 긴 목록 ' + maxLen + (why ? ' · ' + why : ''));
}
console.log(out.join('\n')); console.log(fail ? fail + ' FAILED' : 'all ok'); process.exit(fail ? 1 : 0);

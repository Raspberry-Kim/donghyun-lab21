/* 맞는 범위가 그림과 어긋나지 않는지: 보스·포탑·보통 적의 상자를 그림의 연필 자국과 견준다.
   상자가 그림 밖으로 나가 있으면 내 탄이 닿기 전에 사라져 보인다(v0.01의 전함). */
const { launch } = require('./launch.cjs');
const URL = process.env.DS_URL || 'http://127.0.0.1:8765/';
const VERBOSE = process.argv.includes('-v');
(async () => {
  const b = await launch('chromium'); const pg = await b.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(URL); await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const rows = await pg.evaluate(() => {
    const S = DS.S, out = [];
    function mask(name) {
      const s = DS.ART.get(name), f = s.frames[0], c = document.createElement('canvas'); c.width = f.width; c.height = f.height;
      const g = c.getContext('2d'); g.drawImage(f, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
      const w = s.w, h = s.h, m = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let n = 0; for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (d[((y * S + j) * c.width + x * S + i) * 4 + 3] > 60) n++; m[y * w + x] = n * 2 >= S * S ? 1 : 0; }
      return { w, h, m };
    }
    function check(kind, name, spr, boxes) {
      const M = mask(spr), cx = M.w / 2, cy = M.h / 2;
      boxes.forEach((bx, bi) => {
        const x0 = Math.round(cx + bx[0] - bx[2]), x1 = Math.round(cx + bx[0] + bx[2]), y0 = Math.round(cy + bx[1] - bx[3]), y1 = Math.round(cy + bx[1] + bx[3]);
        let ink = 0, tot = 0, lowest = -1, highest = 1e9, left = 1e9, right = -1;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { tot++; if (x < 0 || y < 0 || x >= M.w || y >= M.h) continue; if (M.m[y * M.w + x]) ink++; }
        // 상자가 걸친 세로줄에서 그림의 가장 아래·위, 가로줄에서 가장 왼쪽·오른쪽
        for (let x = Math.max(0, x0); x < Math.min(M.w, x1); x++) for (let y = 0; y < M.h; y++) if (M.m[y * M.w + x]) { if (y > lowest) lowest = y; if (y < highest) highest = y; }
        for (let y = Math.max(0, y0); y < Math.min(M.h, y1); y++) for (let x = 0; x < M.w; x++) if (M.m[y * M.w + x]) { if (x < left) left = x; if (x > right) right = x; }
        // 아래쪽 줄(내 탄이 먼저 닿는 곳) 4칸에서 그림이 차 있는 정도
        let bInk = 0, bTot = 0; for (let y = y1 - 4; y < y1; y++) for (let x = x0; x < x1; x++) { bTot++; if (x >= 0 && y >= 0 && x < M.w && y < M.h && M.m[y * M.w + x]) bInk++; }
        out.push({ kind, name, spr, bi, box: bx, size: [M.w, M.h], cover: ink / tot, bottomCover: bInk / bTot, over: { bottom: y1 - (lowest + 1), top: highest - y0, left: left - x0, right: x1 - (right + 1) } });
      });
    }
    Object.keys(DS.BOSSES).forEach(k => { const d = DS.BOSSES[k]; check('boss', k + ' ' + d.name, d.spr, d.boxes); });
    Object.keys(DS.ENEMIES).forEach(k => { const d = DS.ENEMIES[k]; check('enemy', k, d.spr, [[0, 0, d.hw, d.hh]]); });
    [['bt_l', 9], ['bt_s', 6], ['gun_t', 6]].forEach(q => check('part', q[0], q[0], [[0, 0, q[1], q[1]]]));
    return out;
  });
  /* 아래에서 곧게 쏜 탄이 보스 그림에 닿는 자리: 탄 끝과 그 세로줄의 그림 아래 끝 사이 틈 (양수면 닿기 전에 사라진다) */
  const reach = await pg.evaluate(() => {
    const S = DS.S, out = [];
    Object.keys(DS.BOSSES).forEach(name => {
      const d = DS.BOSSES[name], s = DS.ART.get(d.spr), f = s.frames[0], c = document.createElement('canvas'); c.width = f.width; c.height = f.height;
      const cg = c.getContext('2d'); cg.drawImage(f, 0, 0); const px = cg.getImageData(0, 0, c.width, c.height).data;
      const low = dx => { const x = Math.round(s.w / 2 + dx); if (x < 0 || x >= s.w) return null; for (let y = s.h - 1; y >= 0; y--) { let n = 0; for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (px[((y * S + j) * c.width + x * S + i) * 4 + 3] > 60) n++; if (n * 2 >= S * S) return y + 1 - s.h / 2; } return null; };
      const g = new DS.Game({ plane: 1, diff: 1, stage: 0, lives: 3, bombs: 0 });
      g.enemies.length = 0; const e = g.spawnBoss(name, false); e.y = d.ty; e.arrived = true; g.enemies.forEach(q => { if (q.parent) q.dead = true; });
      let worst = -1e9, deep = 1e9, hit = 0, pass = 0, cols = 0, at = 0;
      for (let dx = -s.w / 2 + 1; dx < s.w / 2; dx += 2) {
        let lw = null; for (let k = -3; k <= 3; k++) { const v = low(dx + k); if (v != null && (lw == null || v > lw)) lw = v; }      // 탄의 너비(반너비 3칸) 안에서 가장 아래까지 내려온 그림
        if (lw == null) continue; cols++;
        for (let ph = 0; ph < 4; ph++) {            // 걸음마다 8.6칸씩 가므로 출발 높이를 조금씩 달리해 본다
          g.shots.length = 0; const sh = g.shot(e.x + dx, 318 - ph * 2.15, 0, -8.6, 0.0001, 'ps_a'); let tip = null;
          for (let k = 0; k < 80 && g.shots.length; k++) { g.updShots(); if (sh.hit) { tip = sh.y - sh.hh; break; } }
          if (tip == null) { if (g.shots.indexOf(sh) < 0 && sh.y > -10) tip = sh.y - sh.hh; }      // 되돌리지 않고 바로 지운 경우
          if (tip == null) { pass++; continue; }
          hit++; const gap = tip - (e.y + lw); if (gap > worst) { worst = gap; at = dx; } if (gap < deep) deep = gap;
        }
      }
      out.push({ name: name + ' ' + d.name, cols, hit, pass, worst: hit ? +worst.toFixed(1) : null, at, deep: hit ? +deep.toFixed(1) : null });
    });
    return out;
  });
  let fail = 0;
  reach.forEach(r => {
    const bad = r.hit === 0 || r.worst > 2.5;
    if (bad) fail++;
    if (bad || VERBOSE) console.log((bad ? 'FAIL ' : 'ok   ') + '닿는 자리 ' + r.name + ': 맞은 탄 ' + r.hit + ' · 지나간 탄 ' + r.pass + ' · 그림 앞에서 가장 멀리 멈춘 틈 ' + r.worst + '칸(x ' + r.at + ') · 그림 안으로 가장 깊이 ' + (-r.deep) + '칸');
  });
  rows.forEach(r => {
    const o = r.over, lim = r.kind === 'boss' ? 2 : 3, rotating = r.kind === 'part' || (r.kind === 'enemy');
    // 보스: 상자가 그림 아래로 2칸 넘게 나가면 안 되고, 아래 4칸 줄의 절반 이상이 그림이어야 한다
    const bad = r.kind === 'boss' ? (o.bottom > lim || o.top > 6 || o.left > 4 || o.right > 4 || r.bottomCover < 0.5 || r.cover < 0.6) : (o.bottom > 4 || o.top > 4 || o.left > 4 || o.right > 4 || r.cover < 0.4);
    if (bad) fail++;
    if (bad || VERBOSE) console.log((bad ? 'FAIL ' : 'ok   ') + r.kind + ' ' + r.name + ' #' + r.bi + ' [' + r.box + '] 그림 ' + r.size.join('x') + ' · 덮임 ' + r.cover.toFixed(2) + ' · 아래 줄 ' + r.bottomCover.toFixed(2) + ' · 넘침 아래 ' + o.bottom + ' 위 ' + o.top + ' 왼 ' + o.left + ' 오 ' + o.right);
  });
  console.log(rows.length + ' boxes, ' + fail + ' failed'); console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();

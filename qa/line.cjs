// node qa/line.cjs [engine] -- 줄여 그린 팬케이크의 선이 가늘어지거나 흐려지지 않았는지 본다
// v0.41은 좌표를 0.9배로 줄여 다시 그렸다. 펜 굵기는 그대로였지만 떨림은 줄지 않아 윤곽이 거칠어졌고, 프로펠러 그림은 통째로 줄여 붙여 선이 가늘어졌다.
// v0.42는 처음 그림(좌표 · 난수 그대로)을 그림 배율(zoom 0.855)로 줄이고 선 굵기는 배율만큼 되돌린다.
// 1) 기체 넷의 선만 따로 받아(윤곽선: 굵기 0.45 이상, 세부 선: 그보다 가는 선) 길이당 잉크와 선 굵기를 잰다.
// 2) 팬케이크를 배율 없이(처음 크기 · 처음 펜) 다시 그려 같은 브라우저에서 견준다: 처음보다 가늘지 않고, 다른 기체보다 굵지 않아야 한다.
// 3) 모양: 처음 그림을 0.855배로 줄여 겹쳐 본다. 프로펠러도 같은 칸에 0.855배로 그려졌는지 본다.
const { launch } = require('./launch.cjs');
(async () => {
  const engine = process.argv[2] || 'chromium', URL = process.env.DS_URL || 'http://127.0.0.1:8765/index.html', Z = 0.855;
  const b = await launch(engine); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  let fail = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(URL); await p.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const r = await p.evaluate(() => {
    const DS = window.DS, P = DS.Pen.prototype, S = DS.S, o_stroke = P._stroke, o_done = P.done; let cur = null;
    P._stroke = function (d, o, closed) {
      if (!cur) return o_stroke.call(this, d, o, closed);
      if (!this.cls) { this.cls = {}; ['out', 'det'].forEach(k => { const c = document.createElement('canvas'); c.width = this.gc.width; c.height = this.gc.height; const x = c.getContext('2d'); x.setTransform(this.g.getTransform()); x.lineCap = 'round'; x.lineJoin = 'round'; this.cls[k] = { c: c, x: x, len: 0 }; }); }
      const q = this.cls[(o.w || 0.5) >= 0.45 ? 'out' : 'det'];
      let L = 0; for (let i = 1; i < d.length; i++) L += Math.hypot(d[i][0] - d[i - 1][0], d[i][1] - d[i - 1][1]);
      if (closed) L += Math.hypot(d[0][0] - d[d.length - 1][0], d[0][1] - d[d.length - 1][1]);
      q.len += L * (this.zoom || 1);
      const g = this.g; this.g = q.x; o_stroke.call(this, d, o, closed); this.g = g;      // 선만 따로 받는다(난수 흐름은 그대로)
    };
    P.done = function (k) {
      if (cur && this.cls) { const m = {}; for (const n in this.cls) { const q = this.cls[n], id = q.x.getImageData(0, 0, q.c.width, q.c.height).data; let sum = 0, core = 0; for (let i = 3; i < id.length; i += 4) { const a = id[i] / 255; sum += a; if (a > 0.4) core++; } m[n] = { ink: sum / S / S / q.len, core: core / S / S / q.len }; } cur.push(m); }
      return o_done.call(this, k);
    };
    const lines = n => { DS.ART.drop([n]); cur = []; DS.ART.get(n); const m = cur; cur = null; DS.ART.drop([n]); const av = (c, f) => m.reduce((a, x) => a + x[c][f], 0) / m.length; return { oi: av('out', 'ink'), oc: av('out', 'core'), di: av('det', 'ink'), dc: av('det', 'core') }; };
    const out = { planes: {} };
    ['p38', 'hayate', 'shinden', 'pancake'].forEach(n => { out.planes[n] = lines(n); });
    const d = DS.ART.defs.pancake, o = d.o; out.opt = { zoom: o.zoom, bold: o.bold, props: o.props };
    d.o = Object.assign({}, o, { zoom: 1, bold: undefined }); out.first = lines('pancake'); d.o = o;
    P._stroke = o_stroke; P.done = o_done;

    // 모양: 처음 그림을 줄여 겹친다
    const mask = (f, z) => { const c = document.createElement('canvas'); c.width = f.width; c.height = f.height; const x = c.getContext('2d'); x.translate(c.width / 2, c.height / 2); x.scale(z, z); x.drawImage(f, -f.width / 2, -f.height / 2); const id = x.getImageData(0, 0, c.width, c.height).data, m = new Uint8Array(c.width * c.height); let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let i = 0; i < m.length; i++) if (id[i * 4 + 3] > 127) { m[i] = 1; const px = i % c.width, py = (i / c.width) | 0; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; } return { m: m, w: (x1 - x0 + 1) / S, h: (y1 - y0 + 1) / S }; };
    const shape = (name, o1, z) => { const dd = DS.ART.defs[name], oo = dd.o; DS.ART.drop([name]); const now = mask(DS.ART.get(name).frames[0], 1); DS.ART.drop([name]); dd.o = Object.assign({}, oo, o1); const a = DS.ART.get(name).frames[0], full = mask(a, 1), small = mask(a, z); DS.ART.drop([name]); dd.o = oo; let inter = 0, uni = 0; for (let i = 0; i < now.m.length; i++) { if (now.m[i] && small.m[i]) inter++; if (now.m[i] || small.m[i]) uni++; } return { w: now.w, h: now.h, w0: full.w, h0: full.h, iou: inter / uni }; };
    out.body = shape('pancake', { zoom: 1, bold: undefined }, 0.855);
    const ring = n => { const f = DS.ART.get(n).frames[0], x = f.getContext('2d'), id = x.getImageData(0, 0, f.width, f.height).data; let x0 = 1e9, x1 = -1; for (let i = 0; i < f.width * f.height; i++) if (id[i * 4 + 3] > 20) { const px = i % f.width; if (px < x0) x0 = px; if (px > x1) x1 = px; } return (x1 - x0 + 1) / S; };
    out.prop = ring('prop'); out.prop_s = DS.ART.defs.prop_s ? ring('prop_s') : 0; out.propZoom = DS.ART.defs.prop_s ? DS.ART.defs.prop_s.o.zoom : 0;
    return out;
  });
  const f3 = v => v.toFixed(3), P = r.planes, pk = P.pancake, others = ['p38', 'hayate', 'shinden'];
  for (const n of others.concat(['pancake'])) console.log('     ' + n.padEnd(8) + ' 윤곽선: 길이당 잉크 ' + f3(P[n].oi) + ' · 굵기 ' + f3(P[n].oc) + '칸   세부 선: 길이당 잉크 ' + f3(P[n].di) + ' · 굵기 ' + f3(P[n].dc) + '칸');
  console.log('     처음 팬케이크(배율 없이 다시 그림) 윤곽선: ' + f3(r.first.oi) + ' · ' + f3(r.first.oc) + '칸   세부 선: ' + f3(r.first.di) + ' · ' + f3(r.first.dc) + '칸');
  const mx = k => Math.max.apply(null, others.map(n => P[n][k]));
  ok(r.opt.zoom === Z, '팬케이크 그림 배율 ' + r.opt.zoom + ' · 펜 굵기 ' + r.opt.bold);
  for (const [k, nm] of [['oi', '윤곽선 길이당 잉크'], ['oc', '윤곽선 굵기'], ['di', '세부 선 길이당 잉크'], ['dc', '세부 선 굵기']]) {
    ok(pk[k] >= r.first[k] * 0.995, nm + ': 처음 팬케이크보다 가늘지 않다 (' + f3(pk[k]) + ' ≥ ' + f3(r.first[k]) + ')');
    ok(pk[k] <= mx(k) * 1.02, nm + ': 다른 기체보다 굵지 않다 (' + f3(pk[k]) + ' ≤ ' + f3(mx(k)) + ')');
  }
  const B = r.body;
  ok(Math.abs(B.w / B.w0 - Z) < 0.02 && Math.abs(B.h / B.h0 - Z) < 0.025, '크기: 폭 ' + B.w0.toFixed(1) + ' → ' + B.w.toFixed(1) + '칸 (' + (B.w / B.w0).toFixed(3) + '배) · 높이 ' + B.h0.toFixed(1) + ' → ' + B.h.toFixed(1) + '칸 (' + (B.h / B.h0).toFixed(3) + '배)');
  ok(B.iou > 0.95, '모양: 처음 그림을 0.855배로 줄인 것과 ' + (B.iou * 100).toFixed(1) + '% 겹친다');
  const pr = r.opt.props || [];
  ok(pr.length === 2 && pr.every(q => q[3] === 'prop_s' && q[2] === 6.5 && Math.abs(Math.abs(q[0]) - 8.7 * Z) < 0.01 && Math.abs(q[1] + 14.8 * Z) < 0.01), '프로펠러 둘: 자리 ' + JSON.stringify(pr.map(q => [q[0], q[1]])) + ' · 같은 칸(반지름 6.5)에 작게 그린 그림을 쓴다');
  ok(r.propZoom === Z && Math.abs(r.prop_s / r.prop - Z) < 0.03, '프로펠러 그림: 지름 ' + r.prop.toFixed(1) + ' → ' + r.prop_s.toFixed(1) + '칸 (' + (r.prop_s / r.prop).toFixed(3) + '배), 통째로 줄여 붙이지 않는다');

  // 실제 화면: 팬케이크로 출전해 몇 초 날아 본다
  const g = await ctx.newPage(); g.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await g.goto(URL + '?auto=1&god=1&stage=1&diff=1&plane=0'); await g.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  for (let i = 0; i < 8; i++) await g.evaluate(() => window.advanceTime(1000));
  const st = await g.evaluate(() => JSON.parse(window.render_game_to_text()));
  ok(st.game && st.game.mode === 'play', '팬케이크로 스테이지 1을 8초 날았다 (' + (st.game ? st.game.mode : '-') + ')');
  await g.close(); await p.close();
  console.log(engine + ': ' + (fail ? fail + ' FAILED' : 'all ok') + ' · ' + (errs.length ? errs.slice(0, 5).join('\n') : 'no errors'));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();

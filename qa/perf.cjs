// node qa/perf.cjs [engine] -- 실제 시간으로 돌려 한 장면을 만드는 데 걸리는 시간
const PW = require('/home/user/node_modules/playwright');
(async () => {
  const eng = process.argv[2] || 'chromium';
  const b = await PW[eng].launch();
  for (const vp of [{ width: 1280, height: 1100, deviceScaleFactor: 2 }, { width: 390, height: 844, deviceScaleFactor: 3, hasTouch: true, isMobile: eng !== 'firefox' }]) {
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, ...(vp.hasTouch && eng !== 'firefox' ? { hasTouch: true, isMobile: true } : {}) });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const t0 = Date.now(); await p.goto((process.env.DS_URL || 'http://127.0.0.1:8765/index.html') + '?auto=1&debug=1&stage=7&power=3&diff=2');
    await p.waitForFunction(() => document.body.classList.contains('ready')); const ready = Date.now() - t0;
    let mx = { step: 0, draw: 0 }, mn = 999, out = [];
    for (let i = 0; i < 12; i++) { await p.waitForTimeout(2000); const s = await p.evaluate(() => ({ ...DS.app.st, t: DS.app.g ? DS.app.g.t : 0, b: DS.app.g ? DS.app.g.bullets.length : 0 })); mx.step = Math.max(mx.step, s.step); mx.draw = Math.max(mx.draw, s.draw); if (i > 0) mn = Math.min(mn, s.fps); out.push(s.fps.toFixed(0)); }
    const s = await p.evaluate(() => ({ t: DS.app.g.t, mode: DS.app.g.mode }));
    console.log(eng, vp.width + 'x' + vp.height + '@' + vp.deviceScaleFactor, 'ready ms', ready, 'fps', out.join(' '), 'min', mn.toFixed(0), 'step ms max(avg)', mx.step.toFixed(2), 'draw ms max(avg)', mx.draw.toFixed(2), 'game steps in 24s', s.t, errs.join(' '));
    await ctx.close();
  }
  await b.close();
})();

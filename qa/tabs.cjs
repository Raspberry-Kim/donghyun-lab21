/* 탭·휴대폰·어두운 화면 캡처: node qa/tabs.cjs [engine] */
const pw = require('/home/user/node_modules/playwright');
(async () => {
  const eng = process.argv[2] || 'chromium';
  const b = await pw[eng].launch();
  const errs = [];
  for (const [name, vp, mob] of [['desk', { width: 1280, height: 900 }, false], ['phone', { width: 390, height: 780 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: mob, isMobile: mob && eng !== 'firefox', deviceScaleFactor: mob ? 2 : 1 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    await p.goto((process.env.DS_URL || 'http://127.0.0.1:8765/index.html') + ''); await p.waitForSelector('body.ready', { timeout: 60000 });
    await p.screenshot({ path: `qa/tmp/tab-${eng}-${name}-top.png` });
    for (const t of ['protocol', 'rules', 'math', 'about']) {
      const btn = p.locator(`.tabs button[data-tab="${t}"]`);
      if (!(await btn.count())) { errs.push('no tab ' + t); continue; }
      await btn.click(); await p.waitForTimeout(300);
      await p.screenshot({ path: `qa/tmp/tab-${eng}-${name}-${t}.png`, fullPage: true });
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (ov > 1) errs.push(`${name} ${t}: 가로 넘침 ${ov}px`);
    }
    await p.locator('.tabs button[data-tab="play"]').click();
    await p.locator('#theme').click(); await p.waitForTimeout(300);
    await p.screenshot({ path: `qa/tmp/tab-${eng}-${name}-dark.png`, fullPage: true });
    await ctx.close();
  }
  await b.close();
  console.log(errs.length ? errs.join('\n') : 'no errors');
})();

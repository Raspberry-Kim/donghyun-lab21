// node qa/full.cjs [engine] -- 전체 화면(데스크톱·휴대폰 세로·가로)과 닫기
const PW = require(process.env.PLAYWRIGHT || '/home/user/node_modules/playwright');
(async () => {
  const eng = process.argv[2] || 'chromium'; const b = await PW[eng].launch(); let fail = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
  for (const [name, vp, mob] of [['desk', { width: 1280, height: 800 }, false], ['phone', { width: 390, height: 780 }, true], ['land', { width: 780, height: 390 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, ...(mob && eng !== 'firefox' ? { hasTouch: true, isMobile: true } : {}), deviceScaleFactor: mob ? 2 : 1 });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ' ' + e.message));
    await p.goto('http://127.0.0.1:8765/index.html?god=1&diff=1&plane=1'); await p.waitForSelector('body.ready', { timeout: 60000 });
    ok(await p.isDisabled('#full'), name + ': 출전 전에는 전체 화면 버튼이 꺼져 있다');
    await p.click('#run'); await p.waitForTimeout(300);
    await p.evaluate(() => { const d = window.__donghyuns; window.advanceTime(100); });
    for (const k of ['KeyX', 'KeyX']) { await p.keyboard.down(k); await p.evaluate(() => window.advanceTime(34)); await p.keyboard.up(k); await p.evaluate(() => window.advanceTime(100)); }
    await p.evaluate(() => window.advanceTime(3000));
    const before = await (await p.$('#game')).boundingBox();
    await p.click('#full'); await p.waitForTimeout(500); await p.evaluate(() => window.advanceTime(50));
    const r = await (await p.$('#game')).boundingBox();
    ok(r.x >= -0.5 && r.y >= -0.5 && r.x + r.width <= vp.width + 0.5 && r.y + r.height <= vp.height + 0.5, name + ': 게임 화면이 창 안에 들어온다 ' + [r.x, r.y, r.width, r.height].map(Math.round));
    ok(Math.abs(r.height / r.width - 4 / 3) < 0.02, name + ': 3:4 비율');
    ok(r.height >= before.height - 1 || name !== 'desk', name + ': 원래보다 작아지지 않는다 ' + Math.round(before.height) + '→' + Math.round(r.height));
    const pads = await p.evaluate(() => ['#b-charge', '#b-pause', '#b-bomb'].map(s => { const e = document.querySelector(s), q = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && q.width > 0 && q.left >= 0 && q.right <= innerWidth + 0.5 && q.top >= 0 && q.bottom <= innerHeight + 0.5; }));
    if (mob) ok(pads.every(Boolean), name + ': 화면 버튼 셋이 창 안에 보인다 ' + pads);
    await p.screenshot({ path: `qa/tmp/full-${eng}-${name}.png` });
    await p.keyboard.press('Enter'); await p.evaluate(() => window.advanceTime(50)); await p.screenshot({ path: `qa/tmp/full-${eng}-${name}-menu.png` });
    const mr = await p.evaluate(() => { const q = document.querySelector('#menu').getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom, innerWidth, innerHeight]; });
    ok(mr[0] >= 0 && mr[1] >= 0 && mr[2] <= mr[4] + 0.5 && mr[3] <= mr[5] + 0.5, name + ': 메뉴가 창 안에 들어온다');
    await p.keyboard.press('Escape'); await p.evaluate(() => window.advanceTime(50));
    const closeSel = await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find(x => /전체 화면 닫기/.test(x.textContent + (x.title || '') + (x.getAttribute('aria-label') || '')) && x.offsetParent); return e ? (e.id ? '#' + e.id : '.' + e.className.split(' ')[0]) : null; });
    ok(!!closeSel, name + ': 닫기 버튼이 보인다 ' + closeSel);
    if (closeSel) { await p.click(closeSel); await p.waitForTimeout(400); const a = await (await p.$('#game')).boundingBox(); ok(Math.abs(a.width - before.width) < 2, name + ': 닫으면 원래 크기 ' + Math.round(a.width)); }
    await ctx.close();
  }
  console.log(fail ? fail + ' FAILED' : 'all ok'); console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();

// node qa/screens.cjs [engine] [그림 폴더] -- 여러 화면 크기 · 배율에서 쪽이 깨지지 않는지 본다
// Windows의 125% · 150% 배율, 맥 노트북, 태블릿 세로 · 가로, 휴대폰 넷(좁은 320까지)과 가로로 눕힌 휴대폰. 화면 크기와 배율만 흉내 낸 것이고, 그 기기의 브라우저를 돌린 것은 아니다.
// 본 것: 옆으로 넘치지 않는지, 출전한 뒤 판이 3:4로 화면 안에 드는지, 흰 종이 이름의 ‘북’ · ‘흰’이 손글씨로 나오는지, 게임패드 알림 글이 넘치지 않는지, 흰 종이 · 팬케이크로 출전해 15초, 오류.
const { launch } = require('./launch.cjs');
const SCREENS = [
  ['win-100', 1920, 1080, 1, 0], ['win-125', 1536, 864, 1.25, 0], ['win-150', 1280, 720, 1.5, 0], ['laptop', 1366, 768, 1, 0], ['mac-13', 1440, 900, 2, 0],
  ['tablet', 820, 1180, 2, 1], ['tablet-land', 1180, 820, 2, 1],
  ['phone-320', 320, 640, 2, 2], ['phone-360', 360, 800, 3, 2], ['phone-375', 375, 667, 2, 2], ['phone-430', 430, 932, 3, 2], ['phone-land', 844, 390, 3, 2]
];
(async () => {
  const engine = process.argv[2] || 'chromium', dir = process.argv[3], URL = process.env.DS_URL || 'http://127.0.0.1:8765/index.html';
  const b = await launch(engine); let fail = 0, n = 0; const errs = [];
  const ok = (c, m) => { n++; if (!c) { fail++; console.log('FAIL ' + m); } };
  for (const [name, w, h, dpr, kind] of SCREENS) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, ignoreHTTPSErrors: true, ...(kind ? { hasTouch: true } : {}), ...(kind === 2 && engine !== 'firefox' ? { isMobile: true } : {}) });
    await ctx.addInitScript(() => { window.__pad = null; Object.defineProperty(navigator, 'getGamepads', { value: () => [window.__pad, null, null, null], configurable: true }); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ' PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ' CONSOLE ' + m.text()); });
    await p.goto(URL + '?god=1&diff=1&plane=0'); await p.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
    const over = () => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(await over() <= 1, name + ': 첫 화면이 옆으로 넘친다 ' + await over() + 'px');
    for (const tab of ['protocol', 'rules', 'math', 'about', 'play']) { await p.click('[data-tab="' + tab + '"]'); await p.waitForTimeout(120); const o = await over(); ok(o <= 1, name + ': ' + tab + ' 탭이 옆으로 넘친다 ' + o + 'px'); }
    const same = await p.evaluate(async () => {
      await document.fonts.load('700 40px Gaegu', '동현스'); await document.fonts.load('400 40px Gaegu', '동현스');
      const draw = (ch, font) => { const c = document.createElement('canvas'); c.width = 80; c.height = 80; const g = c.getContext('2d'); g.font = font; g.fillText(ch, 12, 52); return c.toDataURL(); };
      return [...'북흰'].filter(ch => [700, 400].some(wt => draw(ch, wt + ' 40px Gaegu, serif') === draw(ch, wt + ' 40px serif')));
    });
    ok(same.length === 0, name + ': 손글씨로 나오지 않는 글자 ' + same.join(' '));
    await p.selectOption('#example', 'white'); await p.waitForTimeout(250); await p.click('#run'); await p.waitForFunction(() => JSON.parse(window.render_game_to_text()).screen !== 'load', null, { timeout: 60000 });   /* 그림을 미리 그리는 동안은 기다린다 */
    const adv = ms => p.evaluate(m => window.advanceTime(m), ms);
    await adv(200); for (let i = 0; i < 2; i++) { await p.keyboard.down('KeyX'); await adv(34); await p.keyboard.up('KeyX'); await adv(300); }
    for (let i = 0; i < 15; i++) await adv(1000);
    const s = await p.evaluate(() => JSON.parse(window.render_game_to_text()));
    ok(s.game && s.game.mode === 'play' && s.game.plane === 'pancake' && s.paper === '스케치북 흰색', name + ': 출전 15초 뒤 ' + (s.game ? s.game.mode + ' · ' + s.game.plane + ' · ' + s.paper : s.screen));
    await p.evaluate(() => { window.__pad = { id: '8BitDo Pro 2 (STANDARD GAMEPAD Vendor: 057e Product: 2009)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) }; });
    await p.waitForFunction(() => /게임패드/.test(document.querySelector('#status').textContent), null, { timeout: 15000 }).catch(() => { });   /* 패드는 화면을 다시 그릴 때 읽는다 */
    const g = await p.evaluate(() => { const c = document.querySelector('#game'), r = c.getBoundingClientRect(), st = document.querySelector('#status'), sr = st.getBoundingClientRect(); c.scrollIntoView({ block: 'nearest' }); const r2 = c.getBoundingClientRect(); return { w: r.width, h: r.height, l: r2.left, rt: r2.right, vw: document.documentElement.clientWidth, st: st.textContent, sl: sr.left, sr: sr.right, sOver: st.scrollWidth - st.clientWidth }; });
    ok(Math.abs(g.w / g.h - 0.75) < 0.01, name + ': 판이 3:4가 아니다 ' + g.w.toFixed(1) + '×' + g.h.toFixed(1));
    ok(g.l >= -0.5 && g.rt <= g.vw + 0.5 && g.w >= 150, name + ': 판이 화면 밖으로 나간다 ' + JSON.stringify(g));
    ok(/게임패드 연결됨/.test(g.st) && g.sl >= -0.5 && g.sr <= g.vw + 0.5 && g.sOver <= 1, name + ': 게임패드 알림 글이 넘친다 ' + JSON.stringify(g));
    ok(await over() <= 1, name + ': 출전한 뒤 옆으로 넘친다 ' + await over() + 'px');
    if (dir) { await p.screenshot({ path: dir + '/' + engine + '-' + name + '.png' }); }
    console.log('     ' + name + ' ' + w + '×' + h + ' @' + dpr + ' · 판 ' + Math.round(g.w) + '×' + Math.round(g.h));
    await ctx.close();
  }
  console.log(engine + ': 화면 ' + SCREENS.length + '가지 · ' + n + '항목 · ' + (fail ? fail + ' FAILED' : 'all ok') + ' · ' + (errs.length ? errs.slice(0, 6).join('\n') : 'no errors'));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();

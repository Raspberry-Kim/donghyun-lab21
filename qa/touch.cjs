// node qa/touch.cjs -- 휴대폰 크기·손가락 입력 확인 (Chromium 터치 에뮬레이션)
const PW = require(process.env.PLAYWRIGHT || '/home/user/node_modules/playwright');
(async () => {
  const b = await PW.chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  const errs = [], out = []; let fail = 0;
  const ok = (c, m) => { out.push((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto((process.env.DS_URL || 'http://127.0.0.1:8765/index.html') + '?god=1');
  await p.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const adv = ms => p.evaluate(ms => window.advanceTime(ms), ms);
  const st = async () => JSON.parse(await p.evaluate(() => window.render_game_to_text()));
  const box = async () => (await p.$('#game')).boundingBox();
  const L = async (x, y) => { const r = await box(); return { x: r.x + x / 240 * r.width, y: r.y + y / 320 * r.height }; };
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ x: q.x, y: q.y, id: q.id == null ? i : q.id })) });
  const tap = async (x, y) => { await p.evaluate(() => document.querySelector('#game').scrollIntoView({ block: 'center' })); const q = await L(x, y); await touch('touchStart', [{ ...q, id: 9 }]); await adv(50); await touch('touchEnd', [{ ...q, id: 9 }]); await adv(50); };
  const mid = async sel => { const r = await (await p.$(sel)).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), '가로로 넘치지 않는다');
  ok(!(await p.isVisible('#b-bomb')), '출전 전에는 화면 버튼이 없다');
  await p.tap('#run'); await p.waitForTimeout(300); await adv(100);
  let s = await st(); ok(s.screen === 'diff' && s.live, '출전 버튼 → 난이도 고르기');
  let r = await box(); ok(r.width <= 390 && Math.abs(r.height / r.width - 4 / 3) < 0.02, '게임 화면 ' + Math.round(r.width) + '×' + Math.round(r.height) + ' (3:4)');
  ok(await p.isVisible('#b-bomb') && await p.isVisible('#b-charge') && await p.isVisible('#b-pause'), '화면 버튼 셋이 보인다');
  await p.screenshot({ path: 'qa/tmp/touch-0diff.png' });
  await tap(120, 171); s = await st(); ok(s.screen === 'plane' && s.diff === 'child', '눌러서 중급을 골랐다: ' + s.screen + ' ' + s.diff);
  await adv(200); await tap(20, 10); s = await st(); ok(s.screen === 'diff', '← 뒤로'); await tap(120, 171); await adv(100);
  await tap(200, 100); s = await st(); ok(s.screen === 'plane' && s.sel === 2, '기체 한 번 누르면 고르기만: ' + s.sel);
  await p.screenshot({ path: 'qa/tmp/touch-1plane.png' });
  await tap(200, 100); await adv(300); s = await st(); ok(s.screen === 'game' && s.game.plane === 'p38', '한 번 더 누르면 시작 (P-38)');
  await adv(3500); s = await st(); const x0 = s.game.player.x, y0 = s.game.player.y;
  await p.evaluate(() => document.querySelector('#game').scrollIntoView({ block: 'center' })); r = await box();
  // 끌기: 오른쪽으로 60칸, 위로 40칸
  const a = await L(60, 250); await touch('touchStart', [{ ...a, id: 1 }]); await adv(50);
  for (let i = 1; i <= 10; i++) { await touch('touchMove', [{ x: a.x + i * 6 * r.width / 240 / 1.25, y: a.y - i * 4 * r.height / 320 / 1.25, id: 1 }]); await adv(34); }
  await adv(300); s = await st(); ok(Math.abs(s.game.player.x - x0 - 60) < 4 && Math.abs(s.game.player.y - y0 + 40) < 4, '끌기: ' + [x0, y0] + ' → ' + [s.game.player.x, s.game.player.y] + ' (기대 +60, −40)');
  ok(await p.evaluate(() => DS.app.g.shots.length) > 0, '끄는 동안 샷이 저절로 나간다');
  // 둘째 손가락 = 모아 쏘기
  const c = await L(200, 280), cur = { x: a.x + 60 * r.width / 240 / 1.25, y: a.y - 40 * r.height / 320 / 1.25, id: 1 };
  await touch('touchStart', [cur, { ...c, id: 2 }]); await adv(1500); s = await st(); ok(s.game.player.charge > 70, '둘째 손가락을 대고 있으면 힘이 모인다 ' + s.game.player.charge);
  await p.screenshot({ path: 'qa/tmp/touch-2play.png' });
  await touch('touchEnd', [{ ...c, id: 2 }]); await adv(100);
  ok(await p.evaluate(() => DS.app.g.shots.filter(q => q.kind === 'rk').length) > 0 && (await st()).game.player.charge === 0, '떼면 모아 쏘기가 나간다');
  // 폭탄 버튼
  let m = await mid('#b-bomb'); const b0 = (await st()).game.player.bombs;
  await touch('touchStart', [cur, { ...m, id: 3 }]); await adv(60); await touch('touchEnd', [{ ...m, id: 3 }]); await adv(300);
  ok((await st()).game.player.bombs === b0 - 1, '폭탄 버튼 ' + b0 + ' → ' + (await st()).game.player.bombs);
  // 모아 쏘기 버튼
  m = await mid('#b-charge');
  await touch('touchStart', [cur, { ...m, id: 4 }]); await adv(1000); ok((await st()).game.player.charge > 40, '모아 쏘기 버튼을 누르고 있으면 모인다'); await touch('touchEnd', [{ ...m, id: 4 }]); await adv(100);
  ok((await st()).game.player.charge === 0, '버튼을 떼면 나간다');
  // 메뉴 버튼
  await touch('touchEnd', [cur]); await adv(50);
  await p.tap('#b-pause'); await adv(100); s = await st(); ok(s.paused && await p.isVisible('#menu'), '메뉴 버튼 → 멈춤 메뉴');
  await p.screenshot({ path: 'qa/tmp/touch-3menu.png' });
  const t0 = (await st()).game.t; await adv(500); ok((await st()).game.t === t0, '메뉴가 열린 동안 게임은 멈춘다');
  const items = await p.$$eval('#menu .mi', e => e.map(x => x.textContent.trim())); out.push('     메뉴: ' + items.join(' | '));
  await p.tap('#menu .mi >> nth=0'); await adv(100); s = await st(); ok(!s.paused, '「' + items[0] + '」을 누르면 이어진다');
  // 저장 → 포기 → 불러오기
  await p.tap('#b-pause'); await adv(100);
  const si = items.findIndex(x => x.includes('저장')); await p.tap('#menu .mi >> nth=' + si); await adv(100);
  const sub = await p.$$eval('#menu .mi', e => e.map(x => x.textContent.trim())); out.push('     저장 메뉴: ' + sub.join(' | '));
  await p.tap('#menu .mi >> nth=0'); await adv(200);
  ok(await p.evaluate(() => !!localStorage.getItem('donghyuns:slot1')), '칸 1에 저장했다');
  await p.evaluate(() => window.__donghyuns.closeMenu()); await adv(50);
  await p.screenshot({ path: 'qa/tmp/touch-4page.png', fullPage: true });
  console.log(out.join('\n')); console.log(fail ? fail + ' FAILED' : 'all ok'); console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();

// node qa/pad.cjs [engine] -- 게임패드 버튼 배정 (v0.41: R=샷 · L=모아 쏘기 · ZL·ZR=폭탄을 더함)
// 실물 패드가 아니라 navigator.getGamepads를 흉내 낸 패드(표준 배치, 닌텐도 글자)로 본다. 자리 번호: 0 B · 1 A · 2 Y · 3 X · 4 L · 5 R · 6 ZL · 7 ZR · 8 − · 9 + · 12~15 십자.
// 실물 패드가 브라우저에 표준 배치로 잡히는지는 이 시험으로 알 수 없다.
const { launch } = require('./launch.cjs');
(async () => {
  const engine = process.argv[2] || 'chromium', URL = process.env.DS_URL || 'http://127.0.0.1:8765/index.html';
  const b = await launch(engine); const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, ignoreHTTPSErrors: true });
  let fail = 0, n = 0; const errs = [];
  const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
  await ctx.addInitScript(() => {
    window.__pad = null;
    window.__mkpad = id => { window.__pad = { id, index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) }; };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [window.__pad, null, null, null], configurable: true });
  });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(URL + '?god=1'); await p.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const adv = ms => p.evaluate(m => window.advanceTime(m), ms);
  const st = () => p.evaluate(() => JSON.parse(window.render_game_to_text()));
  const sync = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 20))))));   // 패드는 화면 갱신 때마다 읽는다
  const set = async (i, on, v) => { await p.evaluate(([i, on, v]) => { window.__pad.buttons[i] = { pressed: on, touched: on, value: v == null ? (on ? 1 : 0) : v }; }, [i, !!on, v]); await sync(); };
  const tap = async i => { await set(i, true); await adv(34); await set(i, false); await adv(100); };
  const cnt = () => p.evaluate(() => Object.assign({}, window.__n));
  const NAME = { 0: 'B', 1: 'A', 2: 'Y', 3: 'X', 4: 'L', 5: 'R', 6: 'ZL', 7: 'ZR', 8: '−', 9: '+' };

  await adv(100);
  await p.evaluate(() => window.__mkpad('Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)')); await sync(); await p.waitForTimeout(120);
  const stat = await p.$eval('#status', e => e.textContent);
  ok(/게임패드 연결됨/.test(stat) && stat.includes('A·R 샷 · B·L 모아 쏘기 · X·Y·ZL·ZR 폭탄 · + 메뉴'), '붙이면 알림 글에 새 배정이 나온다: ' + stat);
  const tip = await p.$eval('.input-marks', e => e.innerHTML);
  ok(tip.includes('A·R 샷 · B·L 모아 쏘기 · X·Y·ZL·ZR 폭탄'), '머리글 게임패드 표식의 풍선 도움말');
  const page = await p.evaluate(() => document.body.innerHTML);
  ok(!page.includes('X·Y·L') && page.split('A·R 샷 · B·L 모아 쏘기 · X·Y·ZL·ZR 폭탄').length - 1 >= 2 && page.includes('ZL·ZR=폭탄'), '쪽의 게임패드 설명 세 곳(머리글 표식 · 판 옆 조작 줄 · 출전 규약 탭의 표)이 새 배정이다');

  // 고르는 화면: R·A = 정하기, L·B = 뒤로
  await p.click('#run'); await p.waitForTimeout(250); await adv(200);
  ok((await st()).screen === 'diff', '출전 → 난이도 고르기');
  const s0 = (await st()).sel; await tap(13); ok((await st()).sel === (s0 + 1) % 3, '십자 ↓로 난이도를 옮긴다'); await tap(12); ok((await st()).sel === s0, '십자 ↑로 되돌린다');
  await tap(5); await adv(300); ok((await st()).screen === 'plane', 'R = 정하기 (난이도 → 기체)');
  await tap(4); await adv(300); ok((await st()).screen === 'diff', 'L = 뒤로 (기체 → 난이도)');
  await tap(1); await adv(300); ok((await st()).screen === 'plane', 'A = 정하기');
  await tap(0); await adv(300); ok((await st()).screen === 'diff', 'B = 뒤로');
  await tap(6); await adv(200); await tap(7); await adv(200); ok((await st()).screen === 'diff', 'ZL · ZR은 고르는 화면에서 아무 일도 하지 않는다');
  await tap(5); await adv(300); const sp = (await st()).sel; await tap(15); ok((await st()).sel === (sp + 1) % 4, '십자 →로 기체를 옮긴다'); await tap(14);
  await tap(5); await adv(4000);
  let s = await st(); ok(s.game && s.game.mode === 'play' && s.game.player.ctrl, 'R로 출전: ' + (s.game ? s.game.mode : s.screen));

  await p.evaluate(() => { const g = window.__donghyuns.A.g; window.__n = { fire: 0, chg: 0, bomb: 0 }; for (const [k, f] of [['fire', 'fireMain'], ['chg', 'chargeShot'], ['bomb', 'useBomb']]) { const o = g[f]; g[f] = function () { window.__n[k]++; return o.apply(this, arguments); }; } });
  const ready = () => p.evaluate(() => { const g = window.__donghyuns.A.g; g.pl.bombs = 5; g.bombT = 0; g.pl.chg = 0; });
  const act = async (i, v) => {      // 버튼 하나를 1.2초 누르고 뗀다 → 무슨 일이 일어났나
    await ready(); const a = await cnt(); await set(i, v == null, v); await adv(1200); const mid = await cnt(), chg = (await st()).game.player.charge, menu = (await st()).menu;
    if (menu) { await set(i, false); await p.evaluate(() => window.__donghyuns.closeMenu()); await adv(50); return 'menu'; }
    await set(i, false); await adv(200); const z = await cnt(); await adv(400); const z2 = await cnt();
    const out = []; if (mid.fire > a.fire) out.push(z2.fire === z.fire ? 'shot' : 'shot(멈추지 않음)'); if (chg > 0 && z.chg > a.chg) out.push('charge'); if (mid.bomb > a.bomb) out.push('bomb' + (mid.bomb - a.bomb > 1 ? '×' + (mid.bomb - a.bomb) : ''));
    await adv(2600); return out.join('+') || 'none';
  };
  const WANT = { 1: 'shot', 5: 'shot', 0: 'charge', 4: 'charge', 3: 'bomb', 2: 'bomb', 6: 'bomb', 7: 'bomb', 9: 'menu', 10: 'none', 11: 'none', 16: 'none' };
  const LABEL = { shot: '샷', charge: '모아 쏘기', bomb: '폭탄', menu: '메뉴', none: '아무 일도 없음' };
  for (const i of [1, 5, 0, 4, 3, 2, 6, 7, 9, 10, 11, 16]) { const r = await act(i); ok(r === WANT[i], (NAME[i] || '자리 ' + i) + ' = ' + LABEL[WANT[i]] + (r === WANT[i] ? '' : ' (실제: ' + r + ')')); }
  for (const i of [6, 7]) { const r = await act(i, 0.8); ok(r === 'bomb', NAME[i] + '을 방아쇠처럼 반쯤(0.8) 당겨도 폭탄' + (r === 'bomb' ? '' : ' (실제: ' + r + ')')); }
  for (const i of [6, 7]) { const r = await act(i, 0.3); ok(r === 'none', NAME[i] + '을 살짝(0.3) 당기면 아무 일도 없음' + (r === 'none' ? '' : ' (실제: ' + r + ')')); }

  // 함께 누르기
  await ready(); let a = await cnt(); await set(5, true); await set(1, true); await adv(400); await set(1, false); await adv(100); let m = await cnt(); await adv(400); let z = await cnt();
  ok(m.fire > a.fire && z.fire > m.fire, 'A와 R을 함께 누르다 A만 떼도 샷이 이어진다'); await set(5, false); await adv(100); m = await cnt(); await adv(400); z = await cnt(); ok(z.fire === m.fire, 'R까지 떼면 샷이 멈춘다');
  await ready(); a = await cnt(); await set(4, true); await adv(200); const f0 = (await cnt()).fire; await set(5, true); await adv(1000); m = await cnt(); await set(4, false); await adv(100); z = await cnt(); await adv(300); const z3 = await cnt(); await set(5, false); await adv(300);
  ok(m.fire === f0 && z.chg === a.chg + 1 && z3.fire > z.fire, 'L을 누른 채 R을 누르면 모으기가 먼저다(키보드 Z+X와 같다). L을 떼면 모아 쏘고 샷이 이어진다');
  await ready(); a = await cnt(); await set(6, true); await set(7, true); await adv(300); m = await cnt(); await set(6, false); await set(7, false); await adv(3000);
  ok(m.bomb === a.bomb + 1, 'ZL과 ZR을 함께 눌러도 폭탄은 하나 나간다 (' + (m.bomb - a.bomb) + ')');

  // 움직이기
  const pos = async () => (await st()).game.player;
  for (const [i, ax, sgn, nm] of [[14, 'x', -1, '십자 ←'], [15, 'x', 1, '십자 →'], [12, 'y', -1, '십자 ↑'], [13, 'y', 1, '십자 ↓']]) { const q = await pos(); await set(i, true); await adv(300); await set(i, false); const r = await pos(); await adv(50); ok((r[ax] - q[ax]) * sgn > 5, nm + ' 움직이기 (' + ax + ' ' + q[ax] + ' → ' + r[ax] + ')'); }
  { const q = await pos(); await p.evaluate(() => { window.__pad.axes = [0.9, 0, 0, 0]; }); await sync(); await adv(300); const r = await pos(); await p.evaluate(() => { window.__pad.axes = [0, 0, 0, 0]; }); await sync(); await adv(50); ok(r.x - q.x > 5, '왼 스틱 → 움직이기 (x ' + q.x + ' → ' + r.x + ')'); }

  // 메뉴: + 열기 · 십자 고르기 · R 정하기 · L 뒤로
  await tap(9); s = await st(); ok(s.menu && s.menu.title === '잠시 멈춤', '+ = 메뉴 열기');
  await tap(13); ok((await st()).menu.i === 1, '메뉴에서 십자 ↓'); await tap(12); ok((await st()).menu.i === 0, '메뉴에서 십자 ↑');
  await tap(6); await tap(7); ok(!!(await st()).menu, '메뉴에서 ZL · ZR은 아무 일도 하지 않는다');
  await tap(4); ok(!(await st()).menu, '메뉴에서 L = 뒤로(닫기)');
  await tap(9); ok(!!(await st()).menu, '+ 다시 열기'); await tap(5); ok(!(await st()).menu, '메뉴에서 R = 정하기(계속 간다)');
  await tap(9); await tap(0); ok(!(await st()).menu, '메뉴에서 B = 뒤로'); await tap(9); await tap(1); ok(!(await st()).menu, '메뉴에서 A = 정하기'); await adv(300);

  // − 로 A·B를 바꿔도 어깨 버튼은 그대로
  await tap(8); const swapped = await p.evaluate(() => localStorage.getItem('dh-gamepad-swap'));
  ok(/true/.test(swapped || ''), '− = A·B 바꾸기 (브라우저에 남는다)');
  for (const [i, w] of [[1, 'charge'], [0, 'shot'], [5, 'shot'], [4, 'charge'], [6, 'bomb'], [7, 'bomb']]) { const r = await act(i); ok(r === w, '바꾼 뒤 ' + NAME[i] + ' = ' + LABEL[w] + (r === w ? '' : ' (실제: ' + r + ')')); }
  await tap(8); { const r = await act(1); ok(r === 'shot', '−를 다시 누르면 A = 샷으로 돌아온다' + (r === 'shot' ? '' : ' (실제: ' + r + ')')); }
  await p.evaluate(() => localStorage.removeItem('dh-gamepad-swap'));

  // 키보드는 그대로
  const key = async code => { await ready(); const a = await cnt(); await p.keyboard.down(code); await adv(1200); const mid = await cnt(), chg = (await st()).game.player.charge; await p.keyboard.up(code); await adv(200); const z = await cnt(); await adv(2800); return mid.fire > a.fire ? 'shot' : chg > 0 && z.chg > a.chg ? 'charge' : mid.bomb > a.bomb ? 'bomb' : 'none'; };
  for (const [c, w] of [['KeyX', 'shot'], ['Space', 'shot'], ['KeyZ', 'charge'], ['KeyC', 'bomb'], ['ShiftLeft', 'bomb']]) { const r = await key(c); ok(r === w, '패드를 붙인 채 키보드 ' + c + ' = ' + LABEL[w] + (r === w ? '' : ' (실제: ' + r + ')')); }

  // 패드가 떨어지면 누르던 버튼이 풀린다
  await ready(); await set(5, true); await adv(300); await p.evaluate(() => { window.__pad = null; }); await sync(); await adv(100); m = await cnt(); await adv(400); z = await cnt();
  ok(z.fire === m.fire, 'R을 누른 채 패드가 떨어지면 샷이 멈춘다');
  s = await st(); ok(s.game.mode === 'play', '끝까지 진행 중 (' + s.game.mode + ')');
  console.log(engine + ': ' + n + '항목 · ' + (fail ? fail + ' FAILED' : 'all ok') + ' · ' + (errs.length ? errs.slice(0, 5).join('\n') : 'no errors'));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();

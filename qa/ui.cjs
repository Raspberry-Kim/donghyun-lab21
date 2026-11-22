// node qa/ui.cjs [engine] -- 쪽 전체 흐름: 출전 준비 → 출전 → 난이도 → 기체 → 게임 → 메뉴 → 저장 → 불러오기 → 포기
const PW = require(process.env.PLAYWRIGHT || '/home/user/node_modules/playwright');
(async () => {
  const engine = process.argv[2] || 'chromium';
  const b = await PW[engine].launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [], out = []; let fail = 0;
  const ok = (c, m) => { out.push((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n'))); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto((process.env.DS_URL || 'http://127.0.0.1:8765/index.html') + '?god=1');
  await p.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const st = () => p.evaluate(() => JSON.parse(window.render_game_to_text()));
  const adv = ms => p.evaluate(m => window.advanceTime(m), ms);
  const key = async (k, hold) => { await p.keyboard.down(k); await adv(hold || 34); await p.keyboard.up(k); await adv(34); };
  await adv(200); await p.screenshot({ path: 'qa/tmp/ui-' + engine + '-ready.png' });
  let s = await st(); ok(s.screen === 'ready' && !s.live, '출전 준비 화면');
  // 출전하기 전에는 키를 잡지 않는다
  await p.keyboard.press('Space'); s = await st(); ok(s.screen === 'ready', '출전 전 Space는 게임이 받지 않는다');
  // 예제 넷째(스테이지 3)
  await p.selectOption('#example', 'stage3'); await p.waitForTimeout(400);
  s = await st(); ok(s.cfg.stage === 3 && s.cfg.lives === 3, '예제 04 미리 보기: 스테이지 3');
  await p.selectOption('#example', 'easy'); await p.waitForTimeout(400);
  await p.click('#run'); await p.waitForTimeout(200); await adv(100);
  s = await st(); ok(s.screen === 'diff' && s.live && s.cfg.lives === 5 && s.cfg.bombs === 4, '출전 → 난이도 고르기 (생명 5 폭탄 4)');
  await p.screenshot({ path: 'qa/tmp/ui-' + engine + '-diff.png' });
  await key('ArrowDown'); await key('KeyX'); s = await st(); ok(s.screen === 'plane' && s.diff === 'child', 'X로 중급을 정했다');
  await key('ArrowRight'); await adv(100); await p.screenshot({ path: 'qa/tmp/ui-' + engine + '-plane.png' });
  await key('KeyZ'); s = await st(); ok(s.screen === 'diff', 'Z로 뒤로');
  await key('Space'); await key('ArrowRight'); await key('Space'); await adv(200); s = await st();
  ok(s.screen === 'game' && s.game && s.game.plane === 'hayate' && s.game.lives === 4 && s.game.player.bombs === 4, 'Space로 정하고 게임 시작 (Ki-84, 예비 4, 폭탄 4): ' + JSON.stringify(s.game && [s.game.plane, s.game.lives, s.game.player.bombs]));
  await adv(4000);
  // 움직이기: 방향키만
  let a = (await st()).game.player; await p.keyboard.down('ArrowLeft'); await adv(500); await p.keyboard.up('ArrowLeft'); let c = (await st()).game.player; ok(c.x < a.x - 20, '← 로 왼쪽으로 ' + a.x + '→' + c.x);
  a = c; await p.keyboard.down('KeyA'); await adv(300); await p.keyboard.up('KeyA'); c = (await st()).game.player; ok(c.x === a.x, 'A 키로는 움직이지 않는다');
  // 샷: X, Space
  const shots = () => p.evaluate(() => DS.app.g.shots.length);
  await adv(600); let n0 = await shots(); await p.keyboard.down('KeyX'); await adv(300); let n1 = await shots(); await p.keyboard.up('KeyX'); ok(n1 > n0, 'X로 샷 ' + n0 + '→' + n1);
  await adv(900); n0 = await shots(); await p.keyboard.down('Space'); await adv(300); n1 = await shots(); await p.keyboard.up('Space'); ok(n1 > n0, 'Space로 샷 ' + n0 + '→' + n1);
  // 모아 쏘기: Z를 누르고 있다가 떼기
  await adv(900); await p.keyboard.down('KeyZ'); await adv(1400); c = (await st()).game.player; ok(c.charge > 70, 'Z를 누르고 있으면 힘이 모인다 ' + c.charge); n0 = await shots(); ok(n0 === 0, '모으는 동안 샷은 멈춘다 ' + n0);
  await p.keyboard.up('KeyZ'); await adv(100); c = (await st()).game.player; n1 = await shots(); const beam = await p.evaluate(() => !!DS.app.g.beam || DS.app.g.shots.length > 0); ok(c.charge === 0 && beam, 'Z를 떼면 모아 쏘기가 나간다');
  // 폭탄: C
  await adv(1500); a = (await st()).game; await key('KeyC'); c = (await st()).game; ok(c.player.bombs === a.player.bombs - 1 && c.bomb > 0, 'C로 폭탄 ' + a.player.bombs + '→' + c.player.bombs);
  await adv(3000); await p.screenshot({ path: 'qa/tmp/ui-' + engine + '-game.png' });
  // 메뉴: Enter
  await key('Enter'); s = await st(); ok(s.paused && s.menu && s.menu.items.length === 5, 'Enter로 메뉴: ' + (s.menu && s.menu.items.join(' / ')));
  const t0 = s.game.t; await adv(500); s = await st(); ok(s.game.t === t0, '메뉴가 열린 동안 멈춘다');
  await p.screenshot({ path: 'qa/tmp/ui-' + engine + '-menu.png' });
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('KeyX'); s = await st(); ok(s.menu && s.menu.title === '저장', '저장 메뉴');
  await p.keyboard.press('KeyX'); s = await st(); const slot = await p.evaluate(() => JSON.parse(localStorage.getItem('donghyuns:slot1') || 'null'));
  ok(slot && slot.format === 'donghyuns-save' && slot.state && slot.summary.stage === 1, '칸 1에 저장 ' + (slot && JSON.stringify(slot.summary)));
  ok(s.menu && s.menu.title === '잠시 멈춤', '저장 뒤 멈춤 메뉴로');
  const before = await p.evaluate(() => DS.app.g.text());
  await p.keyboard.press('KeyZ'); s = await st(); ok(!s.paused, 'Z로 메뉴 닫기');
  await adv(5000); const mid = await p.evaluate(() => DS.app.g.text()); ok(mid !== before, '계속 진행');
  // 불러오기
  await key('Escape'); s = await st(); ok(s.paused, 'Esc로 메뉴');
  for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); s = await st(); ok(s.menu && s.menu.title === '불러오기', '불러오기 메뉴');
  await p.keyboard.press('Enter'); await p.keyboard.press('Enter'); await p.waitForTimeout(300); s = await st();
  const after = await p.evaluate(() => DS.app.g.text()); ok(after === before, '불러온 판이 저장한 때와 같다');
  ok(s.paused && s.menu && /불러왔다/.test(s.menu.title), '불러온 직후에는 멈춘 채 기다린다');
  await p.keyboard.press('KeyX'); await adv(1000); s = await st(); ok(!s.paused && s.game.t > JSON.parse(before).t, '계속 간다');
  // 파일 저장
  await key('KeyP'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('KeyX'); for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowDown');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.keyboard.press('KeyX')]);
  let file = null; if (dl) { file = 'qa/tmp/ui-' + engine + '.dhsave'; await dl.saveAs(file); }
  ok(!!dl && /^donghyuns-stage1-\d+\.dhsave$/.test(dl.suggestedFilename()), '파일로 내려받기 ' + (dl && dl.suggestedFilename()));
  const fileState = await p.evaluate(() => DS.app.g.text());
  // 포기
  s = await st(); if (s.menu) { for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowDown'); await p.keyboard.press('KeyX'); await p.keyboard.press('KeyX'); }
  await adv(200); s = await st(); ok(s.screen === 'ready' && !s.live, '포기하고 출전 준비로: ' + s.screen);
  // 출전 준비에서 칸 불러오기
  const slotBtn = await p.$('#slot-list .slot-btn:not([disabled])'); ok(!!slotBtn, '출전 준비 화면에 저장 칸이 보인다');
  if (slotBtn) { await slotBtn.click(); await p.waitForTimeout(300); s = await st(); ok(s.screen === 'game' && s.paused && (await p.evaluate(() => DS.app.g.text())) === before, '출전 준비에서 칸 1 불러오기'); await p.keyboard.press('KeyX'); }
  // 파일 불러오기
  if (file) { await p.setInputFiles('#load-file', file); await p.waitForTimeout(400); s = await st(); ok(s.screen === 'game' && (await p.evaluate(() => DS.app.g.text())) === fileState, '파일에서 불러오기'); await p.keyboard.press('KeyX'); }
  // 망가진 파일
  await p.setInputFiles('#load-file', { name: 'bad.dhsave', mimeType: 'application/json', buffer: Buffer.from('{"format":"donghyuns-save","version":1,"state":{"planeIdx":7}}') }); await p.waitForTimeout(300);
  s = await st(); ok(s.screen === 'game' && /불러오기 실패/.test(await p.textContent('#status')), '망가진 파일은 거부하고 지금 판은 남는다: ' + (await p.textContent('#status')));
  // M: 소리
  if (s.menu) await p.keyboard.press('KeyZ');
  const m0 = (await st()).muted; await p.keyboard.press('KeyM'); const m1 = (await st()).muted; ok(m0 !== m1, 'M으로 효과음 켜기·끄기'); await p.keyboard.press('KeyM');
  // 흰 종이
  await p.evaluate(() => window.__donghyuns.backToSetup()); await adv(200);
  await p.selectOption('#example', 'whitehard'); await p.waitForTimeout(400); await p.click('#run');
  await p.waitForFunction(() => JSON.parse(window.render_game_to_text()).screen === 'diff', null, { timeout: 30000 });
  s = await st(); ok(s.paper === '스케치북 흰색' && s.cfg.stage === 4 && s.cfg.lives === 2 && s.cfg.bombs === 1, '예제 07: 흰 종이 · 스테이지 4 · 생명 2 · 폭탄 1');
  await key('KeyX'); await key('KeyX'); await adv(4000); s = await st(); ok(s.game && s.game.stage === 4 && s.game.lives === 1, '스테이지 4에서 시작');
  await p.screenshot({ path: 'qa/tmp/ui-' + engine + '-white.png' });
  // 규약 오류
  await p.evaluate(() => window.__donghyuns.backToSetup()); await adv(200);
  const P = t => p.evaluate(x => { const r = window.__donghyuns.parseSortie(x); return [r.go, r.err[0] || '', r.c]; }, t);
  for (const [t, go] of [['3', true], ['9 5 5 2', true], ['0', false], ['10', false], ['3 6', false], ['3 2 6', false], ['3 2 1 3', false], ['3 2 1 1 1', false], ['', false], ['3 -1', false], ['1 0', true]]) { const r = await P(t); ok(r[0] === go, '규약 "' + t + '" → ' + (r[0] ? '출전' : '거부') + (r[1] ? ' (' + r[1] + ')' : '')); }
  await p.fill('#code', '나는 동현이냐?\n동현이구나'); await p.click('#run'); ok(/정수가 하나도/.test(await p.textContent('#result')), '정수 없음 → 출전하지 않는다');
  s = await st(); ok(s.screen === 'ready', '오류 뒤에도 출전 준비');
  console.log(out.join('\n')); console.log(fail ? fail + ' FAILED' : 'all ok'); console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})();

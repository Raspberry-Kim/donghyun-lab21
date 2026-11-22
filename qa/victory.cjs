// node qa/victory.cjs [engine] -- 끝판왕을 이긴 엔딩의 축하: 팡파르(pomp)와 꽃비가 나오는지,
// 꽃비가 게임 화면 안에 놓이고 누르기를 가로채지 않는지, 약 10초 뒤 스스로 걷히는지, 출전 준비로 돌아가거나 저장한 판을 불러오면 함께 멈추는지,
// 소리를 꺼도 꽃비는 내리고 팡파르는 울리지 않는지, 스테이지 클리어 문구에 예전 표현이 남지 않았는지 본다.
const PW = require(process.env.PLAYWRIGHT || '/home/user/node_modules/playwright');
(async () => {
  const engine = process.argv[2] || 'chromium';
  const b = await PW[engine].launch(engine === 'chromium' ? { args: ['--autoplay-policy=no-user-gesture-required'] } : {});
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; let fail = 0;
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto((process.env.DS_URL || 'http://127.0.0.1:8765/index.html') + '?god=1');
  await p.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const st = () => p.evaluate(() => JSON.parse(window.render_game_to_text()));
  const adv = ms => p.evaluate(m => window.advanceTime(m), ms);
  const key = async (k, hold) => { await p.keyboard.down(k); await adv(hold || 34); await p.keyboard.up(k); await adv(34); };
  const H = () => p.evaluate(() => { const c = document.querySelector('.dh-petals'), host = document.querySelector('.board-stage.ds-board'), S = DS.Sfx;
    return { on: DHPETALS.on, count: DHPETALS.count, ended: DHPETALS.ended, n: document.querySelectorAll('.dh-petals').length, inStage: !!c && c.parentNode === host, pe: c ? getComputedStyle(c).pointerEvents : null,
      size: c ? [c.clientWidth, c.clientHeight, host.clientWidth, host.clientHeight] : null, ringing: S.ringing, played: S.played, ready: S.ready, muted: S.muted }; });
  /* 예제 05(스테이지 7)로 나서서 자동 조종으로 끝판왕까지 간다. 마지막 장면까지의 글을 모은다 */
  const toEnding = async () => {
    await p.selectOption('#example', 'last'); await p.waitForTimeout(300); await p.click('#run'); await p.waitForTimeout(200); await adv(100);
    await key('ArrowDown'); await key('KeyX'); await key('ArrowRight'); await key('KeyX'); await adv(200);
    let s = await st(); if (!(s.screen === 'game' && s.game && s.game.stage === 7)) return { s, seen: {} };
    await p.evaluate(() => { window.__donghyuns.A.auto = true; });
    const seen = { boss: '', clear: false, sec: 0 };
    for (let i = 0; i < 400; i++) {
      s = await p.evaluate(() => { window.advanceTime(1000); return JSON.parse(window.render_game_to_text()); });
      seen.sec++; if (s.game && s.game.boss) seen.boss = s.game.boss.name; if (s.game && s.game.mode === 'clear') seen.clear = true;
      if (s.game && s.game.mode === 'ending') break;
    }
    await p.evaluate(() => { window.__donghyuns.A.auto = false; });
    return { s, seen };
  };
  const ready0 = await H();

  // 1. 소리를 켠 채로 끝까지
  let r = await toEnding(), s = r.s;
  ok(s.game && s.game.mode === 'ending' && r.seen.clear && r.seen.boss === '흑심 대요새', `스테이지 7에서 끝판왕 「${r.seen.boss}」을 이기고 엔딩 (${r.seen.sec}초)`);
  let h = await H();
  ok(h.on && h.n === 1 && h.inStage && h.pe === 'none', '엔딩에서 꽃비 캔버스 하나가 게임 화면 안에 놓이고 누르기를 받지 않는다');
  ok(h.size && Math.abs(h.size[0] - h.size[2]) <= 1 && Math.abs(h.size[1] - h.size[3]) <= 1, '꽃비가 게임 화면과 같은 크기다 ' + JSON.stringify(h.size));
  if (h.ready) ok(h.ringing && h.played.join() === 'pomp' && s.ringing === true && s.petals === true, '팡파르가 울리는 중이다 (pomp 1번)');
  else { ok(!h.ringing && h.played.length === 0 && s.petals === true, '소리 장치가 열리지 않은 엔진: 팡파르 없이 꽃비만 내린다'); console.log('note 이 엔진에서는 소리 장치가 열리지 않아 팡파르가 실제로 울리는지는 보지 못했다'); }
  const audio = h.ready;
  const text = await p.evaluate(() => [document.querySelector('#log').textContent, document.querySelector('#status') ? document.querySelector('#status').textContent : '', document.body.textContent].join('\n'));
  ok(/축하한다\. 일곱 스테이지를 모두 클리어했다/.test(text) && /스테이지 7 「백지 하늘」 클리어/.test(text), '기록에 ‘스테이지 7 「백지 하늘」 클리어’와 ‘축하한다. 일곱 스테이지를 모두 클리어했다’가 남는다');
  ok(!/넘김|넘겼다/.test(text), '쪽 어디에도 예전 표현(넘김·넘겼다)이 없다');
  await p.waitForFunction(() => DHPETALS.count > 10, null, { timeout: 8000 }); h = await H(); ok(h.count > 10, '꽃잎이 내린다 (' + h.count + '장)');
  await p.screenshot({ path: 'qa/tmp/victory-' + engine + '.png' });
  await p.waitForFunction(() => !DHPETALS.on && !DS.Sfx.ringing, null, { timeout: 16000 }); h = await H(); s = await st();
  ok(!h.on && h.n === 0 && h.ended === 1 && !h.ringing && s.game.mode === 'ending', '약 10초 뒤 꽃비가 스스로 걷히고 팡파르도 끝난다. 엔딩 화면은 그대로다');
  await adv(3000); await key('KeyX'); s = await st(); ok(s.screen === 'ready' && !s.live, 'X로 출전 준비로 돌아간다');

  // 2. 엔딩 도중에 떠나면 함께 멈춘다
  r = await toEnding(); h = await H(); ok(r.s.game.mode === 'ending' && h.on && (!audio || h.ringing), '두 번째 엔딩: 꽃비' + (audio ? '와 팡파르' : '') + '가 다시 나온다');
  await adv(3000); await key('KeyX'); h = await H(); s = await st();
  ok(s.screen === 'ready' && !h.on && h.n === 0 && !h.ringing, '엔딩 도중 출전 준비로 돌아가면 꽃비와 팡파르가 함께 멈춘다');

  // 3. 엔딩 도중에 저장한 판을 불러오면 멈춘다
  await p.selectOption('#example', 'basic'); await p.waitForTimeout(300); await p.click('#run'); await p.waitForTimeout(200); await adv(100);
  await key('KeyX'); await key('KeyX'); await adv(3000);
  const snap = await p.evaluate(() => JSON.stringify(window.__donghyuns.snapshot())); await p.evaluate(() => window.__donghyuns.backToSetup());
  r = await toEnding(); h = await H(); ok(r.s.game.mode === 'ending' && h.on, '세 번째 엔딩');
  await p.evaluate(d => window.__donghyuns.loadFrom(JSON.parse(d)), snap); await adv(100); h = await H(); s = await st();
  ok(s.screen === 'game' && s.game.stage === 1 && !h.on && h.n === 0 && !h.ringing, '엔딩 도중 저장한 판을 불러오면 꽃비와 팡파르가 멈추고 그 판(스테이지 1)으로 돌아간다');
  await p.evaluate(() => { window.__donghyuns.closeMenu(); window.__donghyuns.backToSetup(); });

  // 4. 소리를 끄면 팡파르는 없고 꽃비만 내린다. 엔딩에서 소리를 꺼도 팡파르가 멈춘다
  const before = (await H()).played.length;
  await p.evaluate(() => DS.Sfx.setMuted(true)); r = await toEnding(); h = await H();
  ok(r.s.game.mode === 'ending' && h.on && !h.ringing && h.played.length === before && r.s.muted === true, '소리를 꺼 두면 팡파르 없이 꽃비만 내린다');
  await adv(3000); await key('KeyX');
  if (audio) {
    await p.evaluate(() => DS.Sfx.setMuted(false)); r = await toEnding(); h = await H(); ok(h.ringing && h.on, '소리를 다시 켜면 팡파르가 울린다');
    await p.evaluate(() => DS.Sfx.setMuted(true)); h = await H(); ok(!h.ringing && h.on, '엔딩에서 소리를 끄면 팡파르가 멈추고 꽃비는 계속 내린다');
    await p.evaluate(() => DS.Sfx.setMuted(false)); await adv(3000); await key('KeyX');
  }
  console.log(engine + ': ' + (fail ? fail + ' FAILED' : 'all ok') + (errs.length ? '\n' + errs.slice(0, 6).join('\n') : ' · no errors') + ' · 처음 소리 장치: ' + JSON.stringify({ ready: ready0.ready }));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();

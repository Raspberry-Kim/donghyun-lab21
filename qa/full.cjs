// node qa/full.cjs [engine] -- 전체 화면(데스크톱·휴대폰 세로·가로): 들어가기, 메뉴, Esc, F, 닫기
// HEADED=1을 주면 창을 띄워 돈다(창이 있는 Chrome이 Esc를 어떻게 받는지 볼 때. 화면이 없는 곳에서는 xvfb-run과 함께).
// 엔진마다 다른 점을 그대로 받아들인다.
//  · 전체 화면이 되면 창 크기가 달라질 수 있다(Firefox는 화면 크기로 커진다). 그래서 들어간 뒤의 창 크기와 견준다.
//  · Esc는 브라우저가 먼저 받아 전체 화면을 닫을 수 있다(WebKit · Firefox, 창이 있는 Chrome도 같다). 이때 쪽은 그 키를 받지 못한다.
//    그러면 버튼·크기가 원래대로 돌아오고 게임이 메뉴를 열어 멈추는지 본 뒤 다시 들어간다(v0.31). 쪽이 Esc를 받으면(창 없는 Chromium, 흉내 낸 전체 화면) 전체 화면은 그대로이고 메뉴가 열리는지 본다.
//    어느 쪽이든 Esc를 누르면 게임은 멈춘다. F나 닫기 버튼으로 닫을 때는 메뉴가 열리지 않는다.
const { launch } = require('./launch.cjs');
(async () => {
  const eng = process.argv[2] || 'chromium'; const b = await launch(eng, process.env.HEADED ? { headless: false } : {}); let fail = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
  for (const [name, vp, mob] of [['desk', { width: 1280, height: 800 }, false], ['phone', { width: 390, height: 780 }, true], ['land', { width: 780, height: 390 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, ...(mob && eng !== 'firefox' ? { hasTouch: true, isMobile: true } : {}), deviceScaleFactor: mob ? 2 : 1 });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ' ' + e.message));
    await p.goto((process.env.DS_URL || 'http://127.0.0.1:8765/index.html') + '?god=1&diff=1&plane=1'); await p.waitForSelector('body.ready', { timeout: 60000 });
    const adv = ms => p.evaluate(m => window.advanceTime(m), ms);
    const key = async k => { await p.keyboard.press(k); await adv(50); };
    const info = () => p.evaluate(() => { const fs = document.fullscreenElement || document.webkitFullscreenElement, sf = document.querySelector('#stage-full'), q = document.querySelector('#game').getBoundingClientRect(), ex = document.querySelector('#exit-full'), tp = document.querySelector('#touchpad');
      return { native: fs === sf, pseudo: sf.classList.contains('pseudo-full'), fs: sf.classList.contains('fs'), exitShown: !ex.hidden && !!ex.offsetParent, label: document.querySelector('#full').textContent.trim(), menu: !!window.__donghyuns.menu, title: window.__donghyuns.menu ? window.__donghyuns.menu.title : '', nMenu: document.querySelectorAll('#menu:not([hidden])').length, r: [q.x, q.y, q.width, q.height], iw: innerWidth, ih: innerHeight, pad: getComputedStyle(tp).display !== 'none' }; });
    const enter = async () => { await p.click('#full'); await p.waitForFunction(() => document.querySelector('#stage-full').classList.contains('fs'), null, { timeout: 8000 }).catch(() => { }); await p.waitForTimeout(400); await adv(50); return info(); };
    const gt = () => p.evaluate(() => JSON.parse(window.render_game_to_text()).game.t);
    const frozen = async () => { const t0 = await gt(); await adv(500); return (await gt()) === t0; };
    const leftFull = s => !s.fs && !s.native && !s.pseudo && !s.exitShown && s.label === '전체 화면';
    ok(await p.isDisabled('#full'), name + ': 출전 전에는 전체 화면 버튼이 꺼져 있다');
    await p.click('#run'); await p.waitForTimeout(300); await adv(100);
    for (const k of ['KeyX', 'KeyX']) { await p.keyboard.down(k); await adv(34); await p.keyboard.up(k); await adv(100); }
    await adv(3000);
    const before = await (await p.$('#game')).boundingBox();

    // 들어가기
    let s = await enter(); const kind = s.native ? '브라우저 전체 화면' : s.pseudo ? '흉내 낸 전체 화면' : '없음';
    ok(s.fs && (s.native || s.pseudo) && s.exitShown && s.label === '전체 화면 닫기', name + ': 전체 화면에 들어간다 (' + kind + ', 창 ' + s.iw + '×' + s.ih + ')');
    const r = s.r;
    ok(r[0] >= -0.5 && r[1] >= -0.5 && r[0] + r[2] <= s.iw + 0.5 && r[1] + r[3] <= s.ih + 0.5, name + ': 게임 화면이 창 안에 들어온다 ' + r.map(Math.round));
    ok(Math.abs(r[3] / r[2] - 4 / 3) < 0.02, name + ': 3:4 비율');
    ok(r[3] >= before.height - 1 || name !== 'desk', name + ': 원래보다 작아지지 않는다 ' + Math.round(before.height) + '→' + Math.round(r[3]));
    if (s.pad) { const pads = await p.evaluate(() => ['#b-charge', '#b-pause', '#b-bomb'].map(q0 => { const e = document.querySelector(q0), q = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && q.width > 0 && q.left >= 0 && q.right <= innerWidth + 0.5 && q.top >= 0 && q.bottom <= innerHeight + 0.5; })); ok(pads.every(Boolean), name + ': 화면 버튼 셋이 창 안에 보인다 ' + pads); }
    else if (mob) console.log('note ' + name + ': 이 엔진은 손가락 기기를 흉내 내지 않아 화면 버튼이 나오지 않는다. 이 항목은 건너뛴다');
    await p.screenshot({ path: `qa/tmp/full-${eng}-${name}.png` });

    // 메뉴: Enter로 열고 P로 닫는다(둘 다 브라우저가 가로채지 않는 키)
    await key('Enter'); await p.screenshot({ path: `qa/tmp/full-${eng}-${name}-menu.png` });
    const mr = await p.evaluate(() => { const q = document.querySelector('#menu').getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom, innerWidth, innerHeight]; }); s = await info();
    ok(s.menu && mr[0] >= 0 && mr[1] >= 0 && mr[2] <= mr[4] + 0.5 && mr[3] <= mr[5] + 0.5, name + ': Enter로 연 메뉴가 창 안에 들어온다');
    await key('KeyP'); s = await info(); ok(!s.menu && s.fs, name + ': P로 메뉴를 닫아도 전체 화면은 그대로다');

    // Esc
    await p.keyboard.press('Escape'); await p.waitForTimeout(700); await adv(50); s = await info();
    if (s.fs) {
      ok(s.menu && s.exitShown, name + ': Esc를 쪽이 받는다 → 메뉴가 열리고 전체 화면은 그대로다');
      await key('KeyP'); s = await info(); ok(!s.menu && s.fs, name + ': 메뉴를 닫는다');
    } else {
      ok(leftFull(s) && Math.abs(s.r[2] - before.width) < 2, name + ': Esc를 브라우저가 받는다 → 전체 화면이 닫히고 버튼·크기가 원래대로다 ' + Math.round(s.r[2]));
      ok(s.menu && s.title === '잠시 멈춤' && await frozen(), name + ': 그때 게임은 메뉴를 열어 멈춘다');
      await key('KeyP'); s = await info(); ok(!s.menu && !(await frozen()), name + ': P로 메뉴를 닫으면 이어진다');
      s = await enter(); ok(s.fs && s.exitShown && !s.menu, name + ': 다시 전체 화면에 들어간다');
    }

    // 메뉴를 열어 둔 채 Esc
    await key('Enter'); s = await info(); const had = s.menu;
    await p.keyboard.press('Escape'); await p.waitForTimeout(700); await adv(50); s = await info();
    if (s.fs) { ok(had && !s.menu, name + ': 메뉴가 열린 채 Esc(쪽이 받음) → 메뉴가 닫히고 전체 화면은 그대로다'); }
    else {
      ok(had && leftFull(s) && s.menu && s.title === '잠시 멈춤' && s.nMenu === 1 && await frozen(), name + ': 메뉴가 열린 채 Esc(브라우저가 받음) → 전체 화면이 닫히고 메뉴는 그대로 열려 있다');
      await key('KeyP'); s = await info(); ok(!s.menu, name + ': P로 메뉴를 닫는다');
      s = await enter(); ok(s.fs && s.exitShown && !s.menu, name + ': 다시 전체 화면에 들어간다');
    }

    // 키 없이 브라우저가 전체 화면을 닫을 때(쪽이 Esc를 받는 엔진에서도 이 길을 본다)
    if (s.native) {
      await p.evaluate(() => (document.exitFullscreen || document.webkitExitFullscreen).call(document)); await p.waitForFunction(() => !document.querySelector('#stage-full').classList.contains('fs'), null, { timeout: 8000 }).catch(() => { }); await p.waitForTimeout(400); await adv(50); s = await info();
      ok(leftFull(s) && s.menu && s.title === '잠시 멈춤' && await frozen(), name + ': 게임이 닫지 않았는데 전체 화면이 닫히면 메뉴를 열어 멈춘다');
      await key('KeyP'); s = await info(); ok(!s.menu, name + ': P로 메뉴를 닫는다');
      s = await enter(); ok(s.fs && s.exitShown && !s.menu, name + ': 다시 전체 화면에 들어간다');
    }

    // F로 닫기: 메뉴는 열리지 않는다
    await p.keyboard.press('KeyF'); await adv(50); await p.waitForFunction(() => !document.querySelector('#stage-full').classList.contains('fs'), null, { timeout: 8000 }).catch(() => { }); await p.waitForTimeout(400); await adv(50); s = await info();
    ok(leftFull(s) && !s.menu && !(await frozen()), name + ': F로 닫으면 메뉴 없이 게임이 이어진다');
    s = await enter(); ok(s.fs && s.exitShown && !s.menu, name + ': 다시 전체 화면에 들어간다');

    // 닫기 버튼
    ok(await p.isVisible('#exit-full'), name + ': 닫기 버튼이 보인다');
    await p.click('#exit-full'); await p.waitForFunction(() => !document.querySelector('#stage-full').classList.contains('fs'), null, { timeout: 8000 }).catch(() => { }); await p.waitForTimeout(400); await adv(50); s = await info();
    ok(leftFull(s) && Math.abs(s.r[2] - before.width) < 2, name + ': 닫기 버튼을 누르면 원래 크기 ' + Math.round(s.r[2]));
    ok(!s.menu && !(await frozen()), name + ': 닫기 버튼으로 닫으면 메뉴 없이 게임이 이어진다');
    await ctx.close();
  }
  console.log(eng + ': ' + (fail ? fail + ' FAILED' : 'all ok')); console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();

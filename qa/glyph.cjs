// node qa/glyph.cjs [engine] -- 게임 화면에 쓴 글자가 모두 손글씨(Gaegu)로 나오는지 본다
// v0.31까지 ‘스케치북 흰색’(예제 03 · 07)의 ‘북’과 ‘흰’이 추린 글꼴에 없어 다른 글꼴로 나왔다. 종이 색 이름이 있는 sketch.js를 글자를 추릴 때 읽지 않은 탓이다.
// 1) 캔버스의 fillText · strokeText를 가로채, 예제 일곱 · 난이도 · 기체 고르기 · 스테이지 1~7 완주 · 엔딩 · 게임 오버에서 실제로 쓴 글자를 모은다.
// 2) 모은 글자가 fonts/Gaegu.subset.txt(추린 글자와, Gaegu 원본에 처음부터 없는 글자)에 있는지 본다.
// 3) 글자마다 ‘Gaegu, serif’와 ‘serif’로 그려 견준다. 둘이 같으면 그 글자는 Gaegu로 나오지 않은 것이다.
const fs = require('fs'), path = require('path');
const { launch } = require('./launch.cjs');
(async () => {
  const engine = process.argv[2] || 'chromium', URL = process.env.DS_URL || 'http://127.0.0.1:8765/index.html';
  const [inFont, absent] = fs.readFileSync(path.join(__dirname, '..', 'fonts', 'Gaegu.subset.txt'), 'utf8').split('\n');
  const b = await launch(engine); const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, ignoreHTTPSErrors: true });
  let fail = 0; const errs = [], seen = new Map();
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
  await ctx.addInitScript(() => {
    window.__glyphs = {};
    for (const fn of ['fillText', 'strokeText']) { const o = CanvasRenderingContext2D.prototype[fn]; CanvasRenderingContext2D.prototype[fn] = function (t) { if (String(this.font).includes('Gaegu')) for (const ch of String(t)) if (!window.__glyphs[ch]) window.__glyphs[ch] = String(t).slice(0, 30); return o.apply(this, arguments); }; }
  });
  const open = async q => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); await p.goto(URL + (q ? '?' + q : '')); await p.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 }); return p; };
  const adv = (p, ms) => p.evaluate(m => window.advanceTime(m), ms);
  const st = p => p.evaluate(() => JSON.parse(window.render_game_to_text()));
  const take = async (p, where) => { const g = await p.evaluate(() => window.__glyphs); for (const ch in g) if (!seen.has(ch)) seen.set(ch, where + ' 「' + g[ch] + '」'); await p.close(); };
  const press = async (p, k) => { await p.keyboard.down(k); await adv(p, 34); await p.keyboard.up(k); await adv(p, 100); };

  // 예제 일곱: 출전 준비 화면 → 출전 → 난이도 → 기체 넷
  let p = await open('god=1');
  const ex = await p.$$eval('#example option', o => o.map(x => x.value));
  for (const id of ex) {
    await p.selectOption('#example', id); await p.waitForTimeout(150); await adv(p, 200);
    await p.click('#run'); await p.waitForTimeout(250); await adv(p, 200);
    for (let i = 0; i < 3; i++) await press(p, 'ArrowDown');
    await press(p, 'KeyX'); for (let i = 0; i < 4; i++) { await press(p, 'ArrowRight'); await adv(p, 200); }
    await p.evaluate(() => window.__donghyuns.backToSetup()); await p.waitForTimeout(150); await adv(p, 200);
  }
  ok(ex.length === 7, '예제 ' + ex.length + '개의 출전 준비 · 난이도 · 기체 고르기 화면을 그렸다');
  await take(p, '예제');

  // 기체 넷으로 스테이지 1~7 (첫 기체는 엔딩까지, 흰 종이로도 한 번)
  for (const [pl, q] of [[1, ''], [0, ''], [2, ''], [3, '']]) {
    p = await open('auto=1&god=1&stage=' + (pl === 1 ? 1 : 6) + '&diff=' + pl % 3 + '&plane=' + pl + '&power=3' + q);
    let t = 0, last = null; while (t < 900) { await adv(p, 1000); t++; last = (await st(p)).game; if (last && last.mode === 'ending') { await adv(p, 4000); break; } }
    ok(last && last.mode === 'ending', '기체 ' + pl + ': 엔딩까지 ' + t + '초');
    await take(p, '완주(기체 ' + pl + ')');
  }
  // 게임 오버와 이어 하기 (상급, 무적 없이 가만히 둔다)
  p = await open('stage=4&diff=2&plane=0'); await p.click('#run'); await p.waitForTimeout(250); await adv(p, 200);
  await press(p, 'ArrowDown'); await press(p, 'ArrowDown'); await press(p, 'KeyX'); await adv(p, 300); await press(p, 'KeyX'); await adv(p, 300);
  let t = 0, mode = ''; while (t < 400 && mode !== 'over') { await adv(p, 1000); t++; const s = await st(p); mode = s.game ? s.game.mode : ''; }
  await adv(p, 3000); ok(mode === 'over', '게임 오버 화면 ' + t + '초');
  await press(p, 'KeyX'); await adv(p, 2000);
  await take(p, '게임 오버');

  const chars = [...seen.keys()].filter(c => c.trim()).sort();
  const miss = chars.filter(c => !inFont.includes(c) && !absent.includes(c));
  ok(chars.length > 150, '게임 화면에 쓴 글자 ' + chars.length + '자를 모았다');
  ok(miss.length === 0, '모두 추린 글꼴에 있다' + (miss.length ? ': 없는 글자 ' + miss.map(c => c + ' (' + seen.get(c) + ')').join(', ') : ''));
  const viaOther = chars.filter(c => absent.includes(c));
  console.log('     Gaegu 원본에 없어 다른 글꼴로 나오는 기호: ' + (viaOther.join(' ') || '없음'));

  // 실제로 그려서 견준다
  p = await open('');
  const same = await p.evaluate(async list => {
    await document.fonts.load('700 40px Gaegu', '동현스'); await document.fonts.load('400 40px Gaegu', '동현스'); await document.fonts.ready;
    const draw = (ch, font) => { const c = document.createElement('canvas'); c.width = 80; c.height = 80; const g = c.getContext('2d'); g.font = font; g.textBaseline = 'alphabetic'; g.fillText(ch, 12, 52);   /* 'middle'은 첫 글꼴의 치수로 높이를 잡아, 다른 글꼴로 나온 글자도 자리가 달라져 다르게 보인다 */ return c.toDataURL(); };
    const out = [];
    for (const w of [700, 400]) for (const ch of list) { const a = draw(ch, w + ' 40px Gaegu, serif'), s = draw(ch, w + ' 40px serif'); if (a === s) out.push(ch + '(' + w + ')'); }
    return out;
  }, chars.filter(c => !absent.includes(c)));
  ok(same.length === 0, engine + ': 그려 보니 모두 Gaegu로 나온다' + (same.length ? ': 다른 글꼴로 나온 글자 ' + same.join(' ') : ''));
  await p.close();
  console.log(engine + ': ' + (fail ? fail + ' FAILED' : 'all ok') + ' · ' + (errs.length ? errs.slice(0, 5).join('\n') : 'no errors'));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();

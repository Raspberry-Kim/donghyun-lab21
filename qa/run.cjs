// node qa/run.cjs <query> <prefix> [maxSec] [engine] -- 자동 조종으로 끝까지 돌리며 기록
const PW = require(process.env.PLAYWRIGHT || '/home/user/node_modules/playwright');
(async () => {
  const [, , query, prefix, maxSec, engine] = process.argv;
  const b = await PW[engine || 'chromium'].launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n'))); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto((process.env.DS_URL || 'http://127.0.0.1:8765/index.html') + '?' + (query || ''));
  await p.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 }).catch(() => errs.push('not ready'));
  const shot = async n => { if (!prefix || prefix === '-') return; const el = await p.$('#game'); await el.screenshot({ path: prefix + '-' + n + '.png' }); };
  let t = 0, last = '', bossShot = {}, deaths = 0, pl = 2, pc = 0, wall = Date.now(), maxB = 0;
  while (t < (+maxSec || 900)) {
    const r = await p.evaluate(() => { window.advanceTime(1000); const s = JSON.parse(window.render_game_to_text()); return s; });
    t += 1; const g = r.game; if (!g) continue;
    maxB = Math.max(maxB, g.nBullets);
    if (g.lives < pl || g.conts > pc) deaths++; pl = g.lives; pc = g.conts;
    const key = g.stage + ':' + g.mode + ':' + (g.boss ? g.boss.name : '-');
    if (key !== last) { console.log(t + 's', key, 'score', g.score, 'lives', g.lives, 'conts', g.conts, 'pw', g.player.power, 'bombs', g.player.bombs, 'deaths', deaths, 'maxBullets', maxB); last = key; }
    if (g.boss && !bossShot[g.boss.name + 'a'] && g.boss.y > 40) { bossShot[g.boss.name + 'a'] = t; }
    if (g.boss && bossShot[g.boss.name + 'a'] && t - bossShot[g.boss.name + 'a'] === 5 && !bossShot[g.boss.name]) { bossShot[g.boss.name] = 1; await shot('s' + g.stage + (g.boss.name)); }
    if (g.mode === 'ending') { await p.evaluate(() => window.advanceTime(3000)); await shot('ending'); break; }
  }
  console.log('game sec', t, 'wall ms', Date.now() - wall, 'deaths', deaths, 'hits(god)', (await p.evaluate(() => JSON.parse(window.render_game_to_text()).game.hits)), 'maxBullets', maxB);
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})();

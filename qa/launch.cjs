// 시험용 브라우저 띄우기 (qa/*.cjs가 함께 쓴다)
// Playwright는 Chromium에 --disable-dev-shm-usage를 붙여 띄운다. 그러면 Chromium이 공유 메모리를 /dev/shm이 아니라 임시 폴더에 쓴다.
// 임시 폴더가 있는 디스크의 여유가 100MB 안팎이면 화면을 찍는 도중 쪽이 죽는다(Target crashed). v0.30을 검사하다 겪은 일이다.
// 그래서 /dev/shm에 여유가 넉넉하면 그 인자를 빼서 /dev/shm을 쓰게 하고, 임시 폴더의 여유가 적으면 알린다.
// /dev/shm이 없는 곳(macOS · Windows)에서는 Playwright의 기본값 그대로 띄운다.
const fs = require('fs'), os = require('os');
const PW = require(process.env.PLAYWRIGHT || '/home/user/node_modules/playwright');
const freeMB = p => { try { const s = fs.statfsSync(p); return Math.floor(s.bavail * s.bsize / 1048576); } catch (e) { return -1; } };
function launch(engine, opts) {
  engine = engine || 'chromium'; opts = Object.assign({}, opts);
  const tmp = freeMB(os.tmpdir()), shm = freeMB('/dev/shm');
  if (engine === 'chromium' && shm >= 512) opts.ignoreDefaultArgs = [].concat(opts.ignoreDefaultArgs || [], '--disable-dev-shm-usage');
  if (tmp >= 0 && tmp < 300) console.log('note 임시 폴더(' + os.tmpdir() + ')가 있는 디스크의 여유가 ' + tmp + 'MB다. 더 줄면 화면을 찍다 브라우저가 죽을 수 있다');
  return PW[engine].launch(opts);
}
module.exports = { PW, launch, freeMB };

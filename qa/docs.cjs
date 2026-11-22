// node qa/docs.cjs -- 문서에 적은 동현랭 예시가 적힌 수를 실제로 출력하는지 본다
const fs = require('fs'), path = require('path'), D = require('../src/donghyun.js');
const root = path.join(__dirname, '..'); let fail = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
ok(D.run(readme.match(/```\n([\s\S]*?)```/)[1]).output === '3\n', 'README 예시는 3을 출력한다');
const h = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const pre = h.slice(h.indexOf('id="tab-protocol"')).match(/<pre[^>]*>([\s\S]*?)<\/pre>/)[1].replace(/<[^>]+>/g, '');
ok(D.run(pre).output === '5\n3\n', '출전 규약 탭 예시는 5 3을 출력한다');
const ver = h.match(/class="edition">v([\d.]+)/)[1];
ok(readme.startsWith('# 동현스 v' + ver), 'README 판 번호 v' + ver);
ok(fs.readFileSync(path.join(root, 'CITATION.cff'), 'utf8').includes('version: "' + ver + '"'), 'CITATION.cff 판 번호');
ok(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').includes('## v' + ver + ' '), 'CHANGELOG 판 번호');
ok(!/요청\s?반영|사용자 요청/.test(readme + fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8') + h), '금지 표현 없음');
console.log(fail ? fail + ' FAILED' : 'all ok'); process.exit(fail ? 1 : 0);

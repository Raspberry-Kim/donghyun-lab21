/* 동현스 앱: 동현랭 편집기 → 출전 규약(생명·폭탄·시작 스테이지·배경 색) → 난이도 → 기체 → 게임.
   조작은 키보드(방향키·X/Space·Z·C)·손가락(끌기)·게임패드. 저장은 브라우저 칸 3개와 .dhsave 파일. */
(function () {
'use strict';
const DS = window.DS, W = DS.W, H = DS.H, S = DS.S, PI = Math.PI;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const Q = new URLSearchParams(location.search), num = (n, d, lo, hi) => { const v = parseInt(Q.get(n), 10); return isNaN(v) ? d : Math.max(lo, Math.min(hi, v)); };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv = $('#game'), R = new DS.Render(cv), IN = new DS.Input(cv), SFX = DS.Sfx, inp = IN.s;
const canvas = cv;
const STEP = 1000 / 60, TURN = 44, NUM = n => Number(n).toLocaleString('ko-KR');
const A = DS.app = { render: R, input: IN,
  scr: 'load', t: 0, sel: 0, diff: num('diff', 0, 0, 2), plane: num('plane', 0, 0, DS.PLANES.length - 1), g: null, live: false, turn: 0, hi: 0, prep: 0, prepFn: null,
  auto: Q.get('auto') === '1' || Q.get('auto') === '2', sloppy: Q.get('auto') === '2', god: Q.get('god') === '1', debug: Q.get('debug') === '1', manual: false, loadI: 0, st: { step: 0, draw: 0, fps: 0, n: 0 }
};
let tab = 'play', menu = null, last = 0, acc = 0;
IN.active = () => A.live && tab === 'play';
IN.onFirst = () => SFX.unlock();
IN.bind($('#b-charge'), 'charge'); IN.bind($('#b-bomb'), 'bomb'); IN.bind($('#b-pause'), 'pause');

/* ---------- 화면 전환·소리·탭 ---------- */
$('#theme').onclick = () => { const dark = document.documentElement.dataset.theme !== 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; $('#theme').setAttribute('aria-pressed', String(dark)); };
const SOUND_KEY = 'donghyuns:sound';
try { if (localStorage.getItem(SOUND_KEY) === 'off') SFX.setMuted(true); } catch (e) { }
function sndUI() { const b = $('#sound'), on = !SFX.muted; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('muted', !on); b.title = on ? '효과음 끄기 (M)' : '효과음 켜기 (M)'; }
function setSound(on) { SFX.setMuted(!on); if (on) SFX.unlock(); try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) { } sndUI(); }
$('#sound').onclick = () => setSound(SFX.muted); sndUI();
const typing = () => { const el = document.activeElement; return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT'); };
document.addEventListener('keydown', e => { if (e.code !== 'KeyM' || e.metaKey || e.ctrlKey || e.altKey || typing()) return; setSound(SFX.muted); });
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  tab = b.dataset.tab;
  document.querySelectorAll('.tabs button').forEach(x => { const on = x.dataset.tab === tab; x.classList.toggle('active', on); on ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current'); });
  document.querySelectorAll('.tab-panel').forEach(p => p.hidden = p.id !== 'tab-' + tab);
  if (tab === 'play') fit(); else { IN.clear(); if (inGame() && !menu && !A.auto) mainMenu(); if (tab === 'rules') planeCards(); }
});
$('.brand').onclick = e => { e.preventDefault(); document.querySelector('[data-tab=play]').click(); scrollTo({ top: 0, behavior: 'smooth' }); };

/* ---------- 규칙 탭의 표 ---------- */
$('#plane-grid').innerHTML = DS.PLANES.map((p, i) => `<article><canvas width="192" height="192" data-plane="${i}" role="img" aria-label="${esc(p.name)} 연필 그림"></canvas><h4>${esc(p.name)}</h4><small>${esc(p.en)}</small><p><b>샷</b> ${esc(p.shot)}</p><p><b>모아 쏘기</b> ${esc(p.charge)}</p><p><b>폭탄</b> ${esc(p.bomb)}</p><p>빠르기 ${'●'.repeat(p.bars[0])}${'○'.repeat(3 - p.bars[0])} · 힘 ${'●'.repeat(p.bars[1])}${'○'.repeat(3 - p.bars[1])} · 넓이 ${'●'.repeat(p.bars[2])}${'○'.repeat(3 - p.bars[2])}</p></article>`).join('');
$('#diff-table').innerHTML = '<thead><tr><th>난이도</th><th>느낌</th><th>적탄 속도</th><th>쏘는 간격</th><th>한 번에 쏘는 탄 수</th><th>작은 적이 쏠 확률</th><th>적의 체력</th></tr></thead><tbody>' + DS.DIFFS.map(d => `<tr><td><b>${d.name}</b></td><td>${d.sub}</td><td>${Math.round(d.bs * 100)}%</td><td>${d.fr}배로 길게</td><td>${Math.round(d.cnt * 100)}%</td><td>${Math.round(d.zp * 100)}%</td><td>${Math.round(d.hp * 100)}%</td></tr>`).join('') + '</tbody>';
$('#stage-table').innerHTML = '<thead><tr><th>스테이지</th><th>이름</th><th>중간 보스</th><th>보스</th><th>적탄 속도 보정</th></tr></thead><tbody>' + DS.STAGES.map((st, i) => { const bs = st.events.filter(e => e.boss).map(e => DS.BOSSES[e.boss].name); return `<tr><td>${i + 1}</td><td><b>${st.name}</b> <small>${st.sub}</small></td><td>${bs.length > 1 ? bs.slice(0, -1).join(' · ') : '—'}</td><td>${bs.length ? bs[bs.length - 1] : '—'}</td><td>×${(1 + 0.06 * i).toFixed(2)}</td></tr>`; }).join('') + '</tbody>';
function planeCards() {
  if (A.scr === 'load') return;
  document.querySelectorAll('#plane-grid canvas').forEach(c => {
    const s = DS.ART.get(DS.PLANES[+c.dataset.plane].spr), f = s.frames[0], g = c.getContext('2d'), k = Math.min(150 / f.width, 150 / f.height);
    g.clearRect(0, 0, c.width, c.height); g.drawImage(f, (c.width - f.width * k) / 2, (c.height - f.height * k) / 2, f.width * k, f.height * k);
  });
}

/* ---------- 동현랭 편집기(동현랭 시리즈와 같은 모양) ---------- */
for(const ex of examples){const o=document.createElement('option');o.value=ex.id;o.textContent=ex.title;$('#example').append(o);}
const DH_TOKEN=/(ㅋㅋ.*$)|(나는 동현이냐\?|동현이구나)|(오겡끼데스까)|(신중동역|신중동|뭉치)|(뿡뿡뿡|뿡뿡|포동이)|(꽥꽥)|(동+현아)|(동+현)|(도오*옹)|(ㅠ+)|(뚱띠|또치)/g;
const DH_CLS=[null,'t-cmt','t-frame','t-halt','t-ctl','t-out','t-in','t-assign','t-var','t-num','t-minus','t-op'];
function dhLine(line){let html='',last=0;line.replace(DH_TOKEN,(m,...gr)=>{const idx=gr[gr.length-2];html+=esc(line.slice(last,idx));const k=gr.slice(0,11).findIndex(x=>x!==undefined)+1;html+=`<span class="${DH_CLS[k]}">${esc(m)}</span>`;last=idx+m.length;return m;});return html+esc(line.slice(last));}
const code=$('#code'), area=document.createElement('div'), hl=document.createElement('div');
area.className='code-area'; hl.id='hl'; hl.setAttribute('aria-hidden','true'); code.parentNode.insertBefore(area,code); area.append(hl,code);
function hlSync(){hl.scrollTop=code.scrollTop;hl.scrollLeft=code.scrollLeft;}
function hlMetrics(){const cs=getComputedStyle(code);for(const p of ['paddingTop','paddingRight','paddingBottom','paddingLeft','fontFamily','fontSize','lineHeight','tabSize','letterSpacing'])hl.style[p]=cs[p];}
function highlight(){hlMetrics();hl.innerHTML=code.value.split('\n').map(l=>`<span class="ln">${dhLine(l)||' '}</span>`).join('')+'<span class="ln"> </span>';hlSync();}
code.addEventListener('scroll',()=>{hlSync();$('#lines').scrollTop=code.scrollTop;});addEventListener('resize',()=>{highlight();fit();});
function indent(){
  const text=code.value,lines=text.split('\n'),lead=l=>l.length-l.replace(/^[ \t]+/,'').length;
  const next=lines.map(l=>{const b=l.slice(lead(l));if(!b)return '';if(b.startsWith('ㅋㅋ'))return '   '+b;const s=b.split('~')[0].replace(/ㅋㅋ.*$/,'').trim();return (s==='나는 동현이냐?'||s==='동현이구나'?'':'  ')+b;});
  const {selectionStart:a,selectionEnd:b,selectionDirection:dir,scrollTop:y,scrollLeft:x}=code;
  const moved=p=>{let o=0,n=0;for(let i=0;i<lines.length;i++){const L=lines[i].length;if(p<=o+L){const c=p-o,ol=lead(lines[i]),nl=lead(next[i]);return n+Math.min(next[i].length,c<ol?nl:c-ol+nl);}o+=L+1;n+=next[i].length+1;}return n;};
  const value=next.join('\n'),na=moved(a),nb=moved(b);if(value===text&&na===a&&nb===b)return;if(value!==text)code.value=value;code.setSelectionRange(na,nb,dir);code.scrollTop=y;code.scrollLeft=x;
}
function codeChanged(e){if(!e?.isComposing)indent();const n=code.value.split('\n').length;$('#line-count').textContent=n+'줄';$('#lines').textContent=Array.from({length:n},(_,i)=>i+1).join('\n');highlight();autoPreview();}
code.addEventListener('compositionend',()=>codeChanged());
function codeLead(){const a=code.selectionStart,v=code.value,ls=v.lastIndexOf('\n',a-1)+1,le=v.indexOf('\n',ls);return {a,ls,lead:/^[ \t]*/.exec(v.slice(ls,le<0?v.length:le))[0].length};}
document.addEventListener('selectionchange',()=>{if(document.activeElement!==code||code.selectionStart!==code.selectionEnd)return;const {a,ls,lead}=codeLead();if(a-ls<lead)code.setSelectionRange(ls+lead,ls+lead);});
code.addEventListener('beforeinput',e=>{const {a,ls,lead}=codeLead();if(a!==code.selectionEnd)return;if(e.inputType==='deleteContentBackward'&&ls>0&&a>ls&&a-ls<=lead){e.preventDefault();code.setRangeText('',ls-1,a,'end');codeChanged();}});
code.oninput=codeChanged;
code.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();sortie();}});
function selectExample(){const ex=examples.find(e=>e.id===$('#example').value);code.value=ex.code;$('#example-note').textContent=ex.note;codeChanged();}
$('#example').onchange=selectExample;
$('#save').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([code.value+'\n'],{type:'text/plain;charset=utf-8'}));a.download='sortie.dh';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('#open').onchange=async e=>{const f=e.target.files[0];if(!f)return;code.value=(await f.text()).replace(/\r/g,'').replace(/\n$/,'');codeChanged();e.target.value='';};
$('#run').onclick=()=>sortie();


/* ---------- 출전 규약: 첫 정수 생명 수(필수) · 둘째 폭탄 수 · 셋째 시작 스테이지 · 넷째 배경 색 ---------- */
const DEFAULT = { lives: 3, bombs: 2, stage: 1, bg: 1 };
let cfg = { lives: num('lives', 3, 1, 9), bombs: num('bombs', 2, 0, 5), stage: num('stage', 1, 1, DS.STAGES.length), bg: num('bg', 1, 1, 2) };
const NSTAGE = DS.STAGES.length, NPAPER = DS.PAPERS.length, NWORD = ['한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'][NSTAGE - 1] || String(NSTAGE);
function parseSortie(out) {
  const tok = out.split(/\s+/).filter(Boolean).map(Number), c = { ...DEFAULT }, err = [];
  if (tok.length === 0) return { c, go: false, err: [] };
  const [li, bo, st, bg] = tok, int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  if (!int(li, 1, 9)) err.push(`첫 정수 ${li}은(는) 생명 수가 아니다. 1~9만 된다.`); else c.lives = li;
  if (!err.length && tok.length >= 2) { if (!int(bo, 0, 5)) err.push(`둘째 정수 ${bo}은(는) 폭탄 수가 아니다. 0~5만 된다.`); else c.bombs = bo; }
  if (!err.length && tok.length >= 3) { if (!int(st, 1, NSTAGE)) err.push(`셋째 정수 ${st}은(는) 시작 스테이지가 아니다. 1~${NSTAGE}만 된다.`); else c.stage = st; }
  if (!err.length && tok.length >= 4) { if (!int(bg, 1, NPAPER)) err.push(`넷째 정수 ${bg}은(는) 배경 색 번호가 아니다. ${DS.PAPERS.map((p, i) => (i + 1) + ' ' + p.name).join(' · ')} 중 하나를 출력하자.`); else c.bg = bg; }
  if (!err.length && tok.length > 4) err.push(`정수가 ${tok.length}개 나왔다. 생명 · 폭탄 · 시작 스테이지 · 배경 색 네 개까지만 읽는다.`);
  return { c, go: !err.length, err };
}
const paperName = c => DS.PAPERS[c.bg - 1].name, stageName = i => DS.STAGES[i].name;
function sortieCard(c) {
  $('#sortie-card').innerHTML = [['생명', `${c.lives}`], ['폭탄', `${c.bombs}`], ['시작 스테이지', `${c.stage} · ${stageName(c.stage - 1)}`], ['배경 색', `${c.bg} · ${paperName(c)}`], ['조작', '방향키 움직이기 · X 또는 Space 샷 · Z 누르고 있다가 떼면 모아 쏘기 · C 폭탄 · 손가락은 끌어서 움직이기']].map(([a, b]) => `<div><span>${a}</span><strong>${b}</strong></div>`).join('');
  $('#stamp-mode').innerHTML = `생명 ${c.lives} <span>폭탄 ${c.bombs}</span>`;
}
function result(text, kind) { const r = $('#result'); r.textContent = text; r.dataset.kind = kind || ''; }
function status(t, kind) { const s = $('#status'); s.textContent = t; s.dataset.kind = kind || ''; }
function readyLabels() { $('#day').textContent = '출전 준비'; $('#turn-badge').textContent = `생명 ${cfg.lives} · 폭탄 ${cfg.bombs}`; $('#tile-info').textContent = `스테이지 ${cfg.stage} 「${stageName(cfg.stage - 1)}」부터. 종이는 ${paperName(cfg)}.`; $('#hint').innerHTML = ''; }
let previewT = 0;
function autoPreview() { clearTimeout(previewT); previewT = setTimeout(() => { if (A.live || A.auto) return;   /* 자동 시험(?auto=1)에서는 주소로 준 값을 그대로 쓴다 */ try { const r = Donghyun.run(code.value, { maxSteps: 300000 }); const p = parseSortie(r.output); if (!p.err.length && p.go) { cfg = p.c; sortieCard(cfg); readyLabels(); } } catch (e) { } }, 250); }
function sortie() {
  if (A.live || A.scr === 'load') return;
  let out;
  try { const r = Donghyun.run(code.value, { maxSteps: 300000 }); out = r.output; }
  catch (e) { result(`동현랭 오류${e.line ? ` (${e.line}줄)` : ''}: ${e.message}`, 'error'); status('동현랭 오류', 'error'); return; }
  const p = parseSortie(out);
  if (p.err.length) { result('출전 규약 오류: ' + p.err[0], 'error'); status('출전 규약 오류', 'error'); return; }
  if (!p.go) { result('정수가 하나도 출력되지 않았다. 첫 정수로 생명 수(1~9)를 출력해야 나선다.', 'error'); status('출전 규약 오류', 'error'); return; }
  cfg = p.c; sortieCard(cfg); go();
}

/* ---------- 준비: 그림을 조금씩 미리 그려 둔다 ---------- */
const WARM = ['p38', 'hayate', 'pancake', 'shinden', 'eb_s', 'eb_l', 'eb_n', 'ps_a', 'ps_w', 'ps_m', 'ps_r', 'ps_h', 'disc', 'beam', 'shin_g', 'wing', 'ring', 'swirl', 'bolt', 'it_p', 'it_b', 'it_m', 'ic_bomb', 'hit', 'scorch', 'prop', 'prop6', 'rotor', 'cloud0', 'cloud1', 'cloud2'];
['s', 'm', 'l'].forEach(k => { for (let i = 0; i < DS.BOOM[k]; i++) WARM.push('boom_' + k + i); });
function warm(then) {
  const t0 = performance.now();
  while (A.loadI < WARM.length && performance.now() - t0 < 24) DS.ART.get(WARM[A.loadI++]);
  draw();
  if (A.loadI < WARM.length) { setTimeout(() => warm(then), 0); return; }
  setTimeout(() => { then(); last = 0; planeCards(); }, 0);
}
/* 종이 색을 바꾼다. 바뀌면 그림을 모두 새로 그린다 */
function setPaper(bg, then) {
  if (!DS.setPaper(bg - 1)) { then(); return; }
  DS.ART.clear(); if (R.paper) R.paper.width = R.paper.height = 0;
  R.paper = DS.makePaper(W * S, H * S, 11); document.documentElement.style.setProperty('--ds-paper', DS.PAPERS[DS.paperIdx].css);
  A.scr = 'load'; A.loadI = 0; setTimeout(() => warm(then), 0);
}
function later(fn) { A.scr = 'prep'; A.prep = 0; A.prepFn = fn; }

/* ---------- 시작·종료 ---------- */
const HINT0 = '<span><kbd>X</kbd>샷</span><span><kbd>Z</kbd>모아 쏘기</span><span><kbd>C</kbd>폭탄</span><span><kbd>↵</kbd>메뉴</span>';
const inGame = () => A.scr === 'game' && !!A.g && A.turn === 0 && (A.g.mode === 'play' || A.g.mode === 'intro');
function liveUI() { $('#setup-panel').hidden = true; $('#hud').hidden = false; $('#board-wrap').classList.add('live'); $('#touchpad').classList.add('on'); $('#full').disabled = false; fit(); $('#board-wrap').focus({ preventScroll: true }); }
function go() {                       // 출전: 종이 색을 맞추고 난이도 고르기로
  A.live = true; A.g = null; closeMenu(); SFX.unlock(); IN.clear();
  liveUI(); if (!A.auto) $('#board-wrap').scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  $('#log').innerHTML = ''; log(`출전. 생명 ${cfg.lives}, 폭탄 ${cfg.bombs}, 스테이지 ${cfg.stage} 「${stageName(cfg.stage - 1)}」부터, ${paperName(cfg)} 종이.`);
  result('출전했다.'); status('난이도 고르기'); $('#day').textContent = '난이도 고르기'; $('#tile-info').textContent = '초급 · 중급 · 상급 가운데 하나를 고른다.'; $('#hint').innerHTML = '<span><kbd>↑</kbd><kbd>↓</kbd>고르기</span><span><kbd>X</kbd>정하기</span><span><kbd>Z</kbd>뒤로</span>'; hud();
  setPaper(cfg.bg, () => { R.prepare(0); A.scr = 'diff'; A.sel = A.diff; A.t = 0; });
}
function startGame() {
  later(() => {
    const st = cfg.stage - 1;
    A.g = new DS.Game({ plane: A.plane, diff: A.diff, hi: A.hi, sfx: SFX.play, god: A.god, stage: st, power: num('power', 0, 0, 3), lives: cfg.lives, bombs: cfg.bombs });
    R.prepare(st); A.turn = 0; A.scr = 'game'; watch = null;
    log(`${DS.DIFFS[A.diff].name}, ${DS.PLANES[A.plane].name}.`);
    $('#hint').innerHTML = HINT0; status('진행 중'); hud();
  });
}
/* 끝판왕을 이긴 축하: 팡파르(약 10초)와 꽃비. 엔딩 화면을 떠나면 함께 멈춘다. 소리를 꺼 두어도 꽃비는 내린다 */
function fete(g) { if (!SFX.pomp()) SFX.play('clear'); DHPETALS.start($('.board-stage.ds-board'), { dur: 10.4, alive: () => A.g === g && g.mode === 'ending', cut: () => SFX.stop() }); }
function feteOff() { DHPETALS.stop(); SFX.stop(); }
function backToSetup() {
  feteOff();
  if (A.g) A.hi = Math.max(A.hi, A.g.hi);
  A.g = null; A.live = false; A.turn = 0; closeMenu(); IN.clear(); watch = null;
  $('#setup-panel').hidden = false; $('#hud').hidden = true; $('#board-wrap').classList.remove('live'); $('#touchpad').classList.remove('on'); exitFull(); $('#full').disabled = true;
  later(() => { R.prepare(0); A.scr = 'ready'; A.t = 0; });
  readyLabels(); status('출전 준비'); result('다시 나서려면 코드를 고치거나 그대로 출전을 누르자.'); renderSlotList(); fit();
}
$('#concede').onclick = () => { if (!A.live || A.scr === 'load' || A.scr === 'prep') return; if (inGame()) confirmMenu('포기하고 출전 준비로 돌아갈까?', [['포기한다', backToSetup], ['계속 간다', () => { }]]); else if (!menu) backToSetup(); };

/* ---------- 옆 칸: 정보·기록 ---------- */
function log(t) { const li = document.createElement('li'); li.textContent = t; const l = $('#log'); l.prepend(li); while (l.children.length > 40) l.lastChild.remove(); }
let hudText = '';
function hud() {
  const g = A.g; let rows;
  if (!g) rows = [['생명', cfg.lives], ['폭탄', cfg.bombs], ['시작 스테이지', `${cfg.stage} · ${stageName(cfg.stage - 1)}`], ['종이', paperName(cfg)]];
  else rows = [['스테이지', `${g.stage + 1} / ${NSTAGE} · ${g.S.name}`], ['난이도', g.D.name], ['기체', g.plane.name], ['점수', NUM(g.score)], ['최고', NUM(Math.max(g.hi, A.hi))], ['생명', g.mode === 'over' ? 0 : g.lives + 1], ['폭탄', g.pl.bombs], ['힘', `${g.pl.power + 1} / 4`], ['이어 하기', g.conts + '번']];
  const html = rows.map(([a, b]) => `<div><span>${a}</span><strong>${esc(b)}</strong></div>`).join('');
  if (html !== hudText) { hudText = html; $('#info-card').innerHTML = html; }
  if (g) { const d = `스테이지 ${g.stage + 1} · ${g.S.name}`, b = `${g.D.name} · ${g.plane.short} · 생명 ${g.mode === 'over' ? 0 : g.lives + 1}`; if ($('#day').textContent !== d) $('#day').textContent = d; if ($('#turn-badge').textContent !== b) $('#turn-badge').textContent = b; }
}
/* 게임 상태가 바뀐 것을 보고 기록을 남긴다 */
let watch = null;
function observe() {
  const g = A.g, w = watch, now = { stage: g.stage, mode: g.mode, lives: g.lives, dead: g.pl.dead > 0, boss: g.boss ? g.boss.bd.name : '', conts: g.conts };
  if (!w || w.stage !== now.stage || (w.mode !== 'intro' && now.mode === 'intro')) { log(`스테이지 ${g.stage + 1} 「${g.S.name}」 시작.`); $('#tile-info').textContent = `${g.S.sub} · ${g.S.name}`; }
  if (w) {
    if (now.boss && w.boss !== now.boss) log(`${now.boss} 등장.`);
    if (!w.dead && now.dead) log(`기체를 잃었다. 남은 예비 기체 ${g.lives}.`);
    if (now.lives > w.lives && now.conts === w.conts) log('기체가 하나 늘었다.');
    if (w.mode !== 'clear' && now.mode === 'clear') { log(`스테이지 ${g.stage + 1} 「${g.S.name}」 클리어. 점수 ${NUM(g.score)}.`); status(`스테이지 ${g.stage + 1} 클리어`); }
    if (w.mode !== 'over' && now.mode === 'over') { log(`게임 오버. 점수 ${NUM(g.score)}.`); status('게임 오버', 'error'); $('#hint').innerHTML = '<span><kbd>↑</kbd><kbd>↓</kbd>고르기</span><span><kbd>X</kbd>정하기</span>'; }
    if (w.mode === 'clear' && now.mode !== 'clear') status('진행 중');
  }
  watch = now;
}

/* ---------- 메뉴(일시정지) ---------- */
function openMenu(title, items, onCancel) { menu = { title, items: items.map(it => Array.isArray(it) ? { label: it[0], fn: it[1] } : it), onCancel }; menu.i = Math.max(0, menu.items.findIndex(it => !it.off)); drawMenu(); IN.clear(); const el = document.activeElement; if (el && el.tagName === 'BUTTON') el.blur(); }
function drawMenu() { const m = $('#menu'); if (!menu) { m.hidden = true; return; } m.hidden = false; m.className = 'game-menu center'; m.innerHTML = (menu.title ? `<h4>${esc(menu.title)}</h4>` : '') + menu.items.map((it, i) => `<div class="mi ${i === menu.i ? 'sel' : ''} ${it.off ? 'off' : ''}" role="menuitem" data-i="${i}"><span>${esc(it.label)}</span>${it.note ? `<small>${esc(it.note)}</small>` : ''}</div>`).join(''); m.querySelectorAll('.mi').forEach(el => el.onclick = e => { e.stopPropagation(); menu.i = +el.dataset.i; pickMenu(); }); const s = m.querySelector('.sel'); if (s) s.scrollIntoView({ block: 'nearest' }); }
function closeMenu() { menu = null; $('#menu').hidden = true; last = 0; }
function cancelMenu() { const c = menu && menu.onCancel; closeMenu(); if (c) c(); }
function pickMenu() { const it = menu.items[menu.i]; if (!it || it.off) return; closeMenu(); SFX.play('ok'); it.fn(); }
function confirmMenu(q, opts, back) { openMenu(q, opts.map(([label, fn]) => ({ label, fn })), back); }
function mainMenu() { openMenu('잠시 멈춤', [['계속 간다', () => { }], [SFX.muted ? '소리 켜기' : '소리 끄기', () => { setSound(SFX.muted); mainMenu(); }], ['저장', saveMenu], ['불러오기', loadMenu], ['포기하고 출전 준비로', () => confirmMenu('포기하고 출전 준비로 돌아갈까?', [['포기한다', backToSetup], ['계속 간다', () => { }]], mainMenu)]]); }
function menuKey(k) {                 // up · down · ok · back
  if (!menu) return;
  if (k === 'up' || k === 'down') { const n = menu.items.length; menu.i = (menu.i + (k === 'up' ? -1 : 1) + n) % n; SFX.play('tick'); drawMenu(); }
  else if (k === 'ok') pickMenu(); else if (k === 'back') cancelMenu();
}
const MENUKEY = { ArrowUp: 'up', ArrowDown: 'down', KeyX: 'ok', Space: 'ok', Enter: 'ok', NumpadEnter: 'ok', KeyZ: 'back', Escape: 'back', KeyP: 'back' };
document.addEventListener('keydown', e => {          // 메뉴가 떠 있는 동안은 키를 여기서 받는다 (파일 고르기 창은 키를 누른 그 자리에서 열어야 한다)
  if (!menu || tab !== 'play' || e.metaKey || e.ctrlKey || e.altKey || typing()) return;
  const k = MENUKEY[e.code]; if (!k) return;
  e.preventDefault(); e.stopPropagation(); if (e.repeat && k !== 'up' && k !== 'down') return; menuKey(k);
});
GP.start({ hint: 'A 샷 · B 모아 쏘기 · X·Y·L 폭탄 · + 메뉴', status: t => status(t),
  down(k) { if (menu) { if (tab === 'play') menuKey(k === 'x' || k === 'enter' ? 'ok' : k === 'z' ? 'back' : k); return; } IN.padDown(k); }, up(k) { IN.padUp(k); } });

/* ---------- 저장·불러오기: 브라우저 칸 3개 + .dhsave 파일 ---------- */
const SAVE_FORMAT = 'donghyuns-save', SAVE_VERSION = 1, SLOT_KEY = n => 'donghyuns:slot' + n, SLOTS = 3;
function snapshot() {
  const g = A.g; if (!g || !inGame()) throw new Error('지금은 저장할 수 없다.');
  const logs = [...$('#log').children].reverse().map(li => li.textContent);
  return { format: SAVE_FORMAT, version: SAVE_VERSION, savedAt: new Date().toISOString(), summary: { stage: g.stage + 1, stageName: g.S.name, diff: g.D.name, plane: g.plane.short, lives: g.lives + 1, bombs: g.pl.bombs, score: g.score }, cfg: { ...cfg }, state: g.save(), logs };
}
function restore(data) {
  if (!data || data.format !== SAVE_FORMAT) throw new Error('동현스 저장 파일이 아니다.');
  if (data.version !== SAVE_VERSION) throw new Error('지원하지 않는 저장 형식 버전이다(' + data.version + ').');
  const g = DS.Game.load(data.state, { sfx: SFX.play, hi: A.hi });             // 맞지 않으면 여기서 멈춘다. 지금 판은 그대로 남는다
  const c = data.cfg || {}, int = (v, lo, hi, d) => Number.isInteger(v) && v >= lo && v <= hi ? v : d;
  cfg = { lives: g.life0, bombs: g.bomb0, stage: int(c.stage, 1, NSTAGE, 1), bg: int(c.bg, 1, NPAPER, 1) };
  feteOff();
  A.g = null; A.live = true; A.turn = 0; closeMenu(); SFX.unlock(); IN.clear(); sortieCard(cfg); liveUI();
  const l = $('#log'); l.innerHTML = ''; for (const t of (Array.isArray(data.logs) ? data.logs : []).slice(-38)) log(String(t).slice(0, 200));
  status('불러오는 중');
  setPaper(cfg.bg, () => {
    R.prepare(g.stage); A.g = g; A.diff = g.diffIdx; A.plane = g.planeIdx; A.scr = 'game'; A.t = 0;
    watch = { stage: g.stage, mode: g.mode, lives: g.lives, dead: g.pl.dead > 0, boss: g.boss ? g.boss.bd.name : '', conts: g.conts };
    log('저장한 판을 불러왔다.'); $('#tile-info').textContent = `${g.S.sub} · ${g.S.name}`; $('#hint').innerHTML = HINT0; status('진행 중'); hud();
    openMenu('저장한 판을 불러왔다. 준비되면 계속 간다.', [['계속 간다', () => { }], ['메뉴', mainMenu]], () => { });
  });
}
function readSlot(n) { try { const t = localStorage.getItem(SLOT_KEY(n)); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function slotNote(d) { if (!d || !d.summary) return '비어 있음'; const t = new Date(d.savedAt), pad = v => String(v).padStart(2, '0'), s = d.summary; return `스테이지 ${s.stage} · ${s.diff} · ${s.plane} · 생명 ${s.lives} · ${t.getMonth() + 1}/${t.getDate()} ${pad(t.getHours())}:${pad(t.getMinutes())}`; }
function toast(t, kind) { log(t); status(t, kind); }
function saveToSlot(n) { let d; try { d = snapshot(); } catch (e) { toast(e.message); return; } try { localStorage.setItem(SLOT_KEY(n), JSON.stringify(d)); toast(`브라우저 칸 ${n}에 저장했다.`); renderSlotList(); } catch (e) { toast('브라우저 저장에 실패했다. 파일로 내려받아 저장하자.'); } }
function deleteSlot(n) { try { localStorage.removeItem(SLOT_KEY(n)); } catch (e) { } renderSlotList(); }
function saveToFile() { let d; try { d = snapshot(); } catch (e) { toast(e.message); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' })); a.download = `donghyuns-stage${d.summary.stage}-${d.summary.score}.dhsave`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast('저장 파일을 내려받았다.'); }
function saveMenu() {
  const items = [];
  for (let n = 1; n <= SLOTS; n++) { const d = readSlot(n); items.push({ label: `브라우저 칸 ${n}`, note: slotNote(d), fn: () => { if (d) confirmMenu(`칸 ${n}에 덮어쓸까?`, [['덮어쓴다', () => { saveToSlot(n); mainMenu(); }], ['그만둔다', saveMenu]], saveMenu); else { saveToSlot(n); mainMenu(); } } }); }
  items.push({ label: '파일로 내려받기', note: '.dhsave', fn: () => { saveToFile(); mainMenu(); } });
  items.push({ label: '브라우저 칸 지우기', note: '', off: !Array.from({ length: SLOTS }, (_, i) => readSlot(i + 1)).some(Boolean), fn: deleteMenu });
  openMenu('저장', items, mainMenu);
}
function deleteMenu() {
  const items = [];
  for (let n = 1; n <= SLOTS; n++) { const d = readSlot(n); items.push({ label: `브라우저 칸 ${n}`, note: slotNote(d), off: !d, fn: () => confirmMenu(`칸 ${n}${n === 2 ? '를' : '을'} 지울까? 되돌릴 수 없다.`, [['지운다', () => { deleteSlot(n); toast(`브라우저 칸 ${n}${n === 2 ? '를' : '을'} 지웠다.`); deleteMenu(); }], ['그만둔다', deleteMenu]], deleteMenu) }); }
  openMenu('지울 칸', items, saveMenu);
}
function loadFrom(d) { try { restore(d); } catch (e) { const msg = '불러오기 실패: ' + e.message; if (A.live) { toast(msg, 'error'); if (inGame() && !menu) mainMenu(); } else { result(msg, 'error'); status('불러오기 실패', 'error'); } } }
function loadMenu() {
  const items = [];
  for (let n = 1; n <= SLOTS; n++) { const d = readSlot(n); items.push({ label: `브라우저 칸 ${n}`, note: slotNote(d), off: !d, fn: () => confirmMenu('지금 판을 버리고 불러올까?', [['불러온다', () => loadFrom(readSlot(n))], ['그만둔다', loadMenu]], loadMenu) }); }
  items.push({ label: '파일에서 불러오기', note: '.dhsave', fn: () => { mainMenu(); $('#load-file').click(); } });
  openMenu('불러오기', items, mainMenu);
}
$('#load-file').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; if (A.scr === 'load' || A.scr === 'prep') return; let d = null; try { d = JSON.parse(await f.text()); } catch (err) { } loadFrom(d); };
$('#load-file-setup').onchange = $('#load-file').onchange;
document.querySelector('.load-head label').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#load-file-setup').click(); } });
function renderSlotList() {
  const box = $('#slot-list'); box.innerHTML = '';
  for (let n = 1; n <= SLOTS; n++) {
    const d = readSlot(n), b = document.createElement('button'); b.className = 'slot-btn'; b.disabled = !d;
    b.innerHTML = `<b>칸 ${n}</b><span>${esc(slotNote(d))}</span>${d && d.summary ? `<small>${esc(d.summary.stageName || '')} · ${NUM(d.summary.score || 0)}점</small>` : ''}`;
    b.onclick = () => { if (A.scr === 'load' || A.scr === 'prep') return; loadFrom(readSlot(n)); };
    const row = document.createElement('div'); row.className = 'slot-row'; row.append(b);
    if (d) {
      const x = document.createElement('button'); x.className = 'slot-del'; x.type = 'button'; x.textContent = '지우기'; x.setAttribute('aria-label', `칸 ${n} 지우기`);
      let t = 0; x.onclick = () => { if (!x.classList.contains('armed')) { x.classList.add('armed'); x.textContent = '정말 지운다'; t = setTimeout(() => { x.classList.remove('armed'); x.textContent = '지우기'; }, 4000); return; } clearTimeout(t); deleteSlot(n); status(`브라우저 칸 ${n}${n === 2 ? '를' : '을'} 지웠다.`); };
      row.append(x);
    }
    box.append(row);
  }
}

/* ---------- 화면 크기 ---------- */
function fit() {
  const full = $('#stage-full'), ratio = canvas.width / canvas.height, h = el => el && el.offsetHeight || 0;
  if (full.classList.contains('fs')) {
    const side = full.classList.contains('side'), cs = getComputedStyle(full);
    let aw = full.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ah = full.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (side) aw -= 2 * 190 + 20; else { const tp = $('#touchpad'); ah -= h(full.querySelector('.board-top')) + h(full.querySelector('.board-bottom')) + (getComputedStyle(tp).display === 'none' ? 0 : h(tp) + 10) + 30; }
    canvas.style.width = Math.floor(Math.max(120, Math.min(aw, ah * ratio))) + 'px'; return;
  }
  const wrap = $('#board-wrap'), cs = getComputedStyle(wrap), w = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); if (!(w > 0)) return;
  const maxH = Math.max(320, innerHeight - 130);
  canvas.style.width = Math.floor(Math.min(w, maxH * ratio)) + 'px';
}

/* ---------- 자동 조종 (시험용) ---------- */
  function autoPilot(g) {
    const p = g.pl, sp = g.plane.speed, B = g.bullets, E = g.enemies, o = { l: 0, r: 0, u: 0, d: 0, ax: 0, ay: 0, tdx: 0, tdy: 0, shot: true, charge: false, shotEdge: (g.t % 20) === 0, bombEdge: false };
    if (A.sloppy && A.autoO && g.t % 12) { const q = A.autoO; q.shotEdge = false; q.bombEdge = false; return q; }
    let tx = W / 2, ty = H - 62, best = -1e9;
    for (let i = 0; i < E.length; i++) { const e = E[i]; if (e.dead || e.dying || e.y < 0 || e.y > p.y - 24 || e.x < 12 || e.x > W - 12) continue; const v = e.y - Math.abs(e.x - p.x) * 0.5 + (e.boss ? 60 : 0); if (v > best) { best = v; tx = e.x; } }
    for (let i = 0; i < g.items.length; i++) { const it = g.items[i]; if (it.y > 40 && Math.abs(it.x - p.x) + Math.abs(it.y - p.y) < 90) { tx = it.x; ty = Math.min(H - 20, Math.max(H - 150, it.y)); } }
    let bd = 1e9, bx = 0, by = 0, d0 = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const k = dx && dy ? 0.7071 : 1; let dg = 0;
      for (let n = 1; n <= 24; n += (n < 8 ? 1 : 3)) {
        const px = Math.max(10, Math.min(W - 10, p.x + dx * k * sp * Math.min(n, 10))), py = Math.max(18, Math.min(H - 14, p.y + dy * k * sp * Math.min(n, 10)));
        for (let i = 0; i < B.length; i++) { const b = B[i], ex = b.x + b.vx * n - px, ey = b.y + b.vy * n - py, rr = b.r + 7; if (ex * ex + ey * ey < rr * rr) dg += (30 - n) * 3; }
        for (let i = 0; i < E.length; i++) { const e = E[i]; if (e.ground || e.dead || e.dying) continue; for (let j = 0; j < e.boxes.length; j++) { const q = e.boxes[j]; if (Math.abs(px - e.x - (e.vx || 0) * n - q[0]) < q[2] + 7 && Math.abs(py - e.y - (e.parent || e.boss ? 0 : (e.vy || 0)) * n - q[1]) < q[3] + 9) dg += (30 - n) * 4; } }
      }
      const fx = p.x + dx * k * sp * 6, fy = p.y + dy * k * sp * 6, sc = dg * 50 + Math.abs(fx - tx) + Math.abs(fy - ty) * 0.7;
      if (!dx && !dy) d0 = dg;
      if (sc < bd) { bd = sc; bx = dx; by = dy; A.autoDg = dg; }
    }
    if (bx < 0) o.l = 1; if (bx > 0) o.r = 1; if (by < 0) o.u = 1; if (by > 0) o.d = 1;
    if (!A.sloppy && A.autoDg > 120 && p.inv <= 0 && p.bombs > 0 && g.bombT <= 0) o.bombEdge = true;
    if (g.boss && g.boss.arrived) { const c = g.t % 260; o.charge = c < 124; }
    A.autoO = o; return o;
  }


/* ---------- 고르기(캔버스 화면) ---------- */
function pick(n, horiz, rects, twoTap) {   // 돌려주는 값: 정한 번호 또는 -1
  let s = A.sel;
  if (horiz ? inp.ml : inp.mu) s = (s + n - 1) % n;
  if (horiz ? inp.mr : inp.md) s = (s + 1) % n;
  if (s !== A.sel) { A.sel = s; SFX.play('tick'); }
  if (inp.tap) for (let i = 0; i < n; i++) { const r = rects[i]; if (inp.tap.x >= r[0] && inp.tap.x <= r[0] + r[2] && inp.tap.y >= r[1] && inp.tap.y <= r[1] + r[3]) { if (twoTap && A.sel !== i) { A.sel = i; SFX.play('tick'); return -1; } A.sel = i; SFX.play('ok'); return i; } }
  if (inp.ok) { SFX.play('ok'); return A.sel; }
  return -1;
}
const backTap = () => !!inp.tap && inp.tap.x < 64 && inp.tap.y < 26;
const DIFF_R = [0, 1, 2].map(i => [28, 84 + i * 62, 184, 50]);
const PLANE_R = DS.PLANES.map((p, i) => [5 + i * 58, 58, 56, 104]);
const OVER_R = [0, 1].map(i => [50, 150 + i * 30, 140, 24]);

/* ---------- 한 걸음 ---------- */
function step() {
  A.t++;
  if (inp.bigEdge && A.live) $('#full').click();
  if (menu) { if (inp.pauseEdge) cancelMenu(); inp.tdx = 0; inp.tdy = 0; IN.endStep(); return; }
  if (A.scr === 'prep') { if (++A.prep === 3) { const f = A.prepFn; A.prepFn = null; f(); } }
  else if (A.scr === 'diff') {
    const c = A.auto && A.t > 20 ? A.diff : pick(3, false, DIFF_R);
    if (c >= 0) { A.diff = c; A.scr = 'plane'; A.sel = A.plane; A.t = 0; status('기체 고르기'); $('#day').textContent = '기체 고르기'; $('#tile-info').textContent = '네 기체 가운데 하나를 고른다.'; $('#hint').innerHTML = '<span><kbd>←</kbd><kbd>→</kbd>고르기</span><span><kbd>X</kbd>정하기</span><span><kbd>Z</kbd>뒤로</span>'; }
    else if (inp.back || backTap()) backToSetup();
  } else if (A.scr === 'plane') {
    const c = A.auto && A.t > 20 ? A.plane : pick(DS.PLANES.length, true, PLANE_R, true);
    if (c >= 0) { A.plane = c; startGame(); }
    else if (inp.back || backTap()) { A.scr = 'diff'; A.sel = A.diff; A.t = 0; status('난이도 고르기'); $('#day').textContent = '난이도 고르기'; $('#hint').innerHTML = '<span><kbd>↑</kbd><kbd>↓</kbd>고르기</span><span><kbd>X</kbd>정하기</span><span><kbd>Z</kbd>뒤로</span>'; }
  } else if (A.scr === 'game') stepGame();
  if (A.scr !== 'game') { inp.tdx = 0; inp.tdy = 0; }
  IN.endStep();
}
function stepGame() {
  const g = A.g;
  if (A.turn > 0) {                                    // 종이를 넘기는 중
    A.turn++;
    if (A.turn === TURN + 3) { R.prepare(g.stage + 1); g.startStage(g.stage + 1); A.turn = 0; observe(); hud(); }
    return;
  }
  if (g.mode === 'over') {
    g.update(inp); observe();
    if (g.modeT <= 50) A.sel = 0;
    else { const c = A.auto ? 0 : pick(2, false, OVER_R); if (c === 0) { g.cont(); log(`이어 하기 ${g.conts}번째. 점수는 0부터 다시 센다.`); $('#hint').innerHTML = HINT0; status('진행 중'); watch = null; observe(); } else if (c === 1) backToSetup(); }
    hud(); return;
  }
  if (g.mode === 'next') {
    if (g.stage < NSTAGE - 1) { A.turn = 1; SFX.play('page'); } else { g.mode = 'ending'; g.modeT = 0; fete(g); log(`축하한다. ${NWORD} 스테이지를 모두 클리어했다. 점수 ${NUM(g.score)}.`); status(`${NWORD} 스테이지 클리어`); $('#hint').innerHTML = '<span><kbd>X</kbd>출전 준비로</span>'; }
    return;
  }
  if (g.mode === 'ending') { g.update(inp); if (g.modeT > 150 && (inp.ok || inp.tap) && !A.auto) backToSetup(); return; }
  if (inp.pauseEdge && (g.mode === 'play' || g.mode === 'intro') && !A.auto) { mainMenu(); return; }
  g.update(A.auto ? autoPilot(g) : inp);
  if (g.hi > A.hi) A.hi = g.hi;
  observe(); if (g.t % 6 === 0) hud();
}

/* ---------- 그리기 ---------- */
const T = (s, x, y, px, al, a, w) => R.text(s, x, y, px, al || 'center', a, w);
function plane(i, x, y, k, t) { const s = R.spr(DS.PLANES[i].spr, x, y, 0, k, k, (t / 10) | 0); if (k === 1) R.props(s, x, y, 0, t, 1); }
function hint(s) { T(s, W / 2, H - 13, 8, 'center', 0.7); }
function menuDraw(items, rects) {
  for (let i = 0; i < items.length; i++) {
    const r = rects[i], on = i === A.sel;
    R.box(r[0], r[1], r[2], r[3], i + (on ? ((A.t / 9) | 0) % 2 * 5 : 0), on ? 1.3 : 0.6, on ? 0.95 : 0.5, on ? 0.75 : 0.4);
    T(items[i], W / 2, r[1] + r[3] / 2 + 0.5, 13, 'center', on ? 1 : 0.6);
  }
}
function draw() {
  const t = A.t, g = A.g;
  if (A.scr === 'load' || A.scr === 'prep') {
    R.draw(null); T('연필 깎는 중', W / 2, H / 2 - 6, 16);
    if (A.scr === 'load') { const k = A.loadI / WARM.length; R.bar(70, H / 2 + 12, 100, 3, k); }
    return;
  }
  if (A.scr === 'ready') {
    R.draw(null); R.backdrop(t * 0.5, 0.5);
    R.title(W / 2, 69, 160); T(DS.SUBTITLE, W / 2, 120, 14, 'center', 0.9);
    [1, 0, 3, 2].forEach((pi, i) => plane(pi, 42 + i * 52, 176 + Math.sin(t * 0.05 + i * 2) * 4 + (i === 1 || i === 2 ? -10 : 0), 1, t + i * 3));
    R.box(30, 214, 180, 50, 3, 0.6, 0.55, 0.6);
    T(`생명 ${cfg.lives} · 폭탄 ${cfg.bombs}`, W / 2, 230, 13);
    T(`스테이지 ${cfg.stage} ${stageName(cfg.stage - 1)}부터 · ${paperName(cfg)}`, W / 2, 249, 9.5, 'center', 0.85);
    if (((t / 32) | 0) % 2 === 0) T('출전을 누르면 시작한다', W / 2, 284, 12);
    if (A.hi > 0) T('최고 ' + A.hi, W / 2, 304, 9, 'center', 0.75);
    return;
  }
  if (A.scr === 'diff') {
    R.draw(null); R.backdrop(t * 0.5 + 300, 0.22);
    T('난이도를 고른다', W / 2, 46, 21);
    DS.DIFFS.forEach((d, i) => {
      const r = DIFF_R[i], on = i === A.sel;
      R.box(r[0], r[1], r[2], r[3], i + (on ? ((t / 9) | 0) % 2 * 5 : 0), on ? 1.4 : 0.6, on ? 0.95 : 0.5, on ? 0.75 : 0.45);
      T(d.name, W / 2, r[1] + 18, 19, 'center', on ? 1 : 0.6); if (d.rec) T('(권장)', W / 2 + 21, r[1] + 19, 11, 'left', on ? 0.9 : 0.55); T(d.sub, W / 2, r[1] + 37, 9.5, 'center', on ? 0.9 : 0.55);
      if (on) plane(A.plane, r[0] + 20, r[1] + 25, 0.6, t);
    });
    hint(IN.touch ? '눌러서 고른다' : '↑↓ 고르기 · X 정하기 · Z 뒤로'); T('← 뒤로', 8, 13, 9.5, 'left', 0.75);
    return;
  }
  if (A.scr === 'plane') {
    R.draw(null); R.backdrop(t * 0.5 + 600, 0.22);
    T('기체를 고른다', W / 2, 34, 21);
    DS.PLANES.forEach((p, i) => {
      const r = PLANE_R[i], on = i === A.sel, cx = r[0] + r[2] / 2;
      R.box(r[0], r[1], r[2], r[3], i + (on ? ((t / 9) | 0) % 2 * 5 : 0), on ? 1.4 : 0.6, on ? 0.95 : 0.5, on ? 0.75 : 0.45);
      plane(i, cx, r[1] + 42 + (on ? Math.sin(t * 0.08) * 3 : 0), 1, on ? t : 0);
      T(p.short, cx, r[1] + 80, 12, 'center', on ? 1 : 0.6); T(p.name.slice(p.short.length + 1), cx, r[1] + 93, 8.5, 'center', on ? 0.95 : 0.55);
    });
    const p = DS.PLANES[A.sel]; R.box(20, 174, 200, 112, 9, 0.6, 0.55, 0.6);
    T(p.name, 30, 188, 13.5, 'left'); T(p.en, 30, 201, 7.5, 'left', 0.7);
    [['샷', p.shot], ['모아 쏘기', p.charge], ['폭탄', p.bomb]].forEach((q, i) => { T(q[0], 30, 217 + i * 14, 9.5, 'left', 0.7); T(q[1], 82, 217 + i * 14, 10.5, 'left'); });
    ['빠르기', '힘', '넓이'].forEach((n, i) => {
      const x = 30 + i * 64; T(n, x, 270, 8.5, 'left', 0.7);
      for (let k = 0; k < 3; k++) { R.box(x + 26 + k * 9, 266.5, 6.5, 6.5, k + i * 3, 0.55, 0.8, k < p.bars[i] ? null : 0); if (k < p.bars[i]) { R.c.globalAlpha = 0.7; R.c.fillStyle = DS.INK; R.c.fillRect((x + 27 + k * 9) * S, 267.5 * S, 4.5 * S, 4.5 * S); R.c.globalAlpha = 1; } }
    });
    hint(IN.touch ? '한 번 더 누르면 정한다' : '←→ 고르기 · X 정하기 · Z 뒤로'); T('← 뒤로', 8, 13, 9.5, 'left', 0.75);
    return;
  }
  // 게임
  R.turn = A.turn > 0 ? Math.min(1, A.turn / TURN) : 0;
  R.draw(g);
  if (A.turn > 0) return;
  if (menu) R.wash(0.38);
  else if (g.mode === 'over') {
    const a = Math.min(0.62, g.modeT / 60); R.wash(a); T('게임 오버', W / 2, 104, 30, 'center', Math.min(1, g.modeT / 40));
    if (g.modeT > 50) { T('점수 ' + g.score, W / 2, 130, 11, 'center', 0.85); menuDraw(['이어 하기', '출전 준비로'], OVER_R); T('이어 하면 점수는 0부터 다시 센다', W / 2, 222, 8.5, 'center', 0.7); }
  } else if (g.mode === 'ending') {
    const a = Math.min(1, g.modeT / 60); R.wash(a * 0.72);
    T('축하한다', W / 2, 66, 14, 'center', a * 0.9); T(NWORD + ' 스테이지 클리어', W / 2, 92, 23, 'center', a);
    plane(A.plane, W / 2, 140 + Math.sin(g.modeT * 0.05) * 4, 1, g.modeT);
    T('점수 ' + g.score, W / 2, 186, 16, 'center', a);
    T(g.D.name + ' · ' + g.plane.name, W / 2, 208, 10, 'center', a * 0.85);
    T(g.conts > 0 ? '이어 하기 ' + g.conts + '번' : '한 번도 이어 하지 않았다', W / 2, 224, 10, 'center', a * 0.85);
    if (g.modeT > 150 && ((g.modeT / 32) | 0) % 2 === 0) T(IN.touch ? '화면을 눌러 출전 준비로' : 'X 키나 화면을 눌러 출전 준비로', W / 2, 262, 11);
  }
}

/* ---------- 돌리기: 1초에 60걸음 ---------- */
let fN = 0, fT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (A.scr === 'load') return;
  if (!last) { last = now; }
  let dt = now - last; last = now;
  if (dt > 100) dt = 100;
  if (Math.abs(dt - STEP) < 2.2) dt = STEP; else if (Math.abs(dt - STEP / 2) < 1.2) dt = STEP / 2;     // 주사율에 맞춰 떨림을 줄인다
  IN.frame();
  if (!A.manual) {
    acc += dt; let n = 0; const t0 = performance.now();
    while (acc >= STEP - 0.01 && n < 6) { step(); acc -= STEP; n++; if (A.scr === 'load') { acc = 0; return; } }
    if (n) A.st.step = A.st.step * 0.95 + (performance.now() - t0) / n * 0.05;
  }
  const t1 = performance.now(); draw(); A.st.draw = A.st.draw * 0.95 + (performance.now() - t1) * 0.05;
  if (A.debug) {
    fN++; if (now - fT > 500) { A.st.fps = fN * 1000 / (now - fT); fN = 0; fT = now; const g = A.g, el = $('#dbg'); if (el) el.textContent = A.st.fps.toFixed(0) + ' fps · 걸음 ' + A.st.step.toFixed(2) + 'ms · 그리기 ' + A.st.draw.toFixed(2) + 'ms' + (g ? ' · 적 ' + g.enemies.length + ' · 탄 ' + g.bullets.length + ' · 내 탄 ' + g.shots.length : ''); }
  }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { IN.clear(); if (inGame() && !A.auto && !menu) mainMenu(); } last = 0; });   /* 다른 탭을 보는 동안 멈추고, 돌아오면 멈춤 메뉴가 떠 있다 */
window.addEventListener('blur', () => { if (inGame() && A.g.mode === 'play' && !A.auto && !menu) mainMenu(); });

/* ---------- 시험용 연결 ---------- */
window.render_game_to_text = () => JSON.stringify({ screen: A.scr, live: A.live, sel: A.sel, cfg, diff: DS.DIFFS[A.diff].id, plane: DS.PLANES[A.plane].id, paper: DS.PAPERS[DS.paperIdx].name, paused: !!menu, menu: menu ? { title: menu.title, items: menu.items.map(it => it.label), i: menu.i } : null, turning: A.turn > 0, muted: SFX.muted, ringing: SFX.ringing, petals: DHPETALS.on, hi: A.hi, game: A.g ? JSON.parse(A.g.text()) : null });
window.advanceTime = ms => { A.manual = true; const n = Math.max(1, Math.round(ms / STEP)); for (let i = 0; i < n; i++) { if (A.scr === 'load') break; IN.frame(); step(); } if (A.scr !== 'load') draw(); return n; };
window.__donghyuns = { A, get cfg() { return cfg; }, set cfg(c) { cfg = c; sortieCard(cfg); }, get menu() { return menu; }, parseSortie, sortie, go, snapshot, restore, loadFrom, readSlot, saveToSlot, mainMenu, menuKey, closeMenu, backToSetup, fit, fete, feteOff, get petals() { return DHPETALS; } };

if (A.debug) { const d = $('#dbg'); if (d) d.hidden = false; }
selectExample(); sortieCard(cfg); readyLabels(); renderSlotList(); fit();

/* ---------- 전체 화면(동현램과 같은 규칙) ---------- */
const stageFull=$('#stage-full');
const fullEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
const canNativeFull=!!((document.fullscreenEnabled||document.webkitFullscreenEnabled)&&(stageFull.requestFullscreen||stageFull.webkitRequestFullscreen));
const isPseudo=()=>stageFull.classList.contains('pseudo-full');
const isFull=()=>fullEl()===stageFull||isPseudo();
const SIDE_MQ=matchMedia('(orientation: landscape) and (pointer: coarse)');
function setPseudo(on){ stageFull.classList.toggle('pseudo-full',on); document.documentElement.classList.toggle('pseudo-full-on',on); onFull(); }
/* 브라우저 전체 화면에서 Esc는 브라우저가 먼저 받아 전체 화면을 닫고 쪽에는 넘기지 않는다(Safari · Firefox · Chrome).
   메뉴를 열려고 누른 Esc에 게임이 멈추지 않은 채 화면만 작아지지 않도록, 닫기 버튼이나 F가 아닌 길로 닫혔으면 메뉴를 연다. */
let wasNative=false, leaving=false;
function exitFull(){ if(isPseudo()) return setPseudo(false); if(fullEl()===stageFull){ leaving=true; (document.exitFullscreen||document.webkitExitFullscreen||(()=>{})).call(document); } }
let hintTimer=0;
function onFull(){ const on=isFull(), native=fullEl()===stageFull;
  if(wasNative&&!native){ if(!leaving&&tab==='play'&&inGame()&&!A.auto&&!menu) mainMenu(); leaving=false; }
  if(native&&!wasNative) leaving=false;
  wasNative=native;
  stageFull.classList.toggle('fs',on); stageFull.classList.toggle('side',on&&SIDE_MQ.matches);
  $('#exit-full').hidden=!on; $('#full').textContent=on?'전체 화면 닫기':'전체 화면';
  clearTimeout(hintTimer); $('#full-hint').hidden=!on; if(on) hintTimer=setTimeout(()=>$('#full-hint').hidden=true,5000);
  fit(); setTimeout(fit,60); if(on) $('#full').blur(); }
document.addEventListener('fullscreenchange',onFull); document.addEventListener('webkitfullscreenchange',onFull);
SIDE_MQ.addEventListener?SIDE_MQ.addEventListener('change',onFull):SIDE_MQ.addListener(onFull);
$('#exit-full').onclick=exitFull;
$('#full').onclick=()=>{ if(isFull()) return exitFull(); if(!A.live) return;
  if(!canNativeFull) return setPseudo(true);
  try{ const r=stageFull.requestFullscreen?stageFull.requestFullscreen():stageFull.webkitRequestFullscreen();
    if(r&&r.catch) r.catch(()=>setPseudo(true)); }catch(e){ setPseudo(true); } };

const fontsReady = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load("700 30px Gaegu", '동현스 0123'), document.fonts.load("400 16px Gaegu", '동현스')]).catch(() => { }) : Promise.resolve();
Promise.race([Promise.all([fontsReady, R.titleReady]), new Promise(r => setTimeout(r, 2500))]).then(() => {
  draw(); requestAnimationFrame(frame);
  setTimeout(() => warm(() => { R.prepare(0); A.scr = 'ready'; A.t = 0; document.body.classList.add('ready'); if (A.auto) go(); }), 0);
});
})();

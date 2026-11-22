/* 입력 — 키보드(방향키·X·Space·Z·C)·게임패드(시리즈 공통 gamepad.js)·손가락(끌기) */
(function () {
  'use strict';
  const DS = window.DS, W = DS.W, H = DS.H;
  const KEY = {
    ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd',
    KeyX: 'shot', Space: 'shot', KeyZ: 'charge', KeyC: 'bomb', ShiftLeft: 'bomb', ShiftRight: 'bomb',
    Enter: 'pause', NumpadEnter: 'pause', Escape: 'pause', KeyP: 'pause', KeyF: 'big'
  };
  /* 게임패드는 gamepad.js가 키보드와 같은 이름으로 알려 준다: A=x(샷) · B=z(모아 쏘기) · X=s · Y=a · L=shift(폭탄) · +=enter(메뉴) */
  const PADKEY = { x: 'shot', z: 'charge', s: 'bomb', a: 'bomb', shift: 'bomb', enter: 'pause', up: 'u', down: 'd', left: 'l', right: 'r' };

  function Input(cv) {
    const s = this.s = { l: 0, r: 0, u: 0, d: 0, ax: 0, ay: 0, tdx: 0, tdy: 0, shot: false, charge: false, shotEdge: false, bombEdge: false, pauseEdge: false, muteEdge: false, bigEdge: false, mu: false, md: false, ml: false, mr: false, ok: false, back: false, tap: null, any: false };
    const k = this.k = {}, pad = this.pad = {}, self = this;
    this.cv = cv; this.touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); this.ptr = null; this.ptr2 = null; this.btnCharge = false; this.onFirst = null; this.active = null;
    const first = () => { if (self.onFirst) self.onFirst(); };

    function edge(a) {
      s.any = true;
      if (a === 'l') s.ml = true; else if (a === 'r') s.mr = true; else if (a === 'u') s.mu = true; else if (a === 'd') s.md = true;
      else if (a === 'shot') { s.shotEdge = true; s.ok = true; }
      else if (a === 'charge') s.back = true;
      else if (a === 'bomb') s.bombEdge = true;
      else if (a === 'pause') s.pauseEdge = true;
      else if (a === 'mute') s.muteEdge = true;
      else if (a === 'big') s.bigEdge = true;
      else if (a === 'back') s.back = true;
    }
    this.edge = edge;

    window.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
      if (self.active && !self.active()) return;                 // 출전하기 전에는 키를 잡지 않는다 (쪽을 굴릴 수 있게)
      const a = KEY[e.code]; if (!a) return;
      if (tg === 'BUTTON' && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')) return;      // 초점이 버튼에 있으면 그 버튼을 누른다
      e.preventDefault(); first();
      if (e.repeat) return;
      if (!k['_' + e.code]) { k[a] = (k[a] || 0) + 1; k['_' + e.code] = a; }      // 떼는 신호를 놓친 키가 두 번 세어져 눌린 채 남지 않게
      edge(a); if (e.code === 'Enter' || e.code === 'NumpadEnter') s.ok = true; if (e.code === 'Escape') s.back = true;
    });
    this.padDown = function (key) { const a = PADKEY[key]; if (!a || (self.active && !self.active())) return; first(); pad[a] = true; edge(a); if (key === 'enter') s.ok = true; };
    this.padUp = function (key) { const a = PADKEY[key]; if (a) pad[a] = false; };
    window.addEventListener('keyup', e => { const a = k['_' + e.code]; if (a) { k[a] = Math.max(0, (k[a] || 0) - 1); delete k['_' + e.code]; } });
    const clear = () => { Object.keys(k).forEach(n => delete k[n]); Object.keys(pad).forEach(n => delete pad[n]); self.ptr = null; self.ptr2 = null; self.btnCharge = false; s.tdx = 0; s.tdy = 0; };
    this.clear = clear;
    window.addEventListener('blur', clear);

    /* 손가락·마우스: 끌면 그만큼 움직인다. 둘째 손가락을 대고 있으면 모아 쏘기 */
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H, k: W / r.width }; };
    cv.addEventListener('pointerdown', e => {
      if (self.active && !self.active()) return;
      first(); e.preventDefault(); const q = pos(e); s.any = true; self.touch = e.pointerType === 'touch';
      if (!self.ptr) { self.ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), lx: q.x, ly: q.y }; try { cv.setPointerCapture(e.pointerId); } catch (_) { } }
      else if (!self.ptr2) self.ptr2 = { id: e.pointerId };
    });
    cv.addEventListener('pointermove', e => {
      const p = self.ptr; if (!p || p.id !== e.pointerId) return;
      const r = cv.getBoundingClientRect(), kx = W / r.width * 1.25;
      s.tdx += (e.clientX - p.x) * kx; s.tdy += (e.clientY - p.y) * kx; p.x = e.clientX; p.y = e.clientY;
    });
    const up = e => {
      const p = self.ptr;
      if (p && p.id === e.pointerId) {
        if (e.type === 'pointerup' && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 12 && performance.now() - p.t < 500) s.tap = { x: p.lx, y: p.ly };
        self.ptr = null; s.tdx = 0; s.tdy = 0;
      } else if (self.ptr2 && self.ptr2.id === e.pointerId) self.ptr2 = null;
    };
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());

    this.bind = function (el, act) {
      if (!el) return;
      if (act === 'charge') {
        const on = e => { e.preventDefault(); first(); self.btnCharge = true; el.classList.add('on'); }, off = () => { self.btnCharge = false; el.classList.remove('on'); };
        el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
      } else el.addEventListener('pointerdown', e => { e.preventDefault(); first(); edge(act); });
      el.addEventListener('contextmenu', e => e.preventDefault());
    };
  }

  /* 화면 한 장마다 한 번: 누르고 있는 상태를 모은다 */
  Input.prototype.frame = function () {
    const s = this.s, k = this.k, pad = this.pad;
    let ax = 0, ay = 0;
    let pads = []; try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (_) { }
    for (let i = 0; i < pads.length; i++) {            // 왼 스틱은 기울인 만큼 (버튼은 gamepad.js가 알려 준다)
      const g = pads[i]; if (!g || g.connected === false) continue;
      const x = g.axes[0] || 0, y = g.axes[1] || 0, m = Math.hypot(x, y);
      if (m > 0.3 && !(this.active && !this.active())) { const q = Math.min(1, m); ax = x / m * q; ay = y / m * q; }
      break;
    }
    s.l = k.l > 0 || !!pad.l; s.r = k.r > 0 || !!pad.r; s.u = k.u > 0 || !!pad.u; s.d = k.d > 0 || !!pad.d;
    s.ax = ax; s.ay = ay;
    s.charge = k.charge > 0 || !!pad.charge || this.btnCharge || !!this.ptr2;
    s.shot = k.shot > 0 || !!pad.shot || !!this.ptr;
  };
  /* 한 걸음이 끝나면 '방금 눌림'을 지운다 */
  Input.prototype.endStep = function () {
    const s = this.s; s.shotEdge = s.bombEdge = s.pauseEdge = s.muteEdge = s.bigEdge = s.mu = s.md = s.ml = s.mr = s.ok = s.back = s.any = false; s.tap = null;
  };
  DS.Input = Input;
})();

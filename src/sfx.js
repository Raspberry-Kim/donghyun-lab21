/* 효과음 — 파일 없이 그 자리에서 만든다 (연필 긁는 소리 느낌) */
(function () {
  'use strict';
  const DS = window.DS;
  let ac = null, master = null, nbuf = null, muted = false; const last = {};
  function init() {
    if (ac) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (_) { ac = null; return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(ac.destination);
    nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nbuf.getChannelData(0); let v = 0;
    for (let i = 0; i < d.length; i++) { v = v * 0.2 + (Math.random() * 2 - 1) * 0.8; d[i] = v; }
  }
  function env(g, t, vol, dur, atk) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (atk || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tone(type, f0, f1, dur, vol, delay) {
    const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, vol, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, f0, f1, type, q, delay, atk) {
    const t = ac.currentTime + (delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = nbuf; s.loop = true; f.type = type || 'lowpass'; f.Q.value = q || 0.8;
    f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    env(g, t, vol, dur, atk); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.02);
  }
  const D = {
    shot() { noise(0.045, 0.07, 4200, 2600, 'bandpass', 1.4); },
    eshot() { noise(0.06, 0.05, 900, 500, 'bandpass', 2); },
    chg() { tone('triangle', 520, 780, 0.09, 0.09); },
    charge() { noise(0.34, 0.2, 700, 3800, 'bandpass', 1.1); tone('triangle', 240, 620, 0.26, 0.09); },
    bomb() { noise(1.3, 0.34, 2600, 120, 'lowpass', 0.7, 0, 0.03); tone('sine', 130, 42, 1.1, 0.3); },
    boom_s() { noise(0.2, 0.2, 1500, 220); },
    boom() { noise(0.42, 0.28, 1100, 110); tone('sine', 120, 50, 0.3, 0.16); },
    bigboom() { noise(1.5, 0.4, 1400, 60, 'lowpass', 0.7, 0, 0.02); tone('sine', 100, 30, 1.2, 0.34); noise(0.5, 0.2, 3000, 600, 'bandpass', 1, 0.15); },
    bossdie() { noise(0.9, 0.3, 2000, 150); tone('sawtooth', 220, 55, 0.8, 0.07); },
    die() { noise(0.6, 0.32, 2400, 140); tone('sawtooth', 440, 60, 0.55, 0.1); },
    item() { tone('triangle', 660, 660, 0.07, 0.11); tone('triangle', 990, 990, 0.12, 0.11, 0.07); },
    medal() { tone('sine', 1320, 1320, 0.05, 0.09); tone('sine', 1760, 1760, 0.1, 0.09, 0.05); },
    warn() { for (let i = 0; i < 4; i++) { tone('square', 330, 330, 0.16, 0.05, i * 0.42); tone('square', 262, 262, 0.16, 0.05, i * 0.42 + 0.2); } },
    clear() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.22, 0.12, i * 0.13)); },
    extend() { [784, 988, 1175, 1568].forEach((f, i) => tone('triangle', f, f, 0.12, 0.12, i * 0.08)); },
    tick() { noise(0.03, 0.08, 3000, 2000, 'bandpass', 2); },
    ok() { tone('triangle', 520, 780, 0.1, 0.1); },
    page() { noise(0.5, 0.16, 500, 5000, 'bandpass', 0.6, 0, 0.1); }
  };
  const GAP = { shot: 0.07, eshot: 0.12, boom_s: 0.05, boom: 0.06, medal: 0.04, item: 0.04 };
  DS.Sfx = {
    unlock() { init(); if (ac && ac.state === 'suspended') ac.resume().catch(() => { }); },
    play(n) {
      if (!ac || muted || ac.state !== 'running' || !D[n]) return;
      const t = ac.currentTime; if (t - (last[n] == null ? -9 : last[n]) < (GAP[n] || 0.02)) return; last[n] = t;
      try { D[n](); } catch (_) { }
    },
    get muted() { return muted; },
    setMuted(m) { muted = !!m; if (master) master.gain.value = muted ? 0 : 0.55; },
    get ready() { return !!ac && ac.state === 'running'; }
  };
})();

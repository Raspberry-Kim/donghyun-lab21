/* 스테이지 바닥 그림 — 세로로 길게(화면 세 장) 그려 두고 되풀이해 흘린다 */
(function () {
  'use strict';
  const DS = window.DS, Pen = DS.Pen, RNG = DS.RNG, W = DS.W, TH = 960, TAU = 6.2832;
  DS.TERRAIN_H = TH;
  const per = (y, k, ph) => Math.sin(TAU * k * y / TH + (ph || 0));     // 위아래가 이어지는 물결

  function waves(p, r, n, x0, x1, a) {
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = 6 + r() * (TH - 12), L = 3 + r() * 5;
      p.line([[x - L, y], [x - L * 0.35, y - 0.9], [x + L * 0.3, y + 0.1], [x + L, y - 0.7]], { s: true, w: 0.3, a: (a || 0.5) * (0.6 + 0.4 * r()), passes: 1, noOver: true });
    }
  }
  function blob(r, cx, cy, rx, ry, n, rough) {
    const pts = [], ph = r() * TAU;
    for (let i = 0; i < n; i++) { const a = ph + i / n * TAU, q = 1 - rough + rough * 2 * r(); pts.push([cx + Math.cos(a) * rx * q, cy + Math.sin(a) * ry * q]); }
    return pts;
  }
  const scl = (pts, cx, cy, k) => pts.map(q => [cx + (q[0] - cx) * k, cy + (q[1] - cy) * k]);
  function trees(p, r, cx, cy, rx, ry, n) {
    for (let i = 0; i < n; i++) { const a = r() * TAU, q = Math.sqrt(r()); p.scribble(cx + Math.cos(a) * rx * q, cy + Math.sin(a) * ry * q, 1.6 + r() * 1.6, { turns: 1.6, w: 0.3, a: 0.6 }); }
  }
  function house(p, r, x, y, w, h, rot) {
    p.at(x, y, rot || 0, q => {
      q.rect(0, 0, w, h, { tone: 0.05, w: 0.4, a: 0.8, hatch: { side: 'b', ang: 0, gap: 1.1, a: 0.5 } });
      q.seg(-w / 2, 0, w / 2, 0, { w: 0.3, a: 0.7, passes: 1 });
    });
  }

  const GEN = [
    /* 1. 종이 바다 */
    function (p, r) {
      waves(p, r, 560, 4, W - 4, 0.55);
      const isl = [[52, 110, 34, 46], [186, 300, 30, 38], [70, 520, 42, 34], [176, 700, 36, 50], [40, 850, 22, 26], [206, 60, 16, 20], [128, 420, 12, 10]];
      isl.forEach(a => {
        const b = blob(r, a[0], a[1], a[2], a[3], 11, 0.2);
        p.poly(scl(b, a[0], a[1], 1.2), { s: true, paper: false, w: 0.26, a: 0.3, passes: 1 });
        p.poly(b, { s: true, w: 0.5, a: 0.9, tone: 0.03 });
        p.poly(scl(b, a[0], a[1], 0.8), { s: true, paper: false, w: 0.3, a: 0.5, passes: 1, hatch: { ang: -0.9, gap: 1.9, a: 0.4, side: 'r', f: 0.45 } });
        trees(p, r, a[0], a[1], a[2] * 0.55, a[3] * 0.55, Math.round(a[2] * a[3] / 60));
        if (a[2] > 28) house(p, r, a[0] - 6, a[1] + 8, 7, 5, 0.3);
      });
      for (let i = 0; i < 18; i++) { const x = 10 + r() * 220, y = 10 + r() * 940; p.poly(blob(r, x, y, 1.5 + r() * 2, 1.2 + r() * 1.5, 5, 0.3), { paper: false, tone: 0.25, w: 0.3, a: 0.6 }); }
    },
    /* 2. 빗금 들판 — 한가운데로 철길이 지나간다 */
    function (p, r) {
      const cw = 60, ch = 64, nx = 5, ny = 15, gx = (i, j) => i * cw + ((i === 0 || i === nx - 1) ? 0 : 0) + (((i * 7 + (j % ny) * 13) % 11) - 5) * 1.6,
        gy = (i, j) => j * ch + (((i * 5 + (j % ny) * 3) % 9) - 4) * 1.8;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx - 1; i++) {
        const q = [[gx(i, j), gy(i, j)], [gx(i + 1, j), gy(i + 1, j)], [gx(i + 1, j + 1), gy(i + 1, j + 1)], [gx(i, j + 1), gy(i, j + 1)]];
        const kind = r();
        p.poly(q, { paper: false, w: 0.32, a: 0.55, passes: 1, hatch: kind < 0.8 ? { ang: r.pick([0, 1.5708, 0.7, -0.7, 0.3]), gap: 2 + r() * 2, a: 0.22 + r() * 0.2 } : null });
        const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2;
        if (kind > 0.8) trees(p, r, cx, cy, 20, 22, 16);
        else if (kind < 0.22 && Math.abs(cx - 120) > 26) { house(p, r, cx - 6, cy - 4, 9, 6, r() * 0.4); house(p, r, cx + 7, cy + 5, 7, 6, r() * 0.4); trees(p, r, cx, cy, 16, 16, 4); }
      }
      const road = []; for (let y = -30; y <= TH + 30; y += 12) road.push([56 + 26 * per(y, 2) + 8 * per(y, 5, 1), y]);
      p.line(road.map(q => [q[0] - 2.2, q[1]]), { s: true, w: 0.4, a: 0.7 }); p.line(road.map(q => [q[0] + 2.2, q[1]]), { s: true, w: 0.4, a: 0.7 });
      for (let y = 0; y < TH; y += 3.2) p.seg(115.6, y, 124.4, y, { w: 0.34, a: 0.5, passes: 1, noOver: true });
      p.seg(117.4, -4, 117.4, TH + 4, { w: 0.45, a: 0.7, noOver: true }); p.seg(122.6, -4, 122.6, TH + 4, { w: 0.45, a: 0.7, noOver: true });
    },
    /* 3. 먹구름 항구 */
    function (p, r) {
      const cx = y => 104 + 20 * per(y, 1) + 7 * per(y, 3, 1);
      const coast = []; for (let y = -30; y <= TH + 30; y += 10) coast.push([cx(y), y]);
      p.line(coast, { s: true, w: 0.55, a: 0.95 });
      p.line(coast.map(q => [q[0] + 3, q[1]]), { s: true, w: 0.26, a: 0.35, passes: 1 });
      for (let y = 4; y < TH; y += 2.2) { const x = cx(y); p.seg(x - 1, y, x - 5 - r() * 5, y + 1.2, { w: 0.28, a: 0.4, passes: 1, noOver: true }); }
      waves(p, r, 300, 112, W - 4, 0.5);
      for (let y = 20; y < TH - 30;) {
        const h = 16 + r() * 22, lim = cx(y + h / 2) - 14; let x = 5;
        while (x < lim - 10) { const w = Math.min(lim - x, 12 + r() * 20); if (r() < 0.86) { p.rect(x + w / 2, y + h / 2, w - 2.4, h - 3, { paper: false, tone: 0.04, w: 0.4, a: 0.75, hatch: { ang: r.pick([0, 1.5708, 0.78]), gap: 1.5 + r() * 1.4, a: 0.3 + r() * 0.2, side: r.pick(['r', 'b', null]) } }); if (r() < 0.4) p.seg(x + 2, y + h / 2, x + w - 3, y + h / 2, { w: 0.28, a: 0.5, passes: 1 }); } x += w; }
        y += h + (r() < 0.3 ? 9 : 2.5);
      }
      [70, 210, 330, 470, 610, 740, 880].forEach((y, i) => {
        const x0 = cx(y) - 2, L = 34 + r() * 30;
        p.rect(x0 + L / 2, y, L, 8, { paper: false, tone: 0.05, w: 0.45, a: 0.85, hatch: { ang: 1.5708, gap: 1.7, a: 0.4 } });
        if (i % 2 === 0) { p.seg(x0 + L * 0.6, y - 4, x0 + L * 0.6, y - 13, { w: 0.5, a: 0.8 }); p.seg(x0 + L * 0.6, y - 13, x0 + L * 0.6 + 12, y - 11, { w: 0.4, a: 0.8 }); p.rect(x0 + L * 0.6, y - 3, 4, 4, { paper: false, tone: 0.4, w: 0.3 }); }
        const bx = x0 + L * 0.5, by = y + 12;
        p.poly([[bx - 9, by], [bx - 5, by - 3], [bx + 7, by - 3], [bx + 9, by], [bx + 7, by + 3], [bx - 5, by + 3]], { s: true, paper: false, tone: 0.1, w: 0.4, a: 0.8 });
      });
      for (let i = 0; i < 9; i++) { const x = 150 + r() * 80, y = 20 + r() * 920; p.ell(x, y, 1.6, 1.6, { paper: false, tone: 0.3, w: 0.3 }); }
    },
    /* 4. 연필심 산맥 */
    function (p, r) {
      const river = []; for (let y = -30; y <= TH + 30; y += 12) river.push([150 + 46 * per(y, 1, 0.6) + 12 * per(y, 4), y]);
      p.line(river.map(q => [q[0] - 2, q[1]]), { s: true, w: 0.34, a: 0.6 }); p.line(river.map(q => [q[0] + 2, q[1]]), { s: true, w: 0.34, a: 0.6 });
      const ridges = [[40, 40, 150], [200, 150, 170], [70, 260, 130], [30, 430, 150], [180, 470, 140], [90, 640, 170], [210, 720, 150], [40, 790, 130], [120, 890, 60]];
      ridges.forEach(a => {
        const pts = []; let x = a[0], y = a[1]; const n = Math.round(a[2] / 16), dir = r() < 0.5 ? 1 : -1;
        for (let i = 0; i <= n; i++) { pts.push([x, y]); x += dir * (4 + r() * 9) * (i % 2 ? 1 : -0.4); y += 14 + r() * 5; x = Math.max(14, Math.min(226, x)); y = Math.min(TH - 8, y); }
        p.line(pts, { w: 0.6, a: 0.95, jit: 0.4 });
        for (let i = 0; i < pts.length - 1; i++) {
          const A = pts[i], B = pts[i + 1], m = 9;
          for (let k = 0; k < m; k++) {
            const t = (k + r() * 0.6) / m, px = A[0] + (B[0] - A[0]) * t, py = A[1] + (B[1] - A[1]) * t, L = 9 + r() * 15;
            p.seg(px + 0.6, py, px + L, py + 2 + r() * 5, { w: 0.34, a: 0.6, passes: 1, noOver: true });
            if (r() < 0.6) p.seg(px - 0.6, py, px - L * 0.7, py + 1 + r() * 4, { w: 0.24, a: 0.3, passes: 1, noOver: true });
          }
        }
        const s = pts[1]; p.poly([[s[0] - 5, s[1] - 2], [s[0], s[1] - 7], [s[0] + 6, s[1] - 1], [s[0] + 2, s[1] + 3], [s[0] - 2, s[1] + 1]], { s: true, paper: false, w: 0.3, a: 0.5, passes: 1 });
      });
      for (let i = 0; i < 170; i++) { const x = 8 + r() * 224, y = 8 + r() * 944; p.line([[x - 1.6, y + 2], [x, y - 2.2], [x + 1.6, y + 2]], { w: 0.3, a: 0.5, passes: 1, noOver: true }); }
    },
    /* 5. 흑연 요새 */
    function (p, r) {
      for (let x = 40; x < W; x += 40) p.seg(x + (r() - 0.5), -4, x + (r() - 0.5), TH + 4, { w: 0.26, a: 0.35, passes: 1, noOver: true });
      for (let y = 0; y < TH; y += 40) p.seg(-2, y, W + 2, y, { w: 0.26, a: 0.35, passes: 1, noOver: true });
      for (let y = 6; y < TH; y += 16) p.seg(118.4, y, 118.4, y + 8, { w: 0.7, a: 0.55, passes: 1, noOver: true });
      for (let y = 6; y < TH; y += 16) p.seg(121.6, y, 121.6, y + 8, { w: 0.7, a: 0.55, passes: 1, noOver: true });
      for (let j = 0; j < 24; j++) {
        const y = 20 + j * 39 + r() * 6, k = r(), left = r() < 0.5, x = left ? 14 + r() * 70 : 156 + r() * 70;
        if (k < 0.3) { const R = 9 + r() * 7; p.ell(x, y, R, R, { paper: false, tone: 0.06, w: 0.5, a: 0.9, hatch: { side: 'r', f: 0.5, ang: -0.9, gap: 1.3, a: 0.45 } }); p.ell(x, y, R * 0.45, R * 0.45, { paper: false, w: 0.3, a: 0.6, passes: 1 }); for (let i = 0; i < 8; i++) { const a = i * 0.785; p.seg(x + Math.cos(a) * R * 0.45, y + Math.sin(a) * R * 0.45, x + Math.cos(a) * R, y + Math.sin(a) * R, { w: 0.24, a: 0.45, passes: 1, noOver: true }); } }
        else if (k < 0.6) { const w = 22 + r() * 26, h = 12 + r() * 12; p.rect(x, y, w, h, { paper: false, tone: 0.1, w: 0.5, a: 0.9, hatch: { ang: r.pick([0, 1.5708]), gap: 1.5, a: 0.5 } }); p.rect(x, y, w * 0.5, h * 0.4, { paper: false, tone: 0.3, w: 0.3 }); }
        else if (k < 0.8) { const L = 30 + r() * 50; p.seg(x - L / 2, y - 1.6, x + L / 2, y - 1.6, { w: 0.4, a: 0.8 }); p.seg(x - L / 2, y + 1.6, x + L / 2, y + 1.6, { w: 0.4, a: 0.8 }); for (let q = -L / 2; q < L / 2; q += 9) p.seg(x + q, y - 2.6, x + q, y + 2.6, { w: 0.4, a: 0.7, passes: 1, noOver: true }); }
        else { const w = 30 + r() * 20; p.rect(x, y, w, 6, { paper: false, w: 0.45, a: 0.85, hatch: { ang: 0.9, gap: 2.2, a: 0.7, w: 0.5 } }); }
      }
      for (let i = 0; i < 26; i++) { let x = 10 + r() * 220, y = 10 + r() * 940; const pts = [[x, y]]; for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 9; y += 2 + r() * 5; pts.push([x, y]); } p.line(pts, { w: 0.24, a: 0.4, passes: 1 }); }
    },
    /* 6. 모눈 도시 — 모눈종이 위의 길과 지붕. 큰길이 가운데로 지나고 가로줄 길이 여섯 번 건넌다 */
    function (p, r) {
      for (let x = 0; x <= W; x += 20) p.seg(x, -4, x, TH + 4, { w: 0.2, a: 0.3, passes: 1, noOver: true });
      for (let y = 0; y < TH; y += 20) p.seg(-2, y, W + 2, y, { w: 0.2, a: 0.3, passes: 1, noOver: true });
      const A0 = 105, A1 = 135, ST = 160, HW = 10;
      for (let k = 0; k < 6; k++) {
        const y0 = k * ST + HW, y1 = (k + 1) * ST - HW;
        [A0, A1].forEach(x => p.seg(x, y0, x, y1, { w: 0.45, a: 0.7, noOver: true }));
        for (let y = y0 + 6; y < y1 - 6; y += 14) p.seg(120, y, 120, y + 7, { w: 0.4, a: 0.5, passes: 1, noOver: true });
        [[-2, A0], [A1, W + 2]].forEach(q => { p.seg(q[0], y0, q[1], y0, { w: 0.45, a: 0.7, noOver: true }); p.seg(q[0], y1, q[1], y1, { w: 0.45, a: 0.7, noOver: true }); for (let x = q[0] + 8; x < q[1] - 8; x += 14) p.seg(x, y1 + HW, x + 7, y1 + HW, { w: 0.36, a: 0.45, passes: 1, noOver: true }); });
        for (let x = A0 + 3; x < A1 - 1; x += 4) { p.seg(x, y0 - 4, x, y0 - 1, { w: 0.4, a: 0.5, passes: 1, noOver: true }); p.seg(x, y1 + 1, x, y1 + 4, { w: 0.4, a: 0.5, passes: 1, noOver: true }); }      // 건널목
        /* 한 구역을 지붕 여러 개로 나눈다 */
        [[3, A0 - 3], [A1 + 3, W - 3]].forEach(q => {
          let y = y0 + 3;
          while (y < y1 - 14) {
            const h = Math.min(y1 - 3 - y, 20 + r() * 26); let x = q[0];
            while (x < q[1] - 12) {
              const w = Math.min(q[1] - x, 18 + r() * 30), cx = x + w / 2, cy = y + h / 2, k2 = r();
              if (k2 < 0.12) trees(p, r, cx, cy, w * 0.4, h * 0.4, Math.round(w * h / 50));
              else {
                p.rect(cx, cy, w - 3, h - 3, { paper: false, tone: 0.03 + r() * 0.05, w: 0.4, a: 0.62, hatch: { ang: r.pick([0, 1.5708, 0.78, -0.78]), gap: 1.9 + r() * 1.8, a: 0.16 + r() * 0.12, side: r.pick(['r', 'b', 'r', 'b', null]), f: 0.45 } });
                if (k2 < 0.4) p.rect(cx + (r() - 0.5) * w * 0.3, cy + (r() - 0.5) * h * 0.3, w * 0.36, h * 0.36, { paper: false, tone: 0.13, w: 0.3, a: 0.55 });
                else if (k2 < 0.58) { p.ell(cx - w * 0.2, cy, 2.6, 2.6, { paper: false, tone: 0.16, w: 0.3, a: 0.6 }); p.ell(cx + w * 0.2, cy, 2.6, 2.6, { paper: false, tone: 0.16, w: 0.3, a: 0.6 }); }
                else if (k2 < 0.63 && w > 24 && h > 22) { p.ell(cx, cy, 7, 7, { paper: false, w: 0.36, a: 0.5, passes: 1 }); p.seg(cx - 2.4, cy - 3, cx - 2.4, cy + 3, { w: 0.4, a: 0.55, passes: 1 }); p.seg(cx + 2.4, cy - 3, cx + 2.4, cy + 3, { w: 0.4, a: 0.55, passes: 1 }); p.seg(cx - 2.4, cy, cx + 2.4, cy, { w: 0.4, a: 0.55, passes: 1 }); }
                else if (k2 < 0.84) p.seg(x + 3, cy, x + w - 3, cy, { w: 0.28, a: 0.5, passes: 1 });
              }
              x += w;
            }
            y += h;
          }
        });
      }
      for (let i = 0; i < 16; i++) { const y = 20 + r() * 920, up = r() < 0.5; p.rect(up ? 112.5 : 127.5, y, 4, 7, { paper: false, tone: 0.2, w: 0.3, a: 0.65 }); }      // 큰길의 차
    },
    /* 7. 백지 하늘 — 아직 아무것도 그리지 않은 종이. 옅은 밑그림 선, 지우개 자국, 구름 윤곽만 있다 */
    function (p, r) {
      for (let i = 0; i < 9; i++) {
        const cx = 20 + r() * 200, cy = 50 + i * 104 + r() * 30, rx = 34 + r() * 30, ry = 14 + r() * 10, n = 12, pts = [];
        for (let k = 0; k < n; k++) { const a = k / n * TAU, q = 0.8 + 0.34 * r(); pts.push([cx + Math.cos(a) * rx * q, cy + Math.sin(a) * ry * q]); }
        p.poly(pts, { s: true, paper: false, w: 0.34, a: 0.42, passes: 1, hatch: { side: 'b', f: 0.4, ang: 0.2, gap: 2.2, a: 0.16 } });
      }
      [[0.34, 60], [-0.3, 380], [0.22, 700]].forEach(q => { const y0 = q[1]; p.seg(-4, y0, W + 4, y0 + q[0] * W, { w: 0.22, a: 0.3, passes: 1, noOver: true }); p.seg(-4, y0 + 5, W + 4, y0 + 5 + q[0] * W, { w: 0.2, a: 0.2, passes: 1, noOver: true }); });      // 자를 대고 그은 밑그림 선
      for (let i = 0; i < 7; i++) {      // 밑그림의 동그라미와 가운데 십자
        const x = 30 + r() * 180, y = 70 + i * 128 + r() * 40, R0 = 9 + r() * 12;
        p.ell(x, y, R0, R0, { paper: false, w: 0.24, a: 0.3, passes: 1 }); p.seg(x - R0 - 3, y, x + R0 + 3, y, { w: 0.2, a: 0.28, passes: 1, noOver: true }); p.seg(x, y - R0 - 3, x, y + R0 + 3, { w: 0.2, a: 0.28, passes: 1, noOver: true });
      }
      for (let i = 0; i < 12; i++) {      // 지우개로 문지른 자국
        const x = 20 + r() * 200, y = 20 + r() * 920, L = 10 + r() * 16, a = -0.5 + r() * 0.4;
        for (let k = 0; k < 5; k++) p.seg(x + k * 1.6, y + k * 0.9, x + k * 1.6 + Math.cos(a) * L, y + k * 0.9 + Math.sin(a) * L, { w: 0.9, a: 0.1, passes: 1, noOver: true });
      }
      for (let i = 0; i < 40; i++) { const x = 8 + r() * 224, y = 8 + r() * 944; p.line([[x - 2, y], [x, y - 0.8], [x + 2.4, y - 0.2]], { s: true, w: 0.24, a: 0.3, passes: 1, noOver: true }); }
    }
  ];

  DS.makeTerrain = function (stage) {
    const p = new Pen(W, TH, 9000 + stage * 131, { noFill: true, origin: [0, 0], k: 0.82, bold: 1.45, ink: '#3a3a40' });
    GEN[stage](p, RNG(4242 + stage * 17));
    return p.done(0.42);
  };
})();

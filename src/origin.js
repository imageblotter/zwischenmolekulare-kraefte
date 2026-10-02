  // ------------------------------------------------------------------ "how the force comes into being"
  // A step player (one canvas, a list of stages) per tab. Spliced into app.js at /*ORIGIN*/.
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const mix = (a, b, t) => a + (b - a) * t;
  const wob = (t, k) => clamp(((Math.sin(1.7 * t + k * 1.9) + Math.sin(2.9 * t + k * 4.1 + 1.3) + Math.sin(4.3 * t + k * 2.3 + 2.1)) / 3) * 1.3, -1, 1);
  const DEG = Math.PI / 180;
  const ANIM_FRAC = 0.62;
  const rotPt = (cx, cy, ang, x, y) => { const c = Math.cos(ang), s = Math.sin(ang); return [cx + c * x - s * y, cy + s * x + c * y]; };

  function pill(ctx, str, x, y, color, alpha, size) {
    if (alpha < 0.02) return;
    size = size || 13;
    ctx.save();
    ctx.font = '700 ' + size + 'px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(str).width + 14, h = size + 9;
    ctx.globalAlpha = alpha * 0.92; ctx.fillStyle = COL.surface; ctx.strokeStyle = COL.border; ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); else ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fill(); ctx.stroke();
    ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillText(str, x, y + 0.5);
    ctx.restore();
  }
  function note(ctx, str, x, y, align, alpha, color) {
    if (alpha < 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha; ctx.fillStyle = color || COL.dim; ctx.font = '600 12px "Source Sans 3", sans-serif';
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y);
    ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, color, w, head, alpha) {
    if (alpha < 0.02) return;
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head);
    ctx.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function track(ctx, x, y, w, h) {
    ctx.fillStyle = COL.surface2; ctx.strokeStyle = COL.border; ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y - h / 2, w, h, h / 2); else ctx.rect(x, y - h / 2, w, h);
    ctx.fill(); ctx.stroke();
  }

  // ---------------------------------------------------------------- London dispersion
  function ldAtom(ctx, o, cx, cy, r, shift, lab, speed, seed) {
    const clk = o.clk;
    ctx.save();
    ctx.fillStyle = COL.surface2; ctx.strokeStyle = COL.border; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke();
    const ccx = cx + shift * r * 0.36;
    const g = ctx.createRadialGradient(ccx, cy, 1, ccx, cy, r * 0.62);
    g.addColorStop(0, COL.neg + 'bb'); g.addColorStop(1, COL.neg + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ccx, cy, r * 0.62, 0, TAU); ctx.fill();
    ctx.fillStyle = COL.neg;
    for (let k = 0; k < 10; k++) {
      const dir = k % 2 ? 1 : -1, a = k * 2.399 + seed + clk * speed * (0.5 + 0.35 * (k % 3)) * dir;
      const rho = r * (0.08 + 0.26 * (((k * 37) % 10) / 10));
      const ex = ccx + Math.cos(a) * rho * 1.05 + Math.sin(clk * 5 * speed + k) * r * 0.03, ey = cy + Math.sin(a) * rho * 0.9;
      ctx.beginPath(); ctx.arc(ex, ey, Math.max(2, r * 0.05), 0, TAU); ctx.fill();
    }
    ctx.fillStyle = COL.pos; ctx.beginPath(); ctx.arc(cx, cy, r * 0.13, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.round(r * 0.22) + 'px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+', cx, cy + 0.5);
    ctx.restore();
    if (lab > 0.02) {
      const s = shift >= 0 ? 1 : -1, a = lab * clamp(Math.abs(shift) / 0.45, 0, 1);
      pill(ctx, 'δ−', cx + s * r * 0.55, cy - r - 14, COL.neg, a);
      pill(ctx, 'δ+', cx - s * r * 0.55, cy - r - 14, COL.pos, a);
    }
  }

  function ldTrace(o, ctx, W, H) {
    const x0 = W * 0.1, x1 = W * 0.9, top = H * 0.76, h = H * 0.2, T = 6, yz = top + h * 0.28, amp = h * 0.26, yb = top + h, clk = o.clk, hist = o.hist;
    ctx.save();
    ctx.lineWidth = 1; ctx.strokeStyle = COL.grid; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(x0, yz + 0.5); ctx.lineTo(x1, yz + 0.5); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = COL.border; ctx.beginPath(); ctx.moveTo(x0, yb + 0.5); ctx.lineTo(x1, yb + 0.5); ctx.stroke();
    ctx.beginPath(); ctx.rect(x0, top - 4, x1 - x0, h + 8); ctx.clip();
    const X = (t) => x1 - ((clk - t) / T) * (x1 - x0);
    ctx.fillStyle = COL.attract; ctx.globalAlpha = 0.85;
    for (let j = 1; j < hist.length; j++) {
      const v = clamp(hist[j].a * hist[j].b, 0, 1) * h * 0.34, xr = X(hist[j].t), xl = X(hist[j - 1].t);
      if (v > 0.3) ctx.fillRect(xl, yb - v, Math.max(1, xr - xl + 0.5), v);
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    [['a', COL.s[0]], ['b', COL.s[1]]].forEach(([key, col]) => {
      ctx.strokeStyle = col; ctx.beginPath();
      hist.forEach((q, j) => { const px = X(q.t), py = yz - q[key] * amp; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.stroke();
    });
    ctx.restore();
    // legend
    let lx = x0;
    [['Dipol von A', COL.s[0], 'line'], ['Dipol von B', COL.s[1], 'line'], ['Anziehung', COL.attract, 'box']].forEach(([txt, col, kind]) => {
      ctx.save();
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 2;
      if (kind === 'line') { ctx.beginPath(); ctx.moveTo(lx, top - 12); ctx.lineTo(lx + 14, top - 12); ctx.stroke(); } else ctx.fillRect(lx, top - 16, 14, 8);
      ctx.restore();
      note(ctx, txt, lx + 19, top - 12, 'left', 1, COL.ink);
      ctx.font = '600 12px "Source Sans 3", sans-serif'; lx += 19 + ctx.measureText(txt).width + 18;
    });
    note(ctx, 'letzte 6 s', x1, top - 12, 'right', 1);
  }

  function ldCompare(o, ctx, W, H, u) {
    const cy = H * 0.38, clk = o.clk, e = ease(seg(o.p, 0, 0.3));
    const pairs = [
      { cx: W * 0.27, r: 1.05 * u, amp: 0.45, seed: 11, name: 'Kleine Wolke (wie F₂)', k: 'avgS' },
      { cx: W * 0.73, r: 1.6 * u, amp: 0.95, seed: 23, name: 'Große Wolke (wie I₂)', k: 'avgL' },
    ];
    pairs.forEach((pr) => {
      const gap = 0.9 * pr.r, xa = pr.cx - (pr.r + gap / 2), xb = pr.cx + (pr.r + gap / 2);
      const sA = e * pr.amp * clamp(1.8 * wob(clk * 0.9, pr.seed), -1, 1), sB = e * pr.amp * 0.8 * clamp(1.8 * wob(clk * 0.9 - 0.3, pr.seed), -1, 1);
      ldAtom(ctx, o, xa, cy, pr.r, sA, 1, 1, pr.seed);
      ldAtom(ctx, o, xb, cy, pr.r, sB, 1, 1, pr.seed + 1);
      const a = clamp(sA * sB, 0, 1);
      if (o.adv) o[pr.k] += (a - o[pr.k]) * (1 - Math.exp(-o.dt * 0.7));
      ctx.save();
      ctx.strokeStyle = COL.attract; ctx.globalAlpha = 0.2 + 0.7 * clamp(a / 0.6, 0, 1); ctx.lineWidth = 1 + 3.5 * clamp(a / 0.6, 0, 1); ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(xa + pr.r + 2, cy); ctx.lineTo(xb - pr.r - 2, cy); ctx.stroke();
      ctx.restore();
      pill(ctx, pr.name, pr.cx, H * 0.72, COL.ink, 1, 12);
      const bw = Math.min(W * 0.34, 4 * pr.r + gap), bx = pr.cx - bw / 2, by = H * 0.84;
      track(ctx, bx, by, bw, 9);
      ctx.fillStyle = COL.attract; ctx.beginPath();
      const fw = bw * clamp(o[pr.k] / 0.5, 0, 1);
      if (fw > 1) { if (ctx.roundRect) ctx.roundRect(bx, by - 4.5, fw, 9, 4.5); else ctx.rect(bx, by - 4.5, fw, 9); ctx.fill(); }
      note(ctx, 'mittlere Anziehung', pr.cx, H * 0.93, 'center', 1);
    });
  }

  function drawLondon(o, ctx, W, H) {
    const u = Math.min(W / 16, H / 8), i = o.i, p = o.p, clk = o.clk;
    if (i === 6) return ldCompare(o, ctx, W, H, u);
    const r = 1.9 * u, cy = H * 0.4;
    let sA = 0, sB = 0, labA = 0, labB = 0, field = 0, attr = 0, close = 0, speed = 1;
    if (i === 1) { sA = 0.32 * wob(clk * 1.1, 1); sB = 0.32 * wob(clk * 1.1, 2); speed = 2.4; }
    else if (i === 2) { const e = ease(p); sA = mix(0.32 * wob(clk * 1.1, 1), -1, e); sB = 0.32 * wob(clk * 1.1, 2) * (1 - e); labA = e; speed = mix(2.4, 1, e); }
    else if (i === 3) { const e = ease(p); sA = -1; sB = -0.7 * e; labA = 1; labB = e; field = e; }
    else if (i === 4) { sA = -1; sB = -0.7; labA = labB = 1; attr = ease(seg(p, 0, 0.5)); close = ease(seg(p, 0.25, 1)); }
    else if (i === 5) {
      const e = ease(seg(p, 0, 0.35));
      sA = mix(-1, 0.95 * wob(clk * 0.9, 3), e); sB = mix(-0.7, 0.8 * wob(clk * 0.9 - 0.3, 3), e);
      labA = labB = 1; attr = clamp(sA * sB / 0.7, 0, 1); close = 0.5 + 0.5 * attr;
    }
    const gap = 3.0 * u - close * 0.6 * u, cxA = W / 2 - (r + gap / 2), cxB = W / 2 + (r + gap / 2);
    if (o.adv) { o.hist.push({ t: clk, a: sA, b: sB }); while (o.hist.length && clk - o.hist[0].t > 6.5) o.hist.shift(); }
    ldAtom(ctx, o, cxA, cy, r, sA, labA, speed, 1);
    ldAtom(ctx, o, cxB, cy, r, sB, labB, speed, 4);
    if (field > 0.02) for (const k of [-1, 0, 1]) { const y = cy + k * r * 0.42; arrow(ctx, cxB - r * 0.5, y, cxA + r + 6, y, COL.attract, 1.6, 7, field * 0.85); }
    if (attr > 0.02) {
      const xa = cxA + r + 3, xb = cxB - r - 3, L = Math.min(0.4 * (xb - xa), 26);
      ctx.save(); ctx.strokeStyle = COL.attract; ctx.globalAlpha = 0.25 + 0.5 * attr; ctx.lineWidth = 1 + 2 * attr; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(xa, cy); ctx.lineTo(xb, cy); ctx.stroke(); ctx.restore();
      arrow(ctx, xa, cy, xa + L, cy, COL.attract, 1.5 + 2 * attr, 6 + 4 * attr, attr);
      arrow(ctx, xb, cy, xb - L, cy, COL.attract, 1.5 + 2 * attr, 6 + 4 * attr, attr);
      if (i === 4) pill(ctx, 'Anziehung', W / 2, cy + r + 18, COL.attract, attr);
    }
    if (i === 5) ldTrace(o, ctx, W, H);
  }

  // ---------------------------------------------------------------- dipole-dipole
  function dpMol(ctx, o, cx, cy, ang, u, st) {
    const rA = 0.5 * u, rB = mix(0.5, 0.82, st.uneq) * u, d = 1.5 * u;
    const xA = -(d + rB - rA) / 2, xB = xA + d;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    const atom = (x, r, col, a) => {
      ctx.fillStyle = COL.surface2; ctx.strokeStyle = COL.border; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, 0, r, 0, TAU); ctx.fill();
      if (a > 0.01) { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, 0, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.beginPath(); ctx.arc(x, 0, r, 0, TAU); ctx.stroke();
    };
    atom(xA, rA, COL.pos, 0.55 * st.chg); atom(xB, rB, COL.neg, 0.55 * st.chg);
    if (!st.simple) {
      const xc = (xA + xB) / 2 + st.shift * 0.3 * d, ry = rA * 0.8, rx = d * 0.5 + (rA + rB) * 0.38;
      ctx.save(); ctx.translate(xc, 0); ctx.scale(rx / ry, 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry); g.addColorStop(0, COL.neg + 'cc'); g.addColorStop(1, COL.neg + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, ry, 0, TAU); ctx.fill(); ctx.restore();
      ctx.fillStyle = COL.neg;
      for (let k = 0; k < 2; k++) {
        ctx.beginPath(); ctx.arc(xc + Math.sin(o.clk * 3.1 + k * 3.4) * rx * 0.3, Math.sin(o.clk * 2.3 + k * 2.1) * ry * 0.5, 3, 0, TAU); ctx.fill();
      }
      if (st.arrow > 0.01) {
        const y = -(rB + 1.0 * u);
        arrow(ctx, xA, y, xB, y, COL.ink, 2, 9, st.arrow);
        ctx.save(); ctx.globalAlpha = st.arrow; ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(xA - 4, y); ctx.lineTo(xA + 4, y); ctx.moveTo(xA, y - 4); ctx.lineTo(xA, y + 4); ctx.stroke(); ctx.restore();
      }
    }
    ctx.restore();
    const w = (lx, ly) => rotPt(cx, cy, ang, lx, ly);
    if (!st.simple) {
      ctx.save(); ctx.fillStyle = COL.ink; ctx.font = '700 ' + Math.round(0.42 * u) + 'px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const pa = w(xA, 0), pb = w(xB, 0);
      ctx.fillText('H', pa[0], pa[1] + 1);
      ctx.globalAlpha = 1 - st.uneq; ctx.fillText('H', pb[0], pb[1] + 1);
      ctx.globalAlpha = st.uneq; ctx.fillText('Cl', pb[0], pb[1] + 1);
      ctx.restore();
      if (st.en > 0.02) {
        const ea = w(xA, rA + 0.6 * u), eb = w(xB, rB + 0.6 * u);
        note(ctx, 'EN 2,2', ea[0], ea[1], 'center', st.en);
        note(ctx, 'EN 2,2', eb[0], eb[1], 'center', st.en * (1 - st.uneq));
        note(ctx, 'EN 3,2', eb[0], eb[1], 'center', st.en * st.uneq);
      }
      if (st.arrow > 0.01) { const m = w((xA + xB) / 2, -(rB + 1.0 * u) - 16); pill(ctx, 'Dipol', m[0], m[1], COL.ink, st.arrow, 12); }
    }
    if (st.chg > 0.02 && !st.simple) {
      const pa = w(xA, -(rA + 0.55 * u)), pb = w(xB, -(rB + 0.55 * u));
      pill(ctx, 'δ+', pa[0], pa[1], COL.pos, st.chg); pill(ctx, 'δ−', pb[0], pb[1], COL.neg, st.chg);
    }
    return { ext: (d + rA + rB) / 2 };
  }

  function dpMeet(o, ctx, W, H, U) {
    const u = U * 1.6, p = o.p, cy = H * 0.46;
    const rotP = ease(seg(p, 0.28, 0.72)), ang2 = Math.PI * (1 - rotP), score = Math.cos(ang2);
    const x1 = W * 0.3, x2 = W * 0.7 - score * 0.25 * u;
    const st = { uneq: 1, shift: 1, chg: 1, arrow: 0, en: 0 };
    const m1 = dpMol(ctx, o, x1, cy, 0, u, st);
    dpMol(ctx, o, x2, cy, ang2, u, st);
    const gl = x1 + m1.ext, gr = x2 - m1.ext, mid = (gl + gr) / 2, L = Math.abs(score) * Math.min((gr - gl) * 0.4, 34);
    if (score < 0) { arrow(ctx, mid, cy, mid - L, cy, COL.repel, 2 + 2 * -score, 9, -score); arrow(ctx, mid, cy, mid + L, cy, COL.repel, 2 + 2 * -score, 9, -score); }
    else { arrow(ctx, gl + 2, cy, gl + 2 + L, cy, COL.attract, 2 + 2 * score, 9, score); arrow(ctx, gr - 2, cy, gr - 2 - L, cy, COL.attract, 2 + 2 * score, 9, score); }
    pill(ctx, score < -0.15 ? 'gleiche Ladungen: Abstoßung' : score > 0.15 ? 'entgegengesetzte Ladungen: Anziehung' : 'dreht sich …', W / 2, H * 0.08, score < -0.15 ? COL.repel : score > 0.15 ? COL.attract : COL.dim, 1);
    // energy meter
    const mw = W * 0.34, mx = W / 2 - mw / 2, my = H * 0.9;
    track(ctx, mx, my, mw, 9);
    ctx.fillStyle = score >= 0 ? COL.attract : COL.repel;
    const fw = Math.abs(score) * mw / 2;
    if (fw > 1) { ctx.beginPath(); ctx.rect(score >= 0 ? W / 2 : W / 2 - fw, my - 4, fw, 8); ctx.fill(); }
    ctx.strokeStyle = COL.dim; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W / 2, my - 8); ctx.lineTo(W / 2, my + 8); ctx.stroke();
    note(ctx, 'Abstoßung', mx - 8, my, 'right', 1); note(ctx, 'Anziehung', mx + mw + 8, my, 'left', 1);
  }

  const DP_RAND = Array.from({ length: 15 }, (_, k) => ((k * 2654435761) % 1000) / 1000 * TAU);
  function dpBulk(o, ctx, W, H, U) {
    const u = U * 0.75, e = ease(seg(o.p, 0.1, 0.8)), clk = o.clk;
    const xs = W * 0.17, ys = H * 0.23, x0 = W / 2 - 2 * xs - xs * 0.25, y0 = H * 0.5 - ys;
    const st = { uneq: 1, shift: 1, chg: 1, arrow: 0, en: 0, simple: true };
    const ext = (1.5 + 0.5 + 0.82) * u / 2;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const k = r * 5 + c, tgt = r % 2 ? Math.PI : 0;
      const d0 = ((DP_RAND[k] - tgt + Math.PI) % TAU + TAU) % TAU - Math.PI;
      const ang = tgt + d0 * (1 - e) + 0.6 * mix(1, 0.15, e) * wob(clk * 1.4, k);
      const x = x0 + c * xs + (r % 2) * xs * 0.5 + 3 * (1 - e) * wob(clk * 1.1, k + 40), y = y0 + r * ys + 3 * (1 - e) * wob(clk * 1.3, k + 70);
      dpMol(ctx, o, x, y, ang, u, st);
      if (c < 4 && e > 0.3) arrow(ctx, x + ext + 1, y, x + xs - ext - 1, y, COL.attract, 1.4, 5, (e - 0.3) / 0.7 * 0.85);
    }
    note(ctx, 'orangefarbenes Ende δ+   ·   blaues Ende δ−', W / 2, H * 0.06, 'center', 1);
    pill(ctx, e < 0.35 ? 'zufällige Ausrichtung' : e < 0.95 ? 'richten sich aus …' : 'Kopf an Schwanz: niedrigere Energie', W / 2, H * 0.92, e > 0.95 ? COL.attract : COL.dim, 1);
  }

  function drawDipole(o, ctx, W, H) {
    const U = Math.min(W / 16, H / 8), i = o.i, p = o.p;
    if (i === 4) return dpMeet(o, ctx, W, H, U);
    if (i === 5) return dpBulk(o, ctx, W, H, U);
    const st = { uneq: 0, shift: 0, chg: 0, arrow: 0, en: 0 };
    if (i === 1) { st.uneq = ease(seg(p, 0, 0.45)); st.shift = ease(seg(p, 0.35, 0.9)); st.en = ease(seg(p, 0.2, 0.6)); }
    else if (i >= 2) {
      st.uneq = 1; st.shift = 1; st.en = 0.6;
      st.chg = i === 2 ? ease(seg(p, 0, 0.5)) : 1;
      st.arrow = i === 3 ? ease(seg(p, 0, 0.5)) : 0;
    }
    dpMol(ctx, o, W / 2, H * 0.56, 0, U * 1.9, st);
  }

  // ---------------------------------------------------------------- hydrogen bonding
  function hbLine(ctx, x1, y1, x2, y2, s) {
    if (s < 0.02) return;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = COL.surface; ctx.globalAlpha = 0.6 * s; ctx.lineWidth = 3 + 3.5 * s;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = COL.attract; ctx.globalAlpha = 0.35 + 0.65 * s; ctx.lineWidth = 1.2 + 2.2 * s; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }
  function glow(ctx, x, y, r, color, a) {
    if (a < 0.02) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color + 'cc'); g.addColorStop(1, color + '00');
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  function lobe(ctx, x, y, u, ang, a) {
    if (a < 0.02) return;
    const d = 0.72 * u;
    ctx.save(); ctx.translate(x + Math.cos(ang) * d, y + Math.sin(ang) * d); ctx.rotate(ang);
    ctx.globalAlpha = 0.4 * a; ctx.fillStyle = COL.neg; ctx.beginPath(); ctx.ellipse(0, 0, 0.46 * u, 0.24 * u, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = a; ctx.strokeStyle = COL.neg; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  function hbNetwork(o, ctx, W, H, u, th0, orient, arms) {
    const p = o.p, cy = H * 0.48, cx = mix(W * 0.34, W * 0.5, ease(seg(p, 0, 0.3)));
    const D = 2.5 * u, dFar = 7.5 * u, dirs = [0, 104.5 * DEG, -75.5 * DEG, 180 * DEG];
    const tip = (x, y, th, k) => armTip(x, y, u, th, arms[k], true);
    const nb = [];
    for (let k = 0; k < 4; k++) {
      const f = k === 0 ? 1 : ease(seg(p, 0.1 + 0.17 * k, 0.5 + 0.17 * k)), phi = dirs[k], d = mix(dFar, D, f);
      const donorNb = k >= 2;
      nb.push({ k, f, donorNb, x: cx + Math.cos(phi) * d, y: cy + Math.sin(phi) * d, th: donorNb ? orient(0, phi + Math.PI) : orient(2, phi + Math.PI) });
    }
    nb.forEach((n) => drawMolecule(ctx, n.x, n.y, u, n.th, 'H2O', true, true));
    drawMolecule(ctx, cx, cy, u, th0, 'H2O', true, true);
    let count = 0;
    nb.forEach((n) => {
      const s = n.k === 0 ? 1 : ease(seg(n.f, 0.55, 1));
      if (n.f > 0.97) count++;
      if (s < 0.02) return;
      const a = n.donorNb ? tip(n.x, n.y, n.th, 0) : tip(cx, cy, th0, n.k);
      const b = n.donorNb ? tip(cx, cy, th0, n.k) : tip(n.x, n.y, n.th, 2);
      hbLine(ctx, a[0], a[1], b[0], b[1], s);
    });
    pill(ctx, count + ' von 4 Wasserstoffbrücken am mittleren Molekül', W / 2, H * 0.94, count === 4 ? COL.attract : COL.dim, 1, 12);
  }

  function drawHbond(o, ctx, W, H) {
    const i = o.i, p = o.p, clk = o.clk;
    const uMain = Math.min(H * 0.17, W * 0.125), uNet = Math.min(H * 0.135, W * 0.08);
    const u = i === 5 ? mix(uMain, uNet, ease(seg(p, 0, 0.3))) : uMain;
    const arms = Sim.MOLECULES.H2O.arms, cy = H * 0.48, x1 = W * 0.34;
    const tipD = 0.86 * u, dBond = 2.5 * u, dFar = 3.9 * u;
    const orient = (k, phi) => -phi - arms[k].a;
    const th0 = orient(0, 0);
    if (i === 5) return hbNetwork(o, ctx, W, H, u, th0, orient, arms);
    const tip = (x, y, th, k) => armTip(x, y, u, th, arms[k], true);
    const T0 = tip(x1, cy, th0, 0), T1 = tip(x1, cy, th0, 1);

    // acceptor placement per stage
    let acc = null;
    if (i === 2) acc = { alpha: ease(seg(p, 0, 0.4)), x: x1 + dFar + (1 - ease(seg(p, 0, 0.45))) * 3 * u, y: cy, th: orient(2, Math.PI), lobes: ease(seg(p, 0.3, 0.8)) };
    else if (i === 3) {
      const d = mix(dFar, dBond, ease(seg(p, 0, 0.7)));
      acc = { alpha: 1, x: x1 + d, y: cy, th: orient(2, Math.PI), lobes: 1, close: 1 - (d - dBond) / (dFar - dBond) };
    } else if (i === 4) {
      let f = 0;
      if (p < 0.15) f = 0; else if (p < 0.4) f = ease(seg(p, 0.15, 0.4)); else if (p < 0.7) f = 1 - 2 * ease(seg(p, 0.4, 0.7)); else f = -(1 - ease(seg(p, 0.7, 0.95)));
      const beta = f * 50 * DEG, L = dBond - tipD;
      acc = { alpha: 1, x: T0[0] + Math.cos(beta) * L, y: T0[1] + Math.sin(beta) * L, th: orient(2, beta + Math.PI), lobes: 0, beta };
    }

    // glow behind the donor H
    const pulse = 1 + 0.15 * Math.sin(clk * 3);
    if (i === 1) glow(ctx, T0[0], T0[1], 1.0 * u * pulse, COL.pos, 0.5 * ease(p));
    else if (i === 2 || i === 3) glow(ctx, T0[0], T0[1], 0.9 * u, COL.pos, 0.3);

    drawMolecule(ctx, x1, cy, u, th0, 'H2O', true, true);
    if (acc) {
      drawMolecule(ctx, acc.x, acc.y, u, acc.th, 'H2O', true, true);
      if (acc.lobes > 0.02) for (const k of [2, 3]) lobe(ctx, acc.x, acc.y, u, tip(acc.x, acc.y, acc.th, k)[2], acc.lobes);
    }

    // stages 0-2: polarisation of the O-H bonds
    if (i <= 2) {
      const pol = i === 0 ? ease(p) : 1;
      [T0, T1].forEach((T) => {
        const dx = T[0] - x1, dy = T[1] - cy, len = Math.hypot(dx, dy), nx = dy / len * 0.34 * u, ny = -dx / len * 0.34 * u;
        const gx = x1 + dx * 0.62, gy = cy + dy * 0.62;
        glow(ctx, gx, gy, 0.42 * u, COL.neg, 0.55 * pol);
        arrow(ctx, x1 + dx * 0.92 - nx, cy + dy * 0.92 - ny, x1 + dx * 0.38 - nx, cy + dy * 0.38 - ny, COL.neg, 1.6, 6, pol * 0.9);
      });
      pill(ctx, 'δ−', x1 - 0.95 * u, cy - 0.95 * u, COL.neg, pol);
      pill(ctx, 'δ+', T0[0], T0[1] - 0.85 * u, COL.pos, pol);
      pill(ctx, 'δ+', T1[0] - 0.55 * u, T1[1] + 0.85 * u, COL.pos, pol);
    }
    if (i === 1) {
      const a = ease(seg(p, 0.15, 0.6)), px = T0[0] + 1.9 * u, py = cy - 1.7 * u;
      ctx.save(); ctx.globalAlpha = a * 0.7; ctx.strokeStyle = COL.dim; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px - 0.9 * u, py + 0.2 * u); ctx.lineTo(T0[0] + 0.25 * u, T0[1] - 0.3 * u); ctx.stroke(); ctx.restore();
      pill(ctx, 'fast ein nacktes Proton', px, py, COL.pos, a);
    }
    if (i === 2) {
      const a = acc.lobes;
      pill(ctx, 'freies Elektronenpaar (δ−)', acc.x - 0.78 * u, cy - 1.15 * u, COL.neg, a);
    }
    if (i === 3) {
      const LP = tip(acc.x, acc.y, acc.th, 2);
      hbLine(ctx, T0[0], T0[1], LP[0], LP[1], acc.close);
      const a = ease(seg(p, 0.55, 0.9));
      pill(ctx, 'δ+', T0[0], T0[1] - 0.85 * u, COL.pos, 1);
      pill(ctx, 'δ−', LP[0], LP[1] - 0.85 * u, COL.neg, 1);
      pill(ctx, 'Wasserstoffbrücke', (T0[0] + LP[0]) / 2, cy + 1.2 * u, COL.attract, a);
      note(ctx, 'kovalente O–H-Bindung: 96 pm', W * 0.06, H * 0.86, 'left', a);
      note(ctx, 'Wasserstoffbrücke H···O: etwa 180 pm (nicht maßstabsgetreu)', W * 0.06, H * 0.93, 'left', a);
    }
    if (i === 4) {
      const beta = acc.beta, bd = beta / DEG, s = Math.pow(Math.max(0, Math.cos(beta)), 1.5);
      // straight reference line through the donor O-H
      ctx.save(); ctx.strokeStyle = COL.dim; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(x1, cy); ctx.lineTo(T0[0] + 2.2 * u, cy); ctx.stroke(); ctx.restore();
      const LP = tip(acc.x, acc.y, acc.th, 2);
      hbLine(ctx, T0[0], T0[1], LP[0], LP[1], s);
      // angle arc and label
      const aa = clamp(Math.abs(bd) / 10, 0, 1);
      ctx.save(); ctx.strokeStyle = COL.ink; ctx.globalAlpha = aa; ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (beta >= 0) ctx.arc(T0[0], T0[1], 0.55 * u, beta, Math.PI); else ctx.arc(T0[0], T0[1], 0.55 * u, Math.PI, TAU + beta);
      ctx.stroke(); ctx.restore();
      const above = beta >= 0;
      pill(ctx, 'O–H···O  ' + Math.round(180 - Math.abs(bd)) + '°', T0[0] + 0.5 * u, T0[1] + (above ? -1.45 : 1.45) * u, COL.ink, 1, 12);
      // strength bar
      const bw = W * 0.34, bx0 = W / 2 - bw / 2, bY = H * 0.9;
      track(ctx, bx0, bY, bw, 9);
      if (s > 0.01) { ctx.fillStyle = COL.attract; ctx.beginPath(); ctx.rect(bx0, bY - 4, bw * s, 8); ctx.fill(); }
      note(ctx, 'Bindungsstärke', bx0 - 8, bY, 'right', 1);
      note(ctx, s > 0.7 ? 'stark' : s > 0.3 ? 'schwächer' : 'schwach', bx0 + bw + 8, bY, 'left', 1, COL.ink);
    }
  }

  // ---------------------------------------------------------------- specs and player
  const ORIGIN = {
    vdw: {
      title: 'Wie die Van-der-Waals-Kräfte entstehen',
      sub: 'Zwei neutrale Atome beobachten: Nichts ist geladen, und doch ziehen sie sich an. Die Schritte anklicken oder die Animation laufen lassen.',
      alt: 'Animation: schwankende Elektronenwolken in zwei neutralen Atomen erzeugen momentane und induzierte Dipole, die sich anziehen.',
      draw: drawLondon,
      stages: [
        { t: 'Zwei neutrale Atome', d: 5, x: 'Jedes Atom hat einen positiven Kern, umgeben von einer negativen Elektronenwolke. Im zeitlichen Mittel ist die Wolke symmetrisch: Keines der Atome hat einen Dipol, und es gibt nichts, was das andere anzieht.' },
        { t: 'Elektronen stehen nie still', d: 7, x: 'Die Elektronen sind ständig in Bewegung. In jedem einzelnen Augenblick ist die Wolke daher leicht einseitig verteilt. Diese Schwankungen dauern nur etwa eine Femtosekunde (10⁻¹⁵ s).' },
        { t: 'Ein momentaner Dipol', d: 7, x: 'Kurzzeitig halten sich mehr Elektronen auf einer Seite des linken Atoms auf. Diese Seite ist leicht negativ (δ−), die andere leicht positiv (δ+): ein kurzlebiger Dipol in einem Atom, das keinen permanenten Dipol hat.' },
        { t: 'Er induziert einen Dipol im Nachbarn', d: 7, x: 'Die δ+-Seite des ersten Atoms zieht an den Elektronen des Nachbaratoms, die sich zu ihr hin verschieben. Das Nachbaratom hat nun einen induzierten Dipol, der in dieselbe Richtung zeigt.' },
        { t: 'Die beiden Dipole ziehen sich an', d: 7, x: 'Das δ+-Ende des einen Atoms liegt nun dem δ−-Ende des anderen gegenüber, die Atome ziehen sich an. Diese schwache Anziehung ist die Van-der-Waals-Kraft.' },
        { t: 'Im Mittel nie null', d: 12, x: 'Beide Dipole wechseln immer wieder ihre Richtung, aber stets gemeinsam. Die einander zugewandten Ladungen sind daher immer entgegengesetzt. Die Anziehung (grün) ist deshalb ständig vorhanden, obwohl jeder Dipol für sich im Mittel null ergibt.' },
        { t: 'Größere Wolke, stärkere Kraft', d: 10, x: 'Eine größere Elektronenwolke lässt sich leichter verformen: Ihre Schwankungen sind größer und die Anziehung ist stärker. Deshalb kondensieren die schwereren Halogene leichter: F₂ ist ein Gas, I₂ ein Feststoff.' },
      ],
    },
    dipole: {
      title: 'Wie die Dipol-Dipol-Anziehung entsteht',
      sub: 'Alles beginnt in einer einzelnen Bindung. Die Schritte anklicken oder die Animation laufen lassen.',
      alt: 'Animation: ungleich geteilte Bindungselektronen erzeugen Teilladungen und einen permanenten Dipol; polare Moleküle drehen sich so, dass sie sich anziehen.',
      draw: drawDipole,
      stages: [
        { t: 'Gleichmäßiges Teilen', d: 6, x: 'In einer Bindung zwischen gleichen Atomen, etwa in H₂, liegen die gemeinsamen Elektronen in der Mitte. Keines der Enden ist geladen, das Molekül hat keinen Dipol.' },
        { t: 'Ein Atom zieht stärker', d: 7, x: 'Wird ein Atom durch ein elektronegativeres ersetzt (Cl: 3,2; H: 2,2), zieht es die gemeinsamen Elektronen stärker an. Die Bindungswolke verschiebt sich zu ihm hin.' },
        { t: 'Teilladungen entstehen', d: 6, x: 'Die verschobene Wolke macht das H-Ende leicht positiv (δ+) und das Cl-Ende leicht negativ (δ−). Die Ladungen sind Teilladungen, kleiner als ein ganzes Elektron.' },
        { t: 'Ein permanenter Dipol', d: 6, x: 'Die Ladungstrennung wird als Pfeil gezeichnet, der zum δ−-Ende zeigt. Anders als die flackernden Dipole der Van-der-Waals-Kräfte ist dieser Dipol dauerhaft: Er steckt in der Bindung selbst.' },
        { t: 'Nachbarn drehen sich passend', d: 10, x: 'Zwei polare Moleküle spüren die Ladungen des anderen. Gleiche Enden gegenüber (δ−···δ−) stoßen sich ab, deshalb dreht sich ein Molekül, bis sich entgegengesetzte Enden gegenüberliegen (δ+···δ−). Das zieht an und senkt die Energie.' },
        { t: 'Im Stoff: Ordnung', d: 10, x: 'In einer ganzen Probe geschieht das überall. Ist die Temperatur niedrig genug, richten sich die Moleküle Kopf an Schwanz aus, und das hält die Probe stärker zusammen als Van-der-Waals-Kräfte allein.' },
      ],
    },
    hbond: {
      title: 'Wie Wasserstoffbrücken entstehen',
      sub: 'Sie bauen auf einer sehr polaren Bindung und einem freien Elektronenpaar auf. Die Schritte anklicken oder die Animation laufen lassen.',
      alt: 'Animation: Eine sehr polare O-H-Bindung lässt Wasserstoff fast nackt zurück; er wird von einem freien Elektronenpaar eines benachbarten Wassermoleküls angezogen, am stärksten entlang einer Geraden.',
      draw: drawHbond,
      stages: [
        { t: 'Eine stark polare O–H-Bindung', d: 6, x: 'Sauerstoff (Elektronegativität 3,4) zieht die Bindungselektronen viel stärker an als Wasserstoff (2,2). O wird δ−, jedes H wird δ+.' },
        { t: 'H bleibt fast nackt zurück', d: 6, x: 'Wasserstoff hat nur ein Elektron und keine innere Schale, die den Kern abschirmt. Ist dieses Elektron weggezogen, wirkt das H-Ende wie eine fast nackte, konzentrierte positive Ladung.' },
        { t: 'Ein freies Elektronenpaar als Ziel', d: 7, x: 'Das O eines Nachbarmoleküls trägt freie Elektronenpaare: konzentriert, negativ und in bestimmte Richtungen weisend. Nur kleine, stark elektronegative Atome (N, O, F) bieten sowohl ein fast nacktes H als auch ein kräftiges freies Paar.' },
        { t: 'Das H wird zum Elektronenpaar gezogen', d: 8, x: 'Entgegengesetzte Ladungen ziehen sich an: Das δ+-H und das freie Elektronenpaar nähern sich bis auf etwa 180 pm (die kovalente O–H-Bindung ist 96 pm lang). Diese Anziehung ist die Wasserstoffbrücke: viel schwächer als eine kovalente Bindung, aber stärker als die beiden anderen zwischenmolekularen Kräfte.' },
        { t: 'Sie ist gerichtet', d: 11, x: 'Am stärksten ist die Anziehung, wenn O–H···O eine Gerade bildet und das freie Paar genau auf H zeigt. Knickt man sie ab, rücken die Ladungen auseinander, und die Bindung wird schnell schwächer.' },
        { t: 'Bis zu vier Brücken pro Wasser', d: 11, x: 'Jedes H₂O hat zwei H zum Abgeben und zwei freie Elektronenpaare zum Aufnehmen, kann also vier Wasserstoffbrücken bilden. Dieses Netzwerk erklärt, warum Wasser so viel höher schmilzt und siedet als H₂S. HF und NH₃ bilden nur Ketten, da sie jeweils nur ein H oder nur ein freies Paar haben.' },
      ],
    },
  };

  class Origin {
    constructor(host, key) {
      this.key = key; this.spec = ORIGIN[key]; const st = this.spec.stages;
      this.i = 0; this.tIn = 0; this.p = 0; this.clk = 0; this.last = 0; this.dt = 0; this.adv = false; this.paused = reduceMotion;
      this.hist = []; this.avgS = 0; this.avgL = 0; this.shown = -1; this.W = 0;
      if (reduceMotion) this.tIn = st[0].d * ANIM_FRAC;
      host.innerHTML =
        '<div class="card origin-card"><div class="origin-top"><h3>' + this.spec.title + '</h3><p class="hint">' + this.spec.sub + '</p></div>' +
        '<div class="origin-body"><div class="origin-stage"><canvas role="img" aria-label="' + this.spec.alt + '"></canvas></div>' +
        '<div class="origin-side"><ol class="steps">' +
        st.map((s, k) => '<li><button class="step" data-i="' + k + '"><span class="n">' + (k + 1) + '</span><span class="t">' + s.t + '</span></button><p class="st" hidden>' + s.x + '</p></li>').join('') +
        '</ol><div class="btnrow"><button class="btn o-back">Zurück</button><button class="btn o-play">' + (this.paused ? 'Abspielen' : 'Pause') + '</button><button class="btn o-next">Weiter</button></div></div></div></div>';
      this.stageEl = $('.origin-stage', host); this.canvas = $('canvas', host); this.ctx = this.canvas.getContext('2d');
      this.steps = [...host.querySelectorAll('.step')]; this.texts = [...host.querySelectorAll('.st')];
      this.playBtn = $('.o-play', host);
      this.steps.forEach((b) => b.addEventListener('click', () => this.go(+b.dataset.i, true)));
      $('.o-back', host).addEventListener('click', () => this.go((this.i + st.length - 1) % st.length, true));
      $('.o-next', host).addEventListener('click', () => this.go((this.i + 1) % st.length, true));
      this.playBtn.addEventListener('click', () => { this.paused = !this.paused; this.playBtn.textContent = this.paused ? 'Abspielen' : 'Pause'; });
      this.syncUI(true);
    }
    go(i, user) {
      const st = this.spec.stages;
      this.i = i; this.tIn = 0; this.hist = [];
      if (user) {
        if (reduceMotion) { this.paused = true; this.tIn = st[i].d * ANIM_FRAC; } else this.paused = false;
        this.playBtn.textContent = this.paused ? 'Abspielen' : 'Pause';
      }
    }
    resize() {
      const cw = this.stageEl.clientWidth;
      if (!cw) return;
      this.W = cw >= 520 ? 640 : 420; this.H = cw >= 520 ? 320 : 300;
      this.stageEl.style.aspectRatio = this.W + '/' + this.H;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      this.k = cw / this.W; this.dpr = dpr;
      this.canvas.width = Math.round(cw * dpr); this.canvas.height = Math.round((cw * this.H / this.W) * dpr);
    }
    syncUI(force) {
      if (force || this.shown !== this.i) {
        this.shown = this.i;
        this.steps.forEach((b, k) => { if (k === this.i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); this.texts[k].hidden = k !== this.i; });
      }
      this.steps[this.i].style.setProperty('--p', (this.tIn / this.spec.stages[this.i].d).toFixed(3));
    }
    frame() {
      const now = performance.now(), dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0;
      this.last = now; this.adv = false; this.dt = 0;
      if (!this.W) this.resize();
      if (!this.W) return;
      const st = this.spec.stages;
      if (!this.paused) {
        this.clk += dt; this.tIn += dt; this.adv = dt > 0; this.dt = dt;
        if (this.tIn >= st[this.i].d) this.go((this.i + 1) % st.length, false);
      }
      this.p = Math.min(1, this.tIn / (st[this.i].d * ANIM_FRAC));
      const c = this.ctx, s = this.dpr * this.k;
      c.setTransform(s, 0, 0, s, 0, 0);
      c.clearRect(0, 0, this.W, this.H);
      this.spec.draw(this, c, this.W, this.H);
      this.syncUI(false);
    }
  }


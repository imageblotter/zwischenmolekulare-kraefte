// 2D molecular-dynamics engine in reduced units (sigma = 1, epsilon = 1, mass = 1).
// Models: 'lj' (Lennard-Jones), 'dip' (LJ + 2D point dipoles), 'mb' (LJ + Mercedes-Benz H-bond arms).
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const wrap = (x) => x - TAU * Math.round(x / TAU);

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const LJ_RC = 2.5;
  const LJ_RC2 = LJ_RC * LJ_RC;
  const LJ_SHIFT = 4 * (Math.pow(1 / LJ_RC, 12) - Math.pow(1 / LJ_RC, 6));
  const DIP_R1 = 2.2, DIP_R2 = 2.9;
  const SKIN = 0.5;
  const HB_SIG_R = 0.16, HB_SIG_T = 0.38;
  const DEG = Math.PI / 180;
  // Bonding sites in the molecule's own frame: t 0 = hydrogen (donor), t 1 = lone pair (acceptor).
  // An H-bond forms only between a donor site of one molecule and an acceptor site of its neighbour.
  const MOLECULES = {
    H2S: { center: 'S', arms: [{ a: 46 * DEG, t: 0 }, { a: -46 * DEG, t: 0 }, { a: 128 * DEG, t: 1 }, { a: -128 * DEG, t: 1 }] },
    NH3: { center: 'N', arms: [{ a: 120 * DEG, t: 0 }, { a: 180 * DEG, t: 0 }, { a: 240 * DEG, t: 0 }, { a: 0, t: 1 }] },
    HF: { center: 'F', arms: [{ a: 180 * DEG, t: 0 }, { a: 0, t: 1 }, { a: 70 * DEG, t: 1 }, { a: -70 * DEG, t: 1 }] },
    H2O: { center: 'O', arms: [{ a: 52.25 * DEG, t: 0 }, { a: -52.25 * DEG, t: 0 }, { a: 127.75 * DEG, t: 1 }, { a: -127.75 * DEG, t: 1 }] },
  };

  class Sim {
    constructor(cfg) {
      this.cfg = Object.assign(
        { N: 80, W: 20, H: 16, model: 'lj', molecule: 'H2O', epsLJ: 1, mu2: 0, hb: 0, rhb: 1.3, g: 0.08, I: 0.35, seed: 1, lattice: 'hex' },
        cfg
      );
      const c = this.cfg;
      this.N = c.N; this.W = c.W; this.H = c.H;
      this.model = c.model;
      this.rot = c.model !== 'lj';
      this.dof = this.rot ? 3 * c.N : 2 * c.N;
      const N = this.N;
      this.x = new Float64Array(N); this.y = new Float64Array(N);
      this.vx = new Float64Array(N); this.vy = new Float64Array(N);
      this.fx = new Float64Array(N); this.fy = new Float64Array(N);
      this.cs = new Float64Array(N); this.sn = new Float64Array(N);
      this.th = new Float64Array(N); this.om = new Float64Array(N); this.tq = new Float64Array(N);
      const mol = MOLECULES[c.molecule] || MOLECULES.H2O;
      this.nArm = mol.arms.length;
      this.armA = Float64Array.from(mol.arms.map((m) => m.a));
      this.armT = Int8Array.from(mol.arms.map((m) => m.t));
      this.hs = new Float64Array(8);
      this.rand = rng(c.seed);
      this.rc = c.model === 'dip' ? DIP_R2 : LJ_RC;
      this.maxPairs = N * 60;
      this.pi = new Int32Array(this.maxPairs); this.pj = new Int32Array(this.maxPairs);
      this.np = 0; this.sinceBuild = 1e9;
      this.pe = 0;
      this.thermoT = null; this.tauT = 0.15;
      this.heat = 0;
      this.time = 0;
      // phase analysis state
      this.condensed = new Uint8Array(N);
      this.contacts = new Uint8Array(N);
      this.snap = new Float64Array(2 * N);
      this.snapT = 0; this.mobility = 0; this.fc = 1; this.avgContacts = 0; this.cdens = 0;
      this.uf = new Int32Array(N);
      this.reset(0.05);
    }

    gauss() {
      const r = this.rand;
      return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(TAU * r());
    }

    reset(Tstar, lattice) {
      const c = this.cfg, N = this.N;
      const kind = lattice || c.lattice;
      let n = 0;
      if (kind === 'rhomb') {
        // 2-D "ice": every molecule identically oriented, four bonds along +-u and +-v (angle between them 104.5 deg)
        const d = c.rhb, ux = d * Math.cos(52.25 * DEG), uy = d * Math.sin(52.25 * DEG);
        for (let k = 0; n < N && k < 80; k++) {
          const y = 0.6 + k * uy, x0 = 0.6 + (k % 2) * ux;
          for (let x = x0; n < N && x <= this.W - 0.6; x += 2 * ux) { this.x[n] = x; this.y[n] = y; this.th[n] = 0; n++; }
        }
        let mx = -1e9, mn = 1e9;
        for (let i = 0; i < n; i++) { mx = Math.max(mx, this.x[i]); mn = Math.min(mn, this.x[i]); }
        const off = (this.W - (mx - mn)) / 2 - mn;
        for (let i = 0; i < n; i++) this.x[i] += off;
      } else {
        const rows = kind === 'rows';
        const a = rows ? c.rhb : 1.12;
        const perRow = Math.floor((this.W - 1 - a / 2) / a) + 1;
        const x0 = (this.W - ((perRow - 1) * a + a / 2)) / 2;
        for (let r = 0; n < N; r++) {
          for (let col = 0; col < perRow && n < N; col++) {
            this.x[n] = x0 + col * a + (r % 2) * (a / 2);
            this.y[n] = 0.6 + r * a * 0.866;
            this.th[n] = rows ? 0 : this.model === 'dip' ? (r % 2) * Math.PI : this.rand() * TAU;
            n++;
          }
        }
      }
      for (let i = 0; i < N; i++) {
        this.vx[i] = 0; this.vy[i] = 0; this.om[i] = 0;
      }
      this.setVelocities(Tstar);
      this.time = 0; this.sinceBuild = 1e9;
      this.snap.fill(0); this.snapT = -1; this.mobility = 0;
      this.forces(false);
    }

    setVelocities(Tstar) {
      const N = this.N;
      let sx = 0, sy = 0;
      const sv = Math.sqrt(Tstar);
      for (let i = 0; i < N; i++) {
        this.vx[i] = this.gauss() * sv; this.vy[i] = this.gauss() * sv;
        sx += this.vx[i]; sy += this.vy[i];
        this.om[i] = this.rot ? (this.gauss() * sv) / Math.sqrt(this.cfg.I) : 0;
      }
      for (let i = 0; i < N; i++) { this.vx[i] -= sx / N; this.vy[i] -= sy / N; }
    }

    kineticT() {
      let k = 0;
      for (let i = 0; i < this.N; i++) k += 0.5 * (this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i]);
      return k;
    }
    kineticR() {
      let kr = 0;
      for (let i = 0; i < this.N; i++) kr += this.om[i] * this.om[i];
      return 0.5 * this.cfg.I * kr;
    }
    // translational temperature (2 degrees of freedom per particle)
    temperature() { return this.kineticT() / this.N; }

    scaleT(l) { for (let i = 0; i < this.N; i++) { this.vx[i] *= l; this.vy[i] *= l; } }
    scaleR(l) { for (let i = 0; i < this.N; i++) this.om[i] *= l; }

    buildList() {
      const N = this.N, cut = this.rc + SKIN, cut2 = cut * cut;
      let n = 0;
      for (let i = 0; i < N - 1; i++) {
        const xi = this.x[i], yi = this.y[i];
        for (let j = i + 1; j < N; j++) {
          const dx = xi - this.x[j], dy = yi - this.y[j];
          if (dx * dx + dy * dy < cut2) {
            if (n >= this.maxPairs) break;
            this.pi[n] = i; this.pj[n] = j; n++;
          }
        }
      }
      this.np = n; this.sinceBuild = 0;
    }

    // Donor (D) and acceptor (A) alignment sums, and their angle derivatives, for a molecule of orientation
    // th whose neighbour lies in direction alpha. Results go to this.hs[off..off+3] = D, dD, A, dA.
    armSums(th, alpha, off) {
      const hs = this.hs, inv = 1 / (HB_SIG_T * HB_SIG_T), t0 = wrap(th - alpha);
      let D = 0, dD = 0, A = 0, dA = 0;
      for (let k = 0; k < this.nArm; k++) {
        const d = wrap(t0 + this.armA[k]);
        const g = Math.exp(-0.5 * d * d * inv);
        if (this.armT[k] === 0) { D += g; dD -= d * inv * g; } else { A += g; dA -= d * inv * g; }
      }
      hs[off] = D; hs[off + 1] = dD; hs[off + 2] = A; hs[off + 3] = dA;
    }

    forces(wantPE) {
      const N = this.N, c = this.cfg;
      const fx = this.fx, fy = this.fy, tq = this.tq, x = this.x, y = this.y, th = this.th;
      fx.fill(0); tq.fill(0);
      for (let i = 0; i < N; i++) fy[i] = -c.g;
      if (this.sinceBuild >= 8) this.buildList();
      const eps = c.epsLJ, model = this.model, mu2 = c.mu2, hb = c.hb, rhb = c.rhb;
      const rc2 = this.rc * this.rc;
      const cs = this.cs, sn = this.sn;
      if (model === 'dip' && mu2 > 0) for (let i = 0; i < N; i++) { cs[i] = Math.cos(th[i]); sn[i] = Math.sin(th[i]); }
      let pe = 0;
      const pi = this.pi, pj = this.pj;
      for (let p = 0; p < this.np; p++) {
        const i = pi[p], j = pj[p];
        let dx = x[i] - x[j], dy = y[i] - y[j];
        const r2 = dx * dx + dy * dy;
        if (r2 > rc2) continue;
        let ffx = 0, ffy = 0;
        if (r2 < LJ_RC2) {
          const rr2 = r2 < 0.5 ? 0.5 : r2;
          const inv2 = 1 / rr2, s6 = inv2 * inv2 * inv2;
          const f = 24 * eps * (2 * s6 * s6 - s6) * inv2;
          ffx += f * dx; ffy += f * dy;
          if (wantPE) pe += 4 * eps * (s6 * s6 - s6) - eps * LJ_SHIFT;
        }
        if (model === 'dip' && mu2 > 0) {
          const r = Math.sqrt(r2), ir = 1 / r, ux = dx * ir, uy = dy * ir;
          const ci = cs[i], si = sn[i], cj = cs[j], sj = sn[j];
          const cab = ci * cj + si * sj, sab = si * cj - ci * sj;
          const ca = ci * ux + si * uy, sa = si * ux - ci * uy;
          const cb = cj * ux + sj * uy, sb = sj * ux - cj * uy;
          const cc = cab - 3 * ca * cb;
          let s = 1, ds = 0;
          if (r > DIP_R1) {
            const t = (r - DIP_R1) / (DIP_R2 - DIP_R1);
            s = 1 - 3 * t * t + 2 * t * t * t;
            ds = (-6 * t + 6 * t * t) / (DIP_R2 - DIP_R1);
          }
          const ir3 = ir * ir * ir;
          const dUdr = mu2 * (-3 * cc * s * ir3 * ir + cc * ds * ir3);
          const dUdphi = -3 * mu2 * s * ir3 * (sa * cb + ca * sb);
          // F_i = -dU/dr * rhat - (1/r) dU/dphi * phihat ; phihat = (-uy, ux)
          ffx += -dUdr * ux + dUdphi * ir * uy;
          ffy += -dUdr * uy - dUdphi * ir * ux;
          tq[i] -= mu2 * ir3 * s * (-sab + 3 * sa * cb);
          tq[j] -= mu2 * ir3 * s * (sab + 3 * ca * sb);
          if (wantPE) pe += mu2 * cc * s * ir3;
        }
        if (model === 'mb' && hb > 0) {
          const r = Math.sqrt(r2);
          const dr = r - rhb;
          if (Math.abs(dr) < 3 * HB_SIG_R) {
            const G = Math.exp(-(dr * dr) / (2 * HB_SIG_R * HB_SIG_R));
            const ex = -dx, ey = -dy; // vector i -> j
            const alpha = Math.atan2(ey, ex);
            this.armSums(th[i], alpha, 0);
            this.armSums(th[j], alpha + Math.PI, 4);
            const hs = this.hs;
            const Di = hs[0], dDi = hs[1], Ai = hs[2], dAi = hs[3], Dj = hs[4], dDj = hs[5], Aj = hs[6], dAj = hs[7];
            const S = Di * Aj + Ai * Dj;
            const ir = 1 / r;
            const dUdr = hb * (dr / (HB_SIG_R * HB_SIG_R)) * G * S;
            const dUda = hb * G * (dDi * Aj + Di * dAj + dAi * Dj + Ai * dDj);
            // force on j: -dU/dr rhat - (1/r) dU/dalpha alphahat, rhat=(ex,ey)/r, alphahat=(-ey,ex)/r
            const rx = ex * ir, ry = ey * ir;
            const fjx = -dUdr * rx + dUda * ir * ry;
            const fjy = -dUdr * ry - dUda * ir * rx;
            ffx -= fjx; ffy -= fjy; // force on i is opposite (ffx is force on i)
            tq[i] += hb * G * (dDi * Aj + dAi * Dj);
            tq[j] += hb * G * (Di * dAj + Ai * dDj);
            if (wantPE) pe -= hb * G * S;
          }
        }
        fx[i] += ffx; fy[i] += ffy; fx[j] -= ffx; fy[j] -= ffy;
      }
      if (wantPE) this.pe = pe / N;
    }

    // H-bond weight between i and j (about 1 for a perfect donor-acceptor alignment)
    hbStrength(i, j) {
      const dx = this.x[j] - this.x[i], dy = this.y[j] - this.y[i];
      const r = Math.sqrt(dx * dx + dy * dy), dr = r - this.cfg.rhb;
      if (Math.abs(dr) > 3 * HB_SIG_R) return 0;
      const G = Math.exp(-(dr * dr) / (2 * HB_SIG_R * HB_SIG_R));
      const a = Math.atan2(dy, dx);
      this.armSums(this.th[i], a, 0);
      this.armSums(this.th[j], a + Math.PI, 4);
      const hs = this.hs;
      return G * (hs[0] * hs[6] + hs[2] * hs[4]);
    }

    // Best donor-H -> lone-pair link between i and j, for drawing. Fills this.link with
    // [strength i->j, donor arm of i, acceptor arm of j, strength j->i, donor arm of j, acceptor arm of i].
    hbLink(i, j) {
      const L = this.link || (this.link = new Float64Array(6));
      L.fill(0); L[1] = L[2] = L[4] = L[5] = -1;
      const dx = this.x[j] - this.x[i], dy = this.y[j] - this.y[i];
      const r = Math.sqrt(dx * dx + dy * dy), dr = r - this.cfg.rhb;
      if (Math.abs(dr) > 3 * HB_SIG_R) return L;
      const G = Math.exp(-(dr * dr) / (2 * HB_SIG_R * HB_SIG_R)), a = Math.atan2(dy, dx), inv = 1 / (HB_SIG_T * HB_SIG_T);
      const bi = [0, 0, -1, -1], bj = [0, 0, -1, -1];
      for (let k = 0; k < this.nArm; k++) {
        const t = this.armT[k];
        const gi = Math.exp(-0.5 * inv * Math.pow(wrap(this.th[i] - a + this.armA[k]), 2));
        const gj = Math.exp(-0.5 * inv * Math.pow(wrap(this.th[j] - a - Math.PI + this.armA[k]), 2));
        if (gi > bi[t]) { bi[t] = gi; bi[2 + t] = k; }
        if (gj > bj[t]) { bj[t] = gj; bj[2 + t] = k; }
      }
      L[0] = G * bi[0] * bj[1]; L[1] = bi[2]; L[2] = bj[3];
      L[3] = G * bj[0] * bi[1]; L[4] = bj[2]; L[5] = bi[3];
      return L;
    }

    // Total pair energy of i and j (used only for drawing attraction lines)
    pairU(i, j) {
      const c = this.cfg;
      const dx = this.x[i] - this.x[j], dy = this.y[i] - this.y[j];
      const r2 = dx * dx + dy * dy;
      let u = 0;
      if (r2 < LJ_RC2) {
        const inv2 = 1 / Math.max(r2, 0.5), s6 = inv2 * inv2 * inv2;
        u += c.epsLJ * (4 * (s6 * s6 - s6) - LJ_SHIFT);
      }
      if (this.model === 'dip' && c.mu2 > 0 && r2 < DIP_R2 * DIP_R2) {
        const r = Math.sqrt(r2), ux = dx / r, uy = dy / r;
        const a = this.th[i], b = this.th[j];
        const cc = Math.cos(a - b) - 3 * (Math.cos(a) * ux + Math.sin(a) * uy) * (Math.cos(b) * ux + Math.sin(b) * uy);
        u += (c.mu2 * cc) / (r2 * r);
      }
      if (this.model === 'mb' && c.hb > 0) u -= c.hb * this.hbStrength(i, j);
      return u;
    }

    step(dt) {
      const N = this.N, I = this.cfg.I, W = this.W, H = this.H;
      const x = this.x, y = this.y, vx = this.vx, vy = this.vy, fx = this.fx, fy = this.fy;
      const hd = 0.5 * dt;
      for (let i = 0; i < N; i++) {
        vx[i] += hd * fx[i]; vy[i] += hd * fy[i];
        x[i] += dt * vx[i]; y[i] += dt * vy[i];
        if (x[i] < 0.5) { x[i] = 1 - x[i]; vx[i] = -vx[i]; }
        else if (x[i] > W - 0.5) { x[i] = 2 * (W - 0.5) - x[i]; vx[i] = -vx[i]; }
        if (y[i] < 0.5) { y[i] = 1 - y[i]; vy[i] = -vy[i]; }
        else if (y[i] > H - 0.5) { y[i] = 2 * (H - 0.5) - y[i]; vy[i] = -vy[i]; }
      }
      if (this.rot) {
        for (let i = 0; i < N; i++) {
          this.om[i] += hd * this.tq[i] / I;
          this.th[i] += dt * this.om[i];
        }
      }
      this.sinceBuild++;
      this.forces(false);
      for (let i = 0; i < N; i++) { vx[i] += hd * fx[i]; vy[i] += hd * fy[i]; }
      if (this.rot) for (let i = 0; i < N; i++) this.om[i] += hd * this.tq[i] / I;

      if (this.thermoT !== null) {
        const T0 = this.thermoT, k = dt / this.tauT;
        const Tt = this.temperature();
        if (Tt > 1e-9) this.scaleT(Math.min(1.05, Math.max(0.95, Math.sqrt(1 + k * (T0 / Tt - 1)))));
        if (this.rot) {
          const Tr = (2 * this.kineticR()) / N;
          if (Tr > 1e-9) this.scaleR(Math.min(1.05, Math.max(0.95, Math.sqrt(1 + k * (T0 / Tr - 1)))));
        }
      } else if (this.heat !== 0) {
        const Kt = this.kineticT();
        if (Kt > 1e-9) this.scaleT(Math.sqrt(Math.max(0.5, 1 + (this.heat * N * dt) / Kt)));
      }
      this.time += dt;
    }

    // Classify particles: cluster-connected (condensed) vs isolated (vapour), and measure mobility of the condensed part.
    analyze() {
      const N = this.N, rcn = this.model === 'mb' ? 1.5 : 1.35, rcn2 = rcn * rcn;
      const uf = this.uf;
      for (let i = 0; i < N; i++) { uf[i] = i; this.contacts[i] = 0; }
      const find = (a) => { while (uf[a] !== a) { uf[a] = uf[uf[a]]; a = uf[a]; } return a; };
      for (let i = 0; i < N - 1; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = this.x[i] - this.x[j], dy = this.y[i] - this.y[j];
          if (dx * dx + dy * dy < rcn2) {
            this.contacts[i]++; this.contacts[j]++;
            const a = find(i), b = find(j);
            if (a !== b) uf[a] = b;
          }
        }
      }
      const size = new Int32Array(N);
      for (let i = 0; i < N; i++) size[find(i)]++;
      const minSize = 8;
      let nc = 0, csum = 0;
      for (let i = 0; i < N; i++) {
        const cnd = this.contacts[i] >= 3 ? 1 : 0;
        this.condensed[i] = cnd;
        if (cnd) { nc++; csum += this.contacts[i]; }
      }
      // density of the condensed layer: count / (width x height of the condensed pile)
      if (nc > 0) {
        const ys = [];
        for (let i = 0; i < N; i++) if (this.condensed[i]) ys.push(this.y[i]);
        ys.sort((a, b) => a - b);
        const top = ys[Math.min(ys.length - 1, Math.floor(0.95 * ys.length))] + 0.5;
        this.cdens = nc / (this.W * top);
      } else this.cdens = 0;
      this.fc = nc / N;
      this.avgContacts = nc ? csum / nc : 0;
      // density of the condensed part: particles / area of the bounding band (approx via mean contacts fallback)
      // mobility: MSD of condensed particles between snapshots, centre-of-mass drift removed
      if (this.snapT < 0) {
        for (let i = 0; i < N; i++) { this.snap[2 * i] = this.x[i]; this.snap[2 * i + 1] = this.y[i]; }
        this.snapT = this.time;
      } else if (this.time - this.snapT >= 1.5) {
        let mx = 0, my = 0, n = 0;
        for (let i = 0; i < N; i++) if (this.condensed[i]) {
          mx += this.x[i] - this.snap[2 * i]; my += this.y[i] - this.snap[2 * i + 1]; n++;
        }
        if (n > 0) {
          mx /= n; my /= n;
          let s = 0;
          for (let i = 0; i < N; i++) if (this.condensed[i]) {
            const ddx = this.x[i] - this.snap[2 * i] - mx, ddy = this.y[i] - this.snap[2 * i + 1] - my;
            s += ddx * ddx + ddy * ddy;
          }
          this.mobility = s / n;
        }
        for (let i = 0; i < N; i++) { this.snap[2 * i] = this.x[i]; this.snap[2 * i + 1] = this.y[i]; }
        this.snapT = this.time;
      }
    }
  }

  Sim.MOLECULES = MOLECULES;
  Sim.CENTER_LABEL = (name) => (MOLECULES[name] || {}).center;
  root.Sim = Sim;
  if (typeof module !== 'undefined') module.exports = { Sim };
})(typeof window !== 'undefined' ? window : globalThis);

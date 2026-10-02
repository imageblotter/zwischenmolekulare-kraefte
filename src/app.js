(function () {
  'use strict';
  const DT = 0.004, STEPS_PER_FRAME = 12, BOOST_STEPS = 288, N = 90, W = 26, H = 17, KJ = 0.008314, HEAT_Q = 6;
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const $ = (s, el) => (el || document).querySelector(s);
  const TAU = Math.PI * 2;

  // ------------------------------------------------------------------ content
  const TABS = {
    vdw: {
      label: 'Van-der-Waals-Kräfte', cols: 4, K0: 477, tMax: 700,
      quick: [[77, '77 K'], [298, '25 °C'], [373, '100 °C']],
      headline: 'Nur Elektronenwolken, die aneinander haften: genug, damit F₂ ein Gas und I₂ ein Feststoff ist.',
      intro: 'Jedes Atom hat ständig bewegte Elektronen, deshalb flackert jedes Molekül mit winzigen, kurzlebigen Dipolen, die in den Nachbarn Dipole induzieren. Eine größere Elektronenwolke lässt sich leichter verformen, daher wächst die Anziehung mit der Elektronenzahl. Diese vier Halogene sind unpolar, also ist dies die einzige Kraft zwischen ihnen.',
      substances: [
        { key: 'F2', name: 'F₂', tag: '18 Elektronen', molar: '38,0', feature: 'kleinste Wolke', scaleMul: 0.337, size: 0.84, mp: 53, bp: 85, st: 'gasförmig' },
        { key: 'Cl2', name: 'Cl₂', tag: '34 Elektronen', molar: '70,9', feature: 'kleine Wolke', scaleMul: 1, size: 0.92, mp: 172, bp: 239, st: 'gasförmig' },
        { key: 'Br2', name: 'Br₂', tag: '70 Elektronen', molar: '159,8', feature: 'große Wolke', scaleMul: 1.46, size: 1.0, mp: 266, bp: 332, st: 'flüssig' },
        { key: 'I2', name: 'I₂', tag: '106 Elektronen', molar: '253,8', feature: 'größte Wolke', scaleMul: 2.06, size: 1.08, mp: 387, bp: 458, st: 'fest' },
      ],
      model: 'lj', vis: 'atom',
      tryIt: [
        '<b>25 °C</b> drücken: eine Kraft, drei Zustände.',
        'Das <b>Heizexperiment</b> starten. Jeder flache Abschnitt ist Wärme, die die Anziehung lockert, statt die Probe zu erwärmen; je stärker die Anziehung, desto höher und länger das Plateau.',
        'Die Temperatur auf <b>77 K</b> senken: Sogar F₂ erstarrt.',
      ],
      insight: ['Worauf achten', 'Die Atome unterscheiden sich nur in einer Zahl: wie stark ihre Elektronenwolken anziehen. Grüne Linien zeigen anziehende Kontakte. Im Festkörper hat jedes Teilchen etwa fünf Nachbarn im Gitter, in der Flüssigkeit gleiten sie aneinander vorbei, im Gas verschwinden die Kontakte fast ganz. Mehr Elektronen bedeuten stärkere Anziehung und damit höhere Schmelz- und Siedepunkte.'],
      simplified: 'Die Moleküle sind als einzelne Kugeln mit einer Lennard-Jones-Anziehung gezeichnet, deren Tiefe dem realen Siedeverhalten angepasst ist. Das Flackern der Elektronenwolken wird nicht simuliert, nur seine Nettowirkung.',
    },
    dipole: {
      label: 'Dipol-Dipol', cols: 3, K0: 367, tMax: 500,
      quick: [[77, '77 K'], [298, '25 °C'], [373, '100 °C']],
      headline: 'Gleiche Größe, verschiedene Polarität: Ein permanenter Dipol liefert eine zweite Anziehung.',
      intro: 'Polare Moleküle tragen dauerhafte Teilladungen (δ+ und δ−). Nachbarn drehen sich so, dass sich entgegengesetzte Enden gegenüberliegen, was ihre Energie senkt. Die drei Moleküle unten haben fast dieselbe Masse (etwa 44 g/mol), ihre Van-der-Waals-Kräfte sind also ähnlich. Unterschiedlich ist die Größe des Dipols.',
      substances: [
        { key: 'C3H8', name: 'Propan', tag: 'μ ≈ 0,1 D', molar: '44,1', feature: 'unpolar', mu2: 0.05, q: 0.1, mp: 85, bp: 231, st: 'gasförmig' },
        { key: 'CH3CHO', name: 'Acetaldehyd', tag: 'μ = 2,7 D', molar: '44,1', feature: 'polares C=O', mu2: 1.2, q: 0.6, mp: 150, bp: 294, st: 'gasförmig' },
        { key: 'CH3CN', name: 'Acetonitril', tag: 'μ = 3,9 D', molar: '41,1', feature: 'sehr polares C≡N', mu2: 2.2, q: 1, mp: 229, bp: 355, st: 'flüssig' },
      ],
      model: 'dip', vis: 'dipole',
      tryIt: [
        '<b>25 °C</b> drücken und vergleichen: Das polarste Molekül ist noch flüssig.',
        'Den <b>Feststoff</b> ansehen (77 K): Die Dipole reihen sich Kopf an Schwanz in Reihen auf. Im Gas taumeln sie zufällig.',
        'Das <b>Heizexperiment</b> starten und vergleichen, wo jede Kurve abflacht.',
      ],
      insight: ['Worauf achten', 'Jedes Teilchen ist ein Kreis mit einer warmen δ+-Hälfte und einer kühlen δ−-Hälfte und dreht sich zu seinen Nachbarn. Ausgerichtete Nachbarn ziehen sich stärker an als bei der reinen Van-der-Waals-Anziehung, deshalb bleiben die polaren Stoffe auch bei höherer Temperatur kondensiert. Propan mit fast keinem Dipol siedet bei −42 °C. Acetaldehyd (2,7 D) siedet bei +20 °C und Acetonitril (3,9 D) bei +82 °C.'],
      simplified: 'Flache 2-D-Dipole (die Ladungen werden nicht einzeln modelliert) zusätzlich zur gleichen Van-der-Waals-Anziehung für jeden Stoff. Die echte Dipol-Dipol-Energie hängt von der vollen 3-D-Geometrie ab.',
    },
    hbond: {
      label: 'Wasserstoffbrücken', cols: 2, K0: 387, tMax: 500,
      quick: [[77, '77 K'], [298, '25 °C'], [373, '100 °C']],
      headline: 'Warum siedet Wasser, ein winziges Molekül, 160 K höher als H₂S?',
      intro: 'Ist Wasserstoff an N, O oder F gebunden, trägt es eine große δ+-Ladung und kann sich an ein freies Elektronenpaar eines Nachbarmoleküls binden, aber nur entlang einer Geraden. H₂S hat mehr Elektronen als H₂O und damit stärkere Van-der-Waals-Kräfte, bildet aber kaum Wasserstoffbrücken. Der Rest ist Abzählen: Jede Brücke braucht ein H an einem Molekül und ein freies Elektronenpaar am anderen.',
      key: '<b>Molekülbilder lesen:</b> <span class="kdot" style="background:var(--neg)"></span> zentrales Atom (S, N, F, O) &nbsp; <span class="kdot small" style="background:var(--pos)"></span> Wasserstoff (δ+) &nbsp; <span class="kdot small ring"></span> freies Elektronenpaar (δ−) &nbsp; <span class="kdash"></span> Wasserstoffbrücke: eine dünne Linie von einem H zum Molekül, das es aufnimmt.',
      substances: [
        { key: 'H2S', molecule: 'H2S', name: 'H₂S', tag: 'keine H-Brücken', molar: '34,1', feature: '2 H, 2 freie Paare, S zu schwach polar', epsLJ: 1, hb: 0, lattice: 'hex', mp: 188, bp: 213, st: 'gasförmig' },
        { key: 'NH3', molecule: 'NH3', name: 'NH₃', tag: '3 H · 1 freies Paar', molar: '17,0', feature: 'Ketten (1 freies Paar)', epsLJ: 0.7, hb: 2.0, lattice: 'rows', mp: 195, bp: 240, st: 'gasförmig' },
        { key: 'HF', molecule: 'HF', name: 'HF', tag: '1 H · 3 freie Paare', molar: '20,0', feature: 'Ketten (1 H)', epsLJ: 0.4, hb: 3.5, lattice: 'rows', mp: 190, bp: 293, st: 'gasförmig' },
        { key: 'H2O', molecule: 'H2O', name: 'H₂O', tag: '2 H · 2 freie Paare', molar: '18,0', feature: 'Netzwerk (2 H + 2 freie Paare)', epsLJ: 0.4, hb: 3.8, lattice: 'rhomb', mp: 273, bp: 373, st: 'flüssig' },
      ],
      model: 'mb', vis: 'mol',
      tryIt: [
        '<b>25 °C</b> drücken: Nur H₂O ist flüssig; die anderen sind Gase, obwohl H₂S mehr Elektronen hat.',
        '<b>77 K</b> drücken und die Feststoffe vergleichen. NH₃ und HF lagern sich dicht in Reihen von Ketten an; H₂O bildet ein offenes Netzwerk mit Lücken, jedes Molekül kann bis zu vier Nachbarn binden.',
        'Das <b>Heizexperiment</b> starten: Wasser braucht viel mehr Wärme und eine höhere Temperatur, bevor es zerfällt.',
      ],
      insight: ['Worauf achten', 'Die dünnen grünen Linien sind Wasserstoffbrücken. HF hat drei freie Paare, aber nur ein H, und NH₃ hat drei H, aber nur ein freies Paar; beide bilden deshalb nur einzelne Ketten (höchstens 2 Brücken pro Molekül, eine abgegeben und eine aufgenommen). H₂O hat 2 H und 2 freie Paare, kann also bis zu 4 Brücken pro Molekül bilden und baut ein Netzwerk auf, weshalb es so viel fester zusammenhält. H₂S bildet keine Wasserstoffbrücken, weil S zu wenig elektronegativ ist.'],
      simplified: 'Ein flaches Modell: Jedes Molekül hat seine echten Bindungswinkel, und nur seine H-Atome und freien Paare können binden. Die echte 3-D-Geometrie, die wahre Struktur von Eis und kooperative Effekte werden nicht modelliert; die Bindungsstärken sind auf die Siedereihenfolge abgestimmt.',
    },
  };

  // ------------------------------------------------------------------ helpers
  function niceCeil(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
    return 10 * p;
  }
  function niceStep(range, target) {
    const raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw) return m * p;
    return 10 * p;
  }
  const kToC = (k) => Math.round(k - 273.15);
  const de = (n, d) => n.toFixed(d).replace('.', ',');
  const PHASE_DE = { 'Solid': 'Fest', 'Liquid': 'Flüssig', 'Gas': 'Gasförmig', 'Solid + gas': 'Fest + Gas', 'Liquid + gas': 'Flüssig + Gas' };
  let COL = {};
  function readColors() {
    COL = {
      pos: cssVar('--pos'), neg: cssVar('--neg'), attract: cssVar('--attract'), ink: cssVar('--ink'), dim: cssVar('--ink-dim'),
      border: cssVar('--border'), grid: cssVar('--grid'), surface: cssVar('--surface'), surface2: cssVar('--surface-2'), repel: cssVar('--repel'),
      s: [cssVar('--s1'), cssVar('--s2'), cssVar('--s3'), cssVar('--s4')],
    };
  }

  // Structural drawing of a molecule (used in the simulation and in the header icons). u = pixels per sigma.
  function armTip(cx, cy, u, th, arm, icon) {
    const ang = -(th + arm.a), d = (arm.t ? (icon ? 0.78 : 0.66) : (icon ? 0.86 : 0.76)) * u;
    return [cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, ang];
  }
  function drawMolecule(ctx, cx, cy, u, th, molName, icon, hbOn) {
    const mol = Sim.MOLECULES[molName];
    const Rc = 0.5 * u, Rh = (icon ? 0.3 : 0.27) * u;
    ctx.lineCap = 'round';
    ctx.strokeStyle = COL.dim; ctx.lineWidth = Math.max(1, 0.13 * u); ctx.globalAlpha = hbOn ? 0.9 : 0.55;
    ctx.beginPath();
    mol.arms.forEach((a) => { if (!a.t) { const p = armTip(cx, cy, u, th, a, icon); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); } });
    ctx.stroke();
    ctx.globalAlpha = 1;
    mol.arms.forEach((a) => {
      if (!a.t) return;
      const p = armTip(cx, cy, u, th, a, icon);
      if (icon) {
        const nx = -Math.sin(p[2]) * 0.1 * u, ny = Math.cos(p[2]) * 0.1 * u;
        ctx.fillStyle = COL.neg;
        ctx.beginPath(); ctx.arc(p[0] + nx, p[1] + ny, 0.07 * u, 0, TAU); ctx.arc(p[0] - nx, p[1] - ny, 0.07 * u, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = COL.neg; ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(p[0], p[1], 0.17 * u, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = COL.neg; ctx.lineWidth = 1; ctx.stroke();
      }
    });
    ctx.fillStyle = COL.pos; ctx.globalAlpha = hbOn ? 1 : 0.65;
    mol.arms.forEach((a) => {
      if (a.t) return;
      const p = armTip(cx, cy, u, th, a, icon);
      ctx.beginPath(); ctx.arc(p[0], p[1], Rh, 0, TAU); ctx.fill();
      if (icon) {
        ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.round(0.34 * u) + 'px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('H', p[0], p[1] + 0.5); ctx.fillStyle = COL.pos;
      }
    });
    ctx.globalAlpha = 1; ctx.fillStyle = COL.neg;
    ctx.beginPath(); ctx.arc(cx, cy, Rc, 0, TAU); ctx.fill();
    if (icon) {
      ctx.fillStyle = '#fff'; ctx.font = '800 ' + Math.round(0.5 * u) + 'px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(mol.center, cx, cy + 1);
    }
  }

  // ------------------------------------------------------------------ one container
  class BoxView {
    constructor(tab, sub, idx, host) {
      this.tab = tab; this.sub = sub; this.idx = idx;
      this.scale = tab.K0 * (sub.scaleMul || 1);
      this.sim = new Sim({
        N, W, H, g: 0.03, model: tab.model, epsLJ: sub.epsLJ || 1, mu2: sub.mu2 || 0, hb: sub.hb || 0, molecule: sub.molecule,
        lattice: sub.lattice || 'hex', rhb: 1.3, seed: 11 + idx * 17,
      });
      this.fcE = 1; this.cond = true; this.gas = false; this.solid = true; this.phase = 'Solid'; this.prevPhase = 'Solid';
      this.curve = []; this.marks = []; this.tsum = 0; this.tn = 0; this.melted = false; this.boiled = false; this.holding = false;
      this.el = document.createElement('div');
      this.el.className = 'box';
      this.el.innerHTML =
        '<div class="box-head"><span class="swatch" style="background:var(--s' + (idx + 1) + ')"></span><div class="box-title"><span class="box-name">' + sub.name +
        '</span><span class="box-tag">' + sub.tag + '</span></div>' + (sub.molecule ? '<canvas class="mol-icon" width="72" height="54" aria-hidden="true"></canvas>' : '') + '</div>' +
        '<div class="box-stage"><canvas role="img"></canvas></div>' +
        '<div class="box-foot"><span class="chip" data-phase="solid"><i></i><span class="ph">Fest</span></span><span class="stat">Nachbarn <b class="nb">–</b></span><span class="stat tk"></span></div>' +
        '<div class="cohesion"><span>Anziehung</span><span class="bar"><span></span></span></div>';
      host.appendChild(this.el);
      this.canvas = $('.box-stage canvas', this.el);
      this.ctx = this.canvas.getContext('2d');
      this.chip = $('.chip', this.el); this.phEl = $('.ph', this.el); this.nbEl = $('.nb', this.el); this.tkEl = $('.tk', this.el);
      this.barEl = $('.cohesion .bar span', this.el);
      this.icon = $('.mol-icon', this.el);
      if (this.icon) { const d = Math.max(1, window.devicePixelRatio || 1); this.icon.width = 72 * d; this.icon.height = 54 * d; this.iconCtx = this.icon.getContext('2d'); this.iconCtx.setTransform(d, 0, 0, d, 0, 0); }
      this.canvas.setAttribute('aria-label', sub.name + ': Teilchen in einem Behälter');
      this.resize();
    }
    resize() {
      const r = this.canvas.parentElement.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      this.cw = r.width; this.ch = r.height;
      this.canvas.width = Math.round(r.width * dpr); this.canvas.height = Math.round(r.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    Tk() { return this.sim.temperature() * this.scale; }
    setTarget(K) { this.sim.heat = 0; this.sim.thermoT = Math.max(K, 3) / this.scale; }
    reset(K) {
      this.sim.reset(Math.max(K, 3) / this.scale);
      this.fcE = 1; this.cond = true; this.gas = false; this.solid = true; this.phase = this.prevPhase = 'Solid';
      this.melted = this.boiled = false; this.holding = false;
    }
    measureCohesion() {
      const s = new Sim(Object.assign({}, this.sim.cfg));
      s.reset(0.03); s.thermoT = 0.03;
      for (let k = 0; k < 6000; k++) s.step(DT);
      s.forces(true);
      this.cohesion = -s.pe * this.scale;
    }
    tick() {
      const sim = this.sim;
      sim.analyze();
      this.fcE = this.tickN ? this.fcE + 0.25 * (sim.fc - this.fcE) : sim.fc;
      this.tickN = (this.tickN || 0) + 1;
      const fc = this.fcE, mob = sim.mobility;
      this.cond = this.cond ? fc > 0.5 : fc > 0.58;
      this.gas = this.cond ? false : (this.gas ? fc < 0.45 : fc < 0.37);
      this.solid = this.solid ? mob < 0.26 : mob < 0.18;
      let phase;
      if (this.gas) phase = 'Gas';
      else if (this.cond) phase = this.solid ? 'Solid' : 'Liquid';
      else phase = this.solid ? 'Solid + gas' : 'Liquid + gas';
      this.prevPhase = this.phase; this.phase = phase;
      const cat = this.gas ? 'gas' : this.cond ? (this.solid ? 'solid' : 'liquid') : 'mixed';
      if (this.chip.dataset.phase !== cat) this.chip.dataset.phase = cat;
      if (this.phEl.textContent !== PHASE_DE[phase]) this.phEl.textContent = PHASE_DE[phase];
      this.nbEl.textContent = fc > 0.3 ? de(sim.avgContacts, 1) : '–';
    }
    setCohesionBar(max) { this.barEl.style.width = clamp((this.cohesion / max) * 100, 4, 100) + '%'; }
    draw(showAttr) {
      const ctx = this.ctx, w = this.cw, h = this.ch, sim = this.sim, sub = this.sub;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const s = w / W, R = 0.5 * s * (sub.size || 1);
      const x = sim.x, y = sim.y, th = sim.th;
      const hbSpecies = sim.model === 'mb' && sim.cfg.hb > 0;
      if (showAttr) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = COL.attract;
        for (let p = 0; !hbSpecies && p < sim.np; p++) {
          const i = sim.pi[p], j = sim.pj[p];
          const dx = x[i] - x[j], dy = y[i] - y[j];
          if (dx * dx + dy * dy > 2.4) continue;
          const u = sim.pairU(i, j);
          if (u > -0.5) continue;
          ctx.globalAlpha = Math.min(0.7, -u * 0.2);
          ctx.lineWidth = Math.min(3.2, 0.7 + -u * 0.3);
          ctx.beginPath(); ctx.moveTo(x[i] * s, h - y[i] * s); ctx.lineTo(x[j] * s, h - y[j] * s); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      const vis = this.tab.vis;
      if (vis === 'atom') {
        const col = COL.s[this.idx];
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.16;
        for (let i = 0; i < N; i++) { ctx.beginPath(); ctx.arc(x[i] * s, h - y[i] * s, R * 1.45, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 0.95;
        for (let i = 0; i < N; i++) { ctx.beginPath(); ctx.arc(x[i] * s, h - y[i] * s, R, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 0.4; ctx.fillStyle = '#fff';
        for (let i = 0; i < N; i++) { ctx.beginPath(); ctx.arc(x[i] * s - R * 0.3, h - y[i] * s - R * 0.3, R * 0.34, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 1;
      } else if (vis === 'dipole') {
        const q = sub.q;
        for (let i = 0; i < N; i++) {
          ctx.save(); ctx.translate(x[i] * s, h - y[i] * s); ctx.rotate(-th[i]);
          ctx.globalAlpha = 1; ctx.fillStyle = COL.surface2;
          ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
          ctx.globalAlpha = 0.18 + 0.82 * q;
          ctx.fillStyle = COL.pos; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
          ctx.fillStyle = COL.neg; ctx.beginPath(); ctx.arc(0, 0, R, Math.PI / 2, 1.5 * Math.PI); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 1; ctx.strokeStyle = COL.border; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
          ctx.restore();
        }
      } else {
        const hbOn = sub.hb > 0;
        for (let i = 0; i < N; i++) drawMolecule(ctx, x[i] * s, h - y[i] * s, s, th[i], sub.molecule, false, hbOn);
      }
      if (showAttr && hbSpecies) {
        // hydrogen bonds: a thin line from the donor H to the receiving molecule, drawn on top with a light halo
        const arms = Sim.MOLECULES[sub.molecule].arms;
        const bonds = [];
        for (let p = 0; p < sim.np; p++) {
          const i = sim.pi[p], j = sim.pj[p];
          const dx = x[i] - x[j], dy = y[i] - y[j];
          if (dx * dx + dy * dy > 3.6) continue;
          const L = sim.hbLink(i, j);
          if (L[0] > 0.3) bonds.push(i, L[1], j);
          if (L[3] > 0.3) bonds.push(j, L[4], i);
        }
        ctx.lineCap = 'round';
        for (let pass = 0; pass < 2; pass++) {
          ctx.strokeStyle = pass ? COL.attract : COL.surface;
          ctx.lineWidth = pass ? 1 : 2;
          ctx.globalAlpha = pass ? 1 : 0.55;
          ctx.beginPath();
          for (let b = 0; b < bonds.length; b += 3) {
            const i = bonds[b], j = bonds[b + 2];
            const A = armTip(x[i] * s, h - y[i] * s, s, th[i], arms[bonds[b + 1]], false);
            ctx.moveTo(A[0], A[1]); ctx.lineTo(x[j] * s, h - y[j] * s);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      if (this.icon) {
        const c = this.iconCtx;
        c.clearRect(0, 0, 72, 54);
        drawMolecule(c, 36, 27, 24, sub.molecule === 'H2O' || sub.molecule === 'H2S' ? Math.PI : 0, sub.molecule, true, sub.hb > 0);
      }
    }
  }

  // ------------------------------------------------------------------ heating-curve chart
  class Chart {
    constructor(canvas, tab, boxes) {
      this.c = canvas; this.ctx = canvas.getContext('2d'); this.tab = tab; this.boxes = boxes; this.hx = null;
      canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); this.hx = e.clientX - r.left; });
      canvas.addEventListener('pointerleave', () => { this.hx = null; });
      this.resize();
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      this.w = r.width; this.h = r.height;
      this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    draw() {
      const ctx = this.ctx, w = this.w, h = this.h;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const m = { l: 46, r: 40, t: 26, b: 40 }, pw = w - m.l - m.r, ph = h - m.t - m.b;
      let xmax = 3;
      this.boxes.forEach((b) => { const n = b.curve.length; if (n) xmax = Math.max(xmax, b.curve[n - 1].x); });
      xmax = niceCeil(xmax * 1.06);
      const ymax = this.tab.tMax;
      const X = (v) => m.l + (v / xmax) * pw, Y = (t) => m.t + ph - (t / ymax) * ph;
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.textBaseline = 'middle'; ctx.lineWidth = 1;
      const ys = 100;
      for (let t = 0; t <= ymax + 0.1; t += ys) {
        ctx.strokeStyle = t === 0 ? COL.border : COL.grid;
        ctx.beginPath(); ctx.moveTo(m.l, Y(t) + 0.5); ctx.lineTo(m.l + pw, Y(t) + 0.5); ctx.stroke();
        ctx.fillStyle = COL.dim; ctx.textAlign = 'right'; ctx.fillText(String(t), m.l - 8, Y(t));
      }
      const xs = niceStep(xmax, 6);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (let v = 0; v <= xmax + 1e-9; v += xs) {
        ctx.fillStyle = COL.dim; ctx.fillText(String(+v.toFixed(2)).replace('.', ','), X(v), m.t + ph + 8);
      }
      ctx.fillStyle = COL.dim; ctx.font = '11px "Source Sans 3", sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('Zugeführte Wärme pro Molekül (kJ/mol)', m.l + pw / 2, h - 16);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Temperatur (K)', 4, 12);

      const any = this.boxes.some((b) => b.curve.length > 1);
      if (!any) {
        ctx.fillStyle = COL.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '13px "Source Sans 3", sans-serif';
        ctx.fillText('Heizexperiment starten, um für jeden Stoff eine Kurve aufzuzeichnen', m.l + pw / 2, m.t + ph / 2);
        return;
      }
      ctx.save();
      ctx.beginPath(); ctx.rect(m.l, m.t - 2, pw, ph + 4); ctx.clip();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 2;
      this.boxes.forEach((b, i) => {
        if (b.curve.length < 2) return;
        ctx.strokeStyle = COL.s[i]; ctx.beginPath();
        b.curve.forEach((p, k) => { const px = X(p.x), py = Y(Math.min(p.T, ymax)); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
        ctx.stroke();
      });
      ctx.restore();
      this.boxes.forEach((b, i) => {
        b.marks.forEach((mk) => {
          const px = X(mk.x), py = Y(mk.T);
          ctx.fillStyle = COL.s[i]; ctx.strokeStyle = COL.surface; ctx.lineWidth = 2;
          ctx.beginPath();
          if (mk.type === 'melt') ctx.arc(px, py, 4.5, 0, TAU);
          else { ctx.moveTo(px, py - 6); ctx.lineTo(px + 5, py); ctx.lineTo(px, py + 6); ctx.lineTo(px - 5, py); ctx.closePath(); }
          ctx.stroke(); ctx.fill();
        });
        const n = b.curve.length;
        if (n > 1) {
          const p = b.curve[n - 1];
          ctx.fillStyle = COL.ink; ctx.font = '600 12px "Source Sans 3", sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(b.sub.name, Math.min(X(p.x) + 7, w - 4 - ctx.measureText(b.sub.name).width), Y(Math.min(p.T, ymax)) - (p.T >= ymax ? 9 : 0));
        }
      });
      if (this.hx !== null && this.hx > m.l && this.hx < m.l + pw) {
        const hxv = clamp(((this.hx - m.l) / pw) * xmax, 0, xmax);
        const rows = [];
        this.boxes.forEach((b, i) => {
          const c = b.curve; if (c.length < 2) return;
          let lo = 0, hi = c.length - 1;
          while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (c[mid].x < hxv) lo = mid; else hi = mid; }
          const p = Math.abs(c[lo].x - hxv) < Math.abs(c[hi].x - hxv) ? c[lo] : c[hi];
          if (Math.abs(p.x - hxv) > xmax * 0.03) return;
          rows.push({ b, i, p });
        });
        if (rows.length) {
          const lx = X(rows[0].p.x);
          ctx.strokeStyle = COL.dim; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(lx, m.t); ctx.lineTo(lx, m.t + ph); ctx.stroke(); ctx.setLineDash([]);
          ctx.font = '12px "Source Sans 3", sans-serif';
          const lines = rows.map((r) => r.b.sub.name + '  ' + Math.round(r.p.T) + ' K  ' + PHASE_DE[r.p.ph].toLowerCase());
          const tw = Math.max(...lines.map((t) => ctx.measureText(t).width)) + 34;
          const bh = rows.length * 18 + 26;
          let bx = lx + 12; if (bx + tw > w - 4) bx = lx - 12 - tw;
          const by = m.t + 6;
          ctx.fillStyle = COL.surface; ctx.strokeStyle = COL.border; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, tw, bh, 8) : ctx.rect(bx, by, tw, bh); ctx.fill(); ctx.stroke();
          ctx.fillStyle = COL.dim; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(de(rows[0].p.x, 1) + ' kJ/mol', bx + 12, by + 14);
          rows.forEach((r, k) => {
            const yy = by + 34 + k * 18 - 4;
            ctx.fillStyle = COL.s[r.i]; ctx.fillRect(bx + 12, yy - 4, 10, 8);
            ctx.fillStyle = COL.ink; ctx.fillText(lines[k], bx + 28, yy);
            ctx.fillStyle = COL.s[r.i]; ctx.strokeStyle = COL.surface; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(X(r.p.x), Y(Math.min(r.p.T, ymax)), 4, 0, TAU); ctx.stroke(); ctx.fill();
          });
        }
      }
    }
  }

/*ORIGIN*/
  // ------------------------------------------------------------------ one tab (panel)
  class TabView {
    constructor(key, tab) {
      this.key = key; this.tab = tab; this.ready = false; this.boost = 0;
      this.temp = 298; this.paused = false; this.showAttr = true;
      this.heating = null;
      const sec = document.createElement('section');
      sec.className = 'panel'; sec.id = 'panel-' + key; sec.setAttribute('role', 'tabpanel');
      const rows = tab.substances.map((s, i) =>
        '<tr><td><span class="swatch" style="background:var(--s' + (i + 1) + ')"></span><b>' + s.name + '</b></td><td class="num">' + s.molar + '</td><td>' + s.feature +
        '</td><td class="num">' + s.mp + '</td><td class="num">' + s.bp + '</td><td>' + s.st + '</td></tr>').join('');
      sec.innerHTML =
        '<div class="lead"><h2>' + tab.headline + '</h2><p>' + tab.intro + '</p></div>' +
        '<div class="origin"></div>' +
        '<div class="box-grid' + (tab.cols === 3 ? ' cols3' : tab.cols === 2 ? ' cols2' : '') + '" style="--cols:' + tab.cols + '"></div>' + (tab.key ? '<p class="caveat key">' + tab.key + '</p>' : '') +
        '<div class="row2">' +
        '<div class="card"><h3>Temperatur</h3>' +
        '<div class="tempread"><span class="big mono tval">298 K</span><span class="sub mono tc">25 °C</span></div>' +
        '<input type="range" class="tslider" min="0" max="' + tab.tMax + '" step="1" value="298" aria-label="Temperatur in Kelvin">' +
        '<div class="scale mono"><span>0 K</span><span>' + tab.tMax + ' K</span></div>' +
        '<div class="btnrow quick"></div>' +
        '<div class="btnrow"><button class="btn pause">Pause</button><button class="btn reset">Zurücksetzen</button></div>' +
        '<label class="opt"><input type="checkbox" class="attr" checked> Anziehungen zwischen Nachbarn anzeigen</label>' +
        '</div>' +
        '<div class="card"><h3>Heizexperiment</h3>' +
        '<p class="hint">Alle Behälter werden mit derselben konstanten Rate aus dem kalten Feststoff heraus erwärmt; aufgezeichnet wird die Temperatur gegen die zugeführte Wärme.</p>' +
        '<div class="btnrow"><button class="btn primary run">Heizexperiment starten</button><button class="btn clear">Kurven löschen</button></div>' +
        '<div class="chart-wrap"><canvas role="img" aria-label="Heizkurven: Temperatur gegen zugeführte Wärme"></canvas></div>' +
        '<div class="legend"></div>' +
        '</div></div>' +
        '<div class="insights"><div class="callout"><h3>Zum Ausprobieren</h3><ol>' + tab.tryIt.map((t) => '<li>' + t + '</li>').join('') + '</ol></div>' +
        '<div class="callout"><h3>' + tab.insight[0] + '</h3><p>' + tab.insight[1] + '</p></div></div>' +
        '<div><div class="tbl-title">Reale Daten</div><div class="table-wrap"><table><thead><tr><th>Stoff</th><th>Molare Masse (g/mol)</th><th>Merkmal</th><th>Schmelzpunkt (K)</th><th>Siedepunkt (K)</th><th>Zustand bei 25 °C</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
        '<p class="caveat"><b>Vereinfachungen:</b> ' + tab.simplified + '</p>';
      this.sec = sec;
      $('#panels').appendChild(sec);
      this.origin = new Origin($('.origin', sec), key);
      this.slider = $('.tslider', sec); this.tval = $('.tval', sec); this.tc = $('.tc', sec);
      this.grid = $('.box-grid', sec);
      const quick = $('.quick', sec);
      tab.quick.forEach(([k, label]) => {
        const b = document.createElement('button'); b.className = 'btn'; b.textContent = label;
        b.addEventListener('click', () => { this.slider.value = k; this.setTemp(k, true); });
        quick.appendChild(b);
      });
      this.slider.addEventListener('input', () => this.setTemp(+this.slider.value, false));
      this.pauseBtn = $('.pause', sec);
      this.pauseBtn.addEventListener('click', () => { this.paused = !this.paused; this.pauseBtn.textContent = this.paused ? 'Weiter' : 'Pause'; });
      $('.reset', sec).addEventListener('click', () => this.resetAll());
      $('.attr', sec).addEventListener('change', (e) => { this.showAttr = e.target.checked; });
      this.runBtn = $('.run', sec);
      this.runBtn.addEventListener('click', () => (this.heating ? this.stopHeating(true) : this.startHeating()));
      $('.clear', sec).addEventListener('click', () => { this.boxes.forEach((b) => { b.curve = []; b.marks = []; }); });
    }
    init() {
      if (this.ready) return;
      this.ready = true;
      this.boxes = this.tab.substances.map((s, i) => new BoxView(this.tab, s, i, this.grid));
      this.boxes.forEach((b) => b.measureCohesion());
      const mx = Math.max(...this.boxes.map((b) => b.cohesion));
      this.boxes.forEach((b) => b.setCohesionBar(mx));
      this.chart = new Chart($('.chart-wrap canvas', this.sec), this.tab, this.boxes);
      const lg = $('.legend', this.sec);
      lg.innerHTML = this.tab.substances.map((s, i) => '<span><i style="background:var(--s' + (i + 1) + ')"></i>' + s.name + '</span>').join('') +
        '<span class="mk">● <b>Schmelzen</b> &nbsp; ◆ <b>Sieden</b> &nbsp; flacher Abschnitt = Wärme lockert die Anziehung</span>';
      this.boxes.forEach((b) => { b.reset(this.temp); b.setTarget(this.temp); });
      this.boost = reduceMotion ? 0 : 100;
      this.resize();
    }
    resize() { this.origin.resize(); if (!this.ready) return; this.boxes.forEach((b) => b.resize()); this.chart.resize(); }
    setTemp(K, boost) {
      this.temp = K;
      this.tval.textContent = K + ' K';
      this.tc.textContent = kToC(K) + ' °C';
      if (!this.heating) this.boxes.forEach((b) => b.setTarget(K));
      if (boost && !reduceMotion) this.boost = 70;
    }
    resetAll() {
      this.stopHeating(false);
      this.boxes.forEach((b) => { b.reset(this.temp); b.setTarget(this.temp); });
      this.boost = reduceMotion ? 0 : 70;
    }
    startHeating() {
      this.boxes.forEach((b) => {
        b.curve = []; b.marks = []; b.reset(15); b.Ts = undefined; b.mc = 0; b.bc = 0; b.holding = false; b.tsum = 0; b.tn = 0;
        // let the fresh crystal settle at 15 K before any heat is added
        b.sim.thermoT = 15 / b.scale;
        for (let k = 0; k < 4000; k++) b.sim.step(DT);
        b.sim.time = 0; b.sim.snapT = -1; b.sim.mobility = 0; b.tickN = 0; b.fcE = 1; b.solid = true; b.cond = true; b.gas = false; b.phase = 'Solid';
        b.sim.thermoT = null; b.sim.heat = HEAT_Q / b.scale;
      });
      this.heating = { next: 0.5 };
      this.slider.disabled = true; this.paused = false; this.pauseBtn.textContent = 'Pause';
      this.runBtn.textContent = 'Heizen stoppen'; this.runBtn.classList.remove('primary');
      this.tval.textContent = '…'; this.tc.textContent = 'Aufheizen';
    }
    stopHeating(keepTemp) {
      if (!this.heating) return;
      this.heating = null;
      this.slider.disabled = false;
      this.runBtn.textContent = 'Heizexperiment starten'; this.runBtn.classList.add('primary');
      const mean = this.boxes.reduce((a, b) => a + b.Tk(), 0) / this.boxes.length;
      const K = clamp(Math.round(keepTemp ? mean : this.temp), 0, this.tab.tMax);
      this.slider.value = K; this.setTemp(K, false);
      this.boxes.forEach((b) => b.setTarget(K));
    }
    frameStep(t0) {
      const target = this.boost > 0 || this.heating ? BOOST_STEPS : STEPS_PER_FRAME;
      let done = 0;
      const b0 = this.boxes[0];
      while (done < target) {
        const chunk = Math.min(6, target - done);
        for (const b of this.boxes) {
          for (let k = 0; k < chunk; k++) b.sim.step(DT);
          b.tsum += b.sim.temperature(); b.tn++;
        }
        done += chunk;
        const hs = this.heating;
        if (hs && b0.sim.time >= hs.next) {
          hs.next += 0.5;
          const x = HEAT_Q * b0.sim.time * KJ;
          let allDone = true;
          this.boxes.forEach((b) => {
            if (b.holding) { b.tsum = 0; b.tn = 0; return; }
            const T = (b.tsum / Math.max(1, b.tn)) * b.scale; b.tsum = 0; b.tn = 0;
            b.Ts = b.Ts === undefined ? T : b.Ts + 0.08 * (T - b.Ts);
            const Tp = b.Ts;
            b.curve.push({ x, T: Tp, ph: b.phase });
            b.mc = /^(Liquid|Gas)/.test(b.phase) ? (b.mc || 0) + 1 : 0;
            b.bc = b.phase === 'Gas' ? (b.bc || 0) + 1 : 0;
            if (b.mc >= 5 && !b.melted) { b.melted = true; b.marks.push({ x, T: Tp, type: 'melt' }); }
            if (b.bc >= 5 && !b.boiled) { b.boiled = true; b.marks.push({ x, T: Tp, type: 'boil' }); }
            if (!b.holding && Tp >= this.tab.tMax) { b.holding = true; b.sim.heat = 0; b.sim.thermoT = this.tab.tMax / b.scale; }
            if (!b.holding) allDone = false;
          });
          if (allDone) { this.stopHeating(true); return; }
        }
        if (performance.now() - t0 > 13) break;
      }
      if (this.boost > 0) this.boost--;
    }
    frame(n) {
      this.origin.frame();
      if (!this.paused) this.frameStep(performance.now());
      if (n % 4 === 0) this.boxes.forEach((b) => {
        b.tick();
        b.tkEl.textContent = this.heating ? Math.round(b.Tk()) + ' K' : '';
      });
      this.boxes.forEach((b) => b.draw(this.showAttr));
      this.chart.draw();
      if (this.heating) { const last = this.boxes[0].curve.length; if (last) { this.tval.textContent = Math.round(this.boxes.reduce((a, b) => a + b.Tk(), 0) / this.boxes.length) + ' K'; this.tc.textContent = 'Mittelwert, Aufheizen'; } }
    }
  }

  // ------------------------------------------------------------------ controller
  const views = {};
  Object.keys(TABS).forEach((k) => { views[k] = new TabView(k, TABS[k]); });
  let active = null, raf = null, frameN = 0;
  function loop() {
    if (!active) return;
    readColors();
    views[active].frame(frameN++);
    raf = requestAnimationFrame(loop);
  }
  function activate(key) {
    active = key;
    document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === key)));
    Object.keys(views).forEach((k) => views[k].sec.classList.toggle('active', k === key));
    views[key].init();
    views[key].resize();
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    try { history.replaceState(null, '', '#' + key); } catch (e) { /* sandboxed */ }
  }
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => activate(b.dataset.tab)));
  window.addEventListener('resize', () => { if (active) views[active].resize(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
    else if (active && !raf) raf = requestAnimationFrame(loop);
  });
  /*DEBUG*/
  const start = (location.hash || '').replace('#', '');
  activate(TABS[start] ? start : 'vdw');
})();

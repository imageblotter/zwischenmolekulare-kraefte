const { Sim } = require('../src/engine.js');
function pairPE(sim) { sim.sinceBuild = 1e9; sim.forces(true); return sim.pe * sim.N; }
for (const cfg of [{ model: 'dip', mu2: 1.5 }, { model: 'mb', hb: 3, molecule: 'H2O' }]) {
  const s = new Sim(Object.assign({ N: 2, W: 20, H: 16, g: 0 }, cfg));
  // place two particles in an interesting configuration
  s.x[0] = 5; s.y[0] = 5; s.x[1] = 5 + 1.25; s.y[1] = 5 + 0.4; s.th[0] = 0.3; s.th[1] = 2.2;
  if (cfg.model === 'mb') { s.th[0] = 0.25; s.th[1] = Math.atan2(-0.4, -1.25) - 0 + 0.2; }
  const h = 1e-6;
  s.forces(true);
  const F = [s.fx[0], s.fy[0], s.fx[1], s.fy[1]], T = [s.tq[0], s.tq[1]];
  const num = [];
  const vars = [['x', 0], ['y', 0], ['x', 1], ['y', 1]];
  for (const [k, i] of vars) {
    const a = s[k][i]; s[k][i] = a + h; const up = pairPE(s); s[k][i] = a - h; const dn = pairPE(s); s[k][i] = a;
    num.push(-(up - dn) / (2 * h));
  }
  const numT = [];
  for (const i of [0, 1]) {
    const a = s.th[i]; s.th[i] = a + h; const up = pairPE(s); s.th[i] = a - h; const dn = pairPE(s); s.th[i] = a;
    numT.push(-(up - dn) / (2 * h));
  }
  console.log(cfg.model, 'analytic F', F.map(v => v.toFixed(5)), 'numeric', num.map(v => v.toFixed(5)));
  console.log(cfg.model, 'analytic T', T.map(v => v.toFixed(5)), 'numeric', numT.map(v => v.toFixed(5)));
}

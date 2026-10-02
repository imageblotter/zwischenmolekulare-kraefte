const { Sim } = require('../src/engine.js');
for (const mol of ['H2O', 'NH3', 'HF']) {
  const s = new Sim({ N: 2, W: 20, H: 16, g: 0, model: 'mb', hb: 3, molecule: mol });
  s.x[0] = 5; s.y[0] = 5; s.x[1] = 5 + 1.25; s.y[1] = 5 + 0.4;
  const a = Math.atan2(0.4, 1.25);
  s.th[0] = a - 0.9 + 0.15; s.th[1] = a + Math.PI + 0.7 - 0.1;
  const h = 1e-6, pe = () => { s.sinceBuild = 1e9; s.forces(true); return s.pe * s.N; };
  s.forces(true);
  const F = [s.fx[0], s.fy[0], s.fx[1], s.fy[1]], T = [s.tq[0], s.tq[1]];
  const num = [];
  for (const [k, i] of [['x', 0], ['y', 0], ['x', 1], ['y', 1]]) { const v = s[k][i]; s[k][i] = v + h; const u = pe(); s[k][i] = v - h; const d = pe(); s[k][i] = v; num.push(-(u - d) / (2 * h)); }
  const nT = [];
  for (const i of [0, 1]) { const v = s.th[i]; s.th[i] = v + h; const u = pe(); s.th[i] = v - h; const d = pe(); s.th[i] = v; nT.push(-(u - d) / (2 * h)); }
  console.log(mol, 'U=', pe().toFixed(4), 'F', F.map(v => v.toFixed(4)).join(','), '| num', num.map(v => v.toFixed(4)).join(','), '| T', T.map(v => v.toFixed(4)).join(','), '| num', nT.map(v => v.toFixed(4)).join(','));
}

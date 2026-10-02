const { Sim } = require('../src/engine.js');
const cfg = JSON.parse(process.argv[2] || '{}');
for (const q of (process.argv[3] || '0.01,0.004,0.002').split(',').map(Number)) {
  const s = new Sim(Object.assign({ N: 90, W: 26, H: 17, g: 0.03 }, cfg));
  s.reset(0.05); s.thermoT = null; s.heat = q;
  const dt = 0.004; const pts = []; let k = 0, acc = 0, n = 0;
  const tEnd = Math.min(2500, 1.1 / (0.45 * q));
  while (s.time < tEnd) { s.step(dt); k++; if (k % 20 === 0) { acc += s.temperature(); n++; } if (k % 500 === 0) { pts.push([s.time, acc / n]); acc = 0; n = 0; if (k % 250 === 0) s.analyze(); } }
  // smooth and compute slope every ~ 0.04 T*
  const E = pts.map(p => p[0] * q); // heat per particle
  const T = pts.map((p, i) => { let a = 0, c = 0; for (let j = Math.max(0, i - 6); j <= Math.min(pts.length - 1, i + 6); j++) { a += pts[j][1]; c++; } return a / c; });
  let line = '';
  for (let i = 0; i < pts.length; i += Math.max(1, Math.floor(pts.length / 24))) line += `${E[i].toFixed(2)}:${T[i].toFixed(2)}  `;
  console.log('q=' + q, 'tEnd', tEnd.toFixed(0), '\n' + line);
}

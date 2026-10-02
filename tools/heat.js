const { Sim } = require('../src/engine.js');
function heatCurve(cfg, q, tEnd, every = 10) {
  const s = new Sim(Object.assign({ N: 90, W: 26, H: 17, g: 0.03 }, cfg));
  s.reset(0.05); s.thermoT = null; s.heat = q;
  const dt = 0.004, out = [];
  let acc = 0, n = 0, phaseLast = '';
  const Tacc = [];
  for (let k = 0; s.time < tEnd; k++) {
    s.step(dt);
    if (k % 250 === 0) { s.analyze(); }
    if (k % Math.round(every / dt) === 0) out.push([+s.time.toFixed(0), +s.temperature().toFixed(3), +s.fc.toFixed(2), +s.mobility.toFixed(2), +s.avgContacts.toFixed(1)]);
  }
  return out;
}
module.exports = { heatCurve };
if (require.main === module) {
  const cfg = JSON.parse(process.argv[2] || '{}');
  const q = +process.argv[3] || 0.01, tEnd = +process.argv[4] || 300;
  const t0 = Date.now();
  const o = heatCurve(cfg, q, tEnd, 10);
  console.log(o.map(r => r.join('\t')).join('\n'));
  console.error('ms', Date.now() - t0);
}

const { Sim } = require('../src/engine.js');
function scan(cfg, Ts, opt = {}) {
  const dt = 0.004, eq = opt.eq || 150, meas = opt.meas || 100;
  const rows = [];
  for (const T of Ts) {
    const s = new Sim(Object.assign({ N: 90, W: 26, H: 17 }, cfg));
    s.reset(T);
    s.thermoT = T;
    const steps = (t) => Math.round(t / dt);
    for (let k = 0; k < steps(eq); k++) { s.step(dt); if (k % 250 === 0) s.analyze(); }
    let fc = 0, mob = 0, ac = 0, n = 0, pe = 0, Tm = 0, cd = 0;
    for (let k = 0; k < steps(meas); k++) {
      s.step(dt);
      if (k % 250 === 0) { s.analyze(); s.forces(true); fc += s.fc; mob += s.mobility; ac += s.avgContacts; pe += s.pe; Tm += s.temperature(); cd += s.cdens; n++; }
    }
    rows.push({ T, fc: +(fc / n).toFixed(2), mob: +(mob / n).toFixed(3), contacts: +(ac / n).toFixed(2), pe: +(pe / n).toFixed(2), Tmeas: +(Tm / n).toFixed(2), rho: +(cd / n).toFixed(2) });
  }
  return rows;
}
module.exports = { scan };
if (require.main === module) {
  const cfg = JSON.parse(process.argv[2] || '{}');
  const Ts = (process.argv[3] || '0.2,0.3,0.4,0.5,0.6,0.7').split(',').map(Number);
  console.table(scan(cfg, Ts));
}

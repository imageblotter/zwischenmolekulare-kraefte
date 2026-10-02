// Baut aus src/template.html + src/engine.js + src/app.js (+ src/origin.js) eine einzelne HTML-Datei.
//   node tools/build.js                  -> intermolecular-forces.html (Artifact-Fassung, ohne <head>/Viewport)
//   STANDALONE=1 node tools/build.js     -> docs/index.html (vollständige Seite, z. B. für GitHub Pages)
//   DEBUG=1 / MOBILE=1                   -> Testhaken bzw. Viewport-Meta für lokale Tests
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const debug = !!process.env.DEBUG;

let out = read('src/template.html');
const app = read('src/app.js').replace('/*ORIGIN*/', () => read('src/origin.js'));
out = out.replace('/*ENGINE*/', () => read('src/engine.js')).replace('/*APP*/', () => app);

const hook = debug
  ? 'window.__views = views; window.__step = (k, n) => { readColors(); const v = views[k]; for (let i = 0; i < n; i++) { v.frameStep(performance.now() + 1e9); v.boxes.forEach(b => b.tick()); } v.boxes.forEach(b => b.draw(v.showAttr)); v.chart.draw(); }; window.__ostep = (k, secs, fps) => { readColors(); const o = views[k].origin; const dt = 1 / (fps || 30); for (let n = 0; n < secs / dt; n++) { o.last = performance.now() - dt * 1000; o.frame(); } };'
  : '';
out = out.replace('/*DEBUG*/', () => hook);

if (process.env.MOBILE) {
  const meta = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
  out = out.replace('<title>Zwischenmolekulare Kräfte</title>', () => '<title>Zwischenmolekulare Kräfte</title>\n' + meta);
}

if (process.env.STANDALONE) {
  const cut = out.indexOf('<div class="app">');
  const head = out.slice(0, cut), body = out.slice(cut);
  const pre = [
    '<!doctype html>',
    '<html lang="de">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<style>html{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style>',
  ].join('\n');
  out = pre + '\n' + head + '</head>\n<body>\n' + body + '\n</body>\n</html>\n';
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'index.html'), out);
  console.log('built docs/index.html', out.length, 'bytes (standalone)');
} else {
  fs.writeFileSync(path.join(root, 'intermolecular-forces.html'), out);
  console.log('built', out.length, 'bytes', debug ? '(debug)' : '(release)');
}

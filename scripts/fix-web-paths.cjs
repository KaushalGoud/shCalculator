const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, '..', 'dist');

const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html
  .replace(/href="\/(?!\/)/g, 'href="./')
  .replace(/src="\/(?!\/)/g, 'src="./');
fs.writeFileSync(indexPath, html);

const manifestPath = path.join(dist, 'manifest.webmanifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.start_url = './';
manifest.scope = './';
manifest.icons = manifest.icons.map((icon) => ({
  ...icon,
  src: icon.src.replace(/^\//, './'),
}));
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const jsDir = path.join(dist, '_expo', 'static', 'js', 'web');
for (const file of fs.readdirSync(jsDir)) {
  if (!file.endsWith('.js')) {
    continue;
  }

  const filePath = path.join(jsDir, file);
  const source = fs.readFileSync(filePath, 'utf8').split('/assets/').join('./assets/');
  fs.writeFileSync(filePath, source);
}

console.log('web export paths made relative');

// Calibragem da pérola: renderiza variações de material lado a lado.
// Uso: node scripts/calibrar-perola.mjs '{"iridescence":0}' '{"envMapIntensity":0}|{"amplitude":0.12}' ...
// Cada argumento é "material" ou "material|forma" em JSON.
import { createServer } from 'vite';
import { chromium } from 'playwright';
import sharp from 'sharp';

const variacoes = process.argv.slice(2).length ? process.argv.slice(2) : ['{}'];
const servidor = await createServer({ server: { port: 5198, strictPort: false }, logLevel: 'error' });
await servidor.listen();
const base = servidor.resolvedUrls.local[0];
const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
const pecas = [];
try {
  for (const [i, v] of variacoes.entries()) {
    const pagina = await navegador.newPage();
    pagina.on('pageerror', (e) => console.error('Erro:', e.message));
    const [material, forma = '{}'] = v.split('|');
    await pagina.goto(`${base}ferramentas/perola.html?tamanho=800&material=${encodeURIComponent(material)}&forma=${encodeURIComponent(forma)}`);
    await pagina.waitForFunction(() => window.__perola, null, { timeout: 60000 });
    const dados = await pagina.evaluate(() => window.__perola);
    const png = await sharp(Buffer.from(dados.split(',')[1], 'base64')).resize(500, 500).png().toBuffer();
    pecas.push({ input: png, left: i * 510, top: 0 });
    await pagina.close();
  }
} finally {
  await navegador.close();
  await servidor.close();
}
await sharp({ create: { width: variacoes.length * 510, height: 500, channels: 3, background: '#f3efe8' } })
  .composite(pecas)
  .png()
  .toFile(`capturas/calibragem-${Date.now()}.png`)
  .then(() => {});
const { readdir } = await import('node:fs/promises');
const ultima = (await readdir('capturas')).filter((f) => f.startsWith('calibragem-')).sort().at(-1);
console.log('ok', `capturas/${ultima}`);

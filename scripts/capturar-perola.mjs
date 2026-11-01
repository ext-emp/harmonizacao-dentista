// Gera fotos/hero/perola.png, a imagem estática da pérola 3D usada pelo hero
// antes de o Three.js carregar e como alternativa sem WebGL.
// Sobe um servidor Vite temporário, renderiza a cena num quadro só e salva o PNG
// com fundo transparente. Depois rode `npm run imagens`.
// Uso: npm run perola
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const TAMANHO = 1600;
const servidor = await createServer({ server: { port: 5199, strictPort: false }, logLevel: 'error' });
await servidor.listen();
const base = servidor.resolvedUrls.local[0];

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
try {
  const pagina = await navegador.newPage();
  pagina.on('pageerror', (e) => console.error('Erro na página:', e.message));
  await pagina.goto(`${base}ferramentas/perola.html?tamanho=${TAMANHO}`);
  await pagina.waitForFunction(() => window.__perola, null, { timeout: 60000 });
  const dados = await pagina.evaluate(() => window.__perola);
  if (dados === 'sem-webgl') throw new Error('O navegador não tem WebGL 2; não dá para renderizar a pérola.');
  await mkdir('fotos/hero', { recursive: true });
  await writeFile('fotos/hero/perola.png', Buffer.from(dados.split(',')[1], 'base64'));
  console.log(`Salvo fotos/hero/perola.png (${TAMANHO}×${TAMANHO})`);
} finally {
  await navegador.close();
  await servidor.close();
}

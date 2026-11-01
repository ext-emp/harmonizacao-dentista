// Prévia rápida dos ambientes e naturezas-mortas provisórios (uso interno,
// para calibrar as cenas antes de gerar os originais em fotos/).
// Precisa do servidor de desenvolvimento rodando.
// Uso: node scripts/previa-ambientes.mjs [cena1,cena2] [--escala 0.4] [--saida capturas/ambientes]
//      cenas de natureza-morta: prefixo "nm:" (ex.: nm:espelho:linho)
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const base = process.env.URL_SITE || 'http://localhost:5173/';
const cenas = (args[0] && !args[0].startsWith('--') ? args[0] : 'recepcao,arco,cortina,nicho,sala').split(',');
const escala = Number(opcao('escala', '0.4'));
const saida = opcao('saida', 'capturas/ambientes');
await mkdir(saida, { recursive: true });

const TAMANHOS = { recepcao: [2400, 1600], arco: [1600, 2000], cortina: [2400, 1600], nicho: [1600, 2000], sala: [2880, 1920] };

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
const arquivos = [];
for (const item of cenas) {
  const pagina = await navegador.newPage();
  pagina.on('pageerror', (e) => console.error('  erro:', e.message));
  pagina.on('console', (m) => m.type() === 'error' && console.error('  console:', m.text()));
  let url;
  let nome;
  if (item.startsWith('nm:')) {
    const [, cena, fundo = 'linho', exposicao = '1'] = item.split(':');
    const [w, h] = [Math.round(1000 * escala * 2), Math.round(1250 * escala * 2)];
    url = `${base}ferramentas/natureza-morta.html?cena=${cena}&fundo=${fundo}&largura=${w}&altura=${h}&exposicao=${exposicao}`;
    nome = `nm-${cena}-${fundo}`;
  } else {
    const [w, h] = (TAMANHOS[item] || [2400, 1600]).map((v) => Math.round(v * escala));
    url = `${base}ferramentas/ambientes.html?cena=${item}&largura=${w}&altura=${h}`;
    nome = item;
  }
  const inicio = Date.now();
  await pagina.goto(url);
  await pagina.waitForFunction(() => window.__render, null, { timeout: 180000 });
  const dados = await pagina.evaluate(() => window.__render);
  if (!dados.startsWith('data:')) {
    console.error(nome, dados);
  } else {
    const arquivo = `${saida}/${nome}.png`;
    await sharp(Buffer.from(dados.split(',')[1], 'base64')).png().toFile(arquivo);
    arquivos.push(arquivo);
    console.log(`  ${nome} (${((Date.now() - inicio) / 1000).toFixed(1)} s)`);
  }
  await pagina.close();
}
await navegador.close();

// Folha com todas, na mesma altura.
const altura = 360;
const pecas = [];
let x = 0;
for (const arquivo of arquivos) {
  const buffer = await sharp(arquivo).resize({ height: altura }).png().toBuffer();
  const { width } = await sharp(buffer).metadata();
  pecas.push({ input: buffer, left: x, top: 0 });
  x += width + 8;
}
if (pecas.length) {
  await sharp({ create: { width: x - 8, height: altura, channels: 3, background: '#ff00ff' } })
    .composite(pecas)
    .png()
    .toFile(`${saida}/folha.png`);
  console.log(`folha: ${saida}/folha.png`);
}

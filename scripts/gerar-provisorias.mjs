// ---------------------------------------------------------------------------
// Gera as imagens provisórias em fotos/ (originais), a partir das ferramentas:
//   - naturezas-mortas de porcelana (ferramentas/natureza-morta.html)
//   - ambientes da galeria "O espaço" (ferramentas/ambientes.html)
//   - placas dos casos de antes e depois e a imagem do Open Graph
//     (ferramentas/placa.html, com as fontes do site)
// Depois rode `npm run imagens`.
// Uso: node scripts/gerar-provisorias.mjs [filtro]
//      (filtro opcional: só gera arquivos cujo caminho contém o texto)
// ---------------------------------------------------------------------------
import { createServer } from 'vite';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const filtro = process.argv[2] || '';

// Naturezas-mortas: arquivo de saída -> cena, fundo e tamanho.
// O retrato do hero não é gerado aqui: a foto vem do doutor
// (fotos/hero/doutor-capa.png). A cena "busto" continua na ferramenta, se
// precisar de um provisório sem rosto de novo.
const NATUREZAS = [
  // Um claro (areia) e um escuro (grafite): os dois blocos não somem sobre a porcelana da seção.
  { saida: 'fotos/tratamentos/rosto.jpg', cena: 'seixos', fundo: 'areia', largura: 1600, altura: 2000 },
  { saida: 'fotos/tratamentos/sorriso.jpg', cena: 'prato', fundo: 'grafite', largura: 1600, altura: 2000 },
  { saida: 'fotos/procedimentos/lentes-de-contato-dental.jpg', cena: 'lamina', fundo: 'porcelana', largura: 800, altura: 1000 },
  { saida: 'fotos/procedimentos/harmonizacao-facial.jpg', cena: 'par', fundo: 'linho', largura: 800, altura: 1000 },
  { saida: 'fotos/procedimentos/preenchimento-labial.jpg', cena: 'almofada', fundo: 'perola', largura: 800, altura: 1000 },
  { saida: 'fotos/procedimentos/toxina-botulinica.jpg', cena: 'onda', fundo: 'linho', largura: 800, altura: 1000 },
  { saida: 'fotos/procedimentos/bioestimulador-de-colageno.jpg', cena: 'camadas', fundo: 'porcelana', largura: 800, altura: 1000 },
  { saida: 'fotos/procedimentos/clareamento-dental.jpg', cena: 'esfera', fundo: 'perola', largura: 800, altura: 1000 },
  { saida: 'fotos/sobre/retrato.jpg', cena: 'pedestal', fundo: 'grafite', largura: 1600, altura: 2000 },
  // Atendimento: detalhes que flutuam sobre o fundo do manifesto (sem paciente).
  { saida: 'fotos/atendimento/atendimento-01.jpg', cena: 'espelho', fundo: 'linho', largura: 1000, altura: 1250 },
  { saida: 'fotos/atendimento/atendimento-02.jpg', cena: 'xicara', fundo: 'areia', largura: 1000, altura: 1250 },
  { saida: 'fotos/atendimento/atendimento-03.jpg', cena: 'lamina', fundo: 'grafite', largura: 1000, altura: 1250, exposicao: 1.35 },
  { saida: 'fotos/atendimento/atendimento-04.jpg', cena: 'caderno', fundo: 'porcelana', largura: 1000, altura: 1250 },
];

// Ambientes da galeria "O espaço" (ferramentas/ambientes.html). A última
// (05) vira o fundo do manifesto: por isso é a maior e a mais escura.
const AMBIENTES = [
  { saida: 'fotos/espaco/espaco-01.jpg', cena: 'recepcao', largura: 2400, altura: 1600 },
  { saida: 'fotos/espaco/espaco-02.jpg', cena: 'arco', largura: 1600, altura: 2000 },
  { saida: 'fotos/espaco/espaco-03.jpg', cena: 'cortina', largura: 2400, altura: 1600 },
  { saida: 'fotos/espaco/espaco-04.jpg', cena: 'nicho', largura: 1600, altura: 2000 },
  { saida: 'fotos/espaco/espaco-05.jpg', cena: 'sala', largura: 2880, altura: 1920 },
];

// Placas feitas em HTML (fontes do site): casos e Open Graph.
const PLACAS = [];
for (let n = 1; n <= 6; n++) {
  const id = String(n).padStart(2, '0');
  for (const lado of ['antes', 'depois']) {
    PLACAS.push({ saida: `fotos/casos/caso-${id}-${lado}.jpg`, query: `tipo=caso&n=${id}&lado=${lado}`, largura: 1080, altura: 1080 });
  }
}
PLACAS.push({ saida: 'public/og-imagem.jpg', query: 'tipo=og', largura: 1200, altura: 630 });

// Desde 02/11/2026 estes originais são fotos de banco ou o retrato do hero
// (docs/creditos-imagens.md). O render deles vai para capturas/renders/, para
// não apagar a foto.
const SUBSTITUIDAS = [
  'fotos/tratamentos/',
  'fotos/sobre/',
  'fotos/atendimento/',
  'fotos/espaco/',
];
const destino = (saida) => (SUBSTITUIDAS.some((p) => saida.startsWith(p)) ? path.join('capturas', 'renders', saida) : saida);

const servidor = await createServer({ server: { port: 5197, strictPort: false }, logLevel: 'error' });
await servidor.listen();
const base = servidor.resolvedUrls.local[0];
const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });

// Salva em JPG, ou em PNG (com transparência) quando o destino é .png.
async function salvarJpg(buffer, saida) {
  await mkdir(path.dirname(saida), { recursive: true });
  const imagem = sharp(buffer);
  if (saida.endsWith('.png')) await imagem.png({ compressionLevel: 9 }).toFile(saida);
  else await imagem.jpeg({ quality: 92, mozjpeg: true }).toFile(saida);
  console.log('  salvo', saida);
}

try {
  for (const n of NATUREZAS.filter((x) => x.saida.includes(filtro))) {
    const pagina = await navegador.newPage();
    pagina.on('pageerror', (e) => console.error('  erro:', e.message));
    const q = new URLSearchParams({ cena: n.cena, fundo: n.fundo, largura: n.largura, altura: n.altura, exposicao: n.exposicao ?? 1 });
    if (n.cor) q.set('cor', n.cor);
    await pagina.goto(`${base}ferramentas/natureza-morta.html?${q}`);
    await pagina.waitForFunction(() => window.__render, null, { timeout: 120000 });
    const dados = await pagina.evaluate(() => window.__render);
    if (!dados.startsWith('data:')) throw new Error(`${n.saida}: ${dados}`);
    await salvarJpg(Buffer.from(dados.split(',')[1], 'base64'), destino(n.saida));
    await pagina.close();
  }

  for (const a of AMBIENTES.filter((x) => x.saida.includes(filtro))) {
    const pagina = await navegador.newPage();
    pagina.on('pageerror', (e) => console.error('  erro:', e.message));
    const q = new URLSearchParams({ cena: a.cena, largura: a.largura, altura: a.altura });
    await pagina.goto(`${base}ferramentas/ambientes.html?${q}`);
    await pagina.waitForFunction(() => window.__render, null, { timeout: 180000 });
    const dados = await pagina.evaluate(() => window.__render);
    if (!dados.startsWith('data:')) throw new Error(`${a.saida}: ${dados}`);
    await salvarJpg(Buffer.from(dados.split(',')[1], 'base64'), destino(a.saida));
    await pagina.close();
  }

  for (const p of PLACAS.filter((x) => x.saida.includes(filtro))) {
    const pagina = await navegador.newPage({ viewport: { width: p.largura, height: p.altura }, deviceScaleFactor: 1 });
    pagina.on('pageerror', (e) => console.error('  erro:', e.message));
    await pagina.goto(`${base}ferramentas/placa.html?${p.query}`);
    await pagina.waitForFunction(() => window.__pronta === true, null, { timeout: 30000 });
    await salvarJpg(await pagina.screenshot({ type: 'png' }), p.saida);
    await pagina.close();
  }
} finally {
  await navegador.close();
  await servidor.close();
}

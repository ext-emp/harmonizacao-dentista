// ---------------------------------------------------------------------------
// Compara alinhamentos de texto no celular (390 px, toque), com os mesmos
// trechos lado a lado:
//   atual        à esquerda, com text-wrap: pretty (o que o site usa)
//   justificado  text-align: justify
//   hifenizado   justificado + hifenização automática (como o Safari faria)
//   equilibrado  à esquerda, com as linhas equilibradas (text-wrap: balance)
// As etiquetas [CONFIRMAR] ficam escondidas: o texto final não terá elas.
// Uso: node scripts/comparar-alinhamento.mjs
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const SAIDA = 'capturas/alinhamento';
const DSF = 2;
const LARGURA = 390;
const ALTURA = 844;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Só os parágrafos de texto corrido (rótulos de uma linha não mudam).
const PARAGRAFOS = 'main p:not(.rotulo)';
const TODAS = [
  { nome: 'atual', titulo: 'Atual: à esquerda', css: '' },
  { nome: 'justificado', titulo: 'Justificado', css: `${PARAGRAFOS} { text-align: justify !important; }` },
  {
    nome: 'hifenizado',
    titulo: 'Justificado + hifenização',
    css: `${PARAGRAFOS} { text-align: justify !important; -webkit-hyphens: auto !important; hyphens: auto !important; }`,
  },
  { nome: 'equilibrado', titulo: 'À esquerda, equilibrado', css: `${PARAGRAFOS} { text-wrap: balance !important; }` },
];

const TRECHOS = [
  { nome: 'hero', seletor: '.hero__subtitulo' },
  { nome: 'manifesto', seletor: '.manifesto__texto' },
  { nome: 'tratamento', seletor: '.tratamento--rosto .tratamento__descricao' },
  { nome: 'sobre', seletor: '.sobre__paragrafos' },
  { nome: 'faq', seletor: '[data-faq] details:nth-of-type(2) .faq__resposta' },
];

// O navegador sabe hifenizar português? (palavra estreita quebra em mais linhas)
const testeHifen = () => {
  const d = document.createElement('div');
  d.lang = 'pt-BR';
  d.style.cssText = 'position:absolute;left:0;top:0;width:6ch;font:16px sans-serif;visibility:hidden;-webkit-hyphens:auto;hyphens:auto';
  d.textContent = 'naturalidade harmonização';
  document.body.append(d);
  const com = d.getBoundingClientRect().height;
  d.style.webkitHyphens = 'manual';
  d.style.hyphens = 'manual';
  const sem = d.getBoundingClientRect().height;
  d.remove();
  return com > sem + 1;
};

const navegador = await chromium.launch({ channel: 'chrome' });
await mkdir(SAIDA, { recursive: true });

const opcoesContexto = {
  viewport: { width: LARGURA, height: ALTURA },
  deviceScaleFactor: DSF,
  isMobile: true,
  hasTouch: true,
  // Sem animações: o texto aparece no estado final, sem divisão em palavras.
  reducedMotion: 'reduce',
  locale: 'pt-BR',
};

// Hifenização: o dicionário do Chrome pode demorar a chegar num perfil novo.
let hifeniza = false;
{
  const contexto = await navegador.newContext(opcoesContexto);
  const pagina = await contexto.newPage();
  await pagina.goto(URL_SITE);
  for (let i = 0; i < 10 && !hifeniza; i++) {
    hifeniza = await pagina.evaluate(testeHifen);
    if (!hifeniza) await espera(2000);
  }
  await contexto.close();
}
console.log(`hifenização em português neste navegador: ${hifeniza ? 'sim' : 'não'}`);
const VARIANTES = TODAS.filter((v) => v.nome !== 'hifenizado' || hifeniza);

const capturas = {};
for (const v of VARIANTES) {
  const contexto = await navegador.newContext(opcoesContexto);
  const pagina = await contexto.newPage();
  await pagina.goto(URL_SITE);
  await pagina.addStyleTag({ content: `.header{display:none!important} .pendente{display:none!important} ${v.css}` });
  await pagina.evaluate(() => {
    document.querySelectorAll('[data-faq] details')[1].open = true;
    return document.fonts.ready;
  });
  await espera(900);
  for (const t of TRECHOS) {
    await pagina.evaluate((s) => {
      const el = document.querySelector(s);
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
    }, t.seletor);
    await espera(250);
    const r = await pagina.evaluate((s) => {
      const b = document.querySelector(s).getBoundingClientRect();
      return { y: b.top, h: b.height };
    }, t.seletor);
    const y = Math.max(0, Math.round(r.y - 20));
    const clip = { x: 0, y, width: LARGURA, height: Math.min(ALTURA - y, Math.round(r.h + 40)) };
    (capturas[t.nome] ??= {})[v.nome] = await pagina.screenshot({ clip });
  }
  await pagina.screenshot({ path: `${SAIDA}/${v.nome}-ultima.png` });
  await contexto.close();
}
await navegador.close();

// ---- Folha de comparação: uma coluna por variante, uma linha por trecho ----
const ESCALA = 0.75;
const COLUNA = Math.round(LARGURA * DSF * ESCALA);
const VAO = 14;
const TOPO = 64;
const linhas = [];
for (const t of TRECHOS) {
  const metas = await Promise.all(
    VARIANTES.map(async (v) => {
      const buf = await sharp(capturas[t.nome][v.nome]).resize({ width: COLUNA }).png().toBuffer();
      return { buf, altura: (await sharp(buf).metadata()).height };
    }),
  );
  linhas.push({ metas, altura: Math.max(...metas.map((m) => m.altura)) });
}

const largura = VARIANTES.length * COLUNA + (VARIANTES.length - 1) * VAO;
const altura = TOPO + linhas.reduce((soma, l) => soma + l.altura + VAO, 0);
const pecas = VARIANTES.map((v, i) => ({
  input: Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${COLUNA}" height="${TOPO}"><text x="14" y="42" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="600" fill="#161513">${v.titulo}</text></svg>`,
  ),
  left: i * (COLUNA + VAO),
  top: 0,
}));
let topo = TOPO;
for (const l of linhas) {
  l.metas.forEach((m, i) => pecas.push({ input: m.buf, left: i * (COLUNA + VAO), top: topo }));
  topo += l.altura + VAO;
}
await sharp({ create: { width: largura, height: altura, channels: 3, background: '#cfc7ba' } })
  .composite(pecas)
  .png()
  .toFile(`${SAIDA}/comparacao.png`);
console.log(`ok ${SAIDA}/comparacao.png (${largura}×${altura})`);

// ---------------------------------------------------------------------------
// O hero em vários tamanhos de tela, inclusive a altura de verdade de um
// celular com as barras do navegador (390x664 é um iPhone no Safari).
// Confere que o botão cabe inteiro na primeira tela, que nenhum texto cobre
// o rosto do retrato, que nada passa da largura da tela e, no celular, que o header fica claro sobre o
// hero escuro e que o texto tem contraste WCAG sobre o véu e o jaleco (como
// em contraste-fundo.mjs: esconde o texto, fotografa o fundo e compara com o
// pixel mais claro atrás de cada linha, percentil 98). Mostra também a
// altura do texto (do rótulo ao pé do hero), que calibra --hero-texto.
// Uso: node scripts/testar-hero.mjs [LxA ou LxAt (com toque) ...] [--capturas pasta]
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const linear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminancia = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const contraste = (a, b) => {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// Textos do hero sobre o fundo e o mínimo de cada um (título: texto grande).
const TEXTOS = [
  { nome: 'rótulo', seletor: '.hero__rotulo', minimo: 4.5 },
  { nome: 'título', seletor: '.hero__titulo', minimo: 3 },
  { nome: 'subtítulo', seletor: '.hero__subtitulo', minimo: 4.5 },
  { nome: 'cidade', seletor: '.hero__cidade', minimo: 4.5 },
  { nome: 'nota', seletor: '.hero__nota', minimo: 4.5 },
];

// Pior contraste de cada texto: cor do texto contra o pixel mais claro atrás dele.
async function medirContraste(pagina) {
  const medidas = await pagina.evaluate((textos) => {
    const saida = textos.map((t) => {
      const el = document.querySelector(t.seletor);
      if (!el || !el.offsetWidth) return { ...t, caixas: [] };
      const r = document.createRange();
      r.selectNodeContents(el);
      const caixas = [...r.getClientRects()]
        .map((c) => ({ x: Math.max(0, c.left), y: Math.max(0, c.top), w: Math.min(innerWidth, c.right) - Math.max(0, c.left), h: Math.min(innerHeight, c.bottom) - Math.max(0, c.top) }))
        .filter((c) => c.w > 4 && c.h > 4);
      // A cor do texto de verdade (o título é dividido em linhas pelo SplitText).
      const folha = el.querySelector('.linha') || el;
      return { ...t, cor: getComputedStyle(folha).color, caixas };
    });
    const estilo = document.createElement('style');
    estilo.id = 'medir-contraste';
    estilo.textContent = '.hero__rotulo,.hero__titulo,.hero__titulo *,.hero__subtitulo,.hero__subtitulo *,.hero__nota{color:transparent!important}';
    document.head.append(estilo);
    return saida;
  }, TEXTOS);
  await new Promise((r) => setTimeout(r, 300));
  const tela = await pagina.screenshot();
  await pagina.evaluate(() => document.getElementById('medir-contraste').remove());

  const resultado = [];
  for (const t of medidas) {
    if (!t.caixas.length) continue;
    let pior = null;
    for (const c of t.caixas) {
      const { data, info } = await sharp(tela).extract({ left: Math.round(c.x), top: Math.round(c.y), width: Math.max(1, Math.round(c.w)), height: Math.max(1, Math.round(c.h)) }).raw().toBuffer({ resolveWithObject: true });
      const pixels = [];
      for (let k = 0; k < data.length; k += info.channels) pixels.push([data[k], data[k + 1], data[k + 2]]);
      pixels.sort((a, b) => luminancia(a) - luminancia(b));
      const claro = pixels[Math.floor(pixels.length * 0.98)];
      if (!pior || luminancia(claro) > luminancia(pior)) pior = claro;
    }
    const cor = t.cor.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    resultado.push({ nome: t.nome, minimo: t.minimo, razao: contraste(cor, pior), fundo: pior });
  }
  return resultado;
}

const args = process.argv.slice(2);
const iCapturas = args.indexOf('--capturas');
const CAPTURAS = iCapturas >= 0 ? args[iCapturas + 1] : null;
const tamanhos = args.filter((a, i) => /^\d+x\d+t?$/.test(a) && i !== iCapturas + 1);
const LISTA = tamanhos.length
  ? tamanhos
  : ['390x844t', '390x664t', '430x740t', '412x780t', '375x553t', '360x640t', '320x568t', '768x1024t', '820x1180t', '1024x1366t', '844x390t', '1440x900', '1366x657', '1920x1080'];
const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
if (CAPTURAS) await mkdir(CAPTURAS, { recursive: true });

let falhas = 0;
const conferir = (ok, mensagem) => {
  console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${mensagem}`);
  if (!ok) falhas++;
};

// Medidas na página. O rosto é uma caixa fixa dentro do retrato provisório
// (de 6% a 45% da altura, de 28% a 66% da largura): trocar a foto pede
// conferir esses números.
function medir() {
  const caixa = (el) => {
    const r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, r: r.right, b: r.bottom };
  };
  const cruza = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  const linhas = (el) => {
    const caixas = [];
    const andar = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (andar.nextNode()) {
      if (!andar.currentNode.textContent.trim()) continue;
      const faixa = document.createRange();
      faixa.selectNodeContents(andar.currentNode);
      caixas.push(...[...faixa.getClientRects()].filter((b) => b.width && b.height).map((b) => ({ l: b.left, t: b.top, r: b.right, b: b.bottom })));
    }
    return caixas;
  };

  const hero = document.querySelector('[data-hero]');
  const largo = getComputedStyle(document.querySelector('.hero__fundo')).display === 'none';
  const comp = caixa(document.querySelector('.hero__composicao'));
  const a = comp.b - comp.t;
  const w = comp.r - comp.l;
  const rosto = { l: comp.l + w * 0.28, r: comp.l + w * 0.66, t: comp.t + a * 0.06, b: comp.t + a * 0.45 };

  const textos = ['.hero__rotulo', '.hero__titulo', '.hero__subtitulo', '.hero__acoes'].flatMap((s) => linhas(document.querySelector(s)));
  const botao = caixa(document.querySelector('.hero__acoes .botao'));
  const rotulo = caixa(document.querySelector('.hero__rotulo'));

  return {
    largo,
    vp: [innerWidth, innerHeight],
    hero: Math.round(hero.offsetHeight),
    retrato: Math.round(w),
    textoAltura: Math.round(hero.getBoundingClientRect().bottom - rotulo.t),
    botaoNaTela: botao.b <= innerHeight + 0.5,
    botaoFolga: Math.round(innerHeight - botao.b),
    textoNoRosto: !largo && textos.some((t) => cruza(t, rosto)),
    sobraLateral: document.documentElement.scrollWidth - innerWidth,
    headerEscuro: document.querySelector('[data-header]').classList.contains('header--escuro'),
  };
}

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const t of LISTA) {
  const [, largura, altura, toque] = /^(\d+)x(\d+)(t?)$/.exec(t);
  console.log(`\n== ${t}${toque ? ' (toque)' : ''}`);
  const contexto = await navegador.newContext({
    viewport: { width: Number(largura), height: Number(altura) },
    isMobile: Boolean(toque),
    hasTouch: Boolean(toque),
    locale: 'pt-BR',
  });
  await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await pagina.goto(URL_SITE);
  await pagina.addStyleTag({ content: '.cursor-ponto,.cursor-anel{display:none!important}' });
  await espera(3500);

  const r = await pagina.evaluate(medir);
  console.log(`  ${r.largo ? 'layout largo' : 'celular'}: hero ${r.hero} px, retrato ${r.retrato} px, texto ${r.textoAltura} px, folga do botão ${r.botaoFolga} px`);
  // Celular deitado: o título limitado pela altura ainda empurra o botão
  // para baixo da primeira tela (hero.css); ali o retrato fica ao lado.
  if (r.largo && r.vp[1] <= 500) console.log('  -     botão abaixo da primeira tela (celular deitado, esperado)');
  else conferir(r.botaoNaTela, 'botão inteiro na primeira tela');
  if (!r.largo) conferir(!r.textoNoRosto, 'nenhum texto sobre o rosto');
  conferir(r.sobraLateral <= 0, `sem rolagem lateral${r.sobraLateral > 0 ? ` (${r.sobraLateral} px)` : ''}`);
  conferir(r.headerEscuro === !r.largo, `header com texto ${r.largo ? 'escuro' : 'claro'} sobre o hero`);
  if (CAPTURAS) await pagina.screenshot({ path: `${CAPTURAS}/${t}.png` });
  if (!r.largo) {
    for (const c of await medirContraste(pagina)) {
      conferir(c.razao >= c.minimo, `contraste do ${c.nome}: ${c.razao.toFixed(2)}:1 (mínimo ${c.minimo}), fundo mais claro rgb(${c.fundo.join(',')})`);
    }
  }
  conferir(!erros.length, `console sem erros ${[...new Set(erros)].join(' | ')}`);
  await contexto.close();
}
await navegador.close();
console.log(falhas ? `\n${falhas} falha(s).` : '\nHero ok em todos os tamanhos.');
process.exitCode = falhas ? 1 : 0;

// ---------------------------------------------------------------------------
// Quadros da viagem da pérola (hero -> abertura do "O espaço") para revisão:
// captura a tela em várias posições do scroll, de 0 até depois do pouso, e
// confere se a pérola encosta em algum texto ou no retrato em algum quadro.
// O que do hero já foi coberto pela seção escura (que sobe por cima dele)
// não conta.
// Precisa do servidor de desenvolvimento (window.__perola só existe no dev).
// Uso: node scripts/capturar-viagem.mjs [--vp desktop,mobile,ipad-em-pe,...] [--saida capturas/viagem]
// (sem --vp, todos: desktop em três tamanhos, quatro celulares e três iPads)
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const SAIDA = opcao('saida', 'capturas/viagem');
const FRACOES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 1, 1.25];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  'desktop-1920': { viewport: { width: 1920, height: 1080 } },
  'desktop-1280': { viewport: { width: 1280, height: 720 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  'mobile-360': { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
  // Telas baixas: retrato menor em pé; deitado, retrato ao lado do texto (hero.css).
  'mobile-baixo': { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true },
  'mobile-deitado': { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true },
  'ipad-em-pe': { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true },
  'ipad-pro-em-pe': { viewport: { width: 1024, height: 1366 }, isMobile: true, hasTouch: true },
  'ipad-deitado': { viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true },
};
// Sem --vp, todos os tamanhos acima.
const VPS = opcao('vp', Object.keys(VIEWPORTS).join(',')).split(',');

// Roda na página: caixa visível da pérola (65% do quadro, já com a escala) e
// os elementos que ela não pode cobrir. Devolve as sobreposições.
const examinar = () => {
  const viagem = document.querySelector('[data-perola-viagem]');
  const r = viagem.getBoundingClientRect();
  const lado = r.width * 0.65;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const perola = { left: cx - lado / 2, right: cx + lado / 2, top: cy - lado / 2, bottom: cy + lado / 2 };

  // Caixas reais do texto (linha a linha), não dos blocos.
  const caixasDeTexto = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return [...range.getClientRects()].filter((c) => c.width > 1 && c.height > 1);
  };
  // Topo da seção escura na tela: do hero, só conta o que está acima dele.
  const topoEscuro = document.querySelector('[data-espaco]').getBoundingClientRect().top;
  const doHero = (c) => (c.top >= topoEscuro ? null : { left: c.left, right: c.right, top: c.top, bottom: Math.min(c.bottom, topoEscuro) });
  const alvos = [
    ...['.hero__rotulo', '.hero__titulo', '.hero__subtitulo', '.hero__nota', '.hero__rolar'].flatMap((s) =>
      [...document.querySelectorAll(s)].flatMap((el) => caixasDeTexto(el).map((c) => ({ nome: s, c: doHero(c) }))),
    ),
    ...['.espaco__rotulo', '.espaco__frase'].flatMap((s) =>
      [...document.querySelectorAll(s)].flatMap((el) => caixasDeTexto(el).map((c) => ({ nome: s, c }))),
    ),
    ...['.hero__acoes .botao'].map((s) => ({ nome: s, c: doHero(document.querySelector(s).getBoundingClientRect()) })),
    // O header pode estar escondido (sobe ao rolar para baixo): só conta se estiver à vista.
    ...['.header__barra .botao']
      .map((s) => document.querySelector(s))
      .filter((el) => el && el.getBoundingClientRect().bottom > 0 && !document.querySelector('.header--oculto'))
      .map((el) => ({ nome: '.header__barra .botao', c: el.getBoundingClientRect() })),
  ].filter((a) => a.c);

  // O retrato: só a área opaca conta, então uso a caixa da pessoa (medida no PNG).
  const img = document.querySelector('.hero__retrato-img');
  const ri = img.getBoundingClientRect();
  const escala = Math.min(ri.width / img.naturalWidth, ri.height / img.naturalHeight);
  const largura = img.naturalWidth * escala;
  const altura = img.naturalHeight * escala;
  const [px, py] = getComputedStyle(img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
  const x0 = ri.left + (ri.width - largura) * px;
  const y0 = ri.top + (ri.height - altura) * py;
  // Pessoa entre 0,8% e 99,4% da largura e de 6% da altura até a base
  // (scripts/limites-alfa.mjs em fotos/hero/doutor-capa.png, retrato de
  // 03/11/2026). Medir de novo quando a foto mudar.
  const pessoa = doHero({ left: x0 + largura * 0.008, right: x0 + largura * 0.994, top: y0 + altura * 0.06, bottom: y0 + altura });
  if (pessoa) alvos.push({ nome: 'retrato', c: pessoa });

  const encosta = (a, b, folga = 4) =>
    a.left < b.right + folga && a.right > b.left - folga && a.top < b.bottom + folga && a.bottom > b.top - folga;
  const naTela = perola.bottom > 0 && perola.top < innerHeight;
  return {
    perola: Object.fromEntries(Object.entries(perola).map(([k, v]) => [k, Math.round(v)])),
    naTela,
    sobreposicoes: naTela ? [...new Set(alvos.filter((a) => encosta(perola, a.c)).map((a) => a.nome))] : [],
  };
};

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
let problemas = 0;

for (const nome of VPS) {
  const vp = VIEWPORTS[nome];
  const contexto = await navegador.newContext({ ...vp, locale: 'pt-BR' });
  await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await pagina.goto(URL_SITE);
  await pagina.addStyleTag({ content: '.cursor-ponto,.cursor-anel{display:none!important}' });
  // Espera a pérola 3D (ou desiste, sem WebGL) e o fim das entradas.
  await pagina
    .waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('.perola-palco__canvas') || document.body).opacity) > 0.99, null, { timeout: 12000 })
    .catch(() => {});
  await espera(1500);
  const medidas = await pagina.evaluate(() => window.__perola?.medidas());
  if (!medidas) throw new Error('window.__perola não existe: rode no servidor de desenvolvimento.');
  console.log(`\n== ${nome}: viagem de ${Math.round(medidas.inicio)} a ${Math.round(medidas.fim)} px de scroll, escala ${medidas.escalaInicio.toFixed(2)} -> ${medidas.escalaPouso.toFixed(2)}`);
  await mkdir(`${SAIDA}/${nome}`, { recursive: true });

  for (const [i, f] of FRACOES.entries()) {
    const y = Math.round(medidas.inicio + (medidas.fim - medidas.inicio) * f);
    await pagina.evaluate((v) => (window.__lenis ? window.__lenis.scrollTo(v, { immediate: true }) : window.scrollTo(0, v)), y);
    await espera(700);
    const r = await pagina.evaluate(examinar);
    const aviso = r.sobreposicoes.length ? `ENCOSTA EM ${r.sobreposicoes.join(', ')}` : 'livre';
    if (r.sobreposicoes.length) problemas++;
    console.log(`  ${String(Math.round(f * 100)).padStart(3)}% (y=${String(y).padStart(4)}): pérola ${r.perola.left}-${r.perola.right} × ${r.perola.top}-${r.perola.bottom}  ${r.naTela ? aviso : 'fora da tela'}`);
    await pagina.screenshot({ path: `${SAIDA}/${nome}/${String(i).padStart(2, '0')}-${Math.round(f * 100)}.png` });
  }
  if (erros.length) {
    problemas++;
    console.log(`  console: ${erros.join(' | ')}`);
  }
  await contexto.close();
}

await navegador.close();
console.log(problemas ? `\n${problemas} problema(s).` : '\nA pérola não encosta em nada durante a viagem.');
process.exitCode = problemas ? 1 : 0;

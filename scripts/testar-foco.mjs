// ---------------------------------------------------------------------------
// Teclado e âncoras com as seções empilhadas (pilha.js): uma seção parada
// pode estar coberta pela seguinte. Confere que:
//  - cada elemento que recebe foco pelo Tab está à vista (não coberto);
//  - cada link do menu leva à seção certa, com o topo dela no alto da tela;
//  - no celular, com o menu em tela cheia aberto, o Tab não sai do menu e
//    tocar no monograma fecha o menu.
// Uso: node scripts/testar-foco.mjs [--reduzido]
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';

const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const REDUZIDO = process.argv.includes('--reduzido');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let falhas = 0;

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-BR', reducedMotion: REDUZIDO ? 'reduce' : 'no-preference' });
await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
const pagina = await contexto.newPage();
const erros = [];
pagina.on('pageerror', (e) => erros.push(e.message));
await pagina.goto(URL_SITE);
await espera(3500);

// ---- Tab pela página inteira ------------------------------------------------
console.log(`\n== Tab pela página${REDUZIDO ? ' (movimento reduzido)' : ''}`);
const cobertos = [];
let total = 0;
let ultimo = '';
for (let i = 0; i < 160; i++) {
  await pagina.keyboard.press('Tab');
  // Tempo para o header voltar (ele desce ao receber o foco) e o scroll assentar.
  await espera(REDUZIDO ? 150 : 700);
  const foco = await pagina.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    // Uma volta só: para quando o foco volta a um elemento já visitado.
    window.__visitados ??= new WeakSet();
    if (window.__visitados.has(el)) return { repetido: true };
    window.__visitados.add(el);
    const r = el.getBoundingClientRect();
    const x = Math.min(innerWidth - 1, Math.max(0, r.left + Math.min(r.width, 40) / 2));
    const y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const topo = document.elementFromPoint(x, y);
    const nome = `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)}"`;
    // Elementos escondidos de propósito (input do slider, link "pular") contam pelo pai visível.
    const alvo = el.matches('input[type=range]') ? el.closest('[data-comparador]') : el;
    const visivel = r.bottom > 0 && r.top < innerHeight;
    const naFrente = topo && (alvo.contains(topo) || topo.contains(alvo) || topo.closest('.header') !== null && el.closest('.header') !== null);
    return { nome, chave: nome + Math.round(r.top + scrollY), ok: el.matches('.pular-conteudo') || (visivel && naFrente), y: Math.round(scrollY) };
  });
  if (!foco) continue;
  if (foco.repetido) break;
  total++;
  ultimo = foco.nome;
  if (!foco.ok) cobertos.push(`${foco.nome} (scroll ${foco.y})`);
}
const ok1 = cobertos.length === 0;
if (!ok1) falhas++;
console.log(`  ${ok1 ? 'ok   ' : 'FALHA'} ${total} elementos com foco (o último: ${ultimo}); cobertos ou fora da tela: ${cobertos.length}`);
cobertos.slice(0, 10).forEach((c) => console.log(`        ${c}`));

// ---- Links do menu ----------------------------------------------------------
console.log('\n== links do menu');
for (const id of ['tratamentos', 'resultados', 'sobre', 'experiencia', 'faq', 'contato', 'espaco']) {
  await pagina.evaluate(() => (window.__lenis ? window.__lenis.scrollTo(0, { immediate: true, force: true }) : scrollTo(0, 0)));
  await espera(500);
  // O link "Rolar" do hero leva ao "O espaço"; os outros estão no menu.
  const link = id === 'espaco' ? '.hero__rolar' : `.header a[href="#${id}"]`;
  await pagina.locator(link).first().click();
  await espera(2600);
  const r = await pagina.evaluate((i) => {
    const s = document.getElementById(i);
    const topo = Math.round(s.getBoundingClientRect().top);
    const meio = document.elementFromPoint(innerWidth / 2, innerHeight * 0.6);
    return { topo, naFrente: s.contains(meio), foco: document.activeElement === s };
  }, id);
  const ok = Math.abs(r.topo) <= 4 && r.naFrente && r.foco;
  if (!ok) falhas++;
  console.log(`  ${ok ? 'ok   ' : 'FALHA'} #${id.padEnd(12)} topo ${r.topo}px, à frente ${r.naFrente ? 'sim' : 'NÃO'}, foco ${r.foco ? 'sim' : 'NÃO'}`);
}

// ---- Menu em tela cheia (celular) ---------------------------------------------
// Aberto, o Tab não sai para a página por trás (nem para o "Pular para o
// conteúdo"); tocar no monograma fecha o menu e solta a rolagem.
console.log('\n== menu em tela cheia (celular)');
const celular = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  locale: 'pt-BR',
  reducedMotion: REDUZIDO ? 'reduce' : 'no-preference',
});
await celular.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
const paginaCelular = await celular.newPage();
paginaCelular.on('pageerror', (e) => erros.push(e.message));
await paginaCelular.goto(URL_SITE);
await espera(3000);
// Desce e sobe um pouco: o header volta à tela.
await paginaCelular.evaluate(() => window.scrollTo(0, 3000));
await espera(600);
await paginaCelular.evaluate(() => window.scrollTo(0, 2900));
await espera(800);
await paginaCelular.tap('[data-menu-botao]');
await espera(1500);
const fora = [];
for (let i = 0; i < 16; i++) {
  await paginaCelular.keyboard.press('Tab');
  const foco = await paginaCelular.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    return el.closest('.header') ? null : `${el.tagName.toLowerCase()} "${(el.textContent || '').trim().slice(0, 30)}"`;
  });
  if (foco) fora.push(foco);
}
const okTab = fora.length === 0;
if (!okTab) falhas++;
console.log(`  ${okTab ? 'ok   ' : 'FALHA'} com o menu aberto, o Tab fica no header e no menu${okTab ? '' : ` (saiu para: ${[...new Set(fora)].join(', ')})`}`);
await paginaCelular.tap('.header__marca');
await espera(2000);
const depois = await paginaCelular.evaluate(() => ({
  aberto: document.querySelector('[data-menu-botao]').getAttribute('aria-expanded'),
  travada: getComputedStyle(document.documentElement).overflow === 'hidden',
}));
const okMarca = depois.aberto === 'false' && !depois.travada;
if (!okMarca) falhas++;
console.log(`  ${okMarca ? 'ok   ' : 'FALHA'} tocar no monograma fecha o menu e solta a rolagem`);
await celular.close();

if (erros.length) {
  falhas++;
  console.log(`  FALHA console: ${erros.join(' | ')}`);
}
await navegador.close();
console.log(falhas ? `\n${falhas} falha(s).` : '\nFoco e âncoras ok.');
process.exitCode = falhas ? 1 : 0;

// ---------------------------------------------------------------------------
// Janela redimensionada e celular girado com a página no meio:
//  1. A pessoa continua na seção que estava lendo (lugar.js). As alturas dos
//     trechos animados mudam com a tela; sem o ajuste, a mesma rolagem em
//     pixels cairia em outra seção.
//  2. Celular deitado: as rodas viram lista, sem sobra (classe, disco,
//     percurso, estilos nos itens); em pé de novo, voltam e giram.
// Precisa do servidor de desenvolvimento (window.__rodas só existe no dev).
// Uso: node scripts/testar-redimensionar.mjs
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';

const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let falhas = 0;
const conferir = (ok, mensagem) => {
  console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${mensagem}`);
  if (!ok) falhas++;
};

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });

async function abrir(tamanho, toque) {
  const contexto = await navegador.newContext({ viewport: tamanho, isMobile: toque, hasTouch: toque, locale: 'pt-BR' });
  await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await pagina.goto(URL_SITE);
  await espera(2500);
  return { contexto, pagina, erros };
}

// Seção (de primeiro nível) que está no meio da tela.
const noMeio = (pagina) =>
  pagina.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    const secao = el?.closest('main > section, main > section section, footer');
    return secao ? `#${secao.id || secao.tagName.toLowerCase()}` : '?';
  });

// ---- 1. O lugar da leitura -------------------------------------------------
console.log('\n== lugar da leitura depois de mudar o tamanho');
const casos = [
  ['desktop 1440x900 -> 1280x800', { width: 1440, height: 900 }, { width: 1280, height: 800 }, false],
  ['desktop 1440x900 -> 1920x1080', { width: 1440, height: 900 }, { width: 1920, height: 1080 }, false],
  ['celular em pé -> deitado', { width: 390, height: 844 }, { width: 844, height: 390 }, true],
  ['celular deitado -> em pé', { width: 844, height: 390 }, { width: 390, height: 844 }, true],
];
for (const [nome, de, para, toque] of casos) {
  const mudaram = [];
  for (const alvo of ['#tratamentos', '#resultados', '#sobre', '#faq', '#contato']) {
    const { contexto, pagina } = await abrir(de, toque);
    // Vai até a seção pela posição dela no HTML (como as âncoras do site).
    await pagina.evaluate((sel) => {
      document.documentElement.classList.add('pilha-medindo');
      const y = document.querySelector(sel).getBoundingClientRect().top + scrollY + innerHeight * 0.2;
      document.documentElement.classList.remove('pilha-medindo');
      window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y);
    }, alvo);
    await espera(1500);
    const antes = await noMeio(pagina);
    await pagina.setViewportSize(para);
    await espera(2500);
    const depois = await noMeio(pagina);
    if (antes !== depois) mudaram.push(`${antes} -> ${depois}`);
    await contexto.close();
  }
  conferir(!mudaram.length, `${nome}: continua na mesma seção${mudaram.length ? ` (${mudaram.join(', ')})` : ''}`);
}

// ---- 2. Girar o celular: rodas viram lista e voltam ------------------------
console.log('\n== girar o celular (rodas)');
const { contexto, pagina, erros } = await abrir({ width: 390, height: 844 }, true);
const estadoDasRodas = () =>
  pagina.evaluate(() =>
    ['experiencia', 'consulta'].map((id) => {
      const s = document.getElementById(id);
      const itens = [...s.querySelectorAll('[data-roda-item]')];
      return {
        ativa: s.classList.contains('roda--ativa'),
        marcos: s.querySelectorAll('.roda__marco').length,
        percurso: s.querySelector('[data-roda-percurso]').offsetHeight,
        visiveis: itens.filter((i) => getComputedStyle(i).opacity === '1').length,
        total: itens.length,
        estilo: itens.some((i) => i.getAttribute('style')),
        desce: s.style.getPropertyValue('--roda-desce'),
      };
    }),
  );
let e = await estadoDasRodas();
conferir(e.every((r) => r.ativa && r.marcos === r.total && r.percurso > 0), 'em pé: as duas rodas ligadas');
await pagina.setViewportSize({ width: 844, height: 390 });
await espera(2500);
e = await estadoDasRodas();
conferir(
  e.every((r) => !r.ativa && !r.marcos && !r.percurso && r.visiveis === r.total && !r.estilo && !r.desce),
  'deitado: as duas viram lista, sem sobra da roda',
);
await pagina.setViewportSize({ width: 390, height: 844 });
await espera(2500);
e = await estadoDasRodas();
conferir(e.every((r) => r.ativa && r.marcos === r.total && r.percurso > 0), 'em pé de novo: as rodas voltam');
const roda = (await pagina.evaluate(() => window.__rodas()))[0];
await pagina.evaluate((v) => window.scrollTo(0, v), roda.inicio + roda.passo * 1.3);
await espera(2000);
const ativo = (await pagina.evaluate(() => window.__rodas()))[0].ativo;
conferir(ativo === 1 || ativo === 2, `em pé de novo: a roda gira (passo ${ativo + 1})`);
conferir(!erros.length, `console sem erros ${[...new Set(erros)].join(' | ')}`);
await contexto.close();

await navegador.close();
console.log(falhas ? `\n${falhas} falha(s).` : '\nRedimensionar: tudo ok.');
process.exitCode = falhas ? 1 : 0;

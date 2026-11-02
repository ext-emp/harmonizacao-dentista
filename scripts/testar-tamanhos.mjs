// ---------------------------------------------------------------------------
// Rodas (experiência e consulta) em vários tamanhos de tela, inclusive a
// altura de verdade de um celular com as barras do navegador (390x664 é um
// iPhone no Safari). Em cada passo, confere que nenhum texto do palco
// (rótulo, contador, título, nota, nome e texto do passo) é cruzado pela
// linha do círculo nem fica no caminho dos números quando a roda gira, e que
// nada sai da tela. Onde a roda não cabe (celular deitado, tela muito baixa),
// confere que virou a lista, sem sobra da roda.
// Precisa do servidor de desenvolvimento (window.__rodas só existe no dev).
// Uso: node scripts/testar-tamanhos.mjs [LxA ou LxAt (com toque) ...] [--capturas pasta]
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const iCapturas = args.indexOf('--capturas');
const CAPTURAS = iCapturas >= 0 ? args[iCapturas + 1] : null;
const tamanhos = args.filter((a, i) => /^\d+x\d+t?$/.test(a) && i !== iCapturas + 1);
const LISTA = tamanhos.length
  ? tamanhos
  : ['1440x900', '1920x1080', '1366x657', '1024x768', '390x844t', '390x664t', '360x640t', '412x780t', '768x1024t', '375x553t', '844x390t'];
const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
if (CAPTURAS) await mkdir(CAPTURAS, { recursive: true });

let falhas = 0;
const conferir = (ok, mensagem) => {
  console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${mensagem}`);
  if (!ok) falhas++;
};

// Medida feita na página: caixas das linhas de texto (só os nós de texto,
// linha a linha) contra o círculo e o anel por onde os números passam.
function medirPalco(id) {
  const s = document.getElementById(id);
  const disco = s.querySelector('.roda__disco').getBoundingClientRect();
  const c = { x: disco.left, y: disco.top };
  const raio = s.querySelector('.roda__circulo').offsetWidth / 2;
  const selo = s.querySelector('.roda__selo');
  const anel = [-selo.offsetTop - selo.offsetHeight, -selo.offsetTop];
  const linhas = (el) => {
    const caixas = [];
    const andar = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (andar.nextNode()) {
      if (!andar.currentNode.textContent.trim()) continue;
      const faixa = document.createRange();
      faixa.selectNodeContents(andar.currentNode);
      caixas.push(...[...faixa.getClientRects()].filter((b) => b.width && b.height));
    }
    return caixas;
  };
  const ativo = s.querySelector('.roda__item.esta-ativo');
  const textos = {
    rotulo: s.querySelector('.roda__rotulo'),
    contador: s.querySelector('.roda__contador'),
    titulo: s.querySelector('.roda__titulo-secao'),
    nota: s.querySelector('.roda__nota'),
    nome: ativo?.querySelector('.roda__nome'),
    texto: ativo?.querySelector('.roda__texto'),
  };
  const achados = new Set();
  for (const [nome, el] of Object.entries(textos)) {
    if (!el) continue;
    for (const b of linhas(el)) {
      const perto = Math.hypot(Math.max(b.left - c.x, 0, c.x - b.right), Math.max(b.top - c.y, 0, c.y - b.bottom));
      const longe = Math.hypot(
        Math.max(Math.abs(b.left - c.x), Math.abs(b.right - c.x)),
        Math.max(Math.abs(b.top - c.y), Math.abs(b.bottom - c.y)),
      );
      if (perto < raio && longe > raio) achados.add(`${nome} cruzado pela linha`);
      if (perto < anel[1] && longe > anel[0]) achados.add(`${nome} no caminho dos números`);
      if (b.bottom > innerHeight || b.top < 0) achados.add(`${nome} fora da tela`);
    }
  }
  return [...achados];
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
  await espera(3000);

  const rodas = await pagina.evaluate(() => window.__rodas());
  for (const id of ['experiencia', 'consulta']) {
    const roda = rodas.find((r) => r.id === id);
    if (!roda) {
      const sobra = await pagina.evaluate((i) => {
        const s = document.getElementById(i);
        return s.classList.contains('roda--ativa') || s.querySelector('.roda__marco') || s.querySelector('[data-roda-percurso]').offsetHeight > 0;
      }, id);
      conferir(!sobra, `${id}: virou a lista, sem sobra da roda`);
      continue;
    }
    const total = await pagina.evaluate((i) => document.querySelectorAll(`#${i} [data-roda-item]`).length, id);
    const problemas = [];
    for (let k = 0; k < total; k++) {
      await pagina.evaluate((v) => (window.__lenis ? window.__lenis.scrollTo(v, { immediate: true, force: true }) : window.scrollTo(0, v)), roda.inicio + k * roda.passo);
      await espera(1600);
      for (const p of await pagina.evaluate(medirPalco, id)) problemas.push(`passo ${k + 1}: ${p}`);
      if (CAPTURAS) await pagina.screenshot({ path: `${CAPTURAS}/${t}-${id}-${k + 1}.png` });
    }
    conferir(!problemas.length, `${id}: nenhum texto cruzado nem fora da tela em ${total} passos${problemas.length ? ` (${problemas.join('; ')})` : ''}`);
  }
  conferir(!erros.length, `console sem erros ${[...new Set(erros)].join(' | ')}`);
  await contexto.close();
}
await navegador.close();
console.log(falhas ? `\n${falhas} falha(s).` : '\nRodas ok em todos os tamanhos.');
process.exitCode = falhas ? 1 : 0;

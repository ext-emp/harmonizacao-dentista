// ---------------------------------------------------------------------------
// Contraste WCAG do texto que fica sobre a foto de fundo (manifesto dentro do
// "O espaço"): esconde o texto e as fotos que flutuam, fotografa o fundo
// atrás de cada linha e compara a cor do texto com o pixel mais claro dali
// (percentil 98, para ignorar o ruído da granulação). Pior caso de verdade.
// Uso: node scripts/contraste-fundo.mjs [--vp desktop,mobile]
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import sharp from 'sharp';

const args = process.argv.slice(2);
const i = args.indexOf('--vp');
const VPS = (i >= 0 ? args[i + 1] : 'desktop,mobile').split(',');
const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';

const linear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminancia = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const contraste = (a, b) => {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const rgb = (css) => css.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);

// Textos sobre a foto e o mínimo de cada um (texto grande: 3:1; normal: 4,5:1).
const TEXTOS = [
  { nome: 'parágrafo aceso', seletor: '.manifesto__texto', cor: 'acesa', minimo: 3 },
  { nome: 'parágrafo apagado', seletor: '.manifesto__texto', cor: 'apagada', minimo: 3 },
  { nome: 'rótulo "Manifesto"', seletor: '.manifesto__rotulo', minimo: 4.5 },
  { nome: 'números', seletor: '.numero__valor', minimo: 3 },
  { nome: 'legenda dos números', seletor: '.numero__rotulo', minimo: 4.5 },
];

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
let falhas = 0;
for (const nome of VPS) {
  console.log(`\n== ${nome}`);
  const contexto = await navegador.newContext({ ...VIEWPORTS[nome], locale: 'pt-BR' });
  await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
  const pagina = await contexto.newPage();
  await pagina.goto(URL_SITE);
  await pagina.waitForTimeout(3500);

  for (const [etapa, ancora] of [
    ['parágrafo no centro', '.manifesto__cena'],
    ['números', '.manifesto__base'],
  ]) {
    // Leva o trecho até a tela (o palco do parágrafo fica fixo no meio).
    await pagina.evaluate((s) => {
      const html = document.documentElement;
      html.classList.add('pilha-medindo');
      const el = document.querySelector(s);
      const y = el.getBoundingClientRect().top + scrollY + (s === '.manifesto__cena' ? innerHeight * 0.6 : -innerHeight * 0.25);
      html.classList.remove('pilha-medindo');
      window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y);
    }, ancora);
    await pagina.waitForTimeout(2600);

    // Cores e caixas das linhas de cada texto; depois esconde tudo para fotografar o fundo.
    const medidas = await pagina.evaluate((textos) => {
      const linhas = (el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        return [...r.getClientRects()]
          .filter((c) => c.width > 4 && c.height > 4 && c.bottom > 0 && c.top < innerHeight)
          .map((c) => ({ x: Math.max(0, c.left), y: Math.max(0, c.top), w: Math.min(innerWidth, c.right) - Math.max(0, c.left), h: Math.min(innerHeight, c.bottom) - Math.max(0, c.top) }));
      };
      const saida = textos.map((t) => {
        const els = [...document.querySelectorAll(t.seletor)];
        const palavra = document.querySelector(`${t.seletor} .palavra`);
        // Sobre a foto (galeria animada), as palavras apagadas usam a variante "-foto".
        const variavel = document.querySelector('.espaco--animado') ? '--cor-manifesto-apagado-foto' : '--cor-manifesto-apagado';
        const cor =
          t.cor === 'apagada'
            ? getComputedStyle(document.documentElement).getPropertyValue(variavel).trim()
            : t.cor === 'acesa'
              ? getComputedStyle(els[0]).color
              : getComputedStyle(palavra || els[0]).color;
        return { ...t, cor, caixas: els.flatMap(linhas) };
      });
      const estilo = document.createElement('style');
      estilo.textContent = '.manifesto *{color:transparent!important;border-color:transparent!important}.manifesto__fotos,.pendente{visibility:hidden!important}';
      document.head.append(estilo);
      return saida;
    }, TEXTOS);
    await pagina.waitForTimeout(300);
    const tela = await pagina.screenshot();
    await pagina.evaluate(() => document.head.lastElementChild.remove());

    for (const t of medidas) {
      if (!t.caixas.length) continue;
      let pior = null;
      for (const c of t.caixas) {
        const { data, info } = await sharp(tela).extract({ left: Math.round(c.x), top: Math.round(c.y), width: Math.max(1, Math.round(c.w)), height: Math.max(1, Math.round(c.h)) }).raw().toBuffer({ resolveWithObject: true });
        const lums = [];
        for (let k = 0; k < data.length; k += info.channels) lums.push([data[k], data[k + 1], data[k + 2]]);
        lums.sort((a, b) => luminancia(a) - luminancia(b));
        const claro = lums[Math.floor(lums.length * 0.98)];
        if (!pior || luminancia(claro) > luminancia(pior)) pior = claro;
      }
      const corTexto = t.cor.startsWith('#') ? t.cor.match(/\w\w/g).map((h) => parseInt(h, 16)) : rgb(t.cor);
      const r = contraste(corTexto, pior);
      const ok = r >= t.minimo;
      if (!ok) falhas++;
      console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${etapa.padEnd(20)} ${t.nome.padEnd(22)} ${r.toFixed(2)}:1 (mínimo ${t.minimo}) fundo mais claro rgb(${pior.join(',')})`);
    }
  }
  await contexto.close();
}
await navegador.close();
console.log(falhas ? `\n${falhas} falha(s) de contraste.` : '\nContraste ok sobre a foto.');
process.exitCode = falhas ? 1 : 0;

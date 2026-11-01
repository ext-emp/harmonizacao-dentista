// Sonda da LAVA dental (uso interno, só para análise): estilos calculados
// das peças das transições em alguns pontos do scroll.
// Uso: node scripts/sondar-lava.mjs [desktop|mobile]
import { chromium } from 'playwright';

const vpNome = process.argv[2] || 'desktop';
const vps = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};

const sondar = () => {
  const nome = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  const estilo = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      el: nome(el),
      caixa: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join(' '),
      pos: s.position,
      top: s.top,
      z: s.zIndex,
      mt: s.marginTop,
      tf: s.transform === 'none' ? '' : s.transform.slice(0, 60),
      clip: s.clipPath === 'none' ? '' : s.clipPath.slice(0, 60),
      op: s.opacity,
      fundo: s.backgroundColor,
    };
  };
  const sel = [
    '.hero',
    '.page__sections',
    '#about',
    '.about-process__header',
    '.about-process-carousel',
    '.about-process-carousel > *',
    '.about-process-carousel > * > *',
    '.overlay-section',
    '.wheel-block__sticky-content',
    '.reveal-block__content',
    '.reveal-block__content > *',
  ];
  const linhas = [];
  for (const s of sel) for (const el of [...document.querySelectorAll(s)].slice(0, 6)) linhas.push(estilo(el));
  return { y: Math.round(scrollY), linhas };
};

const navegador = await chromium.launch({ channel: 'chrome' });
const contexto = await navegador.newContext({ ...vps[vpNome], locale: 'en-US' });
const pagina = await contexto.newPage();
await pagina.goto('https://lavadental.lv/en', { waitUntil: 'load', timeout: 90000 });
await pagina.waitForTimeout(6500);
const pontos = (process.argv[3] || '0,450,1350,2700,4500,5000,5400,10300,10700').split(',').map(Number);
for (const y of pontos) {
  // Rola com a roda do mouse até perto do ponto (o Lenis do site acompanha).
  const atual = await pagina.evaluate(() => scrollY);
  await pagina.mouse.move(700, 450);
  const passos = Math.ceil(Math.abs(y - atual) / 300);
  for (let k = 0; k < passos; k++) {
    await pagina.mouse.wheel(0, (y - atual) / passos);
    await pagina.waitForTimeout(40);
  }
  await pagina.waitForTimeout(1500);
  const r = await pagina.evaluate(sondar);
  console.log(`\n== y=${r.y}`);
  for (const l of r.linhas) console.log(`${l.el.padEnd(46).slice(0, 46)} ${l.caixa.padEnd(20)} ${l.pos.padEnd(8)} top=${l.top} z=${l.z} mt=${l.mt} op=${l.op} ${l.tf} ${l.clip}`);
}
// Folhas de estilo: regras com "sticky" ou "overlay" (para ver o mecanismo).
const regras = await pagina.evaluate(() => {
  const saida = [];
  for (const folha of document.styleSheets) {
    let lista;
    try {
      lista = folha.cssRules;
    } catch {
      continue;
    }
    for (const r of lista) {
      const t = r.cssText;
      if (/overlay-section|about-process|reveal-block|\.hero\b/.test(t) && t.length < 400) saida.push(t);
    }
  }
  return saida.slice(0, 80);
});
console.log('\n== regras');
regras.forEach((r) => console.log(r));
await navegador.close();

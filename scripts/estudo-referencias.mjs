// Estudo das referências visuais (uso interno, só para análise).
// Tira screenshots em vários pontos da rolagem e coleta métricas de
// tipografia, cores, grid e movimento direto do DOM.
// Uso: node scripts/estudo-referencias.mjs
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const SITES = [
  { id: 'aventura', url: 'https://aventuradentalarts.com/' },
  { id: 'lava', url: 'https://lavadental.lv/en' },
];

const VIEWPORTS = [
  { id: 'desktop', width: 1440, height: 900, mobile: false },
  { id: 'mobile', width: 390, height: 844, mobile: true },
];

const SAIDA = 'docs/referencias';
const MAX_PASSOS = 22;

// Tenta fechar banners de cookies para não esconder o layout.
async function fecharCookies(page) {
  const padrao = /accept|agree|allow|got it|^ok$|piekrītu|akceptēt|apstiprināt|aceitar/i;
  for (const el of await page.$$('button, a[role="button"], [class*="cookie"] a')) {
    const txt = ((await el.innerText().catch(() => '')) || '').trim();
    if (txt && txt.length < 40 && padrao.test(txt) && (await el.isVisible().catch(() => false))) {
      await el.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(600);
      return txt;
    }
  }
  return null;
}

// Métricas coletadas dentro da página.
function coletarMetricas() {
  const estilo = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      texto: (el.innerText || '').trim().slice(0, 80),
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      textTransform: s.textTransform,
      color: s.color,
    };
  };
  const visiveis = (sel) =>
    [...document.querySelectorAll(sel)].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (el.innerText || '').trim().length > 0;
    });

  // Maiores textos da página (por tamanho de fonte).
  const textos = [...document.querySelectorAll('h1,h2,h3,h4,p,a,span,li,button,div')]
    .filter((el) => el.childElementCount === 0 && (el.innerText || '').trim().length > 1)
    .map((el) => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }));
  textos.sort((a, b) => b.size - a.size);
  const maiores = [];
  const vistos = new Set();
  for (const { el } of textos) {
    const e = estilo(el);
    const chave = e.fontFamily + e.fontSize;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    maiores.push(e);
    if (maiores.length >= 14) break;
  }

  // Famílias e tamanhos mais usados.
  const contagem = {};
  for (const { el } of textos) {
    const s = getComputedStyle(el);
    const k = `${s.fontFamily.split(',')[0]} | ${s.fontSize} | ${s.fontWeight}`;
    contagem[k] = (contagem[k] || 0) + 1;
  }
  const usoFontes = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 15);

  // Cores de fundo e de texto mais frequentes.
  const cores = {};
  const coresTexto = {};
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') cores[s.backgroundColor] = (cores[s.backgroundColor] || 0) + 1;
    if (el.childElementCount === 0 && (el.innerText || '').trim()) coresTexto[s.color] = (coresTexto[s.color] || 0) + 1;
  }

  // Easings e durações em transições e animações CSS.
  const easings = {};
  const duracoes = {};
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (s.transitionDuration !== '0s') {
      easings[s.transitionTimingFunction] = (easings[s.transitionTimingFunction] || 0) + 1;
      duracoes[s.transitionDuration] = (duracoes[s.transitionDuration] || 0) + 1;
    }
    if (s.animationName !== 'none') easings['anim: ' + s.animationTimingFunction] = (easings['anim: ' + s.animationTimingFunction] || 0) + 1;
  }

  // Variáveis CSS do :root (muitos sites guardam tokens ali).
  const vars = {};
  for (const sheet of [...document.styleSheets]) {
    let regras;
    try { regras = sheet.cssRules; } catch { continue; }
    for (const r of regras || []) {
      if (r.selectorText === ':root' || r.selectorText === 'html') {
        for (const nome of r.style) if (nome.startsWith('--')) vars[nome] = r.style.getPropertyValue(nome).trim();
      }
    }
  }

  // Grids declarados.
  const grids = [...document.querySelectorAll('*')]
    .filter((el) => getComputedStyle(el).display.includes('grid'))
    .slice(0, 12)
    .map((el) => {
      const s = getComputedStyle(el);
      return { classe: String(el.className).slice(0, 60), cols: s.gridTemplateColumns.slice(0, 120), gap: s.columnGap, largura: Math.round(el.getBoundingClientRect().width) };
    });

  // Bibliotecas detectáveis.
  const libs = {
    gsap: window.gsap?.version || null,
    scrollTrigger: !!window.ScrollTrigger,
    lenis: !!(window.lenis || window.Lenis || document.documentElement.className.includes('lenis')),
    three: window.THREE?.REVISION || null,
    webflow: !!window.Webflow,
    barba: !!window.barba,
    swiper: !!window.Swiper,
    locomotive: !!document.querySelector('[data-scroll-container]'),
    canvas: document.querySelectorAll('canvas').length,
    video: document.querySelectorAll('video').length,
    htmlClass: document.documentElement.className.slice(0, 200),
  };
  const scripts = [...document.scripts].map((s) => s.src).filter(Boolean).map((s) => s.slice(0, 140));
  const fontes = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight} ${f.style}`);

  // Margens laterais e largura útil do conteúdo.
  const blocos = [...document.querySelectorAll('section, header, footer, main > div')].slice(0, 20).map((el) => {
    const s = getComputedStyle(el);
    return { tag: el.tagName.toLowerCase(), classe: String(el.className).slice(0, 50), padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`, altura: Math.round(el.getBoundingClientRect().height), fundo: s.backgroundColor };
  });

  return {
    titulo: document.title,
    altura: document.documentElement.scrollHeight,
    body: estilo(document.body),
    bodyFundo: getComputedStyle(document.body).backgroundColor,
    h1: visiveis('h1').slice(0, 3).map(estilo),
    h2: visiveis('h2').slice(0, 6).map(estilo),
    h3: visiveis('h3').slice(0, 4).map(estilo),
    p: visiveis('p').slice(0, 6).map(estilo),
    maiores,
    usoFontes,
    cores: Object.entries(cores).sort((a, b) => b[1] - a[1]).slice(0, 10),
    coresTexto: Object.entries(coresTexto).sort((a, b) => b[1] - a[1]).slice(0, 10),
    easings: Object.entries(easings).sort((a, b) => b[1] - a[1]).slice(0, 12),
    duracoes: Object.entries(duracoes).sort((a, b) => b[1] - a[1]).slice(0, 10),
    vars,
    grids,
    blocos,
    libs,
    scripts,
    fontes,
  };
}

async function estudar(browser, site, vp) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    userAgent: vp.mobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
      : undefined,
    locale: 'en-US',
  });
  const page = await context.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e).slice(0, 200)));
  await page.goto(site.url, { waitUntil: 'load', timeout: 90000 }).catch((e) => erros.push('goto: ' + e.message));
  await page.waitForTimeout(6500); // preloader e animação de entrada
  const cookie = await fecharCookies(page);
  await page.waitForTimeout(800);

  const pasta = `${SAIDA}/${site.id}-${vp.id}`;
  await mkdir(pasta, { recursive: true });
  await page.screenshot({ path: `${pasta}/00.png` });

  const metricasTopo = await page.evaluate(coletarMetricas);

  let ultimoY = -1;
  const posicoes = [0];
  for (let i = 1; i <= MAX_PASSOS; i++) {
    if (vp.mobile) {
      await page.evaluate((d) => window.scrollBy(0, d), Math.round(vp.height * 0.85));
    } else {
      // Rolagem em pequenos passos de roda, como um usuário real.
      for (let k = 0; k < 8; k++) {
        await page.mouse.move(vp.width / 2, vp.height / 2);
        await page.mouse.wheel(0, Math.round((vp.height * 0.85) / 8));
        await page.waitForTimeout(40);
      }
    }
    await page.waitForTimeout(1600);
    const y = await page.evaluate(() => Math.round(window.scrollY || document.documentElement.scrollTop));
    posicoes.push(y);
    await page.screenshot({ path: `${pasta}/${String(i).padStart(2, '0')}.png` });
    if (y === ultimoY) break; // chegou ao fim
    ultimoY = y;
  }

  const metricasFim = await page.evaluate(() => ({
    easingsFim: (() => {
      const e = {};
      for (const el of document.querySelectorAll('*')) {
        const s = getComputedStyle(el);
        if (s.transitionDuration !== '0s') e[`${s.transitionTimingFunction} ${s.transitionDuration}`] = (e[`${s.transitionTimingFunction} ${s.transitionDuration}`] || 0) + 1;
      }
      return Object.entries(e).sort((a, b) => b[1] - a[1]).slice(0, 12);
    })(),
  }));

  await context.close();
  return { site: site.id, viewport: vp.id, cookie, erros, posicoes, ...metricasTopo, ...metricasFim };
}

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--use-angle=default'] });
const resultados = [];
for (const site of SITES) {
  for (const vp of VIEWPORTS) {
    console.log('Estudando', site.id, vp.id);
    try {
      resultados.push(await estudar(browser, site, vp));
    } catch (e) {
      console.error('Falhou', site.id, vp.id, e.message);
      resultados.push({ site: site.id, viewport: vp.id, falha: e.message });
    }
  }
}
await browser.close();
await writeFile(`${SAIDA}/metricas.json`, JSON.stringify(resultados, null, 2));
console.log('Pronto:', resultados.map((r) => `${r.site}-${r.viewport}: ${r.posicoes?.length ?? 0} capturas, altura ${r.altura}`).join(' | '));

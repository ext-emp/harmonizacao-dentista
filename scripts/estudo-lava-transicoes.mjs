// Estudo das transições da LAVA dental (uso interno, só para análise).
// Captura quadros em passos curtos de scroll, do hero até os resultados, e
// guarda a estrutura das seções e dos pins (pin-spacer do GSAP), para medir
// quanto scroll cada transição usa.
// Uso: node scripts/estudo-lava-transicoes.mjs [--vp desktop,mobile] [--ate 16000]
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const VPS = opcao('vp', 'desktop,mobile').split(',');
const ATE = Number(opcao('ate', '16000'));
const SAIDA = 'docs/referencias/lava-transicoes';

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, passo: 225 },
  mobile: {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    passo: 211,
  },
};

// Estrutura: seções de primeiro nível, pins e elementos fixos.
const estrutura = () => {
  const caixa = (el) => {
    const r = el.getBoundingClientRect();
    return { topo: Math.round(r.top + scrollY), altura: Math.round(r.height), largura: Math.round(r.width) };
  };
  const nome = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}`;
  const secoes = [...document.querySelectorAll('section, [class*="section"], main > *, footer')]
    .filter((el) => el.getBoundingClientRect().height > 200)
    .slice(0, 60)
    .map((el) => ({ el: nome(el), ...caixa(el), texto: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 90) }));
  const pins = [...document.querySelectorAll('.pin-spacer')].map((el) => ({
    el: nome(el.firstElementChild || el),
    ...caixa(el),
    alturaFilho: Math.round(el.firstElementChild?.getBoundingClientRect().height || 0),
  }));
  const sticky = [...document.querySelectorAll('*')]
    .filter((el) => ['sticky', 'fixed'].includes(getComputedStyle(el).position))
    .slice(0, 40)
    .map((el) => ({ el: nome(el), posicao: getComputedStyle(el).position, ...caixa(el) }));
  return {
    altura: document.documentElement.scrollHeight,
    libs: { gsap: window.gsap?.version || null, lenis: !!(window.lenis || document.documentElement.className.includes('lenis')) },
    secoes,
    pins,
    sticky,
  };
};

const navegador = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--use-angle=default'] });
for (const nomeVp of VPS) {
  const { passo, ...vp } = VIEWPORTS[nomeVp];
  const contexto = await navegador.newContext({ ...vp, deviceScaleFactor: 1, locale: 'en-US' });
  const pagina = await contexto.newPage();
  await pagina.goto('https://lavadental.lv/en', { waitUntil: 'load', timeout: 90000 });
  await pagina.waitForTimeout(7000);
  const pasta = `${SAIDA}/${nomeVp}`;
  await mkdir(pasta, { recursive: true });
  const info = await pagina.evaluate(estrutura);

  const quadros = [];
  let i = 0;
  let y = 0;
  let parado = 0;
  while (y < ATE && parado < 3) {
    await pagina.screenshot({ path: `${pasta}/${String(i).padStart(3, '0')}.png` });
    quadros.push(y);
    i++;
    if (vp.isMobile) {
      await pagina.evaluate((d) => window.scrollBy(0, d), passo);
    } else {
      await pagina.mouse.move(vp.viewport.width / 2, vp.viewport.height / 2);
      for (let k = 0; k < 5; k++) {
        await pagina.mouse.wheel(0, passo / 5);
        await pagina.waitForTimeout(30);
      }
    }
    await pagina.waitForTimeout(1100);
    const novo = await pagina.evaluate(() => Math.round(scrollY));
    parado = novo === y ? parado + 1 : 0;
    y = novo;
  }
  await writeFile(`${pasta}/estrutura.json`, JSON.stringify({ ...info, quadros }, null, 2));
  console.log(`${nomeVp}: ${quadros.length} quadros, altura ${info.altura}, pins ${info.pins.length}`);
  await contexto.close();
}
await navegador.close();

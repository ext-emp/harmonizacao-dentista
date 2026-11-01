// ---------------------------------------------------------------------------
// Verificação visual: abre o site no Chrome (Playwright), roda um roteiro de
// cenários e salva screenshots. Também lista erros e avisos do console.
//
// Uso:
//   node scripts/capturar.mjs [--url http://localhost:5173/] [--saida capturas/x]
//        [--vp desktop,mobile] [--dsf 1] [--reduzido] [--sem-webgl]
//        [--roteiro etapa1] [--ancoras #manifesto,#tratamentos]
//
// Viewports: desktop = 1440×900 com mouse; mobile = 390×844 com toque.
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : padrao;
};
const flag = (nome) => args.includes(`--${nome}`);

const URL_BASE = opcao('url', 'http://localhost:5173/');
const SAIDA = opcao('saida', 'capturas/verificacao');
const VPS = opcao('vp', 'desktop,mobile').split(',');
const DSF = Number(opcao('dsf', '1'));
const REDUZIDO = flag('reduzido');
const SEM_WEBGL = flag('sem-webgl');
const SEM_JS = flag('sem-js');
const ROTEIRO = opcao('roteiro', 'etapa1');
const ANCORAS = opcao('ancoras', '').split(',').filter(Boolean);

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
  mobile: {
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  },
};

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Rola até um seletor ou posição. No desktop usa a roda do mouse (passa pelo
// Lenis como um usuário); no celular, scroll nativo.
async function rolarAte(pagina, vp, alvo) {
  const y = await pagina.evaluate((a) => {
    if (typeof a === 'number') return a;
    const el = document.querySelector(a);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  }, alvo);
  if (vp.isMobile) {
    await pagina.evaluate((v) => window.scrollTo(0, v), y);
  } else {
    await pagina.evaluate((v) => (window.__lenis ? window.__lenis.scrollTo(v, { immediate: true }) : window.scrollTo(0, v)), y);
  }
  await espera(1400);
}

const ROTEIROS = {
  // Etapa 1: preloader, hero (imagem estática e 3D), header e menu.
  async etapa1(pagina, vp, salvar) {
    await espera(350);
    await salvar('01-preloader-inicio');
    await espera(650);
    await salvar('02-preloader-contador');
    await pagina.waitForFunction(() => !document.querySelector('[data-preloader]'), null, { timeout: 15000 }).catch(() => {});
    await espera(500);
    await salvar('03-hero-revelando');
    await espera(1900);
    await salvar('04-hero');
    // Espera o 3D aparecer (ou desistir, se não houver WebGL).
    const tem3d = await pagina
      .waitForFunction(() => {
        const c = document.querySelector('.perola-palco__canvas');
        return c && parseFloat(getComputedStyle(c).opacity) > 0.99;
      }, null, { timeout: 12000 })
      .then(() => true)
      .catch(() => false);
    await espera(400);
    await salvar(tem3d ? '05-hero-3d' : '05-hero-sem-3d');
    if (!vp.isMobile) {
      await pagina.mouse.move(vp.width * 0.85, vp.height * 0.2, { steps: 12 });
      await espera(900);
      await salvar('06-hero-cursor');
    }
    await rolarAte(pagina, vp, 300);
    await salvar('07-scroll-300');
    await rolarAte(pagina, vp, '#manifesto');
    await salvar('08-secao-escura');
    await rolarAte(pagina, vp, 200);
    await salvar('09-voltou-para-cima');
    await rolarAte(pagina, vp, 0);
    if (vp.isMobile) {
      await pagina.click('[data-menu-botao]');
      await espera(450);
      await salvar('10-menu-abrindo');
      await espera(1300);
      await salvar('11-menu-aberto');
      await pagina.keyboard.press('Escape');
      await espera(900);
    }
    return { tem3d };
  },

  // Sem JavaScript: a página inteira, em telas sucessivas.
  async semJs(pagina, vp, salvar) {
    await espera(800);
    const altura = await pagina.evaluate(() => document.documentElement.scrollHeight);
    let i = 0;
    for (let y = 0; y < altura && i < 30; y += Math.round(vp.height * 0.9), i++) {
      await pagina.evaluate((v) => window.scrollTo(0, v), y);
      await espera(250);
      await salvar(String(i).padStart(2, '0'));
    }
    return { altura };
  },

  // Uma captura por âncora (seções).
  async secoes(pagina, vp, salvar) {
    await pagina.waitForFunction(() => !document.querySelector('[data-preloader]'), null, { timeout: 15000 }).catch(() => {});
    await espera(2500);
    await salvar('00-topo');
    for (const [i, ancora] of ANCORAS.entries()) {
      await rolarAte(pagina, vp, ancora);
      await salvar(`${String(i + 1).padStart(2, '0')}-${ancora.replace(/[^\w-]/g, '')}`);
    }
    return {};
  },
};

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
let falhou = false;

for (const nomeVp of VPS) {
  const vp = VIEWPORTS[nomeVp];
  const contexto = await navegador.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: DSF,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    userAgent: vp.userAgent,
    reducedMotion: REDUZIDO ? 'reduce' : 'no-preference',
    javaScriptEnabled: !SEM_JS,
    locale: 'pt-BR',
  });
  if (SEM_WEBGL) {
    await contexto.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (tipo, ...resto) {
        return /webgl/i.test(tipo) ? null : original.call(this, tipo, ...resto);
      };
    });
  }
  const pagina = await contexto.newPage();
  const mensagens = [];
  pagina.on('console', (m) => ['error', 'warning'].includes(m.type()) && mensagens.push(`[${m.type()}] ${m.text()}`));
  pagina.on('pageerror', (e) => mensagens.push(`[pageerror] ${e.message}`));
  pagina.on('requestfailed', (r) => mensagens.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));

  const pasta = `${SAIDA}/${nomeVp}${REDUZIDO ? '-reduzido' : ''}${SEM_WEBGL ? '-sem-webgl' : ''}${SEM_JS ? '-sem-js' : ''}`;
  await mkdir(pasta, { recursive: true });
  const salvar = (nome) => pagina.screenshot({ path: `${pasta}/${nome}.png` });

  await pagina.goto(URL_BASE, { waitUntil: 'domcontentloaded' });
  // Sem JavaScript, page.evaluate continua funcionando (roda no contexto do Playwright).
  const midia = await pagina.evaluate(() => ({
    mouse: matchMedia('(hover: hover) and (pointer: fine)').matches,
    reduzido: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }));
  const resultado = await ROTEIROS[SEM_JS ? 'semJs' : ROTEIRO](pagina, vp, salvar);

  console.log(`\n== ${nomeVp} ${JSON.stringify({ ...midia, ...resultado })} -> ${pasta}`);
  if (mensagens.length) {
    falhou = true;
    console.log(mensagens.map((m) => `  ${m}`).join('\n'));
  } else {
    console.log('  console limpo');
  }
  await contexto.close();
}

await navegador.close();
process.exitCode = falhou ? 1 : 0;

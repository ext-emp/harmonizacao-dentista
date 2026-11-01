// ---------------------------------------------------------------------------
// Confere se as imagens de conteúdo aparecem DE VERDADE na tela: rola como
// uma pessoa (roda do mouse no desktop, scroll nativo no celular), espera a
// revelação terminar e mede os pixels da área da imagem contra o fundo.
// Também recarrega a página no meio da rolagem (o navegador restaura a
// posição, como acontece quando o Vite recarrega depois de uma edição).
// Sai com código 1 se alguma imagem não aparecer.
//
// Uso: node scripts/verificar-imagens.mjs [--reduzido]
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const REDUZIDO = process.argv.includes('--reduzido');
const iVp = process.argv.indexOf('--vp');
const SO_VP = iVp >= 0 ? process.argv[iVp + 1].split(',') : null;
const SAIDA = `capturas/imagens${REDUZIDO ? '-reduzido' : ''}`;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Os índices 1, 2 e 4 (tratamentos e sobre) são reusados mais abaixo.
const ALVOS = [
  { nome: 'hero-retrato', seletor: '.hero__retrato' },
  { nome: 'tratamento-rosto', seletor: '.tratamento--rosto .tratamento__mascara' },
  { nome: 'tratamento-sorriso', seletor: '.tratamento--sorriso .tratamento__mascara' },
  { nome: 'caso-01', seletor: '.caso:nth-child(1) .comparador' },
  { nome: 'sobre-retrato', seletor: '.sobre__mascara' },
  // O espaço: com movimento, a última foto vira o fundo (fica na tela inteira
  // enquanto o manifesto passa); sem movimento, a galeria é uma faixa e a
  // primeira foto é a que aparece.
  REDUZIDO ? { nome: 'espaco-galeria', seletor: '.espaco__foto:first-child' } : { nome: 'espaco-fundo', seletor: '.espaco__foto--fundo' },
  { nome: 'manifesto-foto', seletor: '.manifesto__foto--1' },
];

const VIEWPORTS = {
  'desktop-1920': { viewport: { width: 1920, height: 880 } },
  'desktop-1440': { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

let falhas = 0;

// O cursor customizado não pode entrar na medição.
const SEM_CURSOR = '.cursor-ponto,.cursor-anel{display:none!important}';

// Elementos com revelação que continuam escondidos (roda dentro da página).
const listarEscondidos = () =>
  [...document.querySelectorAll('[data-revelar], [data-revelar="lista"] > *')]
    .filter((el) => {
      const cs = getComputedStyle(el);
      return parseFloat(cs.opacity) < 0.99 || cs.visibility === 'hidden' || (cs.clipPath !== 'none' && cs.clipPath !== 'inset(0%)');
    })
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);

// Traz o elemento para o meio da tela. Desktop: roda do mouse (passa pelo Lenis).
async function centralizar(pagina, seletor, comMouse) {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const delta = await pagina.evaluate((s) => {
      const r = document.querySelector(s).getBoundingClientRect();
      return Math.round(r.top + Math.min(r.height, innerHeight) / 2 - innerHeight / 2);
    }, seletor);
    if (Math.abs(delta) < 40) return;
    if (comMouse) {
      for (let resto = delta; Math.abs(resto) > 0; ) {
        const passo = Math.sign(resto) * Math.min(240, Math.abs(resto));
        await pagina.mouse.wheel(0, passo);
        resto -= passo;
        await espera(45);
      }
      await espera(1200);
    } else {
      await pagina.evaluate((d) => window.scrollBy(0, d), delta);
      await espera(600);
    }
  }
}

// Mede a área visível do elemento: cor média e variação contra o fundo atrás dele.
async function medir(pagina, seletor) {
  const info = await pagina.evaluate((s) => {
    const el = document.querySelector(s);
    const r = el.getBoundingClientRect();
    const x = Math.max(0, r.left);
    const y = Math.max(0, r.top);
    let fundo = getComputedStyle(document.body).backgroundColor;
    for (let n = el.parentElement; n; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
        fundo = c;
        break;
      }
    }
    const img = el.querySelector('img');
    return {
      clip: { x, y, width: Math.min(innerWidth, r.right) - x, height: Math.min(innerHeight, r.bottom) - y },
      fundo: fundo.match(/\d+/g).slice(0, 3).map(Number),
      carregada: Boolean(img && img.complete && img.naturalWidth > 0),
      arquivo: img?.currentSrc.split('/').pop() || '',
      clipPath: getComputedStyle(el).clipPath,
    };
  }, seletor);
  if (info.clip.width < 20 || info.clip.height < 20) return { ...info, visivel: false, motivo: 'fora da tela' };
  const { channels } = await sharp(await pagina.screenshot({ clip: info.clip })).stats();
  const media = channels.slice(0, 3).map((c) => c.mean);
  const distancia = Math.hypot(...media.map((m, i) => m - info.fundo[i]));
  const desvio = channels.slice(0, 3).reduce((s, c) => s + c.stdev, 0) / 3;
  return { ...info, distancia, desvio, visivel: info.carregada && (distancia > 10 || desvio > 12) };
}

function relatar(rotulo, m) {
  if (!m.visivel) falhas++;
  const numeros = m.distancia === undefined ? m.motivo : `distância ${m.distancia.toFixed(0)}, variação ${m.desvio.toFixed(0)}`;
  console.log(`  ${m.visivel ? 'ok   ' : 'FALHA'} ${rotulo.padEnd(34)} ${numeros}, carregada ${m.carregada ? 'sim' : 'NÃO'} (${m.arquivo}), clip-path ${m.clipPath}`);
}

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
await mkdir(SAIDA, { recursive: true });

for (const [nome, opcoes] of Object.entries(VIEWPORTS)) {
  if (SO_VP && !SO_VP.includes(nome)) continue;
  console.log(`\n== ${nome}${REDUZIDO ? ' (movimento reduzido)' : ''}`);
  const contexto = await navegador.newContext({ ...opcoes, reducedMotion: REDUZIDO ? 'reduce' : 'no-preference', locale: 'pt-BR' });
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await pagina.goto(URL_SITE);
  await pagina.waitForFunction(() => !document.querySelector('[data-preloader]'), null, { timeout: 15000 }).catch(() => {});
  await pagina.addStyleTag({ content: SEM_CURSOR });
  const comMouse = !opcoes.isMobile;
  if (comMouse) await pagina.mouse.move(6, opcoes.viewport.height / 2);
  await espera(2500);

  for (const alvo of ALVOS) {
    await centralizar(pagina, alvo.seletor, comMouse);
    await espera(2600); // revelação: máscara 1,6 s e zoom 2,1 s
    relatar(alvo.nome, await medir(pagina, alvo.seletor));
    await pagina.screenshot({ path: `${SAIDA}/${nome}-${alvo.nome}.png` });
  }

  // Recarregar com a página rolada até os tratamentos.
  await centralizar(pagina, ALVOS[1].seletor, comMouse);
  await espera(800);
  const antesDaRecarga = await pagina.evaluate(() => Math.round(window.scrollY));
  await pagina.reload({ waitUntil: 'commit' });
  const amostras = [];
  for (const t of [100, 300, 600, 1000, 1500, 2500, 4000]) {
    await espera(t - (amostras.at(-1)?.t ?? 0));
    const y = await pagina.evaluate(() => `${Math.round(window.scrollY)}${window.__lenis ? `/l${Math.round(window.__lenis.targetScroll)}` : ''}`).catch(() => '?');
    amostras.push({ t, y });
  }
  if (process.argv.includes('--amostras')) console.log(`  amostras depois de recarregar: ${amostras.map((a) => `${a.t}ms=${a.y}`).join(' ')}`);
  await pagina.addStyleTag({ content: SEM_CURSOR });
  // O navegador devolve a posição; se não devolveu, centraliza de novo para
  // conferir a imagem (o que importa aqui é ela aparecer depois da recarga).
  const rolagem = await pagina.evaluate(() => Math.round(window.scrollY));
  if (Math.abs(rolagem - antesDaRecarga) > 200) {
    console.log(`  aviso ${'posição depois de recarregar'.padEnd(34)} antes ${antesDaRecarga}, depois ${rolagem}`);
    await centralizar(pagina, ALVOS[1].seletor, comMouse);
    await espera(2600);
  }
  relatar(`recarregada no meio (${antesDaRecarga} -> ${rolagem})`, await medir(pagina, ALVOS[1].seletor));
  await pagina.screenshot({ path: `${SAIDA}/${nome}-recarregada.png` });

  // Abrir direto no fim (link com #contato) e subir até o topo: as seções de
  // cima precisam aparecer, mesmo com a página tendo começado depois delas.
  const outra = await contexto.newPage();
  outra.on('pageerror', (e) => erros.push(e.message));
  outra.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await outra.goto(`${URL_SITE}#contato`);
  await outra.waitForFunction(() => !document.querySelector('[data-preloader]'), null, { timeout: 15000 }).catch(() => {});
  await outra.addStyleTag({ content: SEM_CURSOR });
  await espera(2500);
  const doFim = await outra.evaluate(() => Math.round(window.scrollY));
  if (comMouse) await outra.mouse.move(6, opcoes.viewport.height / 2);
  for (let i = 0; i < 400 && (await outra.evaluate(() => window.scrollY)) > 2; i++) {
    if (comMouse) await outra.mouse.wheel(0, -240);
    else await outra.evaluate(() => window.scrollBy(0, -240));
    await espera(45);
  }
  await espera(2600);
  const escondidos = await outra.evaluate(listarEscondidos);
  if (escondidos.length) falhas++;
  console.log(`  ${escondidos.length ? 'FALHA' : 'ok   '} ${`subindo do fim (${doFim} -> 0)`.padEnd(34)} ${escondidos.length ? `escondidos: ${escondidos.slice(0, 6).join(', ')}` : 'nada escondido'}`);
  for (const alvo of ALVOS.slice(1, 3).concat(ALVOS[4])) {
    await centralizar(outra, alvo.seletor, comMouse);
    await espera(800);
    relatar(`subindo do fim: ${alvo.nome}`, await medir(outra, alvo.seletor));
  }
  await outra.screenshot({ path: `${SAIDA}/${nome}-subindo-do-fim.png` });
  await outra.close();

  if (erros.length) {
    falhas++;
    console.log(`  FALHA console: ${erros.join(' | ')}`);
  } else console.log('  ok    console limpo');
  await contexto.close();
}

await navegador.close();
console.log(falhas ? `\n${falhas} falha(s).` : '\nTodas as imagens apareceram.');
process.exitCode = falhas ? 1 : 0;

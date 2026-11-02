// ---------------------------------------------------------------------------
// Quadros da página em passos fixos de scroll, para revisar as transições
// (empilhamento, galeria do espaço, rodas). Monta uma folha de contato no fim.
// Uso: node scripts/capturar-jornada.mjs [--vp desktop|mobile|LxA] [--de 0] [--ate 9000]
//        [--passo 450] [--saida capturas/jornada] [--colunas 6] [--espera 750]
// --espera: ms de espera em cada quadro. O último quadro (a posição final do
// trecho, mesmo fora do passo) espera pelo menos 3 s: o nome do rodapé ainda
// está entrando antes disso.
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, readdir, rm } from 'node:fs/promises';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const VP = opcao('vp', 'desktop');
const DE = Number(opcao('de', '0'));
const ATE = Number(opcao('ate', '9000'));
const PASSO = Number(opcao('passo', '450'));
const REDUZIDO = args.includes('--reduzido');
const SAIDA = opcao('saida', `capturas/jornada/${VP}${REDUZIDO ? '-reduzido' : ''}`);
const COLUNAS = Number(opcao('colunas', '6'));
const ESPERA = Number(opcao('espera', '750'));
const ESPERA_FINAL = Math.max(ESPERA, 3000);

const livre = /^(\d+)x(\d+)$/.exec(VP);
const vp =
  VP === 'mobile'
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
    : livre
      ? { viewport: { width: Number(livre[1]), height: Number(livre[2]) } }
      : { viewport: { width: 1440, height: 900 } };

await rm(SAIDA, { recursive: true, force: true });
await mkdir(SAIDA, { recursive: true });
const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
const contexto = await navegador.newContext({ ...vp, locale: 'pt-BR', reducedMotion: REDUZIDO ? 'reduce' : 'no-preference' });
await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
const pagina = await contexto.newPage();
const erros = [];
pagina.on('pageerror', (e) => erros.push(e.message));
pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
await pagina.goto(URL_SITE);
await pagina.addStyleTag({ content: '.cursor-ponto,.cursor-anel{display:none!important}' });
await pagina.waitForTimeout(3500);

const fim = Math.min(ATE, await pagina.evaluate(() => document.documentElement.scrollHeight - innerHeight));
// Os múltiplos do passo e, se ficar de fora, a posição final.
const posicoes = [];
for (let y = DE; y <= fim; y += PASSO) posicoes.push(y);
if (posicoes.at(-1) !== fim) posicoes.push(fim);
for (const [i, y] of posicoes.entries()) {
  await pagina.evaluate((v) => (window.__lenis ? window.__lenis.scrollTo(v, { immediate: true, force: true }) : window.scrollTo(0, v)), y);
  await pagina.waitForTimeout(i === posicoes.length - 1 ? ESPERA_FINAL : ESPERA);
  await pagina.screenshot({ path: `${SAIDA}/${String(i).padStart(3, '0')}-${y}.png` });
}
await navegador.close();

const arquivos = (await readdir(SAIDA)).filter((f) => f.endsWith('.png')).sort();
const escala = vp.viewport.width > 600 ? 0.2 : 0.32;
const largura = Math.round(vp.viewport.width * escala);
const altura = Math.round(vp.viewport.height * escala);
const pecas = await Promise.all(
  arquivos.map(async (f, k) => ({
    input: await sharp(`${SAIDA}/${f}`).resize(largura, altura).png().toBuffer(),
    left: (k % COLUNAS) * (largura + 4),
    top: Math.floor(k / COLUNAS) * (altura + 4),
  })),
);
const linhas = Math.ceil(arquivos.length / COLUNAS);
await sharp({ create: { width: COLUNAS * (largura + 4) - 4, height: linhas * (altura + 4) - 4, channels: 3, background: '#ff00ff' } })
  .composite(pecas)
  .png()
  .toFile(`${SAIDA}-folha.png`);
console.log(`${arquivos.length} quadros (${DE}..${fim}, passo ${PASSO}) -> ${SAIDA}-folha.png`);
if (erros.length) console.log('ERROS:', [...new Set(erros)].join(' | '));

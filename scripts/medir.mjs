// Mede coisas na página real (uso durante a verificação).
// Uso: node scripts/medir.mjs <desktop|mobile|LxA> <arquivo-com-a-expressao.js> [--reduzido] [--espera 3000]
// O arquivo contém uma expressão JS (ex.: uma IIFE) avaliada na página.
// LxA é uma tela qualquer, com mouse (ex.: 1024x768); LxAt é a mesma com toque.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const [vpNome = 'desktop', arquivo, ...resto] = process.argv.slice(2);
const expressao = arquivo ? readFileSync(arquivo, 'utf8') : 'document.title';
const reduzido = resto.includes('--reduzido');
const iEspera = resto.indexOf('--espera');
const espera = iEspera >= 0 ? Number(resto[iEspera + 1]) : 3500;
const url = process.env.URL_SITE || 'http://localhost:5173/';

const vps = {
  og: { viewport: { width: 1200, height: 630 } },
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};

const livre = /^(\d+)x(\d+)(t?)$/.exec(vpNome);
const vp = livre
  ? { viewport: { width: Number(livre[1]), height: Number(livre[2]) }, ...(livre[3] ? { isMobile: true, hasTouch: true } : {}) }
  : vps[vpNome];

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
const contexto = await navegador.newContext({ ...vp, reducedMotion: reduzido ? 'reduce' : 'no-preference' });
const pagina = await contexto.newPage();
const erros = [];
pagina.on('pageerror', (e) => erros.push(e.message));
pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
await pagina.goto(url);
await pagina.waitForTimeout(espera);
const resultado = await pagina.evaluate(expressao);
console.log(JSON.stringify(resultado, null, 2));
if (erros.length) console.log('ERROS:', erros);
await navegador.close();

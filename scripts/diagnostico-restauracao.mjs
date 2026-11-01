// Diagnóstico: registra a posição da rolagem a cada quadro logo depois de
// recarregar, e quem chamou window.scrollTo (para ver se a restauração do
// navegador é suave e se algum script a interrompe).
// Uso: node scripts/diagnostico-restauracao.mjs
import { chromium } from 'playwright';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const navegador = await chromium.launch({ channel: 'chrome' });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
await contexto.addInitScript(() => {
  sessionStorage.setItem('hm:visitou', '1');
  const inicio = performance.now();
  const registro = [];
  window.__registro = registro;
  const marcar = (tipo, extra = '') => registro.push(`${Math.round(performance.now() - inicio)}ms ${tipo} y=${Math.round(scrollY)} ${extra}`);
  const original = window.scrollTo.bind(window);
  window.scrollTo = function (...args) {
    const quem = (new Error().stack.split('\n')[2] || '').trim().replace(/\(?https?:\/\/[^/]+/, '').slice(0, 70);
    marcar('scrollTo', `${JSON.stringify(args)} <- ${quem}`);
    return original(...args);
  };
  let ultimo = -1;
  const quadro = () => {
    const y = Math.round(scrollY);
    if (y !== ultimo) marcar('quadro');
    ultimo = y;
    if (performance.now() - inicio < 3000) requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
  document.addEventListener('DOMContentLoaded', () => marcar('DOMContentLoaded', `scroll-behavior=${getComputedStyle(document.documentElement).scrollBehavior}`));
  window.addEventListener('load', () => marcar('load', `classes=${document.documentElement.className}`));
});

const pagina = await contexto.newPage();
await pagina.goto(process.env.URL_SITE || 'http://localhost:5173/');
await espera(2500);
await pagina.mouse.move(6, 400);
// Desce até a seção Sobre e volta até os tratamentos, com a roda do mouse.
for (let i = 0; i < 40; i++) {
  await pagina.mouse.wheel(0, 240);
  await espera(40);
}
await espera(1200);
for (let i = 0; i < 22; i++) {
  await pagina.mouse.wheel(0, -240);
  await espera(40);
}
await espera(1500);
const antes = await pagina.evaluate(() => Math.round(scrollY));
console.log('antes de recarregar:', antes);
await pagina.reload();
await espera(3500);
console.log((await pagina.evaluate(() => window.__registro)).join('\n'));
console.log('depois:', await pagina.evaluate(() => Math.round(scrollY)));
await navegador.close();

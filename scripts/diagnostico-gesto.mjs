// Diagnóstico: intervalos entre os eventos de roda de um gesto longo do
// Playwright, dentro da roda da experiência (para calibrar PAUSA_ENTRE_GESTOS).
import { chromium } from 'playwright';

const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-BR' });
await contexto.addInitScript(() => {
  sessionStorage.setItem('hm:visitou', '1');
  window.__tempos = [];
  window.addEventListener('wheel', () => window.__tempos.push(performance.now()), { capture: true, passive: true });
});
const pagina = await contexto.newPage();
await pagina.goto(URL_SITE);
await pagina.waitForTimeout(3500);
await pagina.mouse.move(720, 450);
const [roda] = await pagina.evaluate(() => window.__rodas());
await pagina.evaluate((v) => window.__lenis.scrollTo(v, { immediate: true, force: true }), roda.inicio);
await pagina.waitForTimeout(900);
await pagina.evaluate(() => (window.__tempos = []));
const amostras = [];
for (let i = 0; i < 40; i++) {
  await pagina.mouse.wheel(0, 40);
  await pagina.waitForTimeout(16);
  if (i % 5 === 4) amostras.push(await pagina.evaluate(() => window.__rodas()[0].ativo));
}
await pagina.waitForTimeout(1500);
const tempos = await pagina.evaluate(() => window.__tempos);
const intervalos = tempos.slice(1).map((t, i) => Math.round(t - tempos[i]));
console.log('eventos', tempos.length, 'duração', Math.round(tempos.at(-1) - tempos[0]), 'ms');
console.log('intervalos', intervalos.join(' '));
console.log('maior intervalo', Math.max(...intervalos), 'ms');
console.log('ativo a cada 5 eventos', amostras.join(' '), '-> final', await pagina.evaluate(() => window.__rodas()[0].ativo));
await navegador.close();

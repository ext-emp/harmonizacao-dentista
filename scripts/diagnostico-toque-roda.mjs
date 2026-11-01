// Diagnóstico: o que acontece com o scroll durante e depois de um arrasto
// com o dedo dentro da roda (celular emulado).
import { chromium } from 'playwright';

const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'pt-BR' });
await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
const pagina = await contexto.newPage();
await pagina.goto(URL_SITE);
await pagina.waitForTimeout(3500);
const cdp = await contexto.newCDPSession(pagina);
const [roda] = await pagina.evaluate(() => window.__rodas());
console.log('roda', roda);

// Fora da roda primeiro: o gesto rola a página?
await pagina.evaluate(() => window.scrollTo(0, 3000));
await pagina.waitForTimeout(600);
let antes = await pagina.evaluate(() => scrollY);
await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -300, speed: 900, gestureSourceType: 'touch' });
await pagina.waitForTimeout(800);
console.log('fora da roda:', antes, '->', await pagina.evaluate(() => scrollY));

await pagina.evaluate((v) => window.scrollTo(0, v), roda.inicio);
await pagina.waitForTimeout(800);
antes = await pagina.evaluate(() => scrollY);
const linha = [];
const gesto = cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -Math.round(roda.passo * 0.6), speed: 900, gestureSourceType: 'touch' });
for (let i = 0; i < 16; i++) {
  await pagina.waitForTimeout(100);
  linha.push(await pagina.evaluate(() => Math.round(scrollY)));
}
await gesto;
console.log('na roda, início', antes, 'passo', roda.passo);
console.log('scrollY a cada 100 ms:', linha.join(' '));
console.log('estado final', (await pagina.evaluate(() => window.__rodas()))[0]);
await navegador.close();

// Diagnóstico: posição do scroll e elemento focado a cada Tab, do topo.
import { chromium } from 'playwright';

const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-BR' });
await contexto.addInitScript(() => {
  sessionStorage.setItem('hm:visitou', '1');
  // O que está por cima do elemento no instante em que ele recebe o foco.
  window.__focos = [];
  document.addEventListener(
    'focusin',
    (e) => {
      const el = e.target;
      const r = el.getBoundingClientRect();
      const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const nome = (n) => (n ? `${n.tagName.toLowerCase()}.${String(n.className).split(' ')[0]}` : 'nada');
      window.__focos.push(`${nome(el)} centro ${Math.round(r.left + r.width / 2)},${Math.round(r.top + r.height / 2)} -> por cima: ${nome(topo)}`);
    },
    true,
  );
});
const pagina = await contexto.newPage();
await pagina.goto(URL_SITE);
await pagina.waitForTimeout(3500);
const intervalo = Number(process.argv[2] || 260);
for (let i = 0; i < 12; i++) {
  await pagina.keyboard.press('Tab');
  await pagina.waitForTimeout(intervalo);
  const amostras = [];
  for (const ms of [0]) {
    await pagina.waitForTimeout(ms - (amostras.at(-1)?.ms ?? 0));
    amostras.push({ ms, y: await pagina.evaluate(() => Math.round(scrollY)) });
  }
  const info = await pagina.evaluate(() => {
    const el = document.activeElement;
    const r = el.getBoundingClientRect();
    return `${el.tagName.toLowerCase()} "${(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34)}" tela ${Math.round(r.top)}..${Math.round(r.bottom)}`;
  });
  console.log(String(i + 1).padStart(2), info.padEnd(70), amostras.map((a) => `${a.ms}ms=${a.y}`).join(' '));
}
console.log((await pagina.evaluate(() => window.__focos)).join('\n'));
await navegador.close();

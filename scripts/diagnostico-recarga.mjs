// Diagnóstico: depois de recarregar com a página rolada, o navegador devolve
// a posição? Mede window.scrollY ao longo do tempo depois do reload.
// Uso: node scripts/diagnostico-recarga.mjs [largura] [altura] [repeticoes]
import { chromium } from 'playwright';

const [largura = '1440', altura = '900', repeticoes = '3'] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const navegador = await chromium.launch({ channel: 'chrome' });

for (let n = 1; n <= Number(repeticoes); n++) {
  const contexto = await navegador.newContext({ viewport: { width: Number(largura), height: Number(altura) } });
  const pagina = await contexto.newPage();
  await pagina.goto(process.env.URL_SITE || 'http://localhost:5173/');
  await pagina.waitForFunction(() => !document.querySelector('[data-preloader]'), null, { timeout: 15000 }).catch(() => {});
  await espera(1500);
  await pagina.mouse.move(6, 400);
  for (let i = 0; i < 12; i++) {
    await pagina.mouse.wheel(0, 220);
    await espera(45);
  }
  await espera(1500);
  const antes = await pagina.evaluate(() => Math.round(scrollY));
  await pagina.reload({ waitUntil: 'commit' });
  const amostras = [];
  for (const t of [50, 150, 300, 600, 1000, 1600, 2500, 4000]) {
    await espera(t - (amostras.at(-1)?.t ?? 0));
    amostras.push({ t, y: await pagina.evaluate(() => Math.round(scrollY)).catch(() => 'navegando') });
  }
  const restauracao = await pagina.evaluate(() => history.scrollRestoration);
  console.log(`${largura}×${altura} #${n}: antes ${antes} | ${amostras.map((a) => `${a.t}ms=${a.y}`).join(' ')} | scrollRestoration=${restauracao}`);
  await contexto.close();
}
await navegador.close();

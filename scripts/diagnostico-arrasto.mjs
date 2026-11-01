// Diagnóstico do arrasto no carrossel (toque pelo CDP). Repete o gesto e
// registra: eventos de ponteiro recebidos, tarefas longas na thread
// principal (ex.: a pérola 3D compilando) e a posição do trilho no tempo.
// Uso: node scripts/diagnostico-arrasto.mjs [repeticoes] [atrasoInicialMs]
import { chromium } from 'playwright';

const [repeticoes = '4', atrasoInicial = '4500'] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });

for (let n = 1; n <= Number(repeticoes); n++) {
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await contexto.addInitScript(() => {
    window.__eventos = [];
    window.__longas = [];
    const inicio = performance.now();
    const t = () => Math.round(performance.now() - inicio);
    for (const tipo of ['pointerdown', 'pointercancel', 'pointerup']) {
      window.addEventListener(tipo, (e) => window.__eventos.push(`${t()} ${tipo}:${e.pointerType}`), { capture: true, passive: true });
    }
    try {
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries()) window.__longas.push(`${Math.round(e.startTime)}+${Math.round(e.duration)}`);
      }).observe({ type: 'longtask', buffered: true });
    } catch {}
  });
  const pagina = await contexto.newPage();
  await pagina.goto(process.env.URL_SITE || 'http://localhost:5173/');
  await pagina.waitForFunction(() => !document.querySelector('[data-preloader]'), null, { timeout: 15000 }).catch(() => {});
  await espera(1200);
  await pagina.evaluate(() => {
    const el = document.querySelector('#resultados');
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY + 260);
  });
  await espera(Number(atrasoInicial));
  const cdp = await contexto.newCDPSession(pagina);
  const caixa = await pagina.locator('[data-comparador]').first().boundingBox();
  const y = caixa.y + caixa.height * 0.6;
  const x0 = caixa.x + caixa.width * 0.62;
  const x1 = caixa.x + caixa.width * 0.05;
  const marco = await pagina.evaluate(() => Math.round(performance.now()));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * (i / 10), y }] });
    await espera(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const amostras = [];
  for (const ms of [0, 100, 300, 600, 1000, 1600]) {
    await espera(ms - (amostras.at(-1)?.ms ?? 0));
    amostras.push({ ms, x: await pagina.evaluate(() => Math.round(document.querySelector('[data-carrossel-trilho]').scrollLeft)) });
  }
  const r = await pagina.evaluate((m) => ({
    eventos: window.__eventos.slice(-4),
    longasPerto: window.__longas.filter((l) => Math.abs(Number(l.split('+')[0]) - m) < 3000),
    tem3d: Boolean(document.querySelector('.perola-palco__canvas')),
  }), marco);
  console.log(
    `#${n}: trilho ${amostras.map((a) => `${a.ms}ms=${a.x}`).join(' ')} | eventos ${r.eventos.join(', ')} | tarefas longas perto do gesto: ${r.longasPerto.join(', ') || 'nenhuma'} | pérola 3D ${r.tem3d ? 'criada' : 'ainda não'}`,
  );
  await contexto.close();
}
await navegador.close();

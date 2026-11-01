// Diagnóstico: abrir o site já com #secao no endereço (link compartilhado)
// leva até a seção certa? Mede onde o topo da seção ficou na tela.
// Também recarrega várias vezes com a página rolada (desce até o fim e
// volta, como numa visita real) e confere se a posição volta.
// Uso: node scripts/diagnostico-ancoras.mjs
import { chromium } from 'playwright';

const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const navegador = await chromium.launch({ channel: 'chrome' });
const VPS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};

for (const [nome, vp] of Object.entries(VPS)) {
  for (const primeiraVisita of [true, false]) {
    for (const ancora of ['#resultados', '#consulta', '#faq', '#contato']) {
      const contexto = await navegador.newContext(vp);
      if (!primeiraVisita) await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
      const pagina = await contexto.newPage();
      await pagina.goto(URL_SITE + ancora);
      await pagina.waitForFunction(() => !document.querySelector('[data-preloader]'), null, { timeout: 15000 }).catch(() => {});
      await espera(3000);
      const r = await pagina.evaluate((a) => ({
        topo: Math.round(document.querySelector(a).getBoundingClientRect().top),
        y: Math.round(scrollY),
        foco: document.activeElement?.id || document.activeElement?.tagName,
      }), ancora);
      const ok = Math.abs(r.topo) <= 4;
      console.log(`${ok ? 'ok   ' : 'FALHA'} ${nome} ${primeiraVisita ? '1ª visita' : 'retorno  '} ${ancora.padEnd(12)} topo da seção em ${r.topo}px (y=${r.y}, foco ${r.foco})`);
      await contexto.close();
    }
  }

  // Recargas com a página rolada.
  const contexto = await navegador.newContext(vp);
  await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
  const pagina = await contexto.newPage();
  await pagina.goto(URL_SITE);
  await espera(2000);
  for (let n = 1; n <= 4; n++) {
    // Desce até o fim e volta até um ponto diferente a cada vez.
    const alvo = 1800 + n * 700;
    await pagina.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
        window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await pagina.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)), alvo);
    await espera(900);
    const antes = await pagina.evaluate(() => Math.round(scrollY));
    await pagina.reload();
    await espera(3500);
    const depois = await pagina.evaluate(() => Math.round(scrollY));
    console.log(`${Math.abs(depois - antes) <= 80 ? 'ok   ' : 'FALHA'} ${nome} recarga #${n}: ${antes} -> ${depois}`);
  }
  await contexto.close();
}
await navegador.close();

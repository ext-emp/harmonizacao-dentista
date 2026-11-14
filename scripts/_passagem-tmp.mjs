import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome' });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [l, a] of [[390, 844], [360, 640], [768, 1024]]) {
  const ctx = await b.newContext({ viewport: { width: l, height: a }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  await p.goto('http://localhost:5173/');
  await espera(3000);
  const cdp = await ctx.newCDPSession(p);
  const arrastar = async (dy) => {
    const x = l / 2, y0 = dy < 0 ? a * 0.75 : a * 0.3;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (dy * i) / 12 }] });
      await espera(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const logo = Math.round(await p.evaluate(() => scrollY));
    await espera(2200);
    return `${logo} -> ${Math.round(await p.evaluate(() => scrollY))}`;
  };
  const alvo = await p.evaluate(() => {
    document.documentElement.classList.add('pilha-medindo');
    const y = document.querySelector('[data-espaco]').getBoundingClientRect().top + scrollY;
    document.documentElement.classList.remove('pilha-medindo');
    return Math.round(y);
  });
  const desce = await arrastar(-180);
  const sobe = await arrastar(140);
  console.log(`${l}x${a}: topo do espaço em ${alvo}. Dedo 180px para cima (rola para baixo): ${desce}. Dedo 140px para baixo: ${sobe}`, erros.length ? erros : '');
  await ctx.close();
}
await b.close();

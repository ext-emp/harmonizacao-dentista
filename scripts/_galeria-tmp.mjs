import { chromium } from 'playwright';
const SAIDA = process.argv[2];
const tamanhos = (process.argv[3] || '390x844,360x640,430x932').split(',');
const b = await chromium.launch({ channel: 'chrome' });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
for (const t of tamanhos) {
  const [l, a] = t.split('x').map(Number);
  const ctx = await b.newContext({ viewport: { width: l, height: a }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await ctx.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  await p.goto('http://localhost:5173/');
  await espera(3000);
  const info = await p.evaluate(() => {
    document.documentElement.classList.add('pilha-medindo');
    const s = document.querySelector('[data-espaco]');
    const topo = s.getBoundingClientRect().top + scrollY;
    const fim = document.querySelector('[data-espaco-percurso]').getBoundingClientRect().bottom + scrollY - innerHeight;
    document.documentElement.classList.remove('pilha-medindo');
    return { topo: Math.round(topo), fim: Math.round(fim) };
  });
  const linhas = [];
  const passos = 9;
  for (let k = 0; k <= passos; k++) {
    const y = info.topo + ((info.fim - info.topo) * k) / passos;
    await p.evaluate((v) => window.scrollTo(0, v), y);
    await espera(700);
    const m = await p.evaluate(() => {
      const f = document.querySelector('.espaco__frase').getBoundingClientRect();
      const cards = [...document.querySelectorAll('.espaco__trilho > li')].map((li) => li.getBoundingClientRect());
      const c = cards[0];
      const img = document.querySelector('.espaco__trilho > li img');
      const vis = cards.filter((r) => r.right > 0 && r.left < innerWidth).length;
      return { frase: Math.round(f.bottom), card: `${Math.round(c.width)}x${Math.round(c.height)} em y ${Math.round(c.top)}`, vis, encosta: f.bottom > c.top && f.top < c.bottom && c.left < innerWidth && c.right > 0, img: img.currentSrc.split('/').pop() };
    });
    linhas.push(`q${k}: ${m.vis} foto(s) à vista, cartão ${m.card}, pé da frase ${m.frase}${m.encosta ? ' ENCOSTA' : ''}, ${m.img}`);
    if (SAIDA && t === '390x844') await p.screenshot({ path: `${SAIDA}/${t}-q${k}.png`, scale: 'css' });
  }
  console.log(`== ${t}\n  ${linhas.join('\n  ')}${erros.length ? '\n  ERROS ' + erros.join('|') : ''}`);
  await ctx.close();
}
await b.close();

// ---------------------------------------------------------------------------
// Testa a roda da experiência (e qualquer outra seção com data-roda): cada
// gesto deve girar um passo.
//  - Desktop: gestos de roda do mouse (vários eventos seguidos, como um
//    trackpad), descendo e subindo; confere o passo ativo e a posição.
//    Também a troca de sentido logo depois de um passo e o teclado (Page
//    Down, Page Up, Espaço e Shift+Espaço: um passo por tecla).
//  - Celular: arrasto com o dedo (toque emulado via CDP); ao soltar, a
//    página deve encaixar num passo.
// Precisa do servidor de desenvolvimento (window.__rodas só existe no dev).
// Uso: node scripts/testar-roda.mjs [--vp desktop,mobile]
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const VPS = opcao('vp', 'desktop,mobile').split(',');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

let falhas = 0;
const conferir = (ok, mensagem) => {
  console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${mensagem}`);
  if (!ok) falhas++;
};

const estado = (pagina) => pagina.evaluate(() => ({ y: Math.round(scrollY), rodas: window.__rodas() }));

// Um gesto: N eventos de roda em sequência rápida (trackpad ou roda com inércia).
async function gesto(pagina, delta, eventos = 6) {
  for (let i = 0; i < eventos; i++) {
    await pagina.mouse.wheel(0, delta / eventos);
    await espera(16);
  }
}

async function testarDesktop(navegador) {
  console.log('\n== desktop (roda do mouse)');
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-BR' });
  await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  await pagina.goto(URL_SITE);
  await espera(3500);
  await pagina.mouse.move(720, 450);

  const { rodas: todas } = await estado(pagina);
  conferir(todas.length > 0, `há roda na página (${todas.map((r) => r.id).join(', ')})`);
  for (const indice of todas.keys()) {
    let { rodas } = await estado(pagina);
    const roda = rodas[indice];
    // Começa um pouco antes da roda e entra com um gesto.
    await pagina.evaluate((v) => window.__lenis.scrollTo(v, { immediate: true, force: true }), roda.inicio - 120);
    await espera(600);
    const passos = [];
    for (let k = 0; k < roda.passo && k < 12; k++) {
      await gesto(pagina, 240);
      await espera(1400);
      const agora = await estado(pagina);
      const r = agora.rodas[indice];
      passos.push({ ativo: r.ativo, y: agora.y, esperado: r.inicio + Math.min(k, 99) * r.passo });
      if (agora.y > r.fim + 40) break;
    }
    const ativos = passos.map((p) => p.ativo);
    console.log(`  ${roda.id}: passos ${ativos.join(' ')} | y ${passos.map((p) => p.y).join(' ')}`);
    const total = roda.total;
    const sequencia = Array.from({ length: total }, (_, i) => i);
    conferir(JSON.stringify(ativos.slice(0, total)) === JSON.stringify(sequencia), `${roda.id}: um gesto = um passo, descendo (0..${total - 1})`);
    const alinhados = passos.slice(0, total).every((p, i) => Math.abs(p.y - (roda.inicio + i * roda.passo)) <= 3);
    conferir(alinhados, `${roda.id}: cada passo para exatamente na posição dele`);
    conferir(passos.length > total && passos.at(-1).y > roda.fim + 40, `${roda.id}: depois do último passo, a rolagem continua normal`);

    // Subindo: volta passo a passo.
    await pagina.evaluate((v) => window.__lenis.scrollTo(v, { immediate: true, force: true }), roda.fim);
    await espera(900);
    const subindo = [];
    for (let k = 0; k < total - 1; k++) {
      await gesto(pagina, -240);
      await espera(1400);
      subindo.push((await estado(pagina)).rodas[indice].ativo);
    }
    console.log(`  ${roda.id}: subindo ${subindo.join(' ')}`);
    conferir(JSON.stringify(subindo) === JSON.stringify(sequencia.slice(0, -1).reverse()), `${roda.id}: um gesto = um passo, subindo`);

    // Deslize forte no trackpad: deltas grandes que vão diminuindo (inércia)
    // por uns 2 segundos. Continua sendo um passo só.
    await pagina.evaluate((v) => window.__lenis.scrollTo(v, { immediate: true, force: true }), roda.inicio);
    await espera(900);
    for (let d = 160; d > 3; d *= 0.9) {
      await pagina.mouse.wheel(0, d);
      await espera(16);
    }
    await espera(1500);
    const deslize = (await estado(pagina)).rodas[indice].ativo;
    conferir(deslize === 1, `${roda.id}: deslize forte com inércia anda um passo só (ativo ${deslize})`);

    // Roda do mouse girando sem parar por ~3 s: anda devagar, um passo a cada tanto.
    await pagina.evaluate((v) => window.__lenis.scrollTo(v, { immediate: true, force: true }), roda.inicio);
    await espera(900);
    const inicioGiro = Date.now();
    while (Date.now() - inicioGiro < 3000) {
      await pagina.mouse.wheel(0, 100);
      await espera(16);
    }
    await espera(1500);
    const giro = (await estado(pagina)).rodas[indice].ativo;
    conferir(giro >= 2 && giro <= 3, `${roda.id}: girando sem parar por 3 s anda 2 ou 3 passos (ativo ${giro})`);

    // Troca de sentido logo depois de um passo (sem a pausa entre gestos):
    // conta como gesto novo e volta ao passo de onde saiu.
    await pagina.evaluate((v) => window.__lenis.scrollTo(v, { immediate: true, force: true }), roda.inicio + 2 * roda.passo);
    await espera(1200);
    await gesto(pagina, 240);
    await espera(60);
    await gesto(pagina, -240);
    await espera(1800);
    const virou = await estado(pagina);
    conferir(
      virou.rodas[indice].ativo === 2 && Math.abs(virou.y - (roda.inicio + 2 * roda.passo)) <= 3,
      `${roda.id}: desce e logo sobe, volta ao mesmo passo (ativo ${virou.rodas[indice].ativo})`,
    );

    // Teclado: Page Down e Espaço (e o contrário, Page Up e Shift+Espaço)
    // andam um passo por vez, sem pular nenhum.
    for (const [tecla, partida, esperado] of [
      ['PageDown', roda.inicio, sequencia],
      ['Space', roda.inicio, sequencia],
      ['PageUp', roda.fim, [...sequencia].reverse()],
      ['Shift+Space', roda.fim, [...sequencia].reverse()],
    ]) {
      await pagina.evaluate((v) => window.__lenis.scrollTo(v, { immediate: true, force: true }), partida);
      await espera(1200);
      await pagina.evaluate(() => document.activeElement?.blur());
      const vistos = [(await estado(pagina)).rodas[indice].ativo];
      for (let k = 0; k < total - 1; k++) {
        await pagina.keyboard.press(tecla);
        await espera(1300);
        const a = (await estado(pagina)).rodas[indice].ativo;
        if (a !== vistos.at(-1)) vistos.push(a);
      }
      conferir(JSON.stringify(vistos) === JSON.stringify(esperado), `${roda.id}: ${tecla} anda um passo por vez (${vistos.join(' ')})`);
    }
    ({ rodas } = await estado(pagina));
  }
  conferir(!erros.length, `console sem erros ${erros.join(' | ')}`);
  await contexto.close();
}

async function testarCelular(navegador) {
  console.log('\n== celular (arrasto com o dedo)');
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'pt-BR' });
  await contexto.addInitScript(() => sessionStorage.setItem('hm:visitou', '1'));
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  await pagina.goto(URL_SITE);
  await espera(3500);
  const cdp = await contexto.newCDPSession(pagina);
  // Arrasto vertical com o dedo (de baixo para cima = rolar para baixo), com
  // eventos de toque de verdade (o mesmo método de testar-interacoes.mjs).
  const arrastar = async (distancia) => {
    const x = 195;
    const y0 = 640;
    const passos = 14;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= passos; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - (distancia * i) / passos }] });
      await espera(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  const { rodas } = await estado(pagina);
  for (const [indice, roda] of rodas.entries()) {
    await pagina.evaluate((v) => window.scrollTo(0, v), roda.inicio);
    await espera(800);
    const vistos = [];
    for (let k = 0; k < 3; k++) {
      await arrastar(Math.round(roda.passo * 0.6));
      await espera(1600);
      const agora = await estado(pagina);
      const r = agora.rodas[indice];
      const resto = (agora.y - r.inicio) % r.passo;
      vistos.push({ ativo: r.ativo, encaixado: Math.min(resto, r.passo - resto) <= 3 });
    }
    console.log(`  ${roda.id}: ${vistos.map((v) => `${v.ativo}${v.encaixado ? '' : '*'}`).join(' ')}  (* = fora do encaixe)`);
    conferir(vistos.every((v) => v.encaixado), `${roda.id}: depois de soltar o dedo, para num passo`);
    conferir(vistos.at(-1).ativo >= 2, `${roda.id}: arrastos seguidos passam de passo`);
  }
  conferir(!erros.length, `console sem erros ${erros.join(' | ')}`);
  await contexto.close();
}

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });
if (VPS.includes('desktop')) await testarDesktop(navegador);
if (VPS.includes('mobile')) await testarCelular(navegador);
await navegador.close();
console.log(falhas ? `\n${falhas} falha(s).` : '\nRodas ok.');
process.exitCode = falhas ? 1 : 0;

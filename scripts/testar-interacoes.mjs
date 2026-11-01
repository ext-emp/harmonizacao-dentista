// ---------------------------------------------------------------------------
// Testa as interações no navegador de verdade (Chrome via Playwright) e salva
// capturas dos estados. Sai com código 1 se algum teste falhar.
//
//  Desktop (mouse): slider (clicar, arrastar, teclado, leitor de tela),
//  carrossel (setas e contador), cursor ("Arraste", "Ver", link), imagem da
//  lista de procedimentos seguindo o cursor, FAQ (abrir e fechar) e as rodas
//  da experiência e da consulta (um gesto, um passo).
//  Celular (toque emulado pelo CDP): arrastar perto da linha move o slider;
//  arrastar no resto da foto passa o carrossel; arrastar na vertical rola a
//  página; equivalentes de toque (.is-active).
//
// Uso: node scripts/testar-interacoes.mjs [--saida capturas/interacoes] [--reduzido]
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const URL_SITE = process.env.URL_SITE || 'http://localhost:5173/';
const SAIDA = opcao('saida', 'capturas/interacoes');
const REDUZIDO = args.includes('--reduzido');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const resultados = [];
function conferir(nome, condicao, detalhe = '') {
  resultados.push({ nome, ok: Boolean(condicao), detalhe });
  console.log(`  ${condicao ? 'ok   ' : 'FALHA'} ${nome}${detalhe !== '' ? `  (${detalhe})` : ''}`);
}

const navegador = await chromium.launch({ channel: 'chrome', args: ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] });

async function abrir(contextoOpcoes, pasta) {
  const contexto = await navegador.newContext({ ...contextoOpcoes, reducedMotion: REDUZIDO ? 'reduce' : 'no-preference', locale: 'pt-BR' });
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await pagina.goto(URL_SITE);
  await pagina.waitForFunction(() => !document.querySelector('[data-preloader]'), null, { timeout: 15000 }).catch(() => {});
  await espera(1200);
  await mkdir(pasta, { recursive: true });
  const salvar = (nome) => pagina.screenshot({ path: `${pasta}/${nome}.png` });
  return { contexto, pagina, erros, salvar };
}

// Rola até o elemento (com o Lenis, se houver) e espera assentar. A posição é
// medida com os painéis empilhados desligados (.pilha-medindo): um painel
// parado na tela não está no lugar dele na página.
async function rolarAte(pagina, seletor, deslocamento = 0, ms = 1200) {
  await pagina.evaluate(
    ([s, d]) => {
      const html = document.documentElement;
      html.classList.add('pilha-medindo');
      const el = document.querySelector(s);
      const y = el.getBoundingClientRect().top + window.scrollY + d;
      html.classList.remove('pilha-medindo');
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    },
    [seletor, deslocamento],
  );
  await espera(ms);
}

// Desce a página inteira aos poucos (como uma pessoa) e confere se tudo que
// tinha revelação ficou visível: nada pode sobrar escondido depois de passar.
async function conferirTudoVisivel(pagina, rotulo) {
  const altura = await pagina.evaluate(() => document.documentElement.scrollHeight);
  const tela = await pagina.evaluate(() => window.innerHeight);
  for (let y = 0; y <= altura; y += Math.round(tela * 0.45)) {
    await pagina.evaluate((v) => (window.__lenis ? window.__lenis.scrollTo(v, { immediate: true }) : window.scrollTo(0, v)), y);
    await espera(220);
  }
  await espera(2600);
  const escondidos = await pagina.evaluate(() =>
    [...document.querySelectorAll('[data-revelar], [data-revelar="lista"] > *')]
      .filter((el) => {
        const cs = getComputedStyle(el);
        return parseFloat(cs.opacity) < 0.99 || cs.visibility === 'hidden' || (cs.clipPath !== 'none' && cs.clipPath !== 'inset(0%)');
      })
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`),
  );
  conferir(`${rotulo}: tudo visível depois de rolar a página inteira`, escondidos.length === 0, escondidos.slice(0, 6).join(', '));
}

const posicao = (pagina, i = 0) =>
  pagina.evaluate((n) => parseFloat(document.querySelectorAll('[data-comparador]')[n].style.getPropertyValue('--posicao')), i);

// ---------------------------------------------------------------------------
// Desktop
// ---------------------------------------------------------------------------
{
  console.log(`\n== desktop (mouse)${REDUZIDO ? ', movimento reduzido' : ''}`);
  const { contexto, pagina, erros, salvar } = await abrir({ viewport: { width: 1440, height: 900 } }, `${SAIDA}/desktop${REDUZIDO ? '-reduzido' : ''}`);

  // ---- Slider com mouse ----
  await rolarAte(pagina, '#resultados', 150, 4500); // espera o vaivém terminar
  const comp = pagina.locator('[data-comparador]').first();
  const caixa = await comp.boundingBox();
  const meioY = caixa.y + caixa.height * 0.55;
  await pagina.mouse.move(caixa.x + caixa.width * 0.5, meioY, { steps: 6 });
  await espera(700);
  const classesCursor = await pagina.evaluate(() => document.documentElement.className);
  if (!REDUZIDO) conferir('cursor vira "Arraste" sobre a foto', classesCursor.includes('cursor--texto'), classesCursor.match(/cursor--\w+/g)?.join(' '));
  await salvar('01-slider-cursor-arraste');

  await pagina.mouse.move(caixa.x + caixa.width * 0.25, meioY);
  await pagina.mouse.down();
  conferir('mouse: apertar leva a linha até o ponto (25%)', Math.abs((await posicao(pagina)) - 25) < 1.5, (await posicao(pagina)).toFixed(1));
  await pagina.mouse.move(caixa.x + caixa.width * 0.8, meioY, { steps: 10 });
  conferir('mouse: arrastar move a linha (80%)', Math.abs((await posicao(pagina)) - 80) < 1.5, (await posicao(pagina)).toFixed(1));
  await salvar('02-slider-arrastado');
  await pagina.mouse.move(caixa.x + caixa.width * 1.3, meioY, { steps: 6 });
  conferir('mouse: a linha para na borda (100%)', (await posicao(pagina)) === 100, await posicao(pagina));
  await pagina.mouse.up();

  // ---- Slider com teclado ----
  const controle = comp.locator('[data-comparador-controle]');
  await controle.focus();
  await pagina.keyboard.press('Home');
  conferir('teclado: Home leva a 0%', (await posicao(pagina)) === 0, await posicao(pagina));
  await pagina.keyboard.press('ArrowRight');
  await pagina.keyboard.press('ArrowRight');
  conferir('teclado: seta para a direita anda 5% por vez', (await posicao(pagina)) === 10, await posicao(pagina));
  await pagina.keyboard.press('End');
  conferir('teclado: End leva a 100%', (await posicao(pagina)) === 100, await posicao(pagina));
  await pagina.keyboard.press('ArrowLeft');
  const texto = await controle.getAttribute('aria-valuetext');
  conferir('leitor de tela: aria-valuetext acompanha', texto === '95% antes, 5% depois', texto);
  const nomeAcessivel = await controle.getAttribute('aria-label');
  conferir('leitor de tela: o controle tem nome', /antes e depois/i.test(nomeAcessivel || ''), nomeAcessivel);
  const papel = await pagina.evaluate(() => {
    const el = document.querySelector('[data-comparador-controle]');
    return `${el.tagName.toLowerCase()}[type=${el.type}]`;
  });
  conferir('leitor de tela: é um slider nativo', papel === 'input[type=range]', papel);
  await salvar('03-slider-foco-teclado');
  await pagina.keyboard.press('Home');

  // ---- Carrossel ----
  const contador = () => pagina.locator('[data-carrossel-atual]').textContent();
  conferir('carrossel: contador começa em 01', (await contador()) === '01', await contador());
  const total = await pagina.locator('[data-carrossel-total]').textContent();
  conferir('carrossel: total vem da lista de casos', total.trim() === '06', total.trim());
  conferir(
    'carrossel: seta anterior desativada no início',
    (await pagina.locator('[data-carrossel-anterior]').getAttribute('aria-disabled')) === 'true',
  );
  const visiveis = await pagina.evaluate(() => {
    const trilho = document.querySelector('[data-carrossel-trilho]');
    const t = trilho.getBoundingClientRect();
    return [...trilho.children].filter((c) => {
      const r = c.getBoundingClientRect();
      return r.left >= t.left - 1 && r.right <= t.right + 1;
    }).length;
  });
  conferir('carrossel: 3 cards inteiros no desktop', visiveis === 3, visiveis);
  await pagina.locator('[data-carrossel-proximo]').click();
  await espera(1100);
  conferir('carrossel: seta próxima avança o contador', (await contador()) === '02', await contador());
  await salvar('04-carrossel-proximo');
  // Clica além do fim de propósito (force: a seta já fica aria-disabled).
  for (let i = 0; i < 4; i++) {
    await pagina.locator('[data-carrossel-proximo]').click({ force: true });
    await espera(900);
  }
  conferir('carrossel: para no último grupo (04 / 06)', (await contador()) === '04', await contador());
  conferir(
    'carrossel: seta próxima desativada no fim',
    (await pagina.locator('[data-carrossel-proximo]').getAttribute('aria-disabled')) === 'true',
  );
  await pagina.locator('[data-carrossel-anterior]').click();
  await espera(1000);
  conferir('carrossel: seta anterior volta', (await contador()) === '03', await contador());

  // ---- Tratamentos: cursor "Ver" e lista com imagem ----
  await rolarAte(pagina, '.tratamento--rosto', -120);
  const bloco = await pagina.locator('.tratamento--rosto .tratamento__midia').boundingBox();
  await pagina.mouse.move(bloco.x + bloco.width * 0.75, bloco.y + bloco.height * 0.3, { steps: 8 });
  await espera(1200);
  const estadoVer = await pagina.evaluate(() => ({
    classe: document.documentElement.className.match(/cursor--\w+/g)?.join(' ') || '',
    texto: document.querySelector('.cursor-anel__texto')?.textContent,
    giro: getComputedStyle(document.querySelector('.tratamento--rosto .tratamento__midia')).transform,
  }));
  if (!REDUZIDO) {
    conferir('cursor vira "Ver" sobre o tratamento', estadoVer.texto === 'Ver' && estadoVer.classe.includes('cursor--texto'), estadoVer.texto);
    conferir('tilt 3D inclina a imagem', estadoVer.giro.startsWith('matrix3d'), estadoVer.giro.slice(0, 24));
  }
  await salvar('05-tratamento-ver-tilt');

  await rolarAte(pagina, '.procedimentos', -200);
  const linha = await pagina.locator('.procedimento').nth(2).boundingBox();
  await pagina.mouse.move(linha.x + linha.width * 0.45, linha.y + linha.height / 2, { steps: 10 });
  await espera(1200);
  const midia = await pagina.evaluate(() => {
    const m = document.querySelectorAll('.procedimento__midia')[2];
    const r = m.getBoundingClientRect();
    return { clip: getComputedStyle(m).clipPath, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  conferir('lista: a imagem aparece no hover', midia.clip.includes('0%') || midia.clip === 'inset(0px)', midia.clip);
  conferir(
    'lista: a imagem fica no cursor',
    Math.abs(midia.x - (linha.x + linha.width * 0.45)) < 12 && Math.abs(midia.y - (linha.y + linha.height / 2)) < 12,
    `${midia.x},${midia.y}`,
  );
  await salvar('06-lista-imagem-no-cursor');

  // ---- Link: destaque do cursor ----
  await rolarAte(pagina, '#contato');
  const link = await pagina.locator('.contato__link').first().boundingBox();
  await pagina.mouse.move(link.x + 10, link.y + link.height / 2, { steps: 6 });
  await espera(800);
  const estadoLink = await pagina.evaluate(() => document.documentElement.className.match(/cursor--\w+/g)?.join(' ') || '');
  if (!REDUZIDO) conferir('cursor destaca links', estadoLink.includes('cursor--link'), estadoLink);
  await salvar('07-cursor-link');

  // ---- FAQ ----
  await rolarAte(pagina, '#faq', -40);
  const pergunta = pagina.locator('.faq__pergunta').nth(1);
  await pergunta.click();
  await espera(REDUZIDO ? 200 : 450);
  await salvar('08-faq-abrindo');
  await espera(1200);
  const aberto = await pagina.evaluate(() => {
    const d = document.querySelectorAll('[data-faq] details')[1];
    return { open: d.open, altura: d.querySelector('.faq__resposta').getBoundingClientRect().height };
  });
  conferir('FAQ: abre com a resposta visível', aberto.open && aberto.altura > 40, `${aberto.altura}px`);
  await salvar('09-faq-aberto');
  await pergunta.click();
  await espera(1300);
  const fechado = await pagina.evaluate(() => document.querySelectorAll('[data-faq] details')[1].open);
  conferir('FAQ: fecha de novo', fechado === false);
  await pagina.keyboard.press('Tab');
  await pagina.locator('.faq__pergunta').nth(2).focus();
  await pagina.keyboard.press('Enter');
  await espera(1300);
  conferir('FAQ: abre pelo teclado (Enter)', await pagina.evaluate(() => document.querySelectorAll('[data-faq] details')[2].open));

  // ---- Rodas (experiência e consulta): um gesto da roda do mouse = um passo ----
  // (O teste completo, com trackpad e inércia, é scripts/testar-roda.mjs.)
  for (const [id, total] of [['experiencia', 6], ['consulta', 5]]) {
    if (REDUZIDO) {
      // Movimento reduzido: sem roda, a lista inteira à vista.
      const lista = await pagina.evaluate((i) => {
        const s = document.getElementById(i);
        const itens = [...s.querySelectorAll('[data-roda-item]')];
        return { roda: s.classList.contains('roda--ativa'), visiveis: itens.filter((it) => parseFloat(getComputedStyle(it).opacity) > 0.99).length };
      }, id);
      conferir(`${id}: sem roda com movimento reduzido, os ${total} itens à vista`, !lista.roda && lista.visiveis === total, JSON.stringify(lista));
      continue;
    }
    await rolarAte(pagina, `#${id}`, 0, 1200);
    await pagina.mouse.move(720, 450);
    for (let k = 0; k < 6; k++) {
      await pagina.mouse.wheel(0, 40);
      await espera(16);
    }
    await espera(1500);
    const roda = await pagina.evaluate((i) => {
      const s = document.getElementById(i);
      return {
        ativa: s.classList.contains('roda--ativa'),
        marco: [...s.querySelectorAll('.roda__marco')].findIndex((m) => m.classList.contains('esta-ativo')),
        contador: s.querySelector('[data-roda-atual]').textContent,
        texto: [...s.querySelectorAll('[data-roda-item]')].filter((it) => parseFloat(getComputedStyle(it).opacity) > 0.99).length,
        topo: Math.round(s.querySelector('[data-roda-palco]').getBoundingClientRect().top),
      };
    }, id);
    conferir(`${id}: a roda está ligada e o palco fica fixo no topo`, roda.ativa && Math.abs(roda.topo) <= 1, `topo ${roda.topo}`);
    conferir(`${id}: um gesto gira a roda para o passo 2`, roda.marco === 1 && roda.contador === '02', `marco ${roda.marco}, contador ${roda.contador}`);
    conferir(`${id}: só o texto do passo ativo aparece`, roda.texto === 1, roda.texto);
    await salvar(`10-${id}-passo-2`);
  }

  await conferirTudoVisivel(pagina, 'desktop');
  conferir('desktop: console sem erros', erros.length === 0, erros.join(' | '));
  await contexto.close();
}

// ---------------------------------------------------------------------------
// Celular (toque pelo CDP: gera toques reais, com touch-action e scroll)
// ---------------------------------------------------------------------------
{
  console.log(`\n== celular (toque)${REDUZIDO ? ', movimento reduzido' : ''}`);
  const { contexto, pagina, erros, salvar } = await abrir(
    { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    `${SAIDA}/mobile${REDUZIDO ? '-reduzido' : ''}`,
  );
  const cdp = await contexto.newCDPSession(pagina);

  async function arrastar(x0, y0, x1, y1, passos = 14) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= passos; i++) {
      const t = i / passos;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t }] });
      await espera(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await espera(700);
  }

  await rolarAte(pagina, '#resultados', 260, 4500);
  const estado = () =>
    pagina.evaluate(() => ({
      posicao: parseFloat(document.querySelector('[data-comparador]').style.getPropertyValue('--posicao')),
      trilho: Math.round(document.querySelector('[data-carrossel-trilho]').scrollLeft),
      scrollY: Math.round(window.scrollY),
    }));

  const caixa = await pagina.locator('[data-comparador]').first().boundingBox();
  const y = caixa.y + caixa.height * 0.6;
  const antes = await estado();
  await arrastar(caixa.x + caixa.width * 0.5, y, caixa.x + caixa.width * 0.85, y);
  const depoisLinha = await estado();
  conferir('toque: arrastar perto da linha move o slider', depoisLinha.posicao > 75, `${antes.posicao} -> ${depoisLinha.posicao.toFixed(1)}`);
  conferir('toque: e o carrossel fica parado', depoisLinha.trilho === antes.trilho, `${antes.trilho} -> ${depoisLinha.trilho}`);
  await salvar('01-toque-slider');

  // Começa fora da faixa da linha (a linha está em 85%; a faixa vai de ~73%
  // a ~96%) e arrasta até a borda da tela: mais de meio card, para o encaixe
  // nativo sempre ir para o próximo (com meio card ou menos, ele decide pela
  // velocidade do gesto, como em qualquer carrossel nativo).
  await arrastar(caixa.x + caixa.width * 0.68, y, 2, y, 10);
  await espera(600);
  const depoisFoto = await estado();
  conferir('toque: arrastar no resto da foto passa o carrossel', depoisFoto.trilho > depoisLinha.trilho + 100, `${depoisLinha.trilho} -> ${depoisFoto.trilho}`);
  conferir('toque: e o slider fica onde estava', Math.abs(depoisFoto.posicao - depoisLinha.posicao) < 0.5, depoisFoto.posicao.toFixed(1));
  const contador = await pagina.locator('[data-carrossel-atual]').textContent();
  conferir('toque: contador acompanha o carrossel', contador === '02', contador);
  await salvar('02-toque-carrossel');

  const card2 = await pagina.locator('[data-comparador]').nth(1).boundingBox();
  await arrastar(card2.x + card2.width * 0.5, card2.y + card2.height * 0.7, card2.x + card2.width * 0.5, card2.y + card2.height * 0.7 - 320, 12);
  const depoisVertical = await estado();
  conferir('toque: arrastar na vertical rola a página (até sobre a linha)', depoisVertical.scrollY > depoisFoto.scrollY + 150, `${depoisFoto.scrollY} -> ${depoisVertical.scrollY}`);

  // Equivalentes de toque: só uma linha da lista ativa por vez.
  await rolarAte(pagina, '.procedimento:nth-child(3)', -380, 900);
  const ativos = await pagina.evaluate(() => [...document.querySelectorAll('.procedimento')].map((li) => li.classList.contains('is-active')));
  conferir('toque: uma linha de procedimento ativa por vez', ativos.filter(Boolean).length === 1, ativos.map((a) => (a ? 1 : 0)).join(''));
  await salvar('03-toque-lista');

  await rolarAte(pagina, '.tratamento--sorriso', -200, 900);
  const giro = await pagina.evaluate(() => getComputedStyle(document.querySelector('.tratamento--sorriso .tratamento__midia')).transform);
  if (!REDUZIDO) conferir('toque: o tilt vira rotação presa ao scroll', giro.startsWith('matrix3d'), giro.slice(0, 24));

  // Rodapé: o link do fim da página também ganha o estado ativo.
  await pagina.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await espera(900);
  const topo = await pagina.evaluate(() => document.querySelector('.rodape__topo').classList.contains('is-active'));
  conferir('toque: link no fim da página fica ativo', topo);
  await salvar('04-toque-rodape');

  await conferirTudoVisivel(pagina, 'celular');
  conferir('celular: console sem erros', erros.length === 0, erros.join(' | '));
  await contexto.close();
}

await navegador.close();
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} testes passaram.`);
process.exitCode = falhas.length ? 1 : 0;

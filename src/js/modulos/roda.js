// ---------------------------------------------------------------------------
// Roda (a experiência), no estilo da LAVA dental.
// O palco fica fixo (sticky) e cada passo gira a roda: o número seguinte
// chega ao topo, o texto dele aparece embaixo e o contador rola.
//  - Mouse ou trackpad: um gesto de rolagem = um passo. A roda do mouse passa
//    por aqui antes do Lenis (interceptarRoda): o gesto é engolido e a página
//    anda exatamente até o passo seguinte. No primeiro e no último passo, o
//    gesto para fora da roda segue a rolagem normal.
//  - Toque: a página rola livre e, quando para, encaixa no passo seguinte na
//    direção do gesto (snap direcional do ScrollTrigger).
//  - Teclado: Page Down, Page Up e Espaço andam um passo (uma tela de rolagem
//    pularia passos); as setas e a barra de rolagem andam livres, e a roda
//    acompanha a posição.
// Com movimento reduzido (ou sem JavaScript), fica a lista numerada. Também
// fica a lista no celular deitado e em telas baixas demais para a roda.
// ---------------------------------------------------------------------------
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { dur, ease } from '../core/tokens.js';
import { reduzMovimento, temMouse } from '../core/ambiente.js';
import { interceptarRoda, obterLenis } from '../core/scroll.js';

// Scroll de cada passo, em fração da altura da tela.
const PASSO_NA_TELA = 0.55;
// Um gesto é uma sequência de eventos de roda com menos que isto (ms) entre
// eles. O primeiro evento do gesto dá o passo; o resto é engolido, inclusive
// a inércia do trackpad (deltas que vão diminuindo).
const PAUSA_ENTRE_GESTOS = 200;
// Depois que o passo terminou, contam como gesto novo mesmo sem pausa:
//  - um delta que cresce de repente (deslizou de novo durante a inércia);
const ACELERACAO = 1.6;
//  - a roda girando firme (sem diminuir) por mais que isto (ms) desde o
//    último passo: quem gira sem parar anda um passo a cada tanto.
const GIRO_CONTINUO = 1400;
const DELTA_FIRME = 30;
// Trocar de sentido é sempre gesto novo, mesmo no meio do giro (a inércia
// nunca troca de sentido). Abaixo deste delta, é só ruído do trackpad.
const DELTA_PARA_VIRAR = 4;
// Rede de segurança: a trava se solta sozinha depois disto (ms), mesmo se o
// scroll do passo for interrompido (por uma âncora, por exemplo).
const LIMITE_DA_TRAVA = 1600;
// Onde a roda gira: com mouse, com o aparelho em pé ou em tela larga. No
// celular deitado não há altura para ela.
const COM_RODA = '(hover: hover) and (pointer: fine), (orientation: portrait), (min-width: 64em)';
// Espaço livre (px) entre a roda e o texto em volta (cabeçalho e pé da tela).
const FOLGA = 16;

const rodas = [];

function montarDisco(disco, total) {
  const circulo = document.createElement('span');
  circulo.className = 'roda__circulo';
  disco.append(circulo);
  return Array.from({ length: total }, (_, i) => {
    const marco = document.createElement('span');
    marco.className = 'roda__marco';
    marco.style.setProperty('--angulo', `${(360 / total) * i}deg`);
    const ponto = document.createElement('span');
    ponto.className = 'roda__ponto';
    const selo = document.createElement('span');
    selo.className = 'roda__selo';
    selo.textContent = String(i + 1);
    marco.append(ponto, selo);
    disco.append(marco);
    return marco;
  });
}

function criarRoda(secao) {
  const itens = gsap.utils.toArray('[data-roda-item]', secao);
  const palco = secao.querySelector('[data-roda-palco]');
  const cabecalho = secao.querySelector('.roda__cabecalho');
  const disco = secao.querySelector('[data-roda-disco]');
  const percurso = secao.querySelector('[data-roda-percurso]');
  const numero = secao.querySelector('[data-roda-atual]');
  const totalNoContador = secao.querySelector('.roda__total');
  const total = itens.length;
  if (total < 2 || !palco || !cabecalho || !disco || !percurso) return null;

  secao.classList.add('roda--ativa');
  const marcos = montarDisco(disco, total);
  const seloDoTopo = marcos[0].querySelector('.roda__selo');
  const grausPorPasso = 360 / total;
  const passo = () => Math.round(window.innerHeight * PASSO_NA_TELA);
  let ativo = -1;
  let trocaNumero = null;
  const roda = { secao, irPara, desmontar, total, passo, travada: false, gatilho: null };

  // O número do topo da roda não pode encostar no cabeçalho. No celular, o
  // título e a nota ocupam a largura toda (e crescem com o texto): a roda
  // desce o quanto for preciso. Só conta o que está na faixa do meio, por
  // onde o número passa (no desktop, o título e a nota ficam dos lados).
  function abrirEspacoNoTopo() {
    secao.style.removeProperty('--roda-desce');
    const p = palco.getBoundingClientRect();
    const meio = p.left + p.width / 2;
    const faixa = seloDoTopo.offsetWidth / 2 + FOLGA;
    let base = 0;
    for (const el of cabecalho.children) {
      const r = el.getBoundingClientRect();
      if (r.height && r.left < meio + faixa && r.right > meio - faixa) base = Math.max(base, r.bottom - p.top);
    }
    // Topo do número no alto da roda (o offsetTop não muda com a rotação).
    const desce = Math.ceil(base + FOLGA - (disco.offsetTop + seloDoTopo.offsetTop));
    if (desce > 0) secao.style.setProperty('--roda-desce', `${desce}px`);
  }

  // O texto do passo cabe acima do pé da tela? (Os itens ficam todos no
  // mesmo lugar: vale o mais alto.)
  function cabeNaTela() {
    const lista = itens[0].parentElement;
    const fundo = Math.max(...itens.map((item) => item.offsetTop + item.offsetHeight));
    return lista.offsetTop + fundo + FOLGA <= palco.clientHeight;
  }

  // Antes de cada refresh: o espaço no topo e o percurso, que tem um passo
  // por item (menos o primeiro).
  function medir() {
    abrirEspacoNoTopo();
    percurso.style.height = `${(total - 1) * passo()}px`;
  }

  // Volta à lista: tela baixa demais ou o aparelho deitou (ver COM_RODA).
  function desmontar() {
    ScrollTrigger.removeEventListener('refreshInit', medir);
    roda.gatilho?.kill();
    trocaNumero?.kill();
    const animados = [disco, numero, ...itens].filter(Boolean);
    gsap.killTweensOf(animados);
    gsap.set(animados, { clearProps: 'all' });
    secao.classList.remove('roda--ativa');
    secao.style.removeProperty('--roda-desce');
    percurso.style.removeProperty('height');
    disco.replaceChildren();
    itens.forEach((item) => item.classList.remove('esta-ativo'));
    if (numero) numero.textContent = '01';
  }

  abrirEspacoNoTopo();
  if (!cabeNaTela()) {
    desmontar();
    return null;
  }
  // O total do contador ("/ 06") sai da lista, como a roda.
  if (totalNoContador) totalNoContador.textContent = `/ ${String(total).padStart(2, '0')}`;
  gsap.set(itens, { opacity: 0 });

  function trocarNumero(i, subindo) {
    const texto = String(i + 1).padStart(2, '0');
    trocaNumero?.kill();
    trocaNumero = gsap
      .timeline()
      .to(numero, { yPercent: subindo ? -110 : 110, duration: dur.rapida, ease: ease.cortina })
      .add(() => {
        numero.textContent = texto;
      })
      .fromTo(numero, { yPercent: subindo ? 110 : -110 }, { yPercent: 0, duration: dur.media, ease: ease.saida });
  }

  function irPara(i, { imediato = false } = {}) {
    const alvo = gsap.utils.clamp(0, total - 1, i);
    if (alvo === ativo) return;
    const anterior = ativo;
    ativo = alvo;
    marcos.forEach((marco, j) => marco.classList.toggle('esta-ativo', j === alvo));
    itens.forEach((item, j) => item.classList.toggle('esta-ativo', j === alvo));
    gsap.to(disco, { rotation: -alvo * grausPorPasso, duration: imediato ? 0 : dur.lenta, ease: ease.cortina, overwrite: true });
    if (imediato || anterior < 0) {
      gsap.set(itens, { opacity: 0, y: 0 });
      gsap.set(itens[alvo], { opacity: 1 });
      if (numero) numero.textContent = String(alvo + 1).padStart(2, '0');
      return;
    }
    gsap.to(itens[anterior], { opacity: 0, y: -14, duration: dur.rapida, ease: ease.suave, overwrite: true });
    gsap.fromTo(
      itens[alvo],
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: dur.media, ease: ease.saida, delay: dur.rapida * 0.6, overwrite: true },
    );
    if (numero) trocarNumero(alvo, alvo > anterior);
  }

  medir();
  ScrollTrigger.addEventListener('refreshInit', medir);

  roda.gatilho = ScrollTrigger.create({
    trigger: secao,
    start: 'top top',
    end: () => `+=${(total - 1) * passo()}`,
    onUpdate: (self) => {
      // Durante o passo travado, quem manda é o gesto (a roda já foi ao alvo).
      if (!roda.travada) irPara(Math.round(self.progress * (total - 1)));
    },
    onRefresh: (self) => irPara(Math.round(self.progress * (total - 1)), { imediato: ativo < 0 }),
    // Toque: ao parar, encaixa no passo seguinte na direção do gesto.
    snap: temMouse
      ? false
      : {
          snapTo: 1 / (total - 1),
          directional: true,
          delay: 0.06,
          duration: { min: 0.2, max: dur.media },
          ease: ease.cortina,
        },
  });
  irPara(0, { imediato: true });
  return roda;
}

// ---- Mouse e trackpad: um gesto, um passo ----------------------------------
const gesto = { ultimo: -Infinity, delta: 0, sentido: 0, passoEm: -Infinity, usado: false };
let travada = false;
let seguranca = null;

const curvaDoPasso = () => gsap.parseEase(ease.cortina);

function engolir(evento) {
  if (evento.cancelable) evento.preventDefault();
  return false;
}

// Este evento começa um gesto novo? (Ver as constantes no topo.)
function ehGestoNovo(agora, deltaY) {
  const delta = Math.abs(deltaY);
  const pausa = agora - gesto.ultimo > PAUSA_ENTRE_GESTOS;
  const virou = Math.sign(deltaY) !== gesto.sentido && delta >= DELTA_PARA_VIRAR;
  const anterior = gesto.delta;
  gesto.ultimo = agora;
  gesto.delta = delta;
  gesto.sentido = Math.sign(deltaY);
  if (pausa || virou || !gesto.usado) return true;
  if (travada) return false;
  const acelerou = delta > Math.max(anterior, 4) * ACELERACAO;
  const girandoFirme = delta >= DELTA_FIRME && delta >= anterior * 0.9 && agora - gesto.passoEm > GIRO_CONTINUO;
  return acelerou || girandoFirme;
}

function aoRolar({ deltaY, event: evento }) {
  if (!evento.type.includes('wheel') || Math.abs(deltaY) < 1) return true;
  if (!obterLenis()) return true;
  const agora = performance.now();
  // O resto (ou a inércia) do gesto que já deu um passo.
  if (!ehGestoNovo(agora, deltaY)) return engolir(evento);
  gesto.usado = false;
  if (!darPasso(Math.sign(deltaY), deltaY)) return true;
  gesto.usado = true;
  gesto.passoEm = agora;
  return engolir(evento);
}

// ---- Teclado: Page Down, Page Up e Espaço andam um passo por vez -----------
// Uma tela inteira de rolagem pularia passos. (As setas já andam pouco.)
const TECLAS = { PageDown: 1, PageUp: -1, ' ': 1 };
// Quem usa essas teclas para outra coisa (digitar, apertar, mexer no slider).
const USAM_AS_TECLAS = 'input, textarea, select, button, summary, [contenteditable], [role="slider"]';

function aoTeclar(e) {
  const sentido = e.key === ' ' && e.shiftKey ? -1 : TECLAS[e.key];
  if (!sentido || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target instanceof Element && e.target.closest(USAM_AS_TECLAS)) return;
  // O deslocamento é o de uma tela, como o do navegador: serve para notar
  // que a tecla entraria na roda.
  if (darPasso(sentido, sentido * window.innerHeight * 0.85)) e.preventDefault();
}

// Anda um passo na roda em que a rolagem está (ou na que ela vai entrar com
// este deslocamento). Devolve false quando a rolagem deve seguir normal:
// fora das rodas, ou saindo antes do primeiro ou depois do último passo.
function darPasso(direcao, deslocamento) {
  const lenis = obterLenis();
  if (!lenis) return false;
  const posicao = lenis.targetScroll;
  for (const roda of rodas) {
    const { start: inicio, end: fim } = roda.gatilho;
    const passo = roda.passo();
    const dentro = posicao >= inicio - 2 && posicao <= fim + 2;
    const entrando =
      (direcao > 0 && posicao < inicio && posicao + deslocamento >= inicio) ||
      (direcao < 0 && posicao > fim && posicao + deslocamento <= fim);
    if (!dentro && !entrando) continue;

    let alvo;
    if (entrando) alvo = direcao > 0 ? 0 : roda.total - 1;
    else {
      const agoraNaRoda = (posicao - inicio) / passo;
      alvo = direcao > 0 ? Math.floor(agoraNaRoda + 0.02) + 1 : Math.ceil(agoraNaRoda - 0.02) - 1;
    }
    // Para fora da roda (antes do primeiro ou depois do último): rola normal.
    if (alvo < 0 || alvo > roda.total - 1) return false;

    travada = roda.travada = true;
    const soltar = () => {
      clearTimeout(seguranca);
      travada = roda.travada = false;
    };
    // Um passo novo pode chegar antes do anterior terminar (gestos curtos e
    // separados): uma trava só, renovada a cada passo.
    clearTimeout(seguranca);
    seguranca = setTimeout(soltar, LIMITE_DA_TRAVA);
    roda.irPara(alvo);
    lenis.scrollTo(inicio + alvo * passo, {
      duration: dur.cortina,
      easing: curvaDoPasso(),
      lock: true,
      force: true,
      onComplete: soltar,
    });
    return true;
  }
  return false;
}

export function iniciarRodas() {
  const secoes = document.querySelectorAll('[data-roda]');
  if (reduzMovimento || !secoes.length) return;
  // Ao girar o aparelho, o matchMedia desfaz ou refaz as rodas (e o
  // ScrollTrigger recalcula a página em seguida).
  gsap.matchMedia().add(COM_RODA, () => {
    secoes.forEach((secao) => {
      const roda = criarRoda(secao);
      if (roda) rodas.push(roda);
    });
    return () => {
      rodas.splice(0).forEach((roda) => roda.desmontar());
      clearTimeout(seguranca);
      travada = false;
    };
  });
  if (temMouse) interceptarRoda(aoRolar);
  document.addEventListener('keydown', aoTeclar);
  // Só no desenvolvimento: trechos e passo atual, para os scripts de verificação.
  if (import.meta.env.DEV) {
    window.__rodas = () =>
      rodas.map((r) => ({
        id: r.secao.id,
        inicio: Math.round(r.gatilho.start),
        fim: Math.round(r.gatilho.end),
        passo: r.passo(),
        total: r.total,
        ativo: [...r.secao.querySelectorAll('.roda__marco')].findIndex((m) => m.classList.contains('esta-ativo')),
        travada: r.travada,
      }));
  }
}

// ---------------------------------------------------------------------------
// Roda (experiência e consulta), no estilo da LAVA dental.
// O palco fica fixo (sticky) e cada passo gira a roda: o número seguinte
// chega ao topo, o texto dele aparece embaixo e o contador rola.
//  - Mouse ou trackpad: um gesto de rolagem = um passo. A roda do mouse passa
//    por aqui antes do Lenis (interceptarRoda): o gesto é engolido e a página
//    anda exatamente até o passo seguinte. No primeiro e no último passo, o
//    gesto para fora da roda segue a rolagem normal.
//  - Toque: a página rola livre e, quando para, encaixa no passo seguinte na
//    direção do gesto (snap direcional do ScrollTrigger).
//  - Teclado e barra de rolagem: a roda acompanha a posição, passo a passo.
// Com movimento reduzido (ou sem JavaScript), fica a lista numerada.
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
// Rede de segurança: a trava se solta sozinha depois disto (ms), mesmo se o
// scroll do passo for interrompido (por uma âncora, por exemplo).
const LIMITE_DA_TRAVA = 1600;

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
  const disco = secao.querySelector('[data-roda-disco]');
  const percurso = secao.querySelector('[data-roda-percurso]');
  const numero = secao.querySelector('[data-roda-atual]');
  const total = itens.length;
  if (total < 2 || !disco || !percurso) return null;

  secao.classList.add('roda--ativa');
  const marcos = montarDisco(disco, total);
  const grausPorPasso = 360 / total;
  const passo = () => Math.round(window.innerHeight * PASSO_NA_TELA);
  let ativo = -1;
  let trocaNumero = null;
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

  const roda = { irPara, total, passo, travada: false, gatilho: null };

  // Antes de cada refresh: o percurso tem um passo por item (menos o primeiro).
  const medir = () => {
    percurso.style.height = `${(total - 1) * passo()}px`;
  };
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
const gesto = { ultimo: -Infinity, delta: 0, passoEm: -Infinity, usado: false };
let travada = false;
let seguranca = null;

const curvaDoPasso = () => gsap.parseEase(ease.cortina);

function engolir(evento) {
  if (evento.cancelable) evento.preventDefault();
  return false;
}

// Este evento começa um gesto novo? (Ver as constantes no topo.)
function ehGestoNovo(agora, delta) {
  const pausa = agora - gesto.ultimo > PAUSA_ENTRE_GESTOS;
  const anterior = gesto.delta;
  gesto.ultimo = agora;
  gesto.delta = delta;
  if (pausa || !gesto.usado) return true;
  if (travada) return false;
  const acelerou = delta > Math.max(anterior, 4) * ACELERACAO;
  const girandoFirme = delta >= DELTA_FIRME && delta >= anterior * 0.9 && agora - gesto.passoEm > GIRO_CONTINUO;
  return acelerou || girandoFirme;
}

function aoRolar({ deltaY, event: evento }) {
  if (!evento.type.includes('wheel') || Math.abs(deltaY) < 1) return true;
  const lenis = obterLenis();
  if (!lenis) return true;
  const agora = performance.now();
  // O resto (ou a inércia) do gesto que já deu um passo.
  if (!ehGestoNovo(agora, Math.abs(deltaY))) return engolir(evento);
  gesto.usado = false;

  const posicao = lenis.targetScroll;
  const direcao = Math.sign(deltaY);
  for (const roda of rodas) {
    const { start: inicio, end: fim } = roda.gatilho;
    const passo = roda.passo();
    const dentro = posicao >= inicio - 2 && posicao <= fim + 2;
    const entrando =
      (direcao > 0 && posicao < inicio && posicao + deltaY >= inicio) ||
      (direcao < 0 && posicao > fim && posicao + deltaY <= fim);
    if (!dentro && !entrando) continue;

    let alvo;
    if (entrando) alvo = direcao > 0 ? 0 : roda.total - 1;
    else {
      const agoraNaRoda = (posicao - inicio) / passo;
      alvo = direcao > 0 ? Math.floor(agoraNaRoda + 0.02) + 1 : Math.ceil(agoraNaRoda - 0.02) - 1;
    }
    // Para fora da roda (antes do primeiro ou depois do último): rola normal.
    if (alvo < 0 || alvo > roda.total - 1) return true;

    gesto.usado = true;
    gesto.passoEm = agora;
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
    return engolir(evento);
  }
  return true;
}

export function iniciarRodas() {
  if (reduzMovimento) return;
  document.querySelectorAll('[data-roda]').forEach((secao) => {
    const roda = criarRoda(secao);
    if (roda) {
      roda.secao = secao;
      rodas.push(roda);
    }
  });
  if (rodas.length && temMouse) interceptarRoda(aoRolar);
  // Só no desenvolvimento: trechos e passo atual, para os scripts de verificação.
  if (import.meta.env.DEV) {
    window.__rodas = () =>
      rodas.map((r) => ({
        id: r.secao.id,
        inicio: Math.round(r.gatilho.start),
        fim: Math.round(r.gatilho.end),
        passo: r.passo(),
        ativo: [...r.secao.querySelectorAll('.roda__marco')].findIndex((m) => m.classList.contains('esta-ativo')),
        travada: r.travada,
      }));
  }
}

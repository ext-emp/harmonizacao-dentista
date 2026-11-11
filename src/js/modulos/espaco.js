// ---------------------------------------------------------------------------
// O espaço: galeria com scroll lateral, no estilo da LAVA dental.
// O palco fica fixo (sticky, no CSS) e, preso ao scroll:
//  1. o trilho anda para a esquerda até a última foto chegar ao centro;
//  2. o recorte da última foto abre até a tela cheia, a foto assenta e o véu
//     escurece: ela vira o fundo do manifesto, que sobe por cima dela.
// Na tela larga, o trilho já anda enquanto o palco sobe. No celular e no
// tablet em pé, as fotos não sobem pela tela: ficam invisíveis enquanto o
// palco sobe, aparecem (fade) paradas no meio da tela, com a primeira no
// centro da largura, e só então o trilho anda.
// As proporções das fases são fixas; a altura do percurso (quanto scroll a
// galeria usa) é recalculada a cada refresh, para o trilho andar mais ou
// menos no ritmo da mão. Com movimento reduzido, nada disso: a galeria é uma
// faixa com scroll lateral nativo.
// ---------------------------------------------------------------------------
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { layoutLargo, reduzMovimento } from '../core/ambiente.js';

// Fatias do trecho de scroll: trilho andando, foto abrindo e uma pausa no fim.
const FASE_TRILHO = 0.72;
const FASE_FUNDO = 0.24;
// O trilho começa com o primeiro cartão a partir desta fração da largura.
const INICIO_NA_TELA = 0.5;
// A abertura da foto usa pelo menos esta fração da altura da tela em scroll.
const FUNDO_MINIMO = 0.8;
// Celular: scroll (fração da altura da tela) em que as fotos aparecem, já
// paradas no meio da tela.
const APARECER = 0.35;

export function iniciarEspaco() {
  const secao = document.querySelector('[data-espaco]');
  if (!secao || reduzMovimento) return;

  const palco = secao.querySelector('[data-espaco-palco]');
  const trilho = secao.querySelector('[data-espaco-trilho]');
  const percurso = secao.querySelector('[data-espaco-percurso]');
  const fundo = secao.querySelector('[data-espaco-fundo]');
  const imagem = secao.querySelector('[data-espaco-fundo-imagem]');
  const veu = secao.querySelector('[data-espaco-veu]');
  secao.classList.add('espaco--animado');

  // Frações da fase do trilho (celular): até "surge", o palco sobe com as
  // fotos invisíveis; de "surge" a "espera", elas aparecem paradas; depois,
  // o trilho anda. Na tela larga, as duas são 0.
  const m = { x0: 0, x1: 0, topo: 0, lado: 0, surge: 0, espera: 0 };

  // Antes de cada refresh: posições do trilho, recorte do cartão e a altura
  // do percurso (que muda a posição de tudo o que vem depois).
  function medir() {
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    const sobeParado = !layoutLargo.matches;
    // O cartão da última foto tem o tamanho do primeiro (os dois são 3:2).
    const cartao = trilho.firstElementChild.getBoundingClientRect();
    m.x0 = sobeParado ? (largura - cartao.width) / 2 : largura * INICIO_NA_TELA;
    m.x1 = -fundo.offsetLeft;
    m.topo = Math.max(0, (altura - cartao.height) / 2);
    m.lado = Math.max(0, (largura - cartao.width) / 2);
    // No celular, a subida (uma tela) e o aparecer entram no trecho do
    // trilho sem tirar o ritmo dele: o trilho anda o mesmo tanto, no mesmo scroll.
    const subida = sobeParado ? altura : 0;
    const aparecer = sobeParado ? altura * APARECER : 0;
    const total = Math.max((m.x0 - m.x1 + subida + aparecer) / FASE_TRILHO, (altura * FUNDO_MINIMO) / FASE_FUNDO);
    m.surge = subida / (total * FASE_TRILHO);
    m.espera = (subida + aparecer) / (total * FASE_TRILHO);
    // O trecho começa quando o palco entra por baixo (uma tela antes de fixar).
    percurso.style.height = `${Math.round(Math.max(altura * 0.5, total - altura))}px`;
  }

  // Trilho: parado até o fim da espera; depois, linear (preso ao scroll).
  const depoisDaEspera = (t) => Math.max(0, (t - m.espera) / (1 - m.espera));
  // Fotos: invisíveis até "surge", aparecem até "espera" (na tela larga, sempre à vista).
  const aparecendo = (t) => (m.espera <= 0 ? 1 : Math.min(1, Math.max(0, (t - m.surge) / (m.espera - m.surge))));

  medir();
  ScrollTrigger.addEventListener('refreshInit', medir);

  const recorte = () => `inset(${m.topo}px ${m.lado}px ${m.topo}px ${m.lado}px)`;

  gsap
    .timeline({
      // Preso ao scroll: linear, quem dá o ritmo é a mão.
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: palco,
        start: 'top bottom',
        endTrigger: percurso,
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
      },
    })
    .fromTo(trilho, { x: () => m.x0 }, { x: () => m.x1, duration: FASE_TRILHO, ease: depoisDaEspera }, 0)
    .fromTo(trilho, { opacity: 0 }, { opacity: 1, duration: FASE_TRILHO, ease: aparecendo }, 0)
    .fromTo(fundo, { clipPath: recorte }, { clipPath: 'inset(0px 0px 0px 0px)', duration: FASE_FUNDO }, FASE_TRILHO)
    .fromTo(imagem, { scale: 1.1 }, { scale: 1, duration: FASE_FUNDO }, FASE_TRILHO)
    .fromTo(veu, { opacity: 0 }, { opacity: 1, duration: FASE_FUNDO }, FASE_TRILHO)
    // Pausa curta com a foto já em tela cheia, antes do manifesto subir.
    .to({}, { duration: 1 - FASE_TRILHO - FASE_FUNDO });
}

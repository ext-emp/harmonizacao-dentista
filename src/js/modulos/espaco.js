// ---------------------------------------------------------------------------
// O espaço: galeria com scroll lateral, no estilo da LAVA dental.
// O palco fica fixo (sticky, no CSS) e, preso ao scroll:
//  1. o trilho anda para a esquerda até a última foto chegar ao centro;
//  2. o recorte da última foto abre até a tela cheia, a foto assenta e o véu
//     escurece: ela vira o fundo do manifesto, que sobe por cima dela.
// Na tela larga, o trilho já anda enquanto o palco sobe. No celular e no
// tablet em pé, as fotos não sobem pela tela: o palco fica atrás da abertura
// (.espaco--sobreposto, em espaco.css) e sobe com ela por cima do hero, com o
// trilho fora da tela, à direita. Fixo o palco, assim que a frase sai da
// faixa do meio da tela (sem encostar nas fotos), o trilho entra pela direita
// e segue andando. Antes, as fotos esperavam o palco subir uma tela inteira,
// e a tela ficava toda preta nesse trecho.
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
// Celular: px entre o pé da frase e o alto das fotos quando elas começam a entrar.
const FOLGA_DA_FRASE = 24;

export function iniciarEspaco() {
  const secao = document.querySelector('[data-espaco]');
  if (!secao || reduzMovimento) return;

  const palco = secao.querySelector('[data-espaco-palco]');
  const abertura = secao.querySelector('.espaco__abertura');
  const frase = secao.querySelector('.espaco__frase');
  const trilho = secao.querySelector('[data-espaco-trilho]');
  const percurso = secao.querySelector('[data-espaco-percurso]');
  const fundo = secao.querySelector('[data-espaco-fundo]');
  const imagem = secao.querySelector('[data-espaco-fundo-imagem]');
  const veu = secao.querySelector('[data-espaco-veu]');
  secao.classList.add('espaco--animado');

  // Fração da fase do trilho em que ele começa a andar (celular): antes
  // disso, o palco sobe com a abertura e espera a frase sair do meio. Na tela
  // larga, 0.
  const m = { x0: 0, x1: 0, topo: 0, lado: 0, espera: 0 };

  // Antes de cada refresh: posições do trilho, recorte do cartão e a altura
  // do percurso (que muda a posição de tudo o que vem depois).
  function medir() {
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    const celular = !layoutLargo.matches;
    secao.classList.toggle('espaco--sobreposto', celular);
    // O cartão da última foto tem o tamanho do primeiro (os dois são 3:2).
    const cartao = trilho.firstElementChild.getBoundingClientRect();
    // Celular: o primeiro cartão começa logo depois da borda direita da tela.
    m.x0 = celular ? largura : largura * INICIO_NA_TELA;
    m.x1 = -fundo.offsetLeft;
    m.topo = Math.max(0, (altura - cartao.height) / 2);
    m.lado = Math.max(0, (largura - cartao.width) / 2);
    // Celular: a subida (uma tela, junto com a abertura) e a espera pela
    // frase entram no trecho do trilho sem tirar o ritmo dele. A espera é o
    // scroll, depois de o palco fixar, até o pé da frase passar do alto das
    // fotos (as duas medidas a partir do topo da seção, que é o da tela).
    const subida = celular ? altura : 0;
    const peDaFrase = abertura.offsetTop + frase.offsetTop + frase.offsetHeight;
    const espera = celular ? Math.max(0, peDaFrase + FOLGA_DA_FRASE - m.topo) : 0;
    const total = Math.max((m.x0 - m.x1 + subida + espera) / FASE_TRILHO, (altura * FUNDO_MINIMO) / FASE_FUNDO);
    m.espera = (subida + espera) / (total * FASE_TRILHO);
    // O trecho começa quando o palco entra por baixo (uma tela antes de fixar).
    percurso.style.height = `${Math.round(Math.max(altura * 0.5, total - altura))}px`;
  }

  // Trilho: parado até o fim da espera; depois, linear (preso ao scroll).
  const depoisDaEspera = (t) => Math.max(0, (t - m.espera) / (1 - m.espera));

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
    .fromTo(fundo, { clipPath: recorte }, { clipPath: 'inset(0px 0px 0px 0px)', duration: FASE_FUNDO }, FASE_TRILHO)
    .fromTo(imagem, { scale: 1.1 }, { scale: 1, duration: FASE_FUNDO }, FASE_TRILHO)
    .fromTo(veu, { opacity: 0 }, { opacity: 1, duration: FASE_FUNDO }, FASE_TRILHO)
    // Pausa curta com a foto já em tela cheia, antes do manifesto subir.
    .to({}, { duration: 1 - FASE_TRILHO - FASE_FUNDO });
}

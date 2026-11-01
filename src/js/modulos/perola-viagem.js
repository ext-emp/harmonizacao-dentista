// ---------------------------------------------------------------------------
// Viagem da pérola: do hero para a abertura do "O espaço".
// O hero fica preso (pilha.js) enquanto o "O espaço" sobe por cima dele. A
// pérola fica no lugar dela, deixando a seção escura subir em volta; depois
// sobe junto e pousa acima da frase de abertura, crescendo um pouco e rolando
// no caminho. Daí em diante, rola com a página.
// Para depois do pouso ela andar com o scroll nativo (sem atraso no toque), a
// pérola passa a morar no ponto de pouso; antes de pousar, um deslocamento a
// leva até o lugar dela no hero. Tudo preso ao scroll, nos dois sentidos.
// As posições vêm do CSS (.perola-lugar e .perola-pouso); aqui só se mede e
// interpola. Com movimento reduzido (ou sem JavaScript), a pérola fica parada
// no hero, no HTML original.
// ---------------------------------------------------------------------------
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { ease } from '../core/tokens.js';
import { reduzMovimento } from '../core/ambiente.js';

// Fração do giro de um rolamento de verdade (distância / raio). Em 1, a
// pérola giraria como uma bola no chão; menos que isso deixa o giro calmo.
const ROLAMENTO = 0.3;
// A pérola ocupa uns 65% do quadro (margem transparente para a deformação).
const PEROLA_NO_QUADRO = 0.65;

// Largura (px de tela) da troca entre "esperando no hero" e "subindo com o pouso".
const SUAVIZACAO = 160;

const limitar = gsap.utils.clamp(0, 1);

// Mínimo suave: igual ao menor dos dois longe do cruzamento; perto dele, a
// troca é gradual (a velocidade não dá tranco). Nunca passa do menor dos dois.
function minimoSuave(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

// Centro da caixa em relação ao topo e à esquerda de outra (o par mede igual
// com ou sem pin, porque os dois se movem juntos).
function centroRelativo(el, referencia) {
  const r = el.getBoundingClientRect();
  const b = referencia.getBoundingClientRect();
  return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top, esquerda: b.left };
}

/**
 * @returns {{ definirPerola(perola: object): void }} liga a pérola 3D quando ela carregar
 */
export function iniciarViagemDaPerola() {
  let perola3d = null;
  let giro = { x: 0, y: 0, progresso: 0 };
  const controle = {
    definirPerola(perola) {
      perola3d = perola;
      perola.definirGiro(giro);
    },
  };

  const hero = document.querySelector('[data-hero]');
  const lugar = document.querySelector('[data-perola-lugar]');
  const viagem = document.querySelector('[data-perola-viagem]');
  const pouso = document.querySelector('[data-perola-pouso]');
  const destino = pouso?.closest('[data-espaco]');
  if (!hero || !lugar || !viagem || !pouso || !destino || reduzMovimento) return controle;

  // A pérola passa a morar no pouso.
  pouso.append(viagem);

  const curva = gsap.parseEase(ease.deslize);
  const definirX = gsap.quickSetter(viagem, 'x', 'px');
  const definirY = gsap.quickSetter(viagem, 'y', 'px');
  // "scale" é um atalho que o quickSetter não aceita: um para cada eixo.
  const definirEscalaX = gsap.quickSetter(viagem, 'scaleX');
  const definirEscalaY = gsap.quickSetter(viagem, 'scaleY');
  let m = null;

  // Mede partida, pouso e tamanhos depois de cada refresh do ScrollTrigger.
  function medir(gatilho) {
    // A caixa real é a maior das duas medidas: o canvas é desenhado nesse
    // tamanho e só encolhe por escala (ampliar deixaria a pérola borrada).
    viagem.style.removeProperty('--perola-caixa');
    const quadro = viagem.offsetWidth;
    const quadroPouso = pouso.offsetWidth;
    const caixa = Math.max(quadro, quadroPouso, 1);
    viagem.style.setProperty('--perola-caixa', `${caixa}px`);

    const noHero = centroRelativo(lugar, hero);
    const noDestino = centroRelativo(pouso, destino);
    m = {
      inicio: gatilho.start,
      fim: gatilho.end,
      // O hero preso pela pilha só começa a ficar parado quando o pé dele
      // chega ao pé da tela (hero mais alto que a tela, em celulares baixos).
      heroPreso: hero.classList.contains('pilha--ativa'),
      heroSobra: Math.max(0, hero.offsetHeight - window.innerHeight),
      lugarX: noHero.x + noHero.esquerda,
      lugarY: noHero.y,
      pousoX: noDestino.x + noDestino.esquerda,
      pousoY: noDestino.y,
      escalaInicio: quadro / caixa,
      escalaPouso: quadroPouso / caixa,
      raio: (caixa * PEROLA_NO_QUADRO) / 2,
    };
  }

  function aplicar(rolagem) {
    if (!m) return;
    // Fora do trecho da viagem nada muda: antes, a pérola anda com o hero;
    // depois, com o pouso (nos dois casos, o deslocamento fica constante).
    const r = Math.min(Math.max(rolagem, m.inicio), m.fim);
    const p = limitar((r - m.inicio) / Math.max(1, m.fim - m.inicio));
    // Começa e termina sem tranco: parada no hero e no ritmo da página no pouso.
    const w = curva(p);
    // Posições na tela: o lugar no hero (preso ou não) e o pouso (sobe com a página).
    const topoHero = m.heroPreso ? -Math.min(r, m.heroSobra) : -r;
    const partidaY = topoHero + m.lugarY;
    const chegadaY = m.fim - r + m.pousoY;
    // Na vertical, a pérola espera no lugar dela até o pouso chegar e então
    // sobe junto com ele: assim nunca fica para trás, por cima da frase.
    const telaY = minimoSuave(partidaY, chegadaY, SUAVIZACAO);
    // A pérola mora no pouso: o deslocamento é o que falta para ela estar ali.
    const x = (m.lugarX - m.pousoX) * (1 - w);
    const y = telaY - chegadaY;
    const escala = m.escalaInicio + (m.escalaPouso - m.escalaInicio) * w;
    definirX(x);
    definirY(y);
    definirEscalaX(escala);
    definirEscalaY(escala);
    // Rola pelo caminho feito na tela: para o lado gira em y; subindo, em x.
    const andouX = (m.pousoX - m.lugarX) * w;
    const andouY = telaY - partidaY;
    giro = { x: (andouY / m.raio) * ROLAMENTO, y: (andouX / m.raio) * ROLAMENTO, progresso: p };
    perola3d?.definirGiro(giro);
  }

  ScrollTrigger.create({
    trigger: destino,
    start: 'top bottom',
    end: 'top top',
    onUpdate: (self) => aplicar(self.scroll()),
    onRefresh: (self) => {
      medir(self);
      aplicar(self.scroll());
    },
  });
  // Só no desenvolvimento: as medidas ficam à mão para os scripts de verificação.
  if (import.meta.env.DEV) window.__perola = { medidas: () => ({ ...m }) };
  return controle;
}

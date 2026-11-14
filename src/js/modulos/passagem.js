// Passagem do hero para "O espaço", no celular (layout do hero escuro, com
// toque): vira um slide. A seção sobe por cima do hero presa ao dedo e, quando
// a rolagem para no meio do caminho, termina sozinha na direção do gesto:
// para baixo, cobre o hero inteiro; para cima, volta ao hero. Assim ninguém
// fica parado com meia tela da abertura vazia (o pedido do usuário em
// 13/11/2026). É o mesmo encaixe do toque na roda (roda.js).
// Na tela larga, com mouse ou com movimento reduzido, a rolagem segue livre.
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { dur, ease } from '../core/tokens.js';
import { reduzMovimento, temMouse } from '../core/ambiente.js';

// O contrário do layoutLargo (ambiente.js): em pé, estreito, ou deitado mas
// alto o bastante para ser tablet. É onde o hero é escuro.
const LAYOUT_CELULAR = '(orientation: portrait), (max-width: 39.999em), (max-width: 63.999em) and (min-height: 31.2501em)';

export function iniciarPassagem() {
  const espaco = document.querySelector('[data-espaco]');
  if (!espaco || reduzMovimento || temMouse) return;
  // Ao girar o aparelho, o matchMedia desfaz ou refaz o encaixe.
  gsap.matchMedia().add(LAYOUT_CELULAR, () => {
    ScrollTrigger.create({
      trigger: espaco,
      start: 'top bottom',
      end: 'top top',
      snap: {
        snapTo: [0, 1],
        directional: true,
        delay: 0.02,
        duration: { min: 0.25, max: dur.media },
        ease: ease.saida,
      },
    });
  });
}

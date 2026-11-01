// Regra do celular: todo efeito de hover tem um equivalente no toque.
// Em aparelhos sem mouse, a classe .is-active liga enquanto o elemento passa
// pela faixa central da tela. O CSS usa a mesma classe.
//   data-toque-centro          faixa de 40% a 60% da altura (blocos, botões)
//   data-toque-centro="linha"  só quem cruza a linha do meio (listas: uma
//                              linha ativa por vez)
// Elementos no fim da página nunca chegam ao centro: nesses, a classe liga
// quando a rolagem chega ao fim.
import { ScrollTrigger } from '../core/gsap.js';
import { temMouse } from '../core/ambiente.js';

const topoNoDocumento = (el) => el.getBoundingClientRect().top + window.scrollY;

export function iniciarToqueCentro(raiz = document) {
  if (temMouse) return;
  raiz.querySelectorAll('[data-toque-centro]').forEach((el) => {
    const [inicio, fim] = el.dataset.toqueCentro === 'linha' ? [0.5, 0.5] : [0.6, 0.4];
    ScrollTrigger.create({
      trigger: el,
      start: () => Math.min(topoNoDocumento(el) - window.innerHeight * inicio, ScrollTrigger.maxScroll(window) - 2),
      end: `bottom ${fim * 100}%`,
      toggleClass: { targets: el, className: 'is-active' },
    });
  });
}

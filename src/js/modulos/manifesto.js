// Manifesto: as palavras do parágrafo acendem conforme o scroll, enquanto ele
// passa pela tela, rolando com a página.
// O parágrafo é dividido em palavras (SplitText) numa cópia visual; o leitor
// de tela continua lendo o texto inteiro, de uma vez, numa cópia escondida.
// Com movimento reduzido, nada é dividido: o texto já aparece aceso.
import { gsap, SplitText } from '../core/gsap.js';
import { reduzMovimento } from '../core/ambiente.js';

/** @param {Promise} fontes */
export function iniciarManifesto(fontes) {
  const paragrafo = document.querySelector('[data-manifesto]');
  if (!paragrafo || reduzMovimento) return;

  fontes.then(() => {
    // Cópia para o leitor de tela + cópia visual (aria-hidden) dividida.
    const leitura = document.createElement('span');
    leitura.className = 'visualmente-oculto';
    leitura.textContent = paragrafo.textContent.replace(/\s+/g, ' ').trim();
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.append(...paragrafo.childNodes);
    paragrafo.append(leitura, visual);

    const acesa = getComputedStyle(paragrafo).color;
    const { words } = SplitText.create(visual, { type: 'words', wordsClass: 'palavra', aria: 'none' });

    // Preso ao scroll (linear), do parágrafo entrando por baixo até passar do
    // meio. Duração e intervalo aqui são proporções do trecho de scroll, não
    // segundos: cada palavra acende em ~1/6 do caminho e várias acendem
    // juntas, como uma frente de luz.
    gsap.to(words, {
      color: acesa,
      ease: 'none',
      duration: 1,
      stagger: 0.12,
      scrollTrigger: { trigger: paragrafo, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });
}

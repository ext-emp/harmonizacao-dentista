// Manifesto: as palavras do parágrafo acendem conforme o scroll.
// O parágrafo é dividido em palavras (SplitText) numa cópia visual; o leitor
// de tela continua lendo o texto inteiro, de uma vez, numa cópia escondida.
// Dentro do "O espaço" animado, o parágrafo fica parado no centro da tela:
// as palavras acendem enquanto as fotos do atendimento sobem por cima, cada
// uma no seu ritmo (data-flutua: 1 = junto com a página; mais = mais rápido).
// Com movimento reduzido, nada é dividido: o texto já aparece aceso.
import { gsap, SplitText } from '../core/gsap.js';
import { reduzMovimento } from '../core/ambiente.js';

function flutuarFotos(secao) {
  gsap.utils.toArray('[data-flutua]', secao).forEach((foto) => {
    const ritmo = Number(foto.dataset.flutua) || 1;
    // Deslocamento extra ao longo da passagem pela tela (metade antes, metade depois).
    const extra = () => ((ritmo - 1) * (window.innerHeight + foto.offsetHeight)) / 2;
    gsap.fromTo(
      foto,
      { y: () => extra() },
      {
        y: () => -extra(),
        // Preso ao scroll: linear.
        ease: 'none',
        scrollTrigger: { trigger: foto, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      },
    );
  });
}

/** @param {Promise} fontes */
export function iniciarManifesto(fontes) {
  const paragrafo = document.querySelector('[data-manifesto]');
  if (!paragrafo || reduzMovimento) return;
  const secao = paragrafo.closest('[data-manifesto-secao]');
  const cena = secao?.querySelector('[data-manifesto-cena]');
  const animado = Boolean(cena && secao.closest('.espaco--animado'));
  if (animado) flutuarFotos(secao);

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

    // Preso ao scroll (linear). Duração e intervalo aqui são proporções do
    // trecho de scroll, não segundos: cada palavra acende em ~1/6 do caminho
    // e várias acendem juntas, como uma frente de luz.
    // Animado: do parágrafo chegando ao centro até ele começar a sair.
    const trecho = animado
      ? { trigger: cena, start: 'top 55%', end: 'bottom bottom' }
      : { trigger: paragrafo, start: 'top 80%', end: 'bottom 45%' };
    gsap.to(words, {
      color: acesa,
      ease: 'none',
      duration: 1,
      stagger: 0.12,
      scrollTrigger: { ...trecho, scrub: true },
    });
  });
}

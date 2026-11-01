// Parallax discreto: a moldura [data-parallax] (um pouco maior que a
// máscara, ver .moldura-parallax) anda dentro da máscara enquanto ela passa
// pela tela. O valor do atributo é o deslocamento em % (padrão 6).
// Desligado com movimento reduzido.
import { gsap } from '../core/gsap.js';
import { reduzMovimento } from '../core/ambiente.js';

export function iniciarParallax() {
  if (reduzMovimento) return;
  gsap.utils.toArray('[data-parallax]').forEach((moldura) => {
    // 6% da moldura (que tem 116% da máscara) ≈ 7% da máscara: cabe na folga de 8%.
    const distancia = Number(moldura.dataset.parallax) || 6;
    gsap.fromTo(
      moldura,
      { yPercent: -distancia },
      {
        yPercent: distancia,
        // Preso ao scroll: linear, quem dá o ritmo é a mão.
        ease: 'none',
        scrollTrigger: { trigger: moldura.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

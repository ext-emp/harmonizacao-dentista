// Botões magnéticos: o botão se inclina na direção do cursor e o texto vai
// um pouco além, dando profundidade. Só em aparelhos com mouse.
import { gsap } from '../core/gsap.js';
import { dur, ease } from '../core/tokens.js';
import { reduzMovimento, temMouse } from '../core/ambiente.js';

export function iniciarMagneticos(raiz = document) {
  if (!temMouse || reduzMovimento) return;

  raiz.querySelectorAll('[data-magnetico]').forEach((el) => {
    const forca = Number(el.dataset.magnetico) || 0.32;
    const interno = el.querySelector('.botao__rolo');
    const opcoes = { duration: dur.media, ease: ease.saida };
    const moverX = gsap.quickTo(el, 'x', opcoes);
    const moverY = gsap.quickTo(el, 'y', opcoes);
    const internoX = interno && gsap.quickTo(interno, 'x', opcoes);
    const internoY = interno && gsap.quickTo(interno, 'y', opcoes);

    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      moverX(dx * forca);
      moverY(dy * forca);
      internoX?.(dx * forca * 0.4);
      internoY?.(dy * forca * 0.4);
    });

    el.addEventListener('pointerleave', () => {
      moverX(0);
      moverY(0);
      internoX?.(0);
      internoY?.(0);
    });
  });
}

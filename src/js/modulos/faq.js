// FAQ: os <details> já abrem e fecham sozinhos (sem JS). Aqui só entra a
// animação de altura. Fechando, o item continua "open" até a animação
// terminar; a classe .esta-fechando vira o ícone de volta para o "+".
// Com movimento reduzido, fica o comportamento nativo.
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { dur, ease } from '../core/tokens.js';
import { reduzMovimento } from '../core/ambiente.js';

export function iniciarFaq() {
  if (reduzMovimento) return;

  // Abrir ou fechar muda a altura da página: recalcula os gatilhos abaixo.
  const recalcular = gsap.delayedCall(dur.rapida, () => ScrollTrigger.refresh()).pause();

  gsap.utils.toArray('[data-faq] details').forEach((item) => {
    const resumo = item.querySelector('summary');
    const resposta = item.querySelector('.faq__resposta');
    if (!resumo || !resposta) return;
    let animacao = null;

    const terminar = () => {
      gsap.set(resposta, { clearProps: 'height' });
      recalcular.restart(true);
    };

    resumo.addEventListener('click', (e) => {
      e.preventDefault();
      const fechando = item.classList.contains('esta-fechando');
      animacao?.kill();

      if (item.open && !fechando) {
        item.classList.add('esta-fechando');
        animacao = gsap.fromTo(
          resposta,
          { height: resposta.offsetHeight },
          {
            height: 0,
            duration: dur.media,
            ease: ease.cortina,
            onComplete: () => {
              item.open = false;
              item.classList.remove('esta-fechando');
              terminar();
            },
          },
        );
        return;
      }

      // Abrindo (ou reabrindo no meio do fechamento, a partir da altura atual).
      const inicio = fechando ? resposta.offsetHeight : 0;
      item.classList.remove('esta-fechando');
      item.open = true;
      animacao = gsap.fromTo(
        resposta,
        { height: inicio },
        { height: 'auto', duration: dur.lenta, ease: ease.saida, onComplete: terminar },
      );
    });
  });
}

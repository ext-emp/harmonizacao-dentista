// Revelações ao entrar na tela, ligadas pelo atributo data-revelar:
//   "subir"   o bloco sobe um pouco e aparece
//   "lista"   os filhos diretos entram em sequência
//   "imagem"  a máscara abre de baixo para cima e a imagem assenta (zoom)
//   "linhas"  título dividido em linhas (SplitText), cada uma sai da máscara
//   "letras"  o mesmo, letra por letra (nome gigante do rodapé)
// Cada uma roda uma vez. Com movimento reduzido, nada é escondido (CSS) e
// este módulo não faz nada.
import { gsap, SplitText } from '../core/gsap.js';
import { dur, ease, sequencia } from '../core/tokens.js';
import { reduzMovimento } from '../core/ambiente.js';

const INICIO = 'top 86%';

const gatilho = (trigger, start = INICIO) => ({ trigger, start, once: true });

// data-revelar-inicio="top 60%" muda o ponto de partida (seções que entram
// por cima de outra, em que o elemento só fica à vista bem depois).
const inicioDe = (el, padrao = INICIO) => el.dataset.revelarInicio || padrao;

function revelarBlocos() {
  gsap.utils.toArray('[data-revelar="subir"]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: dur.lenta, ease: ease.saida, clearProps: 'transform', scrollTrigger: gatilho(el, inicioDe(el)) },
    );
  });

  gsap.utils.toArray('[data-revelar="lista"]').forEach((lista) => {
    gsap.fromTo(
      lista.children,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: dur.lenta,
        ease: ease.saida,
        stagger: sequencia,
        clearProps: 'transform',
        scrollTrigger: gatilho(lista),
      },
    );
  });
}

function revelarImagens() {
  gsap.utils.toArray('[data-revelar="imagem"]').forEach((mascara) => {
    const img = mascara.querySelector('img');
    gsap
      .timeline({ scrollTrigger: gatilho(mascara, 'top 90%') })
      .fromTo(
        mascara,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: dur.longa,
          ease: ease.cortina,
          // "none" explícito: limpar o estilo faria valer de novo o estado
          // inicial do CSS (máscara fechada).
          onComplete: () => gsap.set(mascara, { clipPath: 'none' }),
        },
      )
      .fromTo(img, { scale: 1.18 }, { scale: 1, duration: dur.longa * 1.3, ease: ease.saida, clearProps: 'transform' }, 0);
  });
}

// Títulos: precisam das fontes carregadas para medir as linhas de verdade.
// autoSplit refaz a divisão no resize e mantém a animação no mesmo ponto.
function revelarTextos() {
  gsap.utils.toArray('[data-revelar="linhas"]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'linha',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 118,
          duration: dur.longa,
          ease: ease.saida,
          stagger: sequencia * 1.5,
          scrollTrigger: gatilho(el, inicioDe(el)),
        }),
    });
    gsap.set(el, { visibility: 'visible' });
  });

  gsap.utils.toArray('[data-revelar="letras"]').forEach((el) => {
    SplitText.create(el, {
      type: 'chars',
      mask: 'chars',
      charsClass: 'letra',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.chars, {
          yPercent: 105,
          duration: dur.longa,
          ease: ease.saida,
          stagger: sequencia * 0.5,
          scrollTrigger: gatilho(el, 'top 92%'),
        }),
    });
    gsap.set(el, { visibility: 'visible' });
  });
}

/** @param {Promise} fontes resolvida quando as fontes chegam (ou no limite) */
export function iniciarRevelacoes(fontes) {
  if (reduzMovimento) return;
  revelarBlocos();
  revelarImagens();
  // Os gatilhos dos títulos medem a posição deles ao nascer; o main.js
  // recalcula a página inteira logo depois (fontes.then registrado depois).
  fontes.then(revelarTextos);
}

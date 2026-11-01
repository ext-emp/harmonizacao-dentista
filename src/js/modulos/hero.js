// Hero: entrada do título linha a linha (SplitText com máscara), do retrato
// (máscara abrindo de baixo para cima) e da pérola. O movimento da pérola
// com o scroll fica em perola-viagem.js.
import { gsap, SplitText } from '../core/gsap.js';
import { dur, ease, sequencia } from '../core/tokens.js';
import { reduzMovimento } from '../core/ambiente.js';

const hero = document.querySelector('[data-hero]');

// Chamado quando a cortina do preloader começa a subir (ou logo, sem preloader).
// Precisa das fontes carregadas: o SplitText mede as linhas reais.
export function revelarHero() {
  if (!hero) return;
  const titulo = hero.querySelector('[data-hero-titulo]');
  const entram = hero.querySelectorAll('[data-hero-entra]');
  // A pérola pode ter saído do hero (perola-viagem.js a move para o pouso).
  const palco = document.querySelector('[data-hero-palco]');
  const retrato = hero.querySelector('[data-hero-retrato]');

  if (reduzMovimento) {
    gsap.set(titulo, { visibility: 'visible' });
    gsap.to([...entram, retrato], { opacity: 1, duration: dur.rapida, ease: ease.suave });
    return;
  }

  // autoSplit refaz as linhas no resize; o onSplit devolve a animação para
  // o SplitText mantê-la no mesmo ponto depois de refazer.
  SplitText.create(titulo, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'linha',
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, { yPercent: 118, duration: dur.longa, ease: ease.saida, stagger: sequencia * 1.5 }),
  });
  gsap.set(titulo, { visibility: 'visible' });

  // Retrato: máscara abrindo de baixo para cima, com um leve zoom assentando.
  const img = retrato.querySelector('img');
  gsap.set(retrato, { opacity: 1 });
  gsap.fromTo(retrato, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: dur.longa, ease: ease.cortina, clearProps: 'clipPath' });
  gsap.fromTo(img, { scale: 1.08, yPercent: 4 }, { scale: 1, yPercent: 0, duration: dur.longa * 1.2, ease: ease.saida });

  gsap.fromTo(
    entram,
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: dur.lenta, ease: ease.saida, stagger: sequencia, delay: dur.media * 0.7 },
  );
  // A pérola entra por último, crescendo um pouco. (O palco é filho do
  // elemento que viaja com o scroll: as duas animações não se misturam.)
  gsap.fromTo(palco, { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: dur.longa * 1.25, ease: ease.saida, delay: dur.media });
}

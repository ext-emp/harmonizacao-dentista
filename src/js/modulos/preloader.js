// Preloader: desenha o monograma e conta de 0 a 100; depois sai como
// cortina (com a borda de baixo curvando) e revela o hero.
// Só roda na primeira visita da sessão (classe .tem-preloader, ligada no <head>).
import { gsap } from '../core/gsap.js';
import { dur, ease } from '../core/tokens.js';

const CHAVE_SESSAO = 'hm:visitou';

function marcarVisita() {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, '1');
  } catch {
    // Sem sessionStorage (modo privado antigo): o preloader volta a aparecer, sem problema.
  }
}

/**
 * @param {object} opcoes
 * @param {Promise} opcoes.fontes  só abre a cortina depois das fontes (com limite)
 * @param {Function} opcoes.aoAbrir chamado quando a cortina começa a subir
 * @returns {Promise} resolvida quando o preloader sai de vez
 */
export function rodarPreloader({ fontes, aoAbrir }) {
  const html = document.documentElement;
  const el = document.querySelector('[data-preloader]');
  if (!el || !html.classList.contains('tem-preloader')) {
    el?.remove();
    aoAbrir();
    return Promise.resolve();
  }

  const numero = el.querySelector('[data-preloader-numero]');
  const tracos = el.querySelectorAll('.preloader__monograma path');
  const cortina = el.querySelector('[data-preloader-cortina]');
  const conteudo = el.querySelector('[data-preloader-conteudo]');
  const contador = el.querySelector('.preloader__contador');
  const progresso = { valor: 0 };

  const entrada = gsap
    .timeline()
    .to(tracos, { strokeDashoffset: 0, duration: dur.lenta * 0.85, ease: ease.saida, stagger: 0.12 }, 0)
    .to(
      progresso,
      {
        valor: 100,
        duration: dur.lenta,
        ease: ease.suave,
        onUpdate: () => {
          numero.textContent = String(Math.round(progresso.valor));
        },
      },
      0,
    );

  return Promise.all([entrada.then(), fontes]).then(
    () =>
      new Promise((resolver) => {
        gsap
          .timeline({
            onComplete: () => {
              el.remove();
              html.classList.remove('tem-preloader');
              marcarVisita();
              resolver();
            },
          })
          .to([conteudo, contador], { yPercent: -35, opacity: 0, duration: dur.media, ease: ease.cortina }, 0)
          .to(cortina, { yPercent: -100, duration: dur.cortina, ease: ease.cortina }, 0.05)
          .to(cortina, { '--curva': '14vh', duration: dur.cortina * 0.6, ease: ease.suave }, 0.05)
          .add(aoAbrir, 0.3);
      }),
  );
}

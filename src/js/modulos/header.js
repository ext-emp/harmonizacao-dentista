// Header: some ao rolar para baixo, volta ao rolar para cima, ganha fundo
// fora do topo e troca de cor sobre as seções escuras.
import { ScrollTrigger } from '../core/gsap.js';

const TOLERANCIA = 8; // px de rolagem antes de mudar de estado

export function iniciarHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  let oculto = false;
  let referencia = 0;

  const definirOculto = (valor) => {
    if (valor === oculto) return;
    oculto = valor;
    header.classList.toggle('header--oculto', valor);
  };

  const menuAberto = () => header.classList.contains('header--menu-aberto');

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      header.classList.toggle('header--topo', y < TOLERANCIA);

      // Menu aberto ou foco do teclado no header: fica sempre visível.
      if (menuAberto() || header.contains(document.activeElement)) {
        definirOculto(false);
        referencia = y;
        return;
      }
      if (y < window.innerHeight * 0.3) {
        definirOculto(false);
        referencia = y;
        return;
      }
      const delta = y - referencia;
      if (Math.abs(delta) < TOLERANCIA) return;
      definirOculto(delta > 0);
      referencia = y;
    },
  });

  header.addEventListener('focusin', () => definirOculto(false));

  // Seções escuras sob o header: guardo quais estão ativas para não piscar
  // na passagem de uma seção escura para outra.
  const ativas = new Set();
  const meio = () => header.offsetHeight / 2;
  document.querySelectorAll('[data-tema="escuro"]').forEach((secao) => {
    ScrollTrigger.create({
      trigger: secao,
      start: () => `top ${meio()}`,
      end: () => `bottom ${meio()}`,
      onToggle(self) {
        if (self.isActive) ativas.add(secao);
        else ativas.delete(secao);
        header.classList.toggle('header--escuro', ativas.size > 0);
      },
    });
  });
}

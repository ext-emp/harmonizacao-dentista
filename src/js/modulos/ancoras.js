// Links internos (#secao): rolagem suave pelo Lenis e foco no destino,
// para quem navega por teclado ou leitor de tela continuar dali.
import { rolarPara } from '../core/scroll.js';

function focar(alvo) {
  if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
  alvo.focus({ preventScroll: true });
}

export function iniciarAncoras() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute('data-menu-botao')) return;
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const alvo = id && document.getElementById(id);
    if (!alvo) return;
    e.preventDefault();
    history.replaceState(null, '', `#${id}`);
    rolarPara(alvo, { aoTerminar: () => focar(alvo) });
  });
}

// Links internos (#secao): rolagem suave pelo Lenis e foco no destino,
// para quem navega por teclado ou leitor de tela continuar dali.
// Seções com data-ancora-ate="<seletor>" (os resultados): em vez de parar no
// topo, com todo o respiro de cima à vista, a rolagem desce o bastante para
// mostrar inteiro o elemento indicado (os cards), sem passar do começo do
// conteúdo: o rótulo fica a um respiro do topo da tela, ou do header, se ele
// estiver à vista na chegada.
import { comPosicoesNaturais, rolarPara } from '../core/scroll.js';

// px entre o conteúdo e a borda da tela (ou o header).
const RESPIRO = 24;

function focar(alvo) {
  if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
  alvo.focus({ preventScroll: true });
}

// O header some ao rolar para baixo (header.js), mas fica à vista com o foco
// dentro dele (um link do menu) e ao rolar para cima.
function destino(alvo, link) {
  const fim = alvo.dataset.ancoraAte && alvo.querySelector(alvo.dataset.ancoraAte);
  if (!fim) return alvo;
  return comPosicoesNaturais(() => {
    const topo = alvo.getBoundingClientRect().top + window.scrollY;
    const conteudo = topo + parseFloat(getComputedStyle(alvo).paddingTop);
    const pe = fim.getBoundingClientRect().bottom + window.scrollY;
    const header = document.querySelector('[data-header]');
    const headerAVista = header && (header.contains(link) || topo < window.scrollY);
    const ateOConteudo = conteudo - RESPIRO - (headerAVista ? header.offsetHeight : 0);
    const ateOPe = pe + RESPIRO - window.innerHeight;
    return Math.max(topo, Math.min(ateOPe, ateOConteudo));
  });
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
    rolarPara(destino(alvo, link), { aoTerminar: () => focar(alvo) });
  });
}

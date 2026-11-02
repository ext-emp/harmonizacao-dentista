// Scroll suave com Lenis, sincronizado com o ScrollTrigger pelo ticker do GSAP.
// Com movimento reduzido, o Lenis nem é criado: fica o scroll nativo.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from './gsap.js';
import { reduzMovimento } from './ambiente.js';
import { dur, ease } from './tokens.js';

let lenis = null;
// Quem quiser decidir sobre a roda do mouse antes do Lenis (a roda da
// experiência, que anda um passo por gesto). Devolve false para o Lenis
// ignorar o evento.
const interceptadores = new Set();

export function iniciarScroll() {
  if (reduzMovimento) return null;
  lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    virtualScroll: (dados) => {
      for (const interceptar of interceptadores) if (interceptar(dados) === false) return false;
      return true;
    },
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((tempo) => lenis.raf(tempo * 1000));
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) window.__lenis = lenis;
  return lenis;
}

export const obterLenis = () => lenis;

/** @param {(dados: {deltaX: number, deltaY: number, event: Event}) => boolean | void} fn */
export function interceptarRoda(fn) {
  interceptadores.add(fn);
  return () => interceptadores.delete(fn);
}

// Os painéis empilhados (pilha.js) e os palcos fixos ficam em position:
// sticky; parados, a posição medida não é a do lugar deles na página. Esta
// função desliga os stickies, mede e liga de novo, sem pintar no meio.
export function comPosicoesNaturais(medir) {
  const html = document.documentElement;
  if (html.classList.contains('pilha-medindo')) return medir();
  html.classList.add('pilha-medindo');
  try {
    return medir();
  } finally {
    html.classList.remove('pilha-medindo');
  }
}

/** Posição do elemento na página (no lugar dele, mesmo se estiver parado). */
export const topoNaPagina = (elemento) =>
  comPosicoesNaturais(() => elemento.getBoundingClientRect().top + window.scrollY);

// Rola até um elemento, um seletor ou uma posição (número, em px). Sem
// Lenis, usa o scroll nativo. imediato: sem animação.
export function rolarPara(alvo, { aoTerminar, imediato = false } = {}) {
  let destino = alvo;
  if (typeof alvo !== 'number') {
    const elemento = typeof alvo === 'string' ? document.querySelector(alvo) : alvo;
    if (!elemento) return;
    destino = topoNaPagina(elemento);
  }
  destino = Math.max(0, Math.round(destino));
  if (lenis) {
    // (Com immediate, o próprio Lenis chama o onComplete na hora.)
    lenis.scrollTo(destino, {
      immediate: imediato,
      duration: dur.longa,
      easing: gsap.parseEase(ease.cortina),
      force: true,
      onComplete: () => aoTerminar?.(),
    });
    return;
  }
  window.scrollTo({ top: destino, behavior: imediato || reduzMovimento ? 'auto' : 'smooth' });
  aoTerminar?.();
}

// Trava e libera a rolagem da página (menu em tela cheia).
export function travarScroll() {
  if (lenis) lenis.stop();
  document.documentElement.style.overflow = 'hidden';
}

export function liberarScroll() {
  document.documentElement.style.overflow = '';
  if (lenis) lenis.start();
}

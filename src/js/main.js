// ---------------------------------------------------------------------------
// Ponto de entrada. A página já está completa no HTML; este script só
// acrescenta movimento e interação. Ordem:
//  1. scroll, header, menu, âncoras, cursor e magnetismo (imediato)
//  2. o que muda a altura da página (galeria do espaço e rodas), o
//     empilhamento das seções e os efeitos de cada seção, na ordem da página
//  3. fontes -> preloader (primeira visita) -> entrada do hero
//  4. depois do conteúdo e do preloader: a pérola 3D
// ---------------------------------------------------------------------------
import { gsap, ScrollTrigger } from './core/gsap.js';
import { iniciarScroll } from './core/scroll.js';
import { aguardarFontes } from './core/fontes.js';
import { semAnimacao } from './core/ambiente.js';
import { dur } from './core/tokens.js';
import { rodarPreloader } from './modulos/preloader.js';
import { iniciarHeader } from './modulos/header.js';
import { iniciarMenu } from './modulos/menu.js';
import { iniciarAncoras } from './modulos/ancoras.js';
import { iniciarCursor } from './modulos/cursor.js';
import { iniciarMagneticos } from './modulos/magnetico.js';
import { revelarHero } from './modulos/hero.js';
import { iniciarViagemDaPerola } from './modulos/perola-viagem.js';
import { carregarPerola3d } from './modulos/hero-3d.js';
import { iniciarManifesto } from './modulos/manifesto.js';
import { iniciarContadores } from './modulos/contador.js';
import { iniciarTratamentos } from './modulos/tratamentos.js';
import { iniciarComparadores } from './modulos/comparador.js';
import { iniciarCarrossel } from './modulos/carrossel.js';
import { iniciarEspaco } from './modulos/espaco.js';
import { iniciarRodas } from './modulos/roda.js';
import { iniciarPilha } from './modulos/pilha.js';
import { iniciarFaq } from './modulos/faq.js';
import { iniciarRevelacoes } from './modulos/revelar.js';
import { iniciarParallax } from './modulos/parallax.js';
import { iniciarToqueCentro } from './modulos/toque.js';
import { manterLugar } from './modulos/lugar.js';

window.__hmIniciado = true;

const fontes = aguardarFontes();

iniciarScroll();
iniciarHeader();
iniciarMenu();
iniciarAncoras();
iniciarCursor();
iniciarMagneticos();

// Primeiro o que muda a altura da página; depois o empilhamento (mede as
// alturas) e a pérola (precisa saber se o hero ficou preso).
iniciarEspaco();
iniciarRodas();
iniciarPilha();
const perola = iniciarViagemDaPerola();
iniciarManifesto(fontes);
iniciarContadores();
iniciarTratamentos();
iniciarComparadores();
iniciarCarrossel();
iniciarFaq();
iniciarRevelacoes(fontes);
iniciarParallax();
iniciarToqueCentro();
manterLugar();

let preloader = Promise.resolve();
if (semAnimacao()) {
  // O script chegou tarde demais: a página já está toda visível.
  document.querySelector('[data-preloader]')?.remove();
} else {
  preloader = rodarPreloader({ fontes, aoAbrir: () => fontes.then(revelarHero) });
}

carregarPerola3d({ depoisDe: preloader, aoCriar: (perola3d) => perola.definirPerola(perola3d) });

// Posições do ScrollTrigger recalculadas quando fontes e imagens chegam.
// As imagens com lazy loading chegam aos poucos: um recálculo só, logo
// depois da última de uma leva.
const recalcular = gsap.delayedCall(dur.media, () => ScrollTrigger.refresh()).pause();
fontes.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
document.addEventListener(
  'load',
  (e) => {
    if (e.target instanceof HTMLImageElement && document.readyState === 'complete') recalcular.restart(true);
  },
  true,
);

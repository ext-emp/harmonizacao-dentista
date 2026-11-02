// ---------------------------------------------------------------------------
// Ponto de entrada. A página já está completa no HTML; este script só
// acrescenta movimento e interação. Ordem:
//  1. scroll, header, menu, âncoras, cursor e magnetismo (imediato)
//  2. o que muda a altura da página (galeria do espaço e rodas), o
//     empilhamento das seções e os efeitos de cada seção, na ordem da página
//  3. fontes -> preloader (primeira visita) -> entrada do hero
//  4. depois do conteúdo e da entrada do hero: a pérola 3D
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

// Altura da página no fim de cada recálculo do ScrollTrigger (ver o fim do
// arquivo). Registrado antes dos módulos: assim roda antes de a pilha ligar
// de novo os stickies, com o layout ainda pronto (ler a altura não força
// outro layout).
let alturaMedida = -1;
ScrollTrigger.addEventListener('refresh', () => {
  alturaMedida = document.documentElement.scrollHeight;
});

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
// Fim da entrada do hero (título, retrato e pérola).
let entradaDoHero = Promise.resolve();
if (semAnimacao()) {
  // O script chegou tarde demais: a página já está toda visível.
  document.querySelector('[data-preloader]')?.remove();
} else {
  let fimDaEntrada;
  entradaDoHero = new Promise((resolver) => {
    fimDaEntrada = resolver;
  });
  preloader = rodarPreloader({ fontes, aoAbrir: () => fontes.then(revelarHero).then(fimDaEntrada) });
}

// A pérola 3D só depois da entrada do hero: montá-la custa caro (no celular,
// a tela trava por uns instantes) e travaria a animação. Até lá, fica a
// imagem estática, igual. (Com um limite, se a entrada não terminar.)
const limite = (ms) => new Promise((resolver) => setTimeout(resolver, ms));
carregarPerola3d({
  depoisDe: Promise.all([preloader, Promise.race([entradaDoHero, limite(8000)])]),
  aoCriar: (perola3d) => perola.definirPerola(perola3d),
});

// Posições do ScrollTrigger. Cada gatilho mede a sua ao nascer; recalcular a
// página inteira custa caro (no celular, de 50 a 200 ms de tela travada):
// uma vez quando as fontes chegam (mudam a altura dos textos) e, depois, só
// se a altura da página mudar: no load, numa leva de imagens ou com fontes
// que chegaram depois do limite de espera. Os recálculos automáticos do
// ScrollTrigger no DOMContentLoaded e no load ficam desligados (repetiriam
// o das fontes); o do resize continua.
ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,resize' });
// Antes do primeiro recálculo (o das fontes), não faz nada: ele já vem.
const recalcularSeMudou = () => {
  if (alturaMedida >= 0 && document.documentElement.scrollHeight !== alturaMedida) ScrollTrigger.refresh();
};
fontes.then(() => ScrollTrigger.refresh());
document.fonts?.ready.then(recalcularSeMudou);
window.addEventListener('load', recalcularSeMudou, { once: true });
// As imagens com lazy loading chegam aos poucos: uma conferência só, logo
// depois da última de uma leva.
const recalcular = gsap.delayedCall(dur.media, recalcularSeMudou).pause();
document.addEventListener(
  'load',
  (e) => {
    if (e.target instanceof HTMLImageElement && document.readyState === 'complete') recalcular.restart(true);
  },
  true,
);

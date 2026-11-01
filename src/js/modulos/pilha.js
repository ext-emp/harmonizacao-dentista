// ---------------------------------------------------------------------------
// Empilhamento das seções, no estilo da LAVA dental: quando o pé de um
// painel [data-pilha] chega ao pé da tela, ele para (position: sticky, no
// CSS) e a seção seguinte sobe por cima dele. Um véu grafite leve escurece o
// painel conforme ele vai sendo coberto.
// O sticky fica no CSS (anda junto com o scroll do navegador, sem atraso no
// toque); este módulo só:
//  - mede a altura de cada painel (o "top" do sticky depende dela);
//  - desliga os stickies enquanto o ScrollTrigger mede a página, para os
//    gatilhos usarem as posições naturais (com tudo no lugar do HTML);
//  - liga o véu e a entrada em caixa do contato (data-pilha-entrada="caixa");
//  - leva o foco do teclado para fora de um painel coberto.
// Com movimento reduzido, nada empilha: a página rola normal.
// ---------------------------------------------------------------------------
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { reduzMovimento } from '../core/ambiente.js';
import { comPosicoesNaturais, rolarPara } from '../core/scroll.js';

// Quanto o véu escurece o painel coberto (0 a 1).
const VEU_MAXIMO = 0.32;

function medirAlturas(paineis) {
  for (const painel of paineis) painel.style.setProperty('--pilha-altura', `${painel.offsetHeight}px`);
}

// Seção que cobre o painel: o próximo elemento da página.
const seguinte = (painel) => painel.nextElementSibling;

// Véu enquanto a seção seguinte sobe. Quando ela chega ao topo, o painel
// fica todo coberto e sai do sticky (.pilha--coberta): volta para o lugar
// dele na página, já fora da tela, e o navegador deixa de pintá-lo por baixo
// das outras. Ao voltar a rolagem, ele para de novo antes de aparecer.
function ligarVeu(painel) {
  const cobre = seguinte(painel);
  if (!cobre) return;
  const veu = document.createElement('span');
  veu.className = 'pilha__veu';
  veu.setAttribute('aria-hidden', 'true');
  painel.append(veu);
  const definir = gsap.quickSetter(veu, 'opacity');
  const atualizar = (self) => {
    definir(self.progress * VEU_MAXIMO);
    painel.classList.toggle('pilha--coberta', self.progress >= 1);
  };
  ScrollTrigger.create({ trigger: cobre, start: 'top bottom', end: 'top top', onUpdate: atualizar, onRefresh: atualizar });
}

// Entrada em caixa: a seção sobe como um retângulo menor, com cantos
// redondos, que abre até ocupar a tela (presa ao scroll, linear).
function entradaEmCaixa(secao) {
  gsap.fromTo(
    secao,
    { clipPath: 'inset(0% 7% 0% 7% round 1.25rem)' },
    {
      clipPath: 'inset(0% 0% 0% 0% round 0rem)',
      ease: 'none',
      scrollTrigger: { trigger: secao, start: 'top bottom', end: 'top 15%', scrub: true },
    },
  );
}

function estaAVista(el) {
  const r = el.getBoundingClientRect();
  if (r.bottom <= 0 || r.top >= window.innerHeight) return false;
  const x = Math.min(window.innerWidth - 1, Math.max(0, r.left + r.width / 2));
  const y = Math.min(window.innerHeight - 1, Math.max(0, r.top + r.height / 2));
  const topo = document.elementFromPoint(x, y);
  return Boolean(topo && (el === topo || el.contains(topo) || topo.contains(el)));
}

// Teclado: se o foco cair num painel coberto (ou fora da tela), rola até um
// ponto em que o painel ainda não foi coberto: do topo dele até o instante em
// que o pé dele chega ao pé da tela. Ali, centraliza o elemento se der.
function cuidarDoFoco() {
  document.addEventListener('focusin', (e) => {
    const alvo = e.target;
    const painel = alvo instanceof HTMLElement && alvo.closest('.pilha--ativa');
    if (!painel || estaAVista(alvo)) return;
    const destino = comPosicoesNaturais(() => {
      const topoPainel = painel.getBoundingClientRect().top + window.scrollY;
      const r = alvo.getBoundingClientRect();
      const centrado = r.top + window.scrollY - Math.max(0, (window.innerHeight - r.height) / 2);
      const limite = Math.max(topoPainel, topoPainel + painel.offsetHeight - window.innerHeight);
      return Math.min(Math.max(centrado, topoPainel), limite);
    });
    rolarPara(destino, { imediato: true });
  });
}

export function iniciarPilha() {
  if (reduzMovimento) return;
  const paineis = gsap.utils.toArray('[data-pilha]');
  if (!paineis.length) return;
  paineis.forEach((painel) => painel.classList.add('pilha--ativa'));
  medirAlturas(paineis);

  // As alturas mudam com fontes, imagens e o resize: medidas antes de cada
  // refresh. Os stickies ficam desligados durante a medição (síncrona: não
  // chega a ser pintada) e voltam no fim.
  const html = document.documentElement;
  ScrollTrigger.addEventListener('refreshInit', () => {
    html.classList.add('pilha-medindo');
    medirAlturas(paineis);
  });
  ScrollTrigger.addEventListener('refresh', () => html.classList.remove('pilha-medindo'));

  paineis.forEach(ligarVeu);
  document.querySelectorAll('[data-pilha-entrada="caixa"]').forEach(entradaEmCaixa);
  cuidarDoFoco();
  // Atualiza se algum painel mudar de altura (FAQ abrindo, por exemplo). A
  // variável só muda o "top" do sticky, não o tamanho: não realimenta o observador.
  const observador = new ResizeObserver(() => medirAlturas(paineis));
  paineis.forEach((painel) => observador.observe(painel));
}

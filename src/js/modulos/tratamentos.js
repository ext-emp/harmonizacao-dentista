// Tratamentos.
//  - Blocos Rosto e Sorriso: tilt 3D seguindo o mouse; no toque, uma rotação
//    leve presa ao scroll no lugar do tilt.
//  - Lista de procedimentos: com mouse, a imagem da linha segue o cursor
//    (posição suavizada) e inclina para o lado em que ele anda. No toque,
//    a imagem aparece na própria linha (só CSS, classe .is-active).
// Com movimento reduzido: sem tilt nem rotação, e a imagem da lista vai
// direto para o cursor, sem deslizar nem inclinar.
import { gsap } from '../core/gsap.js';
import { dur, ease } from '../core/tokens.js';
import { reduzMovimento, temMouse } from '../core/ambiente.js';

const INCLINACAO = 7; // graus no canto da imagem
const PERSPECTIVA = 1100; // px

function tiltComMouse(bloco, midia) {
  gsap.set(midia, { transformPerspective: PERSPECTIVA });
  const opcoes = { duration: dur.lenta, ease: ease.saida };
  const girarX = gsap.quickTo(midia, 'rotationX', opcoes);
  const girarY = gsap.quickTo(midia, 'rotationY', opcoes);
  const limitar = gsap.utils.clamp(-0.5, 0.5);

  bloco.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = midia.getBoundingClientRect();
    const x = limitar((e.clientX - r.left) / r.width - 0.5);
    const y = limitar((e.clientY - r.top) / r.height - 0.5);
    girarY(x * 2 * INCLINACAO);
    girarX(-y * 2 * INCLINACAO);
  });
  bloco.addEventListener('pointerleave', () => {
    girarX(0);
    girarY(0);
  });
}

function giroNoScroll(midia, lado) {
  gsap.fromTo(
    midia,
    { rotationX: 6, rotationY: -4 * lado, transformPerspective: PERSPECTIVA },
    {
      rotationX: -6,
      rotationY: 4 * lado,
      ease: 'none',
      scrollTrigger: { trigger: midia, start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );
}

function imagemSegueCursor(lista) {
  const definir = (nome, valor) => lista.style.setProperty(nome, valor);

  if (reduzMovimento) {
    lista.addEventListener('pointermove', (e) => {
      definir('--cursor-x', `${e.clientX}px`);
      definir('--cursor-y', `${e.clientY}px`);
    });
    return;
  }

  const alvo = { x: innerWidth / 2, y: innerHeight / 2 };
  const pos = { ...alvo };
  const limitarGiro = gsap.utils.clamp(-9, 9);

  // A inclinação vem da distância entre o cursor e a imagem (que vem atrás):
  // andando rápido, inclina; parou, ela alcança o cursor e endireita.
  const aplicar = () => {
    definir('--cursor-x', `${pos.x}px`);
    definir('--cursor-y', `${pos.y}px`);
    definir('--cursor-giro', `${limitarGiro((alvo.x - pos.x) * 0.05)}deg`);
  };
  const opcoes = { duration: dur.media, ease: ease.saida, onUpdate: aplicar };
  const moverX = gsap.quickTo(pos, 'x', opcoes);
  const moverY = gsap.quickTo(pos, 'y', opcoes);

  lista.addEventListener('pointerenter', (e) => {
    // Entrando na lista, a imagem nasce já no cursor (não vem de longe).
    alvo.x = e.clientX;
    alvo.y = e.clientY;
    moverX(e.clientX, e.clientX);
    moverY(e.clientY, e.clientY);
  });
  lista.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    alvo.x = e.clientX;
    alvo.y = e.clientY;
    moverX(e.clientX);
    moverY(e.clientY);
  });
}

export function iniciarTratamentos() {
  const lista = document.querySelector('[data-procedimentos]');
  if (lista && temMouse) imagemSegueCursor(lista);

  if (reduzMovimento) return;
  gsap.utils.toArray('[data-tratamento]').forEach((bloco, i) => {
    const midia = bloco.querySelector('[data-tilt]');
    if (!midia) return;
    if (temMouse) tiltComMouse(bloco, midia);
    else giroNoScroll(midia, i % 2 ? 1 : -1);
  });
}

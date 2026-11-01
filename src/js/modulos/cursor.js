// Cursor customizado. Só em aparelhos com mouse e com movimento liberado;
// no resto, fica o cursor do sistema.
//  - O ponto acompanha o ponteiro sem atraso (precisão para clicar).
//  - O anel vem logo atrás e muda de estado conforme o que está embaixo:
//      links e botões      -> anel maior (destaque)
//      [data-cursor="ver"] -> círculo com "Ver" (tratamentos)
//      [data-cursor="arraste"] -> círculo com "Arraste" (antes e depois)
import { gsap } from '../core/gsap.js';
import { dur, ease } from '../core/tokens.js';
import { reduzMovimento, temMouse } from '../core/ambiente.js';

const TEXTOS = { ver: 'Ver', arraste: 'Arraste' };
const INTERATIVOS = '[data-cursor], a[href], button, summary, label, [role="button"]';

export function iniciarCursor() {
  if (!temMouse || reduzMovimento) return;
  const html = document.documentElement;

  const ponto = document.createElement('div');
  ponto.className = 'cursor-ponto';
  const anel = document.createElement('div');
  anel.className = 'cursor-anel';
  const texto = document.createElement('span');
  texto.className = 'cursor-anel__texto';
  anel.append(texto);
  for (const el of [ponto, anel]) el.setAttribute('aria-hidden', 'true');
  document.body.append(ponto, anel);

  const pontoX = gsap.quickSetter(ponto, 'x', 'px');
  const pontoY = gsap.quickSetter(ponto, 'y', 'px');
  const opcoes = { duration: dur.media, ease: ease.saida };
  const anelX = gsap.quickTo(anel, 'x', opcoes);
  const anelY = gsap.quickTo(anel, 'y', opcoes);

  let visivel = false;
  let estado = '';

  function mostrar(visivelAgora) {
    visivel = visivelAgora;
    html.classList.toggle('cursor-visivel', visivelAgora);
  }

  function definirEstado(novo) {
    if (novo === estado) return;
    estado = novo;
    html.classList.toggle('cursor--link', novo === 'link');
    html.classList.toggle('cursor--texto', novo in TEXTOS);
    if (novo in TEXTOS) texto.textContent = TEXTOS[novo];
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      pontoX(e.clientX);
      pontoY(e.clientY);
      if (!visivel) {
        // Primeira aparição: o anel nasce no ponteiro, sem vir deslizando.
        anelX(e.clientX, e.clientX);
        anelY(e.clientY, e.clientY);
        mostrar(true);
        return;
      }
      anelX(e.clientX);
      anelY(e.clientY);
    },
    { passive: true },
  );

  document.addEventListener('pointerover', (e) => {
    const alvo = e.target.closest?.(INTERATIVOS);
    definirEstado(alvo ? alvo.dataset.cursor || 'link' : '');
  });

  // Saiu da janela (ou ela perdeu o foco): o cursor some até voltar.
  html.addEventListener('mouseleave', () => mostrar(false));
  window.addEventListener('blur', () => mostrar(false));

  html.classList.add('tem-cursor');
}

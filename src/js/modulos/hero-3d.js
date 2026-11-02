// Carrega a pérola 3D DEPOIS do conteúdo (evento load, o que o main.js pedir
// para esperar, como a entrada do hero, e um momento de ócio do navegador) e
// troca a imagem estática pelo canvas num cruzamento suave.
// Sem WebGL 2, ou se algo falhar, a imagem estática continua no lugar.
import { gsap } from '../core/gsap.js';
import { dur, ease } from '../core/tokens.js';
import { reduzMovimento, temMouse } from '../core/ambiente.js';

const aoCarregarPagina = () =>
  document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((resolver) => window.addEventListener('load', resolver, { once: true }));

const quandoOcioso = () =>
  new Promise((resolver) =>
    'requestIdleCallback' in window ? window.requestIdleCallback(resolver, { timeout: 2000 }) : setTimeout(resolver, 500),
  );

/**
 * @param {object} opcoes
 * @param {Promise} [opcoes.depoisDe] espera também isso (ex.: a entrada do hero terminar)
 * @param {Function} [opcoes.aoCriar] recebe a pérola criada
 */
export async function carregarPerola3d({ depoisDe = Promise.resolve(), aoCriar } = {}) {
  const palco = document.querySelector('[data-hero-palco]');
  // Com movimento reduzido a pérola ficaria parada: a imagem estática basta
  // e o Three.js nem é baixado.
  if (!palco || reduzMovimento) return;
  const imagem = palco.querySelector('picture');

  await Promise.all([aoCarregarPagina(), depoisDe]);
  await quandoOcioso();

  try {
    const { criarPerola } = await import('../3d/perola.js');
    // Aparelhos de toque recebem a versão leve (menos polígonos, pixel ratio menor).
    const perola = await criarPerola(palco, { leve: !temMouse, cursor: temMouse });
    if (!perola) return;

    gsap.to(perola.canvas, { opacity: 1, duration: dur.lenta, ease: ease.suave });
    gsap.to(imagem, { opacity: 0, duration: dur.lenta, ease: ease.suave, delay: dur.rapida });
    perola.aoPerderContexto(() => {
      gsap.set(imagem, { opacity: 1 });
      gsap.set(perola.canvas, { opacity: 0 });
    });
    aoCriar?.(perola);
  } catch (erro) {
    if (import.meta.env.DEV) console.warn('Pérola 3D indisponível, mantendo a imagem estática.', erro);
  }
}

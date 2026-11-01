// Carrossel dos resultados. O trilho é um scroll horizontal nativo com
// encaixe (o dedo e o trackpad já funcionam sem script). Aqui entram as
// setas, o contador "01 / 06" e o estado das setas nas pontas.
// As setas usam aria-disabled (e não disabled) para o foco do teclado não
// sumir quando o carrossel chega ao fim.
import { gsap } from '../core/gsap.js';
import { reduzMovimento } from '../core/ambiente.js';

export function iniciarCarrossel() {
  const raiz = document.querySelector('[data-carrossel]');
  if (!raiz) return;
  const trilho = raiz.querySelector('[data-carrossel-trilho]');
  const itens = [...trilho.children];
  const anterior = raiz.querySelector('[data-carrossel-anterior]');
  const proximo = raiz.querySelector('[data-carrossel-proximo]');
  const atual = raiz.querySelector('[data-carrossel-atual]');
  if (!itens.length || !anterior || !proximo || !atual) return;

  // Distância entre o começo de um card e o do seguinte (card + calha).
  const passo = () => (itens.length > 1 ? itens[1].offsetLeft - itens[0].offsetLeft : trilho.clientWidth) || 1;
  const ultimo = () => Math.max(0, Math.round((trilho.scrollWidth - trilho.clientWidth) / passo()));
  const indice = () => Math.min(Math.round(trilho.scrollLeft / passo()), ultimo());

  let quadro = 0;
  function atualizar() {
    quadro = 0;
    const i = indice();
    atual.textContent = String(i + 1).padStart(2, '0');
    anterior.setAttribute('aria-disabled', String(i <= 0));
    proximo.setAttribute('aria-disabled', String(i >= ultimo()));
  }
  const agendar = () => {
    if (!quadro) quadro = requestAnimationFrame(atualizar);
  };

  function irPara(i) {
    const destino = gsap.utils.clamp(0, ultimo(), i);
    trilho.scrollTo({ left: destino * passo(), behavior: reduzMovimento ? 'auto' : 'smooth' });
  }

  anterior.addEventListener('click', () => {
    if (anterior.getAttribute('aria-disabled') !== 'true') irPara(indice() - 1);
  });
  proximo.addEventListener('click', () => {
    if (proximo.getAttribute('aria-disabled') !== 'true') irPara(indice() + 1);
  });

  trilho.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
  atualizar();
}

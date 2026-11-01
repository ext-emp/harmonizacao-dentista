// Comparador de antes e depois ([data-comparador]).
// A posição da linha fica em --posicao (0% a 100%, da esquerda).
//
//  - Mouse: apertar em qualquer ponto da foto leva a linha até ali, e
//    arrastar move a linha.
//  - Toque: só o arrasto que começa na faixa em volta da linha
//    (.comparador__alca, touch-action: pan-y) move o slider. Fora dela, o
//    gesto fica com o navegador: passa o carrossel ou rola a página.
//  - Teclado e leitor de tela: o <input type="range"> nativo, escondido
//    (setas, Page Up/Down, Home e End). O passo é de 5%.
//  - Ao entrar na tela, a linha faz um vaivém curto para mostrar que mexe
//    (só uma vez, só se a pessoa ainda não mexeu e com movimento liberado).
import { gsap } from '../core/gsap.js';
import { dur, ease, sequencia } from '../core/tokens.js';
import { reduzMovimento } from '../core/ambiente.js';

const limitar = gsap.utils.clamp(0, 100);

function criarComparador(el) {
  const controle = el.querySelector('[data-comparador-controle]');
  const alca = el.querySelector('[data-comparador-alca]');
  const html = document.documentElement;
  let valor = Number(controle.value) || 50;
  let mexeu = false;
  let vaivem = null;

  function aplicar(novo, { doControle = false } = {}) {
    valor = limitar(novo);
    el.style.setProperty('--posicao', `${valor}%`);
    const antes = Math.round(valor);
    if (!doControle) controle.value = String(antes);
    controle.setAttribute('aria-valuetext', `${antes}% antes, ${100 - antes}% depois`);
  }

  function assumir() {
    mexeu = true;
    vaivem?.kill();
  }

  controle.addEventListener('input', () => {
    assumir();
    aplicar(Number(controle.value), { doControle: true });
  });

  // ---- Arrasto ----------------------------------------------------------
  let ponteiro = null;
  let inicioX = 0;
  let inicioValor = 0;
  let largura = 1;

  el.addEventListener('pointerdown', (e) => {
    if (ponteiro !== null) return;
    const mouse = e.pointerType === 'mouse';
    if (mouse && e.button !== 0) return;
    if (!mouse && !alca.contains(e.target)) return;

    assumir();
    const r = el.getBoundingClientRect();
    largura = r.width || 1;
    if (mouse) {
      aplicar(((e.clientX - r.left) / largura) * 100);
      // Sem seleção de texto nem "arrastar imagem" do navegador.
      e.preventDefault();
    }
    ponteiro = e.pointerId;
    inicioX = e.clientX;
    inicioValor = valor;
    el.setPointerCapture(e.pointerId);
    el.classList.add('esta-arrastando');
    html.classList.add('cursor--pressionado');
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== ponteiro) return;
    aplicar(inicioValor + ((e.clientX - inicioX) / largura) * 100);
  });

  const soltar = (e) => {
    if (e.pointerId !== ponteiro) return;
    ponteiro = null;
    el.classList.remove('esta-arrastando');
    html.classList.remove('cursor--pressionado');
  };
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', soltar);
  el.addEventListener('lostpointercapture', soltar);

  // ---- Vaivém de apresentação -------------------------------------------
  function mostrar(atraso = 0) {
    if (mexeu || reduzMovimento) return;
    const p = { v: valor };
    vaivem = gsap
      .timeline({ delay: atraso, onUpdate: () => aplicar(p.v) })
      .to(p, { v: 64, duration: dur.media, ease: ease.suave })
      .to(p, { v: 38, duration: dur.lenta, ease: ease.suave })
      .to(p, { v: 50, duration: dur.lenta, ease: ease.saida });
  }

  aplicar(valor);
  return { el, mostrar };
}

export function iniciarComparadores() {
  const comparadores = [...document.querySelectorAll('[data-comparador]')].map(criarComparador);
  if (!comparadores.length || reduzMovimento || !('IntersectionObserver' in window)) return;

  // O observador considera o recorte do carrossel: um card só "entra" quando
  // aparece de verdade, inclusive ao passar o carrossel para o lado.
  const porElemento = new Map(comparadores.map((c) => [c.el, c]));
  const observador = new IntersectionObserver(
    (entradas) => {
      let ordem = 0;
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        porElemento.get(entrada.target)?.mostrar(ordem * sequencia * 3);
        observador.unobserve(entrada.target);
        ordem += 1;
      }
    },
    { threshold: 0.65 },
  );
  comparadores.forEach((c) => observador.observe(c.el));
}

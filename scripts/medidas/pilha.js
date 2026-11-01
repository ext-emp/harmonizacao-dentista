// Estado do empilhamento, da galeria e das rodas (uso durante a verificação).
(() => {
  const caixa = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return `${Math.round(r.top)}..${Math.round(r.bottom)} (h ${Math.round(r.height)})`;
  };
  const st = window.ScrollTrigger || null;
  return {
    altura: document.documentElement.scrollHeight,
    paineis: [...document.querySelectorAll('[data-pilha]')].map((p) => ({
      id: p.id,
      ativa: p.classList.contains('pilha--ativa'),
      pos: getComputedStyle(p).position,
      top: getComputedStyle(p).top,
      caixa: caixa(p),
    })),
    espaco: {
      animado: !!document.querySelector('.espaco--animado'),
      percurso: document.querySelector('[data-espaco-percurso]')?.style.height,
      trilho: getComputedStyle(document.querySelector('[data-espaco-trilho]')).transform,
    },
    rodas: [...document.querySelectorAll('[data-roda]')].map((r) => ({
      id: r.id,
      ativa: r.classList.contains('roda--ativa'),
      percurso: r.querySelector('[data-roda-percurso]')?.style.height,
      marcos: r.querySelectorAll('.roda__marco').length,
    })),
    perola: window.__perola?.medidas(),
    perolaPai: document.querySelector('[data-perola-viagem]')?.parentElement?.className,
  };
})()

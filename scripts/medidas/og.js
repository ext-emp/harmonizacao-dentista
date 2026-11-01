(() => {
  const caixa = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width), margem: cs.margin, lh: cs.lineHeight, fs: cs.fontSize };
  };
  return {
    vh: innerHeight,
    og: caixa('.og'),
    coluna: caixa('.og > div'),
    monograma: caixa('.og__monograma'),
    nome: caixa('.og__nome'),
    linha: caixa('.og__linha'),
    perola: caixa('.og__perola'),
  };
})()

(() => {
  const t = document.querySelector('.hero__titulo');
  const cs = getComputedStyle(t);
  const r = (el) => {
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), h: Math.round(b.height) };
  };
  return {
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight,
    titulo: r(t),
    mascaras: [...t.querySelectorAll('.linha-mask')].map((m) => ({ ...r(m), overflow: getComputedStyle(m).overflow, pad: getComputedStyle(m).padding })),
    linhas: [...t.querySelectorAll('.linha')].map((l) => ({ ...r(l), display: getComputedStyle(l).display })),
    palco: r(document.querySelector('[data-hero-palco]')),
    subtitulo: r(document.querySelector('.hero__subtitulo')),
    acoes: r(document.querySelector('.hero__acoes')),
    rotulo: r(document.querySelector('.hero__rotulo')),
    html: t.innerHTML.slice(0, 600),
  };
})()

// Caixas (em coordenadas da página) dos textos do hero, do retrato e do início do manifesto.
(() => {
  const caixa = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.right), Math.round(r.bottom + scrollY)].join(' ');
  };
  const linhas = [...document.querySelectorAll('.hero__titulo .linha, .hero__linha')].map((l) => {
    const r = l.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(l);
    const t = range.getBoundingClientRect();
    return `${Math.round(t.left)}-${Math.round(t.right)} x ${Math.round(r.top + scrollY)}-${Math.round(r.bottom + scrollY)}`;
  });
  return {
    vp: `${innerWidth}x${innerHeight}`,
    hero: caixa('.hero'),
    rotulo: caixa('.hero__rotulo'),
    linhasTitulo: linhas,
    subtitulo: caixa('.hero__subtitulo'),
    botao: caixa('.hero__acoes .botao'),
    nota: caixa('.hero__nota'),
    rolar: caixa('.hero__rolar'),
    composicao: caixa('.hero__composicao'),
    manifesto: caixa('#manifesto'),
    manifestoRotulo: caixa('.manifesto__rotulo'),
    manifestoTexto: caixa('.manifesto__texto'),
  };
})()

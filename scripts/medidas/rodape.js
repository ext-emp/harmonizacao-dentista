// Mede a razão entre o corpo da fonte e a largura do nome do rodapé, para
// ajustar --rodape-proporcao (o nome deve ocupar a largura do grid).
(() => {
  const nome = document.querySelector('.rodape__nome');
  const grade = nome.parentElement;
  const cs = getComputedStyle(nome);
  const medida = document.createElement('span');
  medida.textContent = nome.textContent;
  medida.style.cssText = `font-family:${cs.fontFamily};font-size:100px;letter-spacing:${cs.letterSpacing === 'normal' ? 'normal' : parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize) + 'em'};white-space:nowrap;position:absolute;visibility:hidden`;
  document.body.append(medida);
  const larguraEm100 = medida.getBoundingClientRect().width;
  medida.remove();
  const gs = getComputedStyle(grade);
  const util = grade.clientWidth - parseFloat(gs.paddingLeft) - parseFloat(gs.paddingRight);
  const r = nome.getBoundingClientRect();
  return {
    larguraEm100,
    proporcaoIdeal: +(100 / larguraEm100).toFixed(4),
    util,
    fonteAtual: cs.fontSize,
    larguraAtual: Math.round(r.width),
    textoLarguraAtual: Math.round(nome.scrollWidth),
  };
})()

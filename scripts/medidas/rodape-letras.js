// Depois da divisão em letras: largura real do nome (da primeira à última
// letra) comparada com a largura útil do grid.
(async () => {
  const nome = document.querySelector('.rodape__nome');
  nome.scrollIntoView();
  window.__lenis?.scrollTo(nome, { immediate: true });
  await new Promise((r) => setTimeout(r, 2500));
  const letras = nome.querySelectorAll('.letra');
  const grade = nome.parentElement;
  const gs = getComputedStyle(grade);
  const util = grade.clientWidth - parseFloat(gs.paddingLeft) - parseFloat(gs.paddingRight);
  const caixaGrade = grade.getBoundingClientRect();
  if (!letras.length) return { semDivisao: true, util };
  const a = letras[0].getBoundingClientRect();
  const b = letras[letras.length - 1].getBoundingClientRect();
  return {
    letras: letras.length,
    util: Math.round(util),
    larguraTexto: Math.round(b.right - a.left),
    esquerda: Math.round(a.left - caixaGrade.left - parseFloat(gs.paddingLeft)),
    direita: Math.round(caixaGrade.right - parseFloat(gs.paddingRight) - b.right),
    fonte: getComputedStyle(nome).fontSize,
  };
})()

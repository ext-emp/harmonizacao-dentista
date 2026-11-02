// Espera as fontes do site (o SplitText só pode medir linhas depois disso).
// Nunca segura a página por mais que `limite` milissegundos.
export function aguardarFontes(limite = 2500) {
  if (!document.fonts?.load) return Promise.resolve();
  const carregar = Promise.all([
    document.fonts.load('400 1em "Instrument Serif"'),
    document.fonts.load('italic 400 1em "Instrument Serif"'),
    document.fonts.load('500 1em Manrope'),
  ])
    // E o "ready": o navegador só o resolve depois de avisar que terminou de
    // carregar as fontes (evento loadingdone). Um título dividido antes desse
    // aviso seria dividido de novo por ele (autoSplit do SplitText), e cada
    // divisão refeita custa caro na carga do celular.
    .then(() => document.fonts.ready)
    .catch(() => {});
  return Promise.race([carregar, new Promise((resolver) => setTimeout(resolver, limite))]);
}

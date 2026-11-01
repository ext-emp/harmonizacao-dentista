// Espera as fontes do site (o SplitText só pode medir linhas depois disso).
// Nunca segura a página por mais que `limite` milissegundos.
export function aguardarFontes(limite = 2500) {
  if (!document.fonts?.load) return Promise.resolve();
  const carregar = Promise.all([
    document.fonts.load('400 1em "Instrument Serif"'),
    document.fonts.load('italic 400 1em "Instrument Serif"'),
    document.fonts.load('500 1em Manrope'),
  ]).catch(() => {});
  return Promise.race([carregar, new Promise((resolver) => setTimeout(resolver, limite))]);
}

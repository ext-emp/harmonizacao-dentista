// Tipo de aparelho e preferências do usuário.
// O tipo de aparelho vem SEMPRE da media query de ponteiro, nunca da largura.

// Mouse ou trackpad: cursor customizado, magnetismo e hovers.
export const temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Sem scroll suave, parallax ou animações longas.
export const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A rede de segurança do <head> desistiu das animações (script atrasou demais).
export const semAnimacao = () => document.documentElement.classList.contains('sem-animacao');

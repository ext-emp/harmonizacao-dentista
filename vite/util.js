// Funções pequenas usadas pelo plugin de montagem do HTML.

// Valor que ainda não é para valer: quem escrever esta marca num dado de
// src/dados/doutor.js tira o campo dos dados estruturados (hoje nenhum usa).
export const PENDENTE = '[CONFIRMAR]';

// Escapa um valor para uso seguro em texto ou atributo HTML.
export function escapar(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Devolve o valor só se ele já estiver confirmado (sem [CONFIRMAR] e não vazio).
export const confirmado = (valor) => (valor && !String(valor).includes(PENDENTE) ? valor : undefined);

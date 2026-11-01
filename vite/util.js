// Funções pequenas usadas pelo plugin de montagem do HTML.

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

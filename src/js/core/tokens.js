// Tokens de movimento lidos do CSS (src/css/tokens.css), para o JavaScript e
// o CSS usarem exatamente as mesmas curvas e durações.
import { CustomEase } from './gsap.js';

const raiz = getComputedStyle(document.documentElement);

function curva(nome, reserva) {
  const m = raiz.getPropertyValue(nome).match(/cubic-bezier\(([^)]+)\)/);
  return (m ? m[1] : reserva).replace(/\s+/g, '');
}

function duracao(nome, reserva) {
  const valor = raiz.getPropertyValue(nome).trim();
  if (valor.endsWith('ms')) return parseFloat(valor) / 1000;
  if (valor.endsWith('s')) return parseFloat(valor);
  return reserva;
}

CustomEase.create('hm-saida', curva('--ease-saida', '0.22,1,0.36,1'));
CustomEase.create('hm-cortina', curva('--ease-cortina', '0.76,0,0.24,1'));
CustomEase.create('hm-suave', curva('--ease-suave', '0.33,0,0.15,1'));
CustomEase.create('hm-queda', curva('--ease-queda', '0.33,0.33,0.55,1'));
CustomEase.create('hm-deslize', curva('--ease-deslize', '0.45,0,0.55,1'));

export const ease = {
  saida: 'hm-saida',
  cortina: 'hm-cortina',
  suave: 'hm-suave',
  // Forma do trajeto da pérola (preso ao scroll).
  queda: 'hm-queda',
  deslize: 'hm-deslize',
};

export const dur = {
  rapida: duracao('--dur-rapida', 0.35),
  media: duracao('--dur-media', 0.7),
  cortina: duracao('--dur-cortina', 0.95),
  lenta: duracao('--dur-lenta', 1.1),
  longa: duracao('--dur-longa', 1.6),
};

export const sequencia = duracao('--atraso-sequencia', 0.08);

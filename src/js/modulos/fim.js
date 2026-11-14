// Fim da página: na última tela, as informações do contato e o rodapé ficam
// centralizados na altura, com o botão do contato inteiro acima, fora da tela
// (antes, o pé dele aparecia cortado na borda de cima).
// Aqui só se mede a altura desse bloco, da linha das informações ao pé do
// rodapé, sem as sobras que dependem dela; o CSS divide o resto da tela
// (--fim-respiro, em contato.css). Medido de novo antes de cada refresh do
// ScrollTrigger (fontes, imagens, resize), antes do pilha.js medir o rodapé.
import { ScrollTrigger } from '../core/gsap.js';

export function iniciarFim() {
  const infos = document.querySelector('.contato__infos');
  const contato = infos?.closest('.contato');
  const rodape = document.querySelector('.rodape');
  if (!infos || !contato || !rodape) return;

  const raiz = document.documentElement.style;
  const medir = () => {
    const respiroDoContato = parseFloat(getComputedStyle(contato).paddingBottom) || 0;
    const respiroDoRodape = parseFloat(getComputedStyle(rodape).paddingBottom) || 0;
    const altura = Math.ceil(infos.offsetHeight + respiroDoContato + rodape.offsetHeight - respiroDoRodape);
    if (raiz.getPropertyValue('--fim-conteudo') !== `${altura}px`) raiz.setProperty('--fim-conteudo', `${altura}px`);
  };
  medir();
  ScrollTrigger.addEventListener('refreshInit', medir);
}

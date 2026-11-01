// ---------------------------------------------------------------------------
// Casos de antes e depois da seção Resultados. Lista única: a ordem daqui é
// a ordem do carrossel, e o contador ("01 / 06") sai do tamanho da lista.
//
// Fotos de cada caso, com o mesmo enquadramento e a mesma luz:
//   fotos/casos/<id>-antes.jpg   e   fotos/casos/<id>-depois.jpg
// Quadradas (1:1), no mínimo 1080 × 1080 px. Depois de trocar, rode
// `npm run imagens` (o build também roda).
//
// Regras do CFO (Resolução 196/2019), obrigatórias:
//  - só casos atendidos pelo próprio Dr. Henrique;
//  - autorização POR ESCRITO do paciente, guardada pelo consultório;
//  - nada de fotos do "durante";
//  - nome e CRO sobre a foto (o site coloca sozinho, a partir de doutor.js).
// Um caso real (provisorio: false) só entra no build com
// autorizacaoPorEscrito: true. Sem isso, o build para com um aviso.
// ---------------------------------------------------------------------------

export const casos = [
  // [CONFIRMAR] casos, tratamentos e fotos: os seis abaixo são provisórios.
  { id: 'caso-01', tratamento: 'Lentes de contato dental', provisorio: true, autorizacaoPorEscrito: false },
  { id: 'caso-02', tratamento: 'Harmonização orofacial', provisorio: true, autorizacaoPorEscrito: false },
  { id: 'caso-03', tratamento: 'Preenchimento labial', provisorio: true, autorizacaoPorEscrito: false },
  { id: 'caso-04', tratamento: 'Lentes de contato dental', provisorio: true, autorizacaoPorEscrito: false },
  { id: 'caso-05', tratamento: 'Clareamento dental', provisorio: true, autorizacaoPorEscrito: false },
  { id: 'caso-06', tratamento: 'Bioestimulador de colágeno', provisorio: true, autorizacaoPorEscrito: false },
];

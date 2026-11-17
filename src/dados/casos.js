// ---------------------------------------------------------------------------
// Casos de antes e depois da seção Resultados. Lista única: a ordem daqui é
// a ordem do carrossel.
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
// Um caso provisório (provisorio: true) só passa enquanto doutor.ficticio for
// true: com ficticio: false, o build para (foto de banco nunca vai ao ar como
// resultado do doutor).
// ---------------------------------------------------------------------------

export const casos = [
  // Fotos do Instagram do doutor (@dr.henriquemartinss), recortadas de capturas
  // de tela que o usuário mandou em 16/11/2026 (docs/creditos-imagens.md).
  // São casos dele, mas continuam como provisórios: falta confirmar a
  // autorização por escrito de cada paciente e o nome do tratamento. Com a
  // autorização em mãos, troque para provisorio: false e
  // autorizacaoPorEscrito: true (sem isso, o build de produção para).
  { id: 'caso-01', tratamento: 'Preenchimento labial', provisorio: true, autorizacaoPorEscrito: false },
  { id: 'caso-02', tratamento: 'Facetas de resina', provisorio: true, autorizacaoPorEscrito: false },
  { id: 'caso-03', tratamento: 'Harmonização orofacial', provisorio: true, autorizacaoPorEscrito: false },
  { id: 'caso-04', tratamento: 'Preenchimento labial', provisorio: true, autorizacaoPorEscrito: false },
  // A CONFIRMAR: o tratamento deste caso (lentes ou facetas).
  { id: 'caso-05', tratamento: 'Lentes de contato dental', provisorio: true, autorizacaoPorEscrito: false },
];

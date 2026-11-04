// ---------------------------------------------------------------------------
// Dados do Dr. Henrique Martins.
// Este é o ÚNICO lugar com nome, CRO, WhatsApp, endereço, Instagram e horários.
// O build espalha esses dados pelo HTML (header, contato, rodapé, marcas nas
// fotos, SEO e dados estruturados).
//
// FICTÍCIO: CRO, WhatsApp escrito, endereço e horários são inventados, para o
// site parecer pronto enquanto os dados reais não chegam (pedido do usuário
// em 01/11/2026). A lista de tudo que é fictício no site está em
// CONTEUDO-PENDENTE.md. Troque pelos reais e mude `ficticio` para false.
// Em `npm run dev` a página recarrega sozinha ao salvar este arquivo.
// ---------------------------------------------------------------------------

export const doutor = {
  // Enquanto for true, o `npm run build` avisa que o site tem dados fictícios.
  ficticio: true,

  nome: 'Henrique Martins',
  tratamento: 'Dr.',
  // Use "Cirurgião-dentista" até a especialidade estar registrada no CFO.
  profissao: 'Cirurgião-dentista',

  cro: {
    uf: 'RS',
    numero: '24817', // FICTÍCIO
  },

  whatsapp: {
    // Só números, com DDI e DDD. Exemplo: '5551999999999'.
    // FICTÍCIO: o mesmo número inventado da exibição, posto nos links a pedido
    // do usuário (02/11/2026). Antes de publicar, troque pelo real: com este,
    // os botões abrem a conversa com um número que pode ser de um desconhecido.
    // Vazio, o link abre o WhatsApp sem destinatário.
    numero: '5551997142083',
    // Como o número aparece escrito no site (vira link para a conversa). FICTÍCIO.
    exibicao: '(51) 99714-2083',
    // Mensagem que já chega escrita na conversa.
    mensagem: 'Olá, Dr. Henrique. Gostaria de agendar uma avaliação.',
  },

  // FICTÍCIO (a rua existe em Novo Hamburgo; o número e a sala, não).
  endereco: {
    logradouro: 'Rua Joaquim Nabuco, 1080',
    complemento: 'Sala 702',
    bairro: 'Centro',
    cidade: 'Novo Hamburgo',
    uf: 'RS',
    cep: '93310-002',
    // Link do Google Maps (botão "Compartilhar" > "Copiar link").
    // Se ficar vazio, o site monta uma busca pelo endereço.
    mapa: '',
  },

  instagram: {
    usuario: 'dr.henriquemartinss',
  },

  // Um item por linha de horário. FICTÍCIO.
  horarios: [
    { dias: 'Segunda a sexta', horas: '9h às 19h' },
    { dias: 'Sábado', horas: '9h às 13h' },
  ],

  site: {
    // Domínio definitivo, com https e sem barra no fim. Ex.: 'https://drhenriquemartins.com.br'
    // Enquanto estiver vazio, o build não gera canonical, sitemap nem URLs absolutas.
    url: '',
  },
};

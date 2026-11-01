// ---------------------------------------------------------------------------
// Dados do Dr. Henrique Martins.
// Este é o ÚNICO lugar com nome, CRO, WhatsApp, endereço, Instagram e horários.
// O build espalha esses dados pelo HTML (header, contato, rodapé, marcas nas
// fotos, SEO e dados estruturados).
//
// Tudo marcado com [CONFIRMAR] precisa ser validado antes de publicar.
// Em `npm run dev` a página recarrega sozinha ao salvar este arquivo.
// ---------------------------------------------------------------------------

export const doutor = {
  nome: 'Henrique Martins',
  tratamento: 'Dr.',
  // Use "Cirurgião-dentista" até a especialidade estar registrada no CFO.
  profissao: 'Cirurgião-dentista',

  cro: {
    uf: 'RS',
    numero: '[CONFIRMAR]',
  },

  whatsapp: {
    // Só números, com DDI e DDD. Exemplo: '5551999999999'. [CONFIRMAR]
    // Enquanto estiver vazio, o link abre o WhatsApp sem destinatário.
    numero: '',
    // Como o número aparece escrito no site. [CONFIRMAR]
    exibicao: '(51) [CONFIRMAR]',
    // Mensagem que já chega escrita na conversa.
    mensagem: 'Olá, Dr. Henrique. Gostaria de agendar uma avaliação.',
  },

  endereco: {
    logradouro: '[CONFIRMAR] Rua e número',
    complemento: '[CONFIRMAR] Sala',
    bairro: '[CONFIRMAR] Bairro',
    cidade: 'Novo Hamburgo',
    uf: 'RS',
    cep: '[CONFIRMAR]',
    // Link do Google Maps (botão "Compartilhar" > "Copiar link").
    // Se ficar vazio, o site monta uma busca pela cidade.
    mapa: '',
  },

  instagram: {
    usuario: 'dr.henriquemartinss',
  },

  // Um item por linha de horário. [CONFIRMAR]
  horarios: [
    { dias: 'Segunda a sexta', horas: '[CONFIRMAR]' },
    { dias: 'Sábado', horas: '[CONFIRMAR]' },
  ],

  site: {
    // Domínio definitivo, com https e sem barra no fim. Ex.: 'https://drhenriquemartins.com.br'
    // Enquanto estiver vazio, o build não gera canonical nem URLs absolutas. [CONFIRMAR]
    url: '',
  },
};

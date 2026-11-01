// HTML gerado a partir dos dados (src/dados). Cada função exportada aqui
// pode ser chamada no HTML com <!-- @gerar nomeDaFuncao -->.
import { escapar, confirmado } from './util.js';

// Serviços listados nos dados estruturados. [CONFIRMAR] lista final de tratamentos.
const SERVICOS = [
  'Lentes de contato dental',
  'Harmonização orofacial',
  'Preenchimento labial',
  'Toxina botulínica',
  'Bioestimulador de colágeno',
  'Clareamento dental',
];

// Dados estruturados schema.org (Dentist). Campos pendentes ficam de fora.
export function schema(c) {
  const d = c.doutor;
  const e = d.endereco;
  const dados = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: c.nomeCompleto,
    description: 'Cirurgião-dentista em Novo Hamburgo/RS. Harmonização orofacial e lentes de contato dental com naturalidade.',
    url: c.site.temUrl ? `${c.site.url}/` : undefined,
    image: c.site.temUrl ? `${c.site.url}/og-imagem.jpg` : undefined,
    telephone: c.whatsapp.temNumero ? `+${d.whatsapp.numero.replace(/\D/g, '')}` : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: confirmado([e.logradouro, e.complemento].filter(confirmado).join(', ')),
      addressLocality: e.cidade,
      addressRegion: e.uf,
      postalCode: confirmado(e.cep),
      addressCountry: 'BR',
    },
    areaServed: { '@type': 'City', name: e.cidade },
    sameAs: [c.instagram.url],
    employee: {
      '@type': 'Person',
      name: d.nome,
      jobTitle: d.profissao,
      identifier: confirmado(d.cro.numero) ? c.cro : undefined,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Tratamentos',
      itemListElement: SERVICOS.map((nome) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: nome } })),
    },
  };
  // JSON.stringify descarta as chaves undefined; "<" escapado evita fechar o <script>.
  const json = JSON.stringify(dados, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

// Open Graph e canonical. Sem o domínio confirmado, não há URLs absolutas.
export function metaSocial(c) {
  const titulo = `${c.nomeCompleto} · Cirurgião-dentista em Novo Hamburgo/RS`;
  const descricao = 'Harmonização orofacial e lentes de contato dental com naturalidade, em Novo Hamburgo/RS.';
  const base = c.site.temUrl ? c.site.url : '';
  const linhas = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:site_name" content="${escapar(c.nomeCompleto)}" />`,
    `<meta property="og:title" content="${escapar(titulo)}" />`,
    `<meta property="og:description" content="${escapar(descricao)}" />`,
    `<meta property="og:image" content="${escapar(base)}/og-imagem.jpg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Monograma HM e o nome ${escapar(c.nomeCompleto)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ];
  if (c.site.temUrl) {
    linhas.push(`<link rel="canonical" href="${escapar(base)}/" />`, `<meta property="og:url" content="${escapar(base)}/" />`);
  }
  return linhas.join('\n    ');
}

// Lista de horários (contato).
export function horarios(c) {
  return c.horarios
    .map((h) => `<li><span>${escapar(h.dias)}</span> <span>${escapar(h.horas)}</span></li>`)
    .join('\n');
}

// Total de casos com dois dígitos, para o contador do carrossel ("01 / 06").
export function totalCasos(c) {
  return String(c.casos.length).padStart(2, '0');
}

// Cards do carrossel de antes e depois, a partir de src/dados/casos.js.
// A foto do depois fica no fundo; a do antes, por cima, recortada até a linha.
// Cada rótulo mora na camada da sua foto: quando a linha passa por cima dele,
// ele some junto com a foto. O controle é um <input type="range"> nativo
// (teclado e leitor de tela); a linha e o botão são só a parte visível.
export function casos(c) {
  const total = c.casos.length;
  const pad = (n) => String(n).padStart(2, '0');
  const tamanhos = '(min-width: 64em) 31vw, 82vw';

  return c.casos
    .map((caso, i) => {
      if (!caso.provisorio && caso.autorizacaoPorEscrito !== true) {
        throw new Error(
          `[casos] ${caso.id}: falta a autorização por escrito do paciente (Resolução CFO 196/2019). ` +
            'Marque autorizacaoPorEscrito: true em src/dados/casos.js só depois de ter o documento assinado.',
        );
      }
      const n = i + 1;
      const tratamento = escapar(caso.tratamento);
      const provisoria = caso.provisorio ? ' (foto provisória)' : '';
      const img = (lado, rotulo) =>
        `<x-img src="casos/${caso.id}-${lado}" alt="${rotulo}: ${tratamento}${provisoria}" sizes="${tamanhos}" class="comparador__img" classe-picture="comparador__foto" draggable="false"></x-img>`;

      return `<li class="caso" aria-roledescription="slide" aria-label="Caso ${n} de ${total}: ${tratamento}">
  <figure class="caso__figura">
    <div class="comparador" data-comparador data-cursor="arraste" style="--posicao: 50%">
      <div class="comparador__camada comparador__camada--depois">
        ${img('depois', 'Depois')}
        <p class="comparador__rotulo comparador__rotulo--depois" aria-hidden="true">Depois</p>
      </div>
      <div class="comparador__camada comparador__camada--antes">
        ${img('antes', 'Antes')}
        <p class="comparador__rotulo comparador__rotulo--antes" aria-hidden="true">Antes</p>
      </div>
      <div class="comparador__linha" aria-hidden="true">
        <span class="comparador__botao"><svg class="comparador__icone" viewBox="0 0 24 24" focusable="false"><use href="#olho" /></svg></span>
      </div>
      <p class="comparador__marca" aria-hidden="true">${escapar(c.marcaFoto)}</p>
      <div class="comparador__alca" data-comparador-alca aria-hidden="true"></div>
      <input class="comparador__controle" type="range" min="0" max="100" step="5" value="50" data-comparador-controle aria-label="Comparar antes e depois: caso ${n}, ${tratamento}" aria-valuetext="50% antes, 50% depois" />
    </div>
    <figcaption class="caso__nome">${tratamento}</figcaption>
  </figure>
</li>`;
    })
    .join('\n');
}

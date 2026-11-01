# Origem das imagens

Toda imagem do site precisa constar aqui: arquivo original em `fotos/`, de onde veio e se é provisória.
Fotos de banco de imagens nunca podem aparecer como resultado de tratamento (Resolução CFO 196/2019).

Fora o retrato provisório do hero (imagem de banco, ver a tabela), nenhuma imagem do site veio de banco de imagens. O Unsplash foi considerado (o briefing permitia fotos de ambiente e textura), mas a busca automática exige login. No lugar, as demais provisórias foram renderizadas aqui mesmo, com Three.js, na mesma porcelana da pérola do hero: naturezas-mortas sem rostos nem sorrisos, que não podem ser confundidas com resultados. Para gerar de novo: `node scripts/gerar-provisorias.mjs [filtro]` e depois `npm run imagens`.

| Arquivo original | Onde aparece | Origem | Situação |
| --- | --- | --- | --- |
| `fotos/hero/perola.png` | Hero (imagem estática da pérola, antes do 3D e sem WebGL) | Render próprio da cena 3D do site (`src/js/3d/perola.js`), gerado com `npm run perola` | Definitiva. Se mudar o material ou a luz da pérola, rode `npm run perola` de novo |
| `fotos/hero/doutor-capa.png` | Hero, à direita do título | Banco de imagens. A primeira versão do arquivo tinha a marca d'água "pngtree" visível no jaleco (`capturas/doutor-capa-jaleco.png`). A atual (PNG recortado de 554 × 554, com estetoscópio no pescoço, que entrou no lugar dela em 31/10/2026) também mostra restos de marca d'água circular no jaleco (`capturas/marca-atual-zoom.png`) | **Não pode ir ao ar.** Entra a foto do Dr. Henrique recortada, PNG transparente 4:5, 1600 × 2000 px ou mais [CONFIRMAR] |
| `fotos/tratamentos/rosto.jpg` | Tratamentos, bloco Rosto | Render próprio: seixos de porcelana (cena `seixos`, fundo `areia`) | Provisório [CONFIRMAR] |
| `fotos/tratamentos/sorriso.jpg` | Tratamentos, bloco Sorriso | Render próprio: prato com pérola (cena `prato`, fundo `grafite`) | Provisório [CONFIRMAR] |
| `fotos/procedimentos/lentes-de-contato-dental.jpg` | Lista de procedimentos (imagem que segue o cursor) | Render próprio (cena `lamina`) | Provisório [CONFIRMAR] |
| `fotos/procedimentos/harmonizacao-facial.jpg` | Lista de procedimentos | Render próprio (cena `par`) | Provisório [CONFIRMAR] |
| `fotos/procedimentos/preenchimento-labial.jpg` | Lista de procedimentos | Render próprio (cena `almofada`) | Provisório [CONFIRMAR] |
| `fotos/procedimentos/toxina-botulinica.jpg` | Lista de procedimentos | Render próprio (cena `onda`) | Provisório [CONFIRMAR] |
| `fotos/procedimentos/bioestimulador-de-colageno.jpg` | Lista de procedimentos | Render próprio (cena `camadas`) | Provisório [CONFIRMAR] |
| `fotos/procedimentos/clareamento-dental.jpg` | Lista de procedimentos | Render próprio (cena `esfera`) | Provisório [CONFIRMAR] |
| `fotos/sobre/retrato.jpg` | Sobre | Render próprio: esfera sobre pedestal (cena `pedestal`, fundo `grafite`) | Provisório. Entra o retrato do doutor [CONFIRMAR] |
| `fotos/espaco/espaco-01.jpg` … `espaco-05.jpg` | O espaço (galeria lateral); a 05 abre até a tela cheia e vira o fundo do manifesto | Render próprio de ambientes em Three.js, na paleta do site (`ferramentas/ambientes.html`, cenas `recepcao`, `arco`, `cortina`, `nicho` e `sala`). Ilustram um consultório; não são o consultório do doutor | Provisório. Entram as fotos reais do consultório [CONFIRMAR] |
| `fotos/atendimento/atendimento-01.jpg` … `atendimento-04.jpg` | Manifesto (as quatro fotos que sobem sobre o fundo) | Render próprio (`ferramentas/natureza-morta.html`, cenas `espelho`, `xicara`, `lamina` e `caderno`): detalhes sem paciente | Provisório. Fotos reais sem paciente e nunca do "durante" [CONFIRMAR] |
| `fotos/casos/caso-01-antes.jpg` … `caso-06-depois.jpg` (12 arquivos) | Resultados (antes e depois) | Placas próprias em HTML com as fontes do site (`ferramentas/placa.html`), escritas "Caso 01 · Foto provisória · antes/depois" | Provisório. Só casos do próprio doutor, com autorização por escrito [CONFIRMAR] |
| `public/og-imagem.jpg` | Prévia do link em redes e mensageiros (Open Graph) | Placa própria em HTML (`ferramentas/placa.html?tipo=og`) com o monograma, o nome e a pérola | Definitiva enquanto a marca for o monograma provisório |
| `public/monograma.svg`, `public/favicon.svg`, `public/favicon-32.png`, `public/apple-touch-icon.png` | Header, preloader, favicon | Desenho próprio do monograma HM | Provisório até o doutor aprovar ou enviar a marca dele [CONFIRMAR] |
| Ícones de olho e seta (`src/secoes/simbolos.html`) | Botão do slider, setas do carrossel | Desenho próprio em SVG | Definitivo |

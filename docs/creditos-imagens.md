# Origem das imagens

Toda imagem do site precisa constar aqui: arquivo original em `fotos/`, de onde veio e se é provisória.
Fotos de banco de imagens nunca podem aparecer como resultado de tratamento (Resolução CFO 196/2019).

Em 02/11/2026 as fotos do espaço, do atendimento (manifesto) e dos dois blocos de tratamento passaram a ser fotos de banco do Unsplash, a pedido do usuário. Todas estão sob a [Licença Unsplash](https://unsplash.com/license): uso comercial liberado, sem pagamento e sem crédito obrigatório (o crédito fica registrado aqui mesmo assim). A licença não inclui autorização de imagem das pessoas fotografadas nem uso que sugira que elas endossam o consultório. Por isso essas fotos continuam provisórias: são de outras clínicas e de modelos, e saem quando chegarem as fotos do próprio consultório.

As escolhas foram feitas com `node scripts/buscar-unsplash.mjs "<busca>"` (folha de contato em `capturas/unsplash/`). O recorte de cada foto (3:2 ou 4:5) foi feito antes de gravar em `fotos/`; depois, `npm run imagens`.

As demais provisórias (procedimentos e casos) foram renderizadas aqui mesmo, com Three.js ou HTML, na paleta do site. Para gerar de novo: `node scripts/gerar-provisorias.mjs [filtro]` e depois `npm run imagens`.

| Arquivo original | Onde aparece | Origem | Situação |
| --- | --- | --- | --- |
| `fotos/hero/perola.png` | Hero (imagem estática da pérola, antes do 3D e sem WebGL) | Render próprio da cena 3D do site (`src/js/3d/perola.js`), gerado com `npm run perola` | Definitiva. Se mudar o material ou a luz da pérola, rode `npm run perola` de novo |
| `fotos/hero/doutor-capa.png` | Hero, à direita do título | Unsplash, [Vitaly Gariev](https://unsplash.com/photos/XqMo4OlBnh0) (`XqMo4OlBnh0`): médico sorrindo, de barba, óculos e jaleco, braços cruzados, escolhido em 03/11/2026 por ser parecido com a referência que o usuário mandou (a foto da referência é de uma clínica e não pode ser usada). Fundo removido aqui com `@imgly/background-removal-node` (modelo local, fora do projeto), recorte 4:5, 1600 × 2000, e o alto do cabelo, cortado na foto original, arredondado com uma máscara suave. Substituiu o PNG de banco anterior, que tinha marca d'água no jaleco | **Não pode ir ao ar como retrato do doutor:** é um modelo. Entra a foto do Dr. Henrique recortada, PNG transparente 4:5, 1600 × 2000 px ou mais |
| `fotos/sobre/retrato.jpg` | Sobre | O mesmo PNG do hero, a 92% do quadro, sobre um fundo de linho em degradê (1600 × 2000) | **Não pode ir ao ar como retrato do doutor.** Entra o retrato dele, 4:5, 1600 × 2000 px ou mais |
| `fotos/espaco/espaco-01.jpg` | O espaço (galeria), 1ª foto | Unsplash, [rawkkim](https://unsplash.com/photos/a-white-room-with-a-tree-in-the-center-X8Y3CJA0aNs) (`X8Y3CJA0aNs`): recepção branca com uma árvore no centro. Recorte 3:2 | Provisória. Entram as fotos reais do consultório |
| `fotos/espaco/espaco-02.jpg` | O espaço, 2ª foto | Unsplash, [kimia kazemi](https://unsplash.com/photos/a-room-with-a-table-chairs-and-a-clock-ixvrfJWCy3A) (`ixvrfJWCy3A`): passagem em arco para uma sala de espera. Recorte 4:5. Tem um logotipo redondo pequeno na parede | Provisória |
| `fotos/espaco/espaco-03.jpg` | O espaço, 3ª foto | Unsplash, [Kari Bjorn Photography](https://unsplash.com/photos/a-dental-room-with-a-desk-and-chairs-Fdku_oMrDvk) (`Fdku_oMrDvk`): consultório odontológico claro. Recorte 3:2 | Provisória |
| `fotos/espaco/espaco-04.jpg` | O espaço, 4ª foto | Unsplash, [Enio Pereira da Silva](https://unsplash.com/photos/hallway-with-paneled-walls-and-art-mISkLiMzypI) (`mISkLiMzypI`): corredor com quadros e poltrona. Recorte 4:5 | Provisória |
| `fotos/espaco/espaco-05.jpg` | O espaço, 5ª foto; abre até a tela cheia e vira o fundo do manifesto | Unsplash, [C. Stone](https://unsplash.com/photos/dimly-lit-room-with-a-table-lamp-chairs-and-magazines-_UJDZiZt5XY) (`_UJDZiZt5XY`): canto de espera à meia-luz, em preto e branco. Escurecida 30% (`linear(0.7)` no sharp) para o texto do manifesto, que fica por cima, passar no contraste | Provisória. A foto real que entrar aqui precisa ser escura o bastante para o texto (`node scripts/contraste-fundo.mjs`) |
| `fotos/atendimento/atendimento-01.jpg` | Manifesto (fotos que sobem) | Unsplash, [Filip Rankovic Grobgaard](https://unsplash.com/photos/a-man-and-a-woman-using-a-touch-screen-device-Bd0RmCsJOCc) (`Bd0RmCsJOCc`): planejamento na tela com a paciente na cadeira. Recorte 4:5 | Provisória. Nunca foto do "durante" |
| `fotos/atendimento/atendimento-02.jpg` | Manifesto | Unsplash, [Nate Johnston](https://unsplash.com/photos/a-person-in-a-white-coat-fNSPSQAH1mQ) (`fNSPSQAH1mQ`): dentista explicando com um modelo. Recorte 4:5 | Provisória |
| `fotos/atendimento/atendimento-03.jpg` | Manifesto | Unsplash, [Caroline LM](https://unsplash.com/photos/dental-mirror-and-explorer-tool-ux18C551ghI) (`ux18C551ghI`): espelho e sonda sobre fundo claro. Recorte 4:5 | Provisória |
| `fotos/atendimento/atendimento-04.jpg` | Manifesto | Unsplash, [Harold Hisona](https://unsplash.com/photos/dentist-talking-to-patient-in-a-modern-dental-office-Bg81yWKZlMg) (`Bg81yWKZlMg`): conversa com a paciente na cadeira. Recorte 4:5 | Provisória |
| `fotos/tratamentos/rosto.jpg` | Tratamentos, bloco Rosto | Unsplash, [Look Studio](https://unsplash.com/photos/woman-with-auburn-hair-and-freckles-FODRyogbNU0) (`FODRyogbNU0`): rosto de frente sobre fundo bege. Recorte 4:5 | Provisória e só ilustrativa: não é paciente nem resultado |
| `fotos/tratamentos/sorriso.jpg` | Tratamentos, bloco Sorriso | Unsplash, [Tony Litvyak](https://unsplash.com/photos/a-close-up-of-a-womans-mouth-with-white-teeth-glPVwPr1FKo) (`glPVwPr1FKo`): sorriso em close. Recorte 4:5 | Provisória e só ilustrativa: não é paciente nem resultado |
| `fotos/procedimentos/lentes-de-contato-dental.jpg` | Lista de procedimentos (imagem que segue o cursor) | Render próprio (cena `lamina`) | Provisória |
| `fotos/procedimentos/harmonizacao-facial.jpg` | Lista de procedimentos | Render próprio (cena `par`) | Provisória |
| `fotos/procedimentos/preenchimento-labial.jpg` | Lista de procedimentos | Render próprio (cena `almofada`) | Provisória |
| `fotos/procedimentos/toxina-botulinica.jpg` | Lista de procedimentos | Render próprio (cena `onda`) | Provisória |
| `fotos/procedimentos/bioestimulador-de-colageno.jpg` | Lista de procedimentos | Render próprio (cena `camadas`) | Provisória |
| `fotos/procedimentos/clareamento-dental.jpg` | Lista de procedimentos | Render próprio (cena `esfera`) | Provisória |
| `fotos/casos/caso-01-antes.jpg` … `caso-06-depois.jpg` (12 arquivos) | Resultados (antes e depois) | Placas próprias em HTML com as fontes do site (`ferramentas/placa.html`), escritas "Caso 01 · Foto provisória · antes/depois" | Provisórias. Só casos do próprio doutor, com autorização por escrito |
| `public/og-imagem.jpg` | Prévia do link em redes e mensageiros (Open Graph) | Placa própria em HTML (`ferramentas/placa.html?tipo=og`) com o monograma, o nome e a pérola | Definitiva enquanto a marca for o monograma provisório |
| `public/monograma.svg`, `public/favicon.svg`, `public/favicon-32.png`, `public/apple-touch-icon.png` | Header, preloader, favicon | Desenho próprio do monograma HM | Provisórios até o doutor aprovar ou enviar a marca dele |
| Ícones de olho e seta (`src/secoes/simbolos.html`) | Botão do slider, setas do carrossel | Desenho próprio em SVG | Definitivos |

Os renders antigos do espaço, do atendimento, do sobre e dos blocos de tratamento continuam reproduzíveis (`ferramentas/ambientes.html` e `ferramentas/natureza-morta.html`). O `gerar-provisorias.mjs` grava esses em `capturas/renders/`, para não apagar as fotos.

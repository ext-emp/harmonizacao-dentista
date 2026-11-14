# Site do Dr. Henrique Martins: briefing

Construa nesta pasta um site one-page com nível de premiação Awwwards para o Dr. Henrique Martins, cirurgião-dentista em Novo Hamburgo/RS (Instagram @dr.henriquemartinss). O site tem dois focos: harmonização orofacial com naturalidade e lentes de contato dental. O público é de alto padrão, mas o texto nunca diz isso: a exclusividade aparece no design, no espaço em branco e no tom.

Quero o site completo hoje. Priorize ter todas as seções funcionando antes de refinar detalhes. Faça tudo nesta conversa, sem disparar workflows, para eu acompanhar. A única exceção é a revisão da etapa 4. Inicialize um repositório git e faça um commit ao fim de cada etapa.

## Antes de começar

1. Salve este briefing em docs/briefing.md. Crie também .kiro/steering/projeto.md com um resumo curto das regras permanentes (stack, regras do CFO, convenções e onde ficam os dados editáveis), para as próximas conversas nesta pasta já terem o contexto.

2. Confira se Node.js LTS e git estão instalados. Se faltar algum, pare e me diga como instalar.

3. Estude as referências https://aventuradentalarts.com/ (Site do Dia no Awwwards, paleta de duas cores) e https://lavadental.lv/en (Menção Honrosa no Awwwards, página única e contida, com movimento estruturado). Com Playwright ou outra ferramenta de navegador, tire screenshots em 1440×900 e 390×844 em vários pontos da rolagem e analise tipografia, grid, espaçamentos, ritmo e animações. Elas servem só de inspiração de estrutura e movimento: textos, imagens e código devem ser originais.

4. Não tente ler o Instagram, que bloqueia acesso automático. Se eu anexar prints do perfil, use-os para alinhar cores, fotos e tom.

## Direção visual

- Conceito: naturalidade como luxo. Um bom resultado não chama atenção para si.

- Paleta inicial, para ajustar depois de estudar as referências: porcelana #F3EFE8 e grafite quente #161513 como base, e champagne #BFA77A só em detalhes (linhas, ícones, botão do slider). Champagne nunca em texto sobre fundo claro. As seções podem alternar fundo claro e escuro, e todo texto precisa de contraste WCAG AA.

- Tipografia: serifa editorial nos títulos (Cormorant Garamond ou Instrument Serif) e sans limpa no texto (Manrope ou General Sans), usando só fontes com licença gratuita para uso comercial, hospedadas no próprio site. Títulos grandes com clamp(), muito espaço em branco e grid editorial de 12 colunas.

- Movimento: easings e durações definidos como tokens e usados no site todo. Revelações suaves, nada quicando ou piscando.

- Nada com cara de template ou de IA: sem gradiente roxo, glassmorphism, ícones genéricos, emojis ou cards iguais com sombra.

- Contenção: não adicione seções, widgets ou efeitos fora deste briefing sem me perguntar.

## Stack

Vite com JavaScript puro, GSAP com ScrollTrigger e SplitText (todos os plugins do GSAP são gratuitos), Lenis para o scroll suave e Three.js para o 3D. Site estático, pronto para publicar na Vercel ou na Netlify. O conteúdo fica escrito no HTML, para SEO e para funcionar sem JavaScript. Os dados do doutor (nome, CRO, WhatsApp, endereço, Instagram e horários) ficam centralizados num único lugar. Código em módulos pequenos, comentado em português.

## Seções, nesta ordem

1. Preloader: monograma HM e contador de 0 a 100, saindo como cortina para revelar o hero. Até uns 2 segundos e só na primeira visita da sessão.

2. Header: monograma, menu (Tratamentos, Resultados, Sobre, Consulta, FAQ, Contato) e botão "Agendar avaliação" para o WhatsApp. Esconde ao rolar para baixo e volta ao rolar para cima. No celular, menu em tela cheia com os links entrando em sequência.

3. Hero: título gigante em serifa revelado linha a linha, subtítulo com os dois focos e a cidade, botão principal e indicação de scroll. Ao fundo, um objeto 3D discreto em Three.js: uma forma orgânica abstrata com acabamento de porcelana ou pérola (material físico com clearcoat e iridescência sutil, luz de estúdio suave), que se deforma devagar e reage ao cursor no desktop e ao scroll em qualquer aparelho. Se tiver uma ideia melhor de objeto, proponha na etapa 1. Títulos para escolher ou melhorar: "Naturalidade é o novo luxo." ou "O luxo de parecer você."

4. Manifesto: parágrafo grande cujas palavras acendem conforme o scroll, seguido de um bloco de números com contagem animada.

5. Tratamentos: dois blocos grandes, Rosto (harmonização orofacial) e Sorriso (lentes de contato dental), com imagem saindo de máscara e tilt 3D no hover. Abaixo, a lista numerada dos procedimentos em linhas grandes, em que o texto desliza e uma imagem segue o cursor no hover. Lista provisória: lentes de contato dental, harmonização facial completa, preenchimento labial, toxina botulínica, bioestimulador de colágeno e clareamento dental.

6. Resultados: carrossel de antes e depois (detalhes abaixo).

7. Sobre o doutor: retrato grande com revelação por máscara e parallax, texto curto e formação.

8. A experiência: seis diferenciais numerados de 01 a 06, no estilo da LAVA dental, com o título fixo na tela enquanto os itens passam e um contador "01 / 06".

9. A primeira consulta: etapas numeradas em scroll horizontal fixo no desktop. No celular, lista vertical com uma linha de progresso.

10. FAQ: acordeão com animação suave de altura. Perguntas de quem considera esses tratamentos, como se o resultado fica artificial e se as lentes desgastam os dentes, com respostas sem promessas.

11. Contato e rodapé: chamada final grande com botão magnético para o WhatsApp com mensagem pré-preenchida, endereço com link para o mapa, horários e Instagram. No rodapé, "Henrique Martins" gigante ocupando toda a largura e, abaixo, "Dr. Henrique Martins · Cirurgião-dentista · CRO-RS nº [CONFIRMAR]".

## Resultados (antes e depois)

O print anexo é a referência: cards claros com cantos arredondados, foto quadrada dividida por uma linha vertical fina e, no meio dela, um botão redondo com ícone de olho. Os rótulos ANTES e DEPOIS ficam em branco, caixa alta, nos cantos inferiores, e o nome do tratamento fica centralizado abaixo da foto, em serifa. Adapte ao visual do site.

- O slider se move arrastando com mouse ou dedo e pelo teclado (setas, Home e End), e é acessível a leitor de tela.

- No toque, arrastar perto da linha move o slider e arrastar no resto da foto passa o carrossel. A rolagem vertical da página continua funcionando.

- Quando um card entra na tela, o slider faz um vaivém curto para mostrar que é interativo.

- Carrossel com setas e contador "01 / 06": 3 cards visíveis no desktop e, no celular, 1 card e um pedaço do próximo.

- Sobre cada foto, uma marca discreta "Dr. Henrique Martins · CRO-RS nº [CONFIRMAR]". A seção traz a nota "Imagens divulgadas com autorização dos pacientes."

- Fotos provisórias neutras e marcadas como provisórias. Nunca use banco de imagens como se fosse resultado. Os casos ficam numa lista única, com nomes de arquivo padronizados, para eu trocar as fotos com facilidade.

## Efeitos e interações

- Lenis sincronizado com o ScrollTrigger; os links do menu rolam suavemente até a seção.

- Títulos revelados por linha com SplitText e máscara, imagens saindo de máscara com leve zoom e parallax discreto.

- Cursor customizado com estados ("Arraste" no slider, "Ver" nos tratamentos, destaque nos links), botões magnéticos e texto de botão que rola no hover. Cursor e efeito magnético só existem em aparelhos com mouse.

- Granulação sutil e estática sobre o site.

- Regra do celular: todo efeito de hover, exceto cursor e efeito magnético, tem um equivalente no toque, disparado quando o elemento passa pelo centro da tela (uma classe ativada pelo ScrollTrigger). O tilt 3D, por exemplo, vira uma rotação leve ligada ao scroll. Detecte o tipo de aparelho pela media query (hover: hover) and (pointer: fine), nunca pela largura da tela, e deixe os estilos de :hover dentro dela.

- Cuidados: SplitText só depois de as fontes carregarem e refeito no resize; svh em vez de vh no hero, por causa da barra do Safari; ScrollTrigger.refresh depois que as imagens carregarem.

## Qualidade técnica

- Acessibilidade: HTML semântico, lang="pt-BR", alt em todas as imagens, foco visível, navegação por teclado e link "Pular para o conteúdo".

- Com prefers-reduced-motion: sem scroll suave, parallax ou animações longas, com todo o conteúdo visível e o slider funcionando.

- Desempenho: o hero mostra primeiro uma imagem estática do objeto 3D, que também serve de alternativa sem WebGL, e o Three.js carrega depois do conteúdo. O render pausa fora da tela e com a aba oculta, com pixel ratio limitado e versão mais leve no celular. Imagens em AVIF ou WebP com srcset e lazy loading, e fontes com preload.

- SEO: title, meta description, Open Graph, favicon e dados estruturados (schema.org Dentist) com cidade e serviços.

- Sem formulários, cookies ou rastreamento por enquanto.

## Regras do CFO (obrigatórias)

O site fica em nome do Dr. Henrique, como pessoa física, seguindo a Resolução CFO 196/2019.

- Antes e depois só de casos dele, com nome e CRO na imagem e autorização por escrito do paciente. Nada de fotos do "durante".

- Nome e CRO também no rodapé.

- Sem preços, promoções, promessa ou garantia de resultado, superlativos ("o melhor", "referência", "nº 1") e comparações com outros profissionais.

- Não chame o doutor de especialista sem eu confirmar o registro da especialidade no CFO; use "cirurgião-dentista".

- Sem depoimentos de pacientes até o doutor confirmar com o CRO-RS.

## Conteúdo provisório

Escreva em português do Brasil, com tom sereno, sofisticado e direto, sem jargão e sem exagero. Fica provisório e marcado com [CONFIRMAR] tudo que depende do doutor: CRO, WhatsApp, endereço, horários, números, formação, diferenciais, lista final de tratamentos, textos clínicos (descrições e respostas do FAQ) e fotos. Não invente números, cursos nem equipamentos; deixe o espaço marcado. Como imagens provisórias, use fotos do Unsplash só de ambiente, texturas e detalhes, sem rostos nem sorrisos para não parecerem resultados do doutor, ou crie placeholders elegantes. Registre a origem de cada imagem. Crie CONTEUDO-PENDENTE.md com cada item a confirmar, onde ele aparece e o tamanho e a proporção ideais de cada foto.

## Etapas

1. Base: projeto configurado, design system (cores, tipografia, grid, espaçamentos e easings), preloader, header e hero com o 3D. Ao terminar, me mostre screenshots em 1440×900 e 390×844 e o endereço local, e espere eu aprovar a direção visual.

2. Todas as outras seções, com efeitos e conteúdo provisório.

3. Polimento: celular, acessibilidade, reduced motion, desempenho e SEO.

4. Fechamento: a verificação abaixo, uma revisão independente do código por outro modelo (por exemplo, o workflow de revisão com dois modelos, se estiver disponível), correção dos bugs reais, README.md (como rodar, trocar fotos e dados e publicar) e um resumo do que ficou pendente.

Depois que eu aprovar a etapa 1, siga até o fim sem parar, a menos que algo dependa de mim.

## Verificação (código que parece certo não basta)

- npm run build sem erros e console do navegador sem erros.

- Screenshots de cada seção em 1440×900 e 390×844, revisados por você, com correção de sobreposições, cortes e espaçamentos.

- Testes com toque emulado e com prefers-reduced-motion emulado.

- Slider testado com mouse, toque e teclado.

- Hero bonito também sem WebGL.

- Lighthouse mobile, se conseguir rodar: Performance 80 ou mais, Acessibilidade 95 ou mais e SEO 95 ou mais.

- No fim, deixe o servidor local rodando e me passe o endereço, ou me diga o comando para eu rodar.

---

## Anexo: o print de referência do antes e depois

Junto com o briefing veio um print (não salvo aqui; é de outro segmento, correção postural). O que ele mostra:

- Foto em retrato (bem mais alta que larga), sem cantos arredondados visíveis, sobre fundo creme.
- Linha vertical fina e clara dividindo a foto, com um botão redondo branco no meio contendo setas "‹ ›".
- Rótulos "ANTES" e "DEPOIS" nos cantos **superiores**, em texto escuro, caixa alta e espaçado, dentro de etiquetas brancas.
- Legenda abaixo, alinhada à esquerda, em sans ("Correção postural — vista de perfil"), e contador "01 / 15" à direita.

O texto do briefing pede algo diferente em alguns pontos (foto quadrada, cantos arredondados, ícone de olho, rótulos brancos nos cantos inferiores, nome centralizado em serifa). Vale o texto do briefing; do print aproveitamos a mecânica (linha fina, botão central, rótulos e contador).

---

## Atualizações do usuário

- 31/10/2026: não fazer commit nem push e não subir o projeto em lugar nenhum. O repositório de destino será informado no fim do projeto. (Substitui o pedido de commit ao fim de cada etapa.)
- 31/10/2026: o usuário indicou o repositório de destino (https://github.com/ext-emp/harmonizacao-dentista.git, branch `main`) e pediu para subir tudo, para continuar em outro computador. A regra de não fazer commit nem push vale de novo depois desse envio, até o usuário pedir.
- 31/10/2026: etapa 1 aprovada (paleta, tipografia, pérola e título "O luxo de parecer você.").
- 31/10/2026: **hero com retrato.** Além da pérola, o hero leva o retrato do Dr. Henrique recortado, sem fundo (só a pessoa), com a pérola 3D atrás dele e os mesmos efeitos (cursor, scroll, deformação). O layout continua limpo: texto à esquerda, sem passar por cima da pessoa. É sempre o doutor: nunca paciente (a Resolução CFO 196/2019 só libera imagem de paciente como diagnóstico ou resultado final) e nunca foto de banco. Até a foto chegar, fica um busto de porcelana sem rosto como provisório.
- 31/10/2026: **pérola fora de trás do retrato.** A pérola atrás do doutor não fazia sentido. O retrato do hero passa a ser `fotos/hero/doutor-capa.png`, e a pérola ganha um lugar próprio no hero, sem cruzar a pessoa nem o texto. Com o scroll, ela viaja e pousa na abertura de "O espaço". (Substitui a pérola atrás do retrato e o busto provisório do item anterior.)
- 31/10/2026: **transições da LAVA e "O espaço".** Copiar as transições de https://lavadental.lv/en: cada seção sobe por cima da anterior, que fica parada. "O espaço" (o consultório) vira a segunda seção, com galeria em scroll lateral, e a última foto abre até a tela cheia e vira o fundo dos atendimentos (o manifesto, com fotos do atendimento subindo por cima). O resto do site fica como estava. Ordem nova: preloader, header, hero, O espaço (com o manifesto e os números), tratamentos, resultados, sobre, experiência, consulta, FAQ, contato e rodapé.
- 31/10/2026: **a roda.** A experiência e a primeira consulta seguem a roda da LAVA: a cada gesto de rolagem, a roda gira e passa um passo. (Substitui o título fixo do item 8 e o scroll horizontal do item 9.)
- 01/11/2026: **uma roda só.** O usuário não gostou de duas seções iguais seguidas e pediu para deixar uma só nesse layout ou unir as duas. A primeira consulta foi unida à experiência: seis etapas, do agendamento ao acompanhamento, na roda (tema escuro). No menu, "Consulta" virou "Experiência". (Substitui os itens 8 e 9.)
- 01/11/2026: desempenho e SEO revisados (antes adiados), e o layout conferido em celulares, iPad e tablets.
- 01/11/2026: **sem `[CONFIRMAR]` na tela.** O usuário achou as etiquetas feias e pediu dados realistas no lugar, mesmo que falsos, para trocar depois. CRO, telefone escrito, endereço, horários, números do manifesto e formação viraram valores fictícios; as notas de "provisório" com `[CONFIRMAR]` saíram. A lista do que é fictício fica em `CONTEUDO-PENDENTE.md`. (Substitui, para a tela, a regra de marcar com `[CONFIRMAR]` em "Conteúdo provisório".)
- 02/11/2026: **fotos de banco no lugar dos renders.** A pedido do usuário: fotos bonitas de clínicas na galeria do "O espaço", fotos reais do atendimento no manifesto, rosto e sorriso reais nos blocos de tratamento, e o retrato do hero também no Sobre. Vieram do Unsplash (licença livre), com crédito em `docs/creditos-imagens.md`. No manifesto, o usuário escolheu fotos sem o "durante" (conversa, avaliação, planejamento, instrumentos). Continuam provisórias e com a etiqueta na tela. (Substitui, para as provisórias, o "nunca foto de banco" de 31/10/2026; o retrato definitivo continua sendo o do doutor.)
- 02/11/2026: correções de uma revisão visual feita no Chrome (FAQ aparecendo atrás do contato no fim da página, contadores "1 2", números da roda cortados no celular, faixa da foto sob os números, header transparente depois do FAQ, fio claro sobre o rodapé, rolagem lateral em 320 px, marca do antes e depois em duas linhas, áreas de toque pequenas, `sizes` das imagens). Com o aval do usuário: fotos do manifesto menores e nas bordas no celular e no tablet, hero ajustado para telas baixas (celular em pé baixo e deitado) e o número (51) 99714-2083, que é fictício, nos links do WhatsApp.
- 03/11/2026: **retrato provisório novo.** O usuário pediu outro retrato sem fundo, só a pessoa, parecido com uma foto de referência de outra clínica (que não pode ser usada): veio do Unsplash um médico de pele clara, barba, sorrindo, de jaleco e braços cruzados, com o fundo recortado. Vale para o hero e para o Sobre. Continua provisório até chegar a foto do doutor.
- 09/11/2026: **manifesto sem fotos por cima do texto, blocos menores e fotos reais nos procedimentos.** O usuário não quis as fotos do atendimento passando por cima do parágrafo do manifesto: do tablet em diante (com altura para o parágrafo), ele fica parado à esquerda e as fotos sobem pela direita; no celular e em telas baixas, ele rola com a página, acendendo, e as fotos vêm depois. Nos blocos Rosto e Sorriso, as fotos diminuíram para a foto e o texto caberem juntos na tela (do tablet em diante, os dois blocos inteiros de uma vez, com um degrau menor entre eles). A lista de procedimentos ganhou uma foto de banco (Unsplash) de cada tipo, só ilustrativa e sem o "durante". O pedido de fotos reais de antes e depois não entrou: ali só podem ir casos do próprio doutor, com autorização por escrito (Resolução CFO 196/2019), e as placas provisórias ficam até eles chegarem (mudou no mesmo dia: ver "blocos de tratamento centralizados", de 10/11/2026, que trocou as placas por fotos de banco). (Substitui, no manifesto, as "fotos do atendimento subindo por cima" de 31/10/2026.)
- 10/11/2026: **hero escuro no celular.** O usuário achou o hero do celular feio (retrato pequeno flutuando no alto, botão cortado na borda, pérola espremida no canto). Entre quatro propostas desenhadas no Claude Design, escolheu a de foto em tela cheia: no celular e no tablet em pé, o hero fica escuro, com uma foto do consultório de fundo, o retrato por cima e o texto claro embaixo, sobre um véu grafite que cobre o jaleco. O rosto fica sempre acima do texto, o botão cabe sempre na primeira tela, o "Rolar" sai e a pérola fica ao lado da cabeça. Na viagem até "O espaço", ela espera a seção passar por ela antes de deslizar, para não cruzar o rosto. A tela larga não muda. (Substitui, só no celular, o "texto sem passar por cima da pessoa" de 31/10/2026: o texto passa sobre o jaleco, nunca sobre o rosto.)
- 10/11/2026: **sem a marca "Retrato provisório".** O usuário achou a etiqueta feia e pediu para tirar. Saiu do hero e do Sobre; o retrato de banco continua provisório (está no `CONTEUDO-PENDENTE.md` e no `alt`) e precisa ser trocado pela foto do doutor antes de o site ir ao ar. A etiqueta "Fotos provisórias" da galeria do "O espaço" continua. (Substitui, para o retrato, a etiqueta na tela de 02/11/2026.)
- 10/11/2026: **botão sozinho no hero e galeria subindo parada, no celular.** No hero do celular, só o botão "Agende sua avaliação", centralizado; o "Atendimento pelo WhatsApp" fica só na tela larga. Na galeria do "O espaço", no celular e no tablet em pé, as fotos sobem paradas (a primeira no centro da largura) até o meio da tela e só então começam a passar; antes, o trilho já andava enquanto as fotos subiam. A tela larga não muda.
- 10/11/2026: **nenhuma marca de provisório na tela.** O usuário pediu para tirar tudo o que indicava foto provisória: saiu a etiqueta "Fotos provisórias" da galeria do "O espaço", e as placas de antes e depois ficaram só com "Caso 01" a "Caso 06" (sem "Foto provisória · antes/depois"). As fotos continuam provisórias e listadas no `CONTEUDO-PENDENTE.md`, no `docs/creditos-imagens.md` e no `alt`; todas precisam ser trocadas antes de o site ir ao ar. (Substitui o "marcadas como provisórias" da seção de conteúdo e as etiquetas na tela de 02/11/2026; a etiqueta da galeria, mantida no item anterior, também sai.)
- 10/11/2026: **galeria sem fotos subindo, no celular.** O usuário não quer ver as fotos subindo pela borda de baixo da tela. No celular e no tablet em pé, as fotos ficam invisíveis enquanto o palco sobe, aparecem (fade) já paradas no meio da tela, com a primeira no centro, e só então passam para o lado. (Substitui as "fotos sobem paradas" do item de hoje sobre a galeria.)
- 10/11/2026: **manifesto só com o texto.** O usuário não quer as fotos do atendimento subindo ao lado (ou depois) do parágrafo do manifesto: saíram de todos os tamanhos de tela, com os arquivos (`fotos/atendimento/`, no histórico do git). O manifesto fica só com o parágrafo, numa tela dele, rolando com a página e acendendo as palavras; depois vêm os números e a seção seguinte. (Substitui o manifesto com fotos de 09/11/2026.)
- 10/11/2026: **manifesto centralizado e blocos de tratamento com foto grande.** O parágrafo do manifesto e o rótulo ficaram centralizados (o rótulo, mais claro, para manter o contraste sobre a foto). Nos tratamentos, do tablet em pé em diante, cada bloco ocupa uma linha: a foto grande (até a altura da tela, menos o header) e o texto ao lado dela, no meio da altura; o Sorriso espelha o Rosto (foto à direita). No celular continua foto em cima e texto embaixo. (Substitui os dois blocos lado a lado, em degrau, de 09/11/2026.)
- 10/11/2026: **blocos de tratamento centralizados.** Do tablet em pé em diante, a foto e o texto de cada bloco ficam juntos no centro da tela, com a sobra dividida pelos dois lados (antes, a foto encostava na margem e a sobra ficava toda do outro lado). O link, o cursor "Ver" e o tilt valem só sobre a foto e o texto. No mesmo dia, o usuário pediu de novo fotos reais de antes e depois, e depois esclareceu que serve qualquer foto livre da internet, só para preencher a demonstração (e, não achando, repetir a foto). **Feito:** os seis casos de `casos.js` viraram fotos do Unsplash, todas sob a Licença Unsplash. O caso 01 é o único par de verdade que existe livre (uma paciente de um consultório do Texas, antes e depois do sorriso, cortado em duas fotos 1:1); nos casos 02 a 06 a mesma foto fica nos dois lados, porque nos bancos livres (Unsplash, Pexels, Pixabay, Wikimedia Commons) não há antes e depois de lentes, clareamento, lábios, toxina ou harmonização. Nenhum "antes" foi montado por edição de uma foto de "depois". Os seis ficam `provisorio: true`, e o **build passou a parar** se `ficticio` virar `false` com eles ainda lá (`vite/geradores.js`): foto de banco nunca vai ao ar como resultado do doutor. As placas "Caso 01" a "Caso 06" saíram do site (o gerador delas continua em `ferramentas/placa.html`). Origem e recortes: `docs/creditos-imagens.md`. (Substitui o "Proposto: comprar no Adobe Stock" que constou aqui por algumas horas.)
- 13/11/2026: **sem a pérola.** O usuário pediu para tirar a pérola 3D. Saiu do hero (celular e tela larga) e do pouso na abertura de "O espaço", com o código 3D e a viagem com o scroll; o Three.js deixou de ir para o site (continua só nas ferramentas de imagens provisórias). A abertura de "O espaço" passou a centralizar o rótulo e a frase na tela. A imagem do Open Graph ainda mostra a pérola até virar uma foto real. (Substitui a pérola dos itens de 31/10/2026.)
- 13/11/2026: **carrossel dos resultados sem contador.** No desktop, com três cards na tela, o "04 / 06" do fim parecia errado; o usuário pediu para tirar os números. Ficam só as setas (à direita), que apagam nas pontas. Os links "Ver resultados" passaram a parar com os cards inteiros na tela. (Substitui o contador "01 / 06" do carrossel, pedido na descrição dos resultados.)
- 13/11/2026: **fim da página centralizado.** No fim da rolagem, o pé do botão "Agendar avaliação" aparecia cortado na borda de cima. Agora, com a tela deitada, a última tela mostra só as informações do contato e o rodapé, centralizados na altura (a sobra vai metade acima da linha das informações e metade abaixo do rodapé), com o botão inteiro fora, acima (`fim.js`, `contato.css`). Em pé (celular e tablet) fica como estava: a última tela já mostra o contato inteiro ou o botão já fica fora.
- 13/11/2026: **experiência sem contador e com o cabeçalho centralizado.** O usuário pediu para tirar o "01 / 06" da roda e juntar o título e a nota, centralizados. Com a roda, rótulo, título e nota ficam um embaixo do outro, no centro, acima da roda (que desce o quanto o cabeçalho pedir). Sem a roda (lista), o cabeçalho continua alinhado à esquerda. (Substitui o contador "01 / 06" do item 8 da página.)
- 13/11/2026: **celular: header e hero mais limpos.** No celular e no tablet em pé (abaixo de 64em): o botão do menu mostra só o ícone (o nome "Menu"/"Fechar" fica para o leitor de tela, com área de toque de 44 px); o "Agendar" saiu do header (fica o botão grande do hero e o do menu aberto). No hero, rótulo, título e subtítulo ficam centralizados; o rótulo "Dr. Henrique Martins · Cirurgião-dentista" fica numa linha só, com o corpo encolhendo com a largura (12 px a partir de uns 390 px, 10 px em 320 px); e "Novo Hamburgo, RS." saiu do subtítulo (continua na tela larga e no contato). A estimativa da altura do texto (`--hero-texto`) foi recalibrada, e o retrato cresceu com o espaço que sobrou. Na tela larga, nada mudou.

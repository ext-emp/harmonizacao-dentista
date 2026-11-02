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

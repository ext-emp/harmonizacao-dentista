# Estudo das referências

Capturas feitas com Playwright (Chrome) em 1440×900 e 390×844, de 0 até o fim da página, com rolagem em passos de 85% da tela. Ficam em `docs/referencias/` (fora do git, por serem material de terceiros). Métricas extraídas do DOM em `docs/referencias/metricas.json`. As referências servem só de inspiração de estrutura e movimento; nenhum texto, imagem ou código foi copiado.

## Aventura Dental Arts (aventuradentalarts.com)

**Tipografia.** Instrument Serif 400 em tamanhos enormes (83 a 276 px no desktop), entrelinha muito fechada (0,80 a 0,93) e espaçamento negativo (−2% a −4%). Itálico só em palavras de ênfase ("*Dentistry*", "*here*", "*for*"). Texto de interface em Inter Tight 12 a 14 px, peso 500. O contraste de escala entre o título gigante e o rótulo minúsculo é o que dá o ar editorial.

**Cor.** Duas cores e nada mais: cinza-claro quente `#EAE8E8` e azul-grafite `#14151D`, com texto secundário `#424346`. Toda a fotografia é em preto e branco, o que mantém a disciplina das duas cores.

**Grid e espaço.** Margens de 32 px, divisão em metades (720/720) e painéis fixos em tela dividida. Títulos centralizados ou em escada (linhas com recuos diferentes). No celular, tudo empilha e os títulos continuam enormes (até 112 px).

**Ritmo.** Blocos inteiros alternando claro e escuro. Cada seção tem um título gigante como âncora e pouquíssimo texto.

**Movimento.** Lenis. Revelações com `cubic-bezier(0.22, 1, 0.36, 1)` em 0,8 s; transições de interface com `cubic-bezier(0.6, 0.14, 0, 1)`; hovers com `ease-in-out` em 0,3 s. Parágrafo grande cujas palavras escurecem com o scroll, título que desliza na horizontal, painéis fixos que trocam o conteúdo, linhas finas em arco.

## LAVA dental (lavadental.lv)

**Tipografia.** Títulos em sans geométrica (Josefin Sans 500, 47 a 63 px, entrelinha 1,05 a 1,1), corpo em PP Neue Montreal 20 px/1,4 e rótulos de 12 px em caixa alta com 0,05 em de espaçamento.

**Cor.** Verde-profundo `#031C14` e menta `#DDEFDE`, com champanhe `#DBC093` aparecendo só nos títulos dos itens sobre o fundo escuro. É a prova de que um dourado funciona melhor como raridade.

**Grid e espaço.** 12 colunas de 80 px com calhas de 30 px e margens de 75 px (conteúdo de 1290 px). No celular, as mesmas 12 colunas com calhas de 16 px e margens de 24 px.

**Ritmo.** Uma ideia por tela. Frases curtas, sozinhas, cercadas de vazio. Sequências longas guiadas pelo scroll (galeria horizontal, imagens flutuando sobre a frase, roda dos diferenciais).

**Movimento.** Lenis. Curva principal `cubic-bezier(0.33, 0, 0.11, 1)` em 0,5 s, 1 s e 2,5 s; secundária `cubic-bezier(0.1, 0.75, 0.25, 1)`. Na seção "Your smile starts here", o título fica fixo enquanto uma roda com seis pontos numerados gira e troca o item ativo no centro. É a referência direta da nossa seção "A experiência".

## O que levamos para o projeto

- **Escala editorial:** Instrument Serif gigante, entrelinha 0,9, espaçamento negativo, itálico raro para ênfase; Manrope pequena e espaçada na interface.
- **Paleta disciplinada:** porcelana e grafite quente como as duas cores; champanhe raro, só em linhas, ícones e no botão do slider. Acrescentei tons de apoio (linho para alternar seções claras, grafite 2 para superfícies escuras, cinzas de texto secundário com contraste AA).
- **Grid de 12 colunas** com margens e calhas fluidas, como a LAVA, e muito espaço vertical entre seções.
- **Ritmo de blocos claros e escuros** com um título forte por seção.
- **Movimento em poucos tokens:** uma curva de saída longa para revelações, uma curva de entrada e saída para cortinas e menus e uma curva curta para hovers. Durações de 0,35 s a 1,6 s. Nada de molas ou quiques.
- **Estrutura de movimento:** parágrafo que acende com o scroll (manifesto), título fixo com contador (experiência) e scroll horizontal fixo (primeira consulta).

O que não levamos: fotografia de banco, vídeos de equipe, depoimentos, lista de preços e formulários. Os dois primeiros não existem para o Dr. Henrique; os três últimos vão contra o briefing e as regras do CFO.

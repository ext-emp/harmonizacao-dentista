# Conteúdo pendente

Tudo que depende do Dr. Henrique. Desde 01/11/2026, a pedido do usuário, nada disso aparece marcado na tela: os dados e textos estão preenchidos com valores **fictícios**, mas realistas, para o site parecer pronto. Esta lista diz o que é fictício e onde trocar. No código, busque por `FICTÍCIO`.

Enquanto `ficticio: true` estiver em `src/dados/doutor.js`, o `npm run build` avisa que o site tem dados fictícios. **Nada desta lista pode ir ao ar como está:** CRO, endereço e números inventados num site de dentista ferem a Resolução CFO 196/2019.

Os dados de contato ficam todos em `src/dados/doutor.js`: corrigiu lá, corrigiu no site inteiro.

## Dados de contato e registro (`src/dados/doutor.js`)

| Item | Onde aparece | Valor fictício de agora |
| --- | --- | --- |
| Número do CRO-RS | Rodapé, Sobre, marca sobre as fotos de antes e depois, dados estruturados | 24817. Obrigatório pela Resolução CFO 196/2019 |
| Especialidade registrada no CFO | Hoje o site diz "Cirurgião-dentista" | Só trocar por "especialista em..." com o registro confirmado |
| Número do WhatsApp (com DDI e DDD) | Os 4 botões "Agendar", o número escrito no Contato (que é link) e os dados estruturados | 5551997142083, a pedido do usuário (02/11/2026). **Inventado:** do jeito que está, os botões abrem a conversa com um número que pode ser de um desconhecido. Trocar antes de qualquer pessoa de fora abrir o site |
| Número do WhatsApp como aparece escrito | Contato | (51) 99714-2083 |
| Mensagem pré-preenchida do WhatsApp | Botões de agendamento | "Olá, Dr. Henrique. Gostaria de agendar uma avaliação." (real, pode ficar) |
| Endereço completo (rua, número, sala, bairro, CEP) | Contato, dados estruturados | Rua Joaquim Nabuco, 1080, Sala 702, Centro, CEP 93310-002 (a rua existe; o número e a sala, não) |
| Link do Google Maps | Contato ("Abrir no mapa") | Vazio: o site abre uma busca pelo endereço |
| Horários de atendimento | Contato | Segunda a sexta, 9h às 19h; sábado, 9h às 13h |
| Domínio definitivo do site | Canonical, Open Graph, sitemap.xml, dados estruturados | Vazio: sem ele, o build não gera URLs absolutas nem o sitemap |

Depois de trocar tudo, mude `ficticio` para `false`.

## Marca

| Item | Onde aparece | Observação |
| --- | --- | --- |
| Monograma HM | Header, preloader, favicon, imagem do Open Graph | Desenho provisório feito para o site. Se o doutor já tiver uma marca, ela entra no lugar |

## Textos

| Item | Arquivo | Observação |
| --- | --- | --- |
| Título e subtítulo do hero | `src/secoes/hero.html` | Escolhido: "O luxo de parecer você." (alternativa do briefing: "Naturalidade é o novo luxo.") |
| Frase de abertura do "O espaço" | `src/secoes/espaco.html` | "Antes de qualquer tratamento, um lugar para conversar com calma." Confirmar que descreve o consultório de verdade |
| Texto do manifesto | `src/secoes/manifesto.html` | Texto de posicionamento, sem promessa. Revisar o tom com o doutor. Fica dentro do "O espaço", sobre a última foto da galeria |
| Números do manifesto | `src/secoes/manifesto.html` | Fictícios: 12 anos de profissão, 07 anos de dedicação à harmonização orofacial, 15 cursos de formação complementar. Trocar pelo valor real ou apagar o item. A contagem animada lê o número escrito no HTML. Não usar número de pacientes nem de procedimentos como chamariz |
| Descrições dos blocos Rosto e Sorriso | `src/secoes/tratamentos.html` | Textos clínicos provisórios |
| Lista final de procedimentos | `src/secoes/tratamentos.html` e `SERVICOS` em `vite/geradores.js` (dados estruturados) | Lista provisória do briefing. Ao mudar, trocar a imagem de cada linha em `fotos/procedimentos/` |
| Tratamento de cada caso | `src/dados/casos.js` | Os seis atuais são provisórios |
| Texto do Sobre | `src/secoes/sobre.html` | O segundo parágrafo descreve a forma de atendimento |
| Formação | `src/secoes/sobre.html` | Fictícia: graduação em Odontologia (2013), aperfeiçoamento em harmonização orofacial (2018) e formação em lentes de contato dental (2020). Trocar pelos cursos reais, com instituição e ano. Nada sem comprovação |
| Etapas da experiência | `src/secoes/experiencia.html` | Seis etapas provisórias, do primeiro contato ao retorno: agendamento, conversa, avaliação, plano, decisão e acompanhamento (a primeira consulta foi unida a esta seção em 01/11/2026). Precisam descrever a rotina real do consultório. Não citar equipamentos sem confirmação. A roda se ajusta sozinha ao número de itens |
| Nota da experiência | `src/secoes/experiencia.html` | "Atendimento reservado, do agendamento ao último retorno." |
| Perguntas e respostas do FAQ | `src/secoes/faq.html` | Textos clínicos provisórios. Sem promessa nem garantia de resultado, sem valores. Os dados estruturados (FAQPage) saem deste HTML |

## Antes e depois (Resolução CFO 196/2019)

- Só casos atendidos pelo próprio Dr. Henrique, com autorização **por escrito** do paciente, guardada pelo consultório.
- Nada de fotos do "durante". Antes e depois com o mesmo enquadramento e a mesma luz.
- O nome e o CRO entram sozinhos sobre cada foto (vêm de `doutor.js`).
- Em `src/dados/casos.js`, cada caso real fica com `provisorio: false` e `autorizacaoPorEscrito: true`. Sem a autorização marcada, o build para com um aviso.
- A seção traz a nota "Imagens divulgadas com autorização dos pacientes."
- As imagens de agora são neutras de propósito ("Caso 01 · foto provisória" escrito na própria imagem): nada que pareça resultado pode entrar sem ser caso dele.
- Depoimentos de pacientes continuam fora do site até o doutor confirmar com o CRO-RS.

## Fotos

Formato dos originais: JPG (ou PNG, quando precisa de fundo transparente), o maior possível. Os tamanhos abaixo são o mínimo. O `npm run imagens` (o build também roda) recorta no centro e gera as versões AVIF/WebP.

| Pasta e nome do arquivo | Onde aparece | Tamanho mínimo | Proporção |
| --- | --- | --- | --- |
| `fotos/hero/doutor-capa.png` | Hero, à direita do título | 1600 × 2000 px, **PNG com fundo transparente** (só a pessoa recortada, sem sombra no chão) | 4:5, retrato da cintura para cima, cabeça a uns 6% a 12% do topo. **A imagem de agora é uma foto de banco (Unsplash) de um modelo, com o fundo recortado: não é o doutor e não pode ir ao ar** |
| `fotos/hero/perola.png` | Hero | 1600 × 1600 px, fundo transparente | 1:1. Gerada pelo próprio site (`npm run perola`), não precisa de foto |
| `fotos/espaco/espaco-01.jpg` e `espaco-03.jpg` | O espaço, fotos deitadas da galeria | 2400 × 1600 px | 3:2 |
| `fotos/espaco/espaco-02.jpg` e `espaco-04.jpg` | O espaço, fotos em pé da galeria | 1600 × 2000 px | 4:5 |
| `fotos/espaco/espaco-05.jpg` | Última foto da galeria: abre até a tela cheia e vira o fundo do manifesto | 2880 × 1920 px | 3:2, com o assunto no centro (no celular a tela corta as laterais) e tons calmos, porque o texto fica por cima, sob um véu grafite |
| `fotos/atendimento/atendimento-01.jpg` … `atendimento-04.jpg` | Manifesto, as quatro fotos que sobem sobre o fundo | 1000 × 1250 px | 4:5. Conversa, avaliação, planejamento e instrumentos, **nunca do "durante"**. Paciente real só com autorização por escrito |
| `fotos/tratamentos/rosto.jpg` | Tratamentos, bloco Rosto | 1600 × 2000 px | 4:5 |
| `fotos/tratamentos/sorriso.jpg` | Tratamentos, bloco Sorriso | 1600 × 2000 px | 4:5 |
| `fotos/procedimentos/<nome>.jpg` (um por procedimento, mesmo nome da linha) | Lista de procedimentos | 640 × 800 px | 4:5 |
| `fotos/sobre/retrato.jpg` | Sobre | 1600 × 2000 px | 4:5 |
| `fotos/casos/<id>-antes.jpg` e `fotos/casos/<id>-depois.jpg` (o `id` vem de `casos.js`) | Resultados | 1080 × 1080 px | 1:1, o mesmo enquadramento nas duas |
| `public/og-imagem.jpg` (vai direto, sem `npm run imagens`) | Prévia do link no WhatsApp, Instagram e Facebook | 1200 × 630 px, exatos | 1,91:1. Hoje é provisória (monograma, nome e a pérola sobre fundo liso): trocar por uma foto real do consultório ou do doutor, sem paciente, com o nome por cima se quiser |

Desde 02/11/2026, as fotos do espaço, do manifesto e dos blocos Rosto e Sorriso são fotos de banco do Unsplash (licença livre para uso comercial), e o Sobre usa o mesmo retrato de banco do hero. Autor e link de cada uma estão em `docs/creditos-imagens.md`. Continuam provisórias: são de outras clínicas e de modelos, e a licença não cobre o uso da imagem das pessoas como se fossem pacientes ou o próprio consultório.

As fotos provisórias continuam com uma etiqueta discreta na tela ("Retrato provisório" no hero e no Sobre, "Fotos provisórias" na galeria do "O espaço"). Ao trocar uma delas, apague a etiqueta da seção e ajuste o texto alternativo (`alt`), que hoje diz "Imagem provisória…" ou "Foto provisória…".

Depois de trocar a `espaco-05.jpg`, rode `node scripts/contraste-fundo.mjs` com o site aberto em `npm run dev`: ele mede o contraste do manifesto e dos números sobre a foto. Quando o retrato do hero mudar, meça onde a pessoa fica na imagem com `node scripts/limites-alfa.mjs fotos/hero/doutor-capa.png`, atualize esses limites em `scripts/capturar-viagem.mjs` e rode o script: ele confere, quadro a quadro, que a pérola não passa por cima da pessoa nem do texto.

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
- A seção traz a nota "Imagens divulgadas com autorização dos pacientes." **Hoje ela não é verdadeira:** as fotos são de banco (ver abaixo). Só pode ficar no ar com casos reais autorizados.
- **As fotos de agora são de banco do Unsplash, só para a demonstração** (o usuário mandou preencher com qualquer foto livre, em 10/11/2026). O caso 01 é um par de antes e depois de verdade, de uma paciente de outra clínica (um consultório do Texas); nos casos 02 a 06 a mesma foto aparece nos dois lados, porque não existe par livre desses tratamentos. Os seis estão `provisorio: true`.
- **Trava no build:** com `provisorio: true`, o site só passa enquanto `ficticio: true` em `src/dados/doutor.js`. No dia em que `ficticio` virar `false`, o `npm run build` **para** (`vite/geradores.js`) até os seis casos serem trocados pelos do doutor. Foto de banco nunca vai ao ar como resultado dele.
- Depoimentos de pacientes continuam fora do site até o doutor confirmar com o CRO-RS.

## Fotos

Formato dos originais: JPG (ou PNG, quando precisa de fundo transparente), o maior possível. Os tamanhos abaixo são o mínimo. O `npm run imagens` (o build também roda) recorta no centro e gera as versões AVIF/WebP.

| Pasta e nome do arquivo | Onde aparece | Tamanho mínimo | Proporção |
| --- | --- | --- | --- |
| `fotos/hero/doutor-capa.png` | Hero: à direita do título na tela larga; no celular, por cima da foto do consultório, com o texto sobre o jaleco | 1600 × 2000 px, **PNG com fundo transparente** (só a pessoa recortada, sem sombra no chão) | 4:5, retrato da cintura para cima, cabeça a uns 6% a 12% do topo e queixo até uns 45%. **A imagem de agora é uma foto de banco (Unsplash) de um modelo, com o fundo recortado: não é o doutor e não pode ir ao ar** |
| `fotos/hero/fundo-celular.jpg` | Hero no celular e no tablet em pé, atrás do retrato | 1600 × 2133 px | 3:4, em pé, com desfoque leve e tons claros (fica sob um véu escuro). Hoje é um recorte da `espaco-01`. O ideal: uma foto do doutor no próprio consultório, e aí o retrato recortado sai do celular |
| `fotos/hero/perola.png` | Hero | 1600 × 1600 px, fundo transparente | 1:1. Gerada pelo próprio site (`npm run perola`), não precisa de foto |
| `fotos/espaco/espaco-01.jpg` e `espaco-03.jpg` | O espaço, fotos deitadas da galeria | 2400 × 1600 px | 3:2 |
| `fotos/espaco/espaco-02.jpg` e `espaco-04.jpg` | O espaço, fotos em pé da galeria | 1600 × 2000 px | 4:5 |
| `fotos/espaco/espaco-05.jpg` | Última foto da galeria: abre até a tela cheia e vira o fundo do manifesto | 2880 × 1920 px | 3:2, com o assunto no centro (no celular a tela corta as laterais) e tons calmos, porque o texto fica por cima, sob um véu grafite |
| `fotos/tratamentos/rosto.jpg` | Tratamentos, bloco Rosto | 1600 × 2000 px | 4:5 |
| `fotos/tratamentos/sorriso.jpg` | Tratamentos, bloco Sorriso | 1600 × 2000 px | 4:5 |
| `fotos/procedimentos/<nome>.jpg` (um por procedimento, mesmo nome da linha) | Lista de procedimentos | 640 × 800 px | 4:5. Ilustra o tipo de tratamento: nada de paciente sendo tratado (o "durante") nem antes e depois |
| `fotos/sobre/retrato.jpg` | Sobre | 1600 × 2000 px | 4:5 |
| `fotos/casos/<id>-antes.jpg` e `fotos/casos/<id>-depois.jpg` (o `id` vem de `casos.js`) | Resultados | 1080 × 1080 px | 1:1, o mesmo enquadramento nas duas |
| `public/og-imagem.jpg` (vai direto, sem `npm run imagens`) | Prévia do link no WhatsApp, Instagram e Facebook | 1200 × 630 px, exatos | 1,91:1. Hoje é provisória (monograma, nome e a pérola sobre fundo liso): trocar por uma foto real do consultório ou do doutor, sem paciente, com o nome por cima se quiser |

Desde 02/11/2026, as fotos do espaço e dos blocos Rosto e Sorriso são fotos de banco do Unsplash (licença livre para uso comercial), assim como, desde 09/11/2026, as da lista de procedimentos, e desde 10/11/2026, as dos casos de antes e depois, e o Sobre usa o mesmo retrato de banco do hero. Autor e link de cada uma estão em `docs/creditos-imagens.md`. Continuam provisórias: são de outras clínicas e de modelos, e a licença não cobre o uso da imagem das pessoas como se fossem pacientes ou o próprio consultório.

**Nenhuma foto provisória tem marca na tela** (o usuário pediu para tirar todas em 10/11/2026): o retrato do hero e do Sobre, a galeria do "O espaço" e as fotos dos casos de antes e depois. Na tela, a foto de banco passa pelo retrato do doutor, as fotos de outras clínicas pelo consultório dele e as de modelos e de uma paciente do Texas pelos resultados dele, então todas precisam ser trocadas antes de o site ir ao ar. A lista é esta seção e a de `docs/creditos-imagens.md`. Ao trocar qualquer foto provisória, ajuste o texto alternativo (`alt`), que hoje diz "Imagem provisória…" ou "Foto provisória…".

Depois de trocar a `espaco-05.jpg`, rode `node scripts/contraste-fundo.mjs` com o site aberto em `npm run dev`: ele mede o contraste do manifesto e dos números sobre a foto. Quando o retrato do hero mudar, meça onde a pessoa fica na imagem com `node scripts/limites-alfa.mjs fotos/hero/doutor-capa.png`, atualize esses limites em `scripts/capturar-viagem.mjs` (a cabeça e o corpo) e rode o script: ele confere, quadro a quadro, que a pérola não passa por cima da pessoa nem do texto. Rode também `node scripts/testar-hero.mjs`: em vários celulares e tablets, ele confere que o botão cabe na primeira tela, que o texto não cobre o rosto (a caixa do rosto fica no começo da função `medir`) e o contraste do texto sobre o jaleco.

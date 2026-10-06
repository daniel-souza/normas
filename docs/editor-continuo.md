# Editor contínuo: uso, reconhecimento e dados

Esta é a primeira prova de conceito do editor de normas. A entrada passa por **informações principais → editor e prévia → salvar no mock**. Órgão, espécie, número, ano, data, epígrafe e ementa continuam separados do corpo.

## O que o usuário faz

O corpo é uma única superfície editável Tiptap/ProseMirror. Os fundos e rótulos mostram o reconhecimento sem criar um formulário por dispositivo. É possível digitar, selecionar vários parágrafos, colar conteúdo formatado, inserir tabelas e desfazer/refazer.

| Ação | Efeito |
| --- | --- |
| Digitar `Art. 1º Texto.` | Reconhece artigo; mostra fundo azul e atualiza a prévia. |
| Continuar em outro parágrafo sem novo marcador | Mantém o vínculo com o último elemento; o rótulo informa continuação. |
| Selecionar dois parágrafos e escolher Preâmbulo | Marca ambos manualmente como uma unidade; o primeiro inicia o preâmbulo. |
| Escolher Artigo em um parágrafo vazio | Guarda um artigo vazio para preenchimento posterior. |
| Escolher Texto livre | Preserva uma unidade de texto, mesmo se houver um marcador de artigo. |
| Escolher Continuar elemento anterior | Vincula a seleção ao elemento anterior disponível. |
| Clicar Separar elemento | Dá a cada parágrafo selecionado uma unidade própria, mantendo o tipo reconhecido. |
| Escolher Reconhecer automaticamente | Remove a escolha manual nos parágrafos selecionados e reaplica as regras. |

Os comandos de classificação atuam em parágrafos inteiros. Selecionar só algumas palavras classifica o parágrafo que as contém. Para separar dentro de um parágrafo, insira uma quebra com Enter na posição desejada e classifique as partes. Shift+Enter insere uma quebra visual dentro do mesmo parágrafo. Os rótulos de classificação e os fundos são decorações: não entram no texto copiado ou na renderização final.

Enter preserva os atributos de uma unidade manual, permitindo continuar um preâmbulo ou artigo em outro parágrafo. Um marcador digitado dentro de uma unidade manual não revoga a escolha. Para iniciar outra unidade, use Separar elemento ou restaure o reconhecimento automático.

O documento pode ser salvo com elementos classificados vazios; um documento inteiramente vazio e sem classificação solicita conteúdo ou classificação. Vazios ficam no rascunho, sem texto artificial na leitura. A operação continua sendo uma gravação temporária do mock, sem publicação no servidor.

## Fonte de edição e projeção de leitura

O acervo guarda três informações diferentes:

| Campo | Conteúdo e responsabilidade |
| --- | --- |
| `RegistroAcervo.editor.versao` | Versão local do documento de edição, atualmente `1`. |
| `RegistroAcervo.editor.documento` | JSON do editor: parágrafos, marcas, tabelas, vazios e classificações manuais. É a fonte ao reabrir. |
| `RegistroAcervo.norma` | Metadados e projeção usada pela busca e pelo renderizador existente. |

`interpretarDocumentoEditor(documento)` é uma função sem efeitos colaterais. Recebe o JSON e retorna `{ leitura, elementos }`:

- `leitura.original`: linearização textual do documento, com quebras entre parágrafos e tabulações entre células.
- `leitura.blocos`: blocos para `NormaDocumento`, incluindo marcas, pais, profundidades e tabelas.
- `leitura.avisos`: indicações de vínculos ausentes e citações preservadas.
- `elementos`: identificação visual por parágrafo/tabela, tipo, nome, origem automática/manual, unidade e condição de vazio. Usado nos destaques, não como conteúdo da norma.

O documento não é reconstruído a partir da prévia. Salvar copia o JSON de edição e sua projeção atual. Voltar às informações e retornar ao editor recria a superfície a partir do mesmo rascunho. O histórico de desfazer/refazer pertence à instância aberta do editor; o conteúdo e as classificações permanecem ao reabrir, mas o histórico não é persistido.

## Atributos que preservam as decisões

Cada parágrafo possui:

| Atributo | Significado |
| --- | --- |
| `id` | Identificador estável, `ed-` seguido de UUID. Não depende do número da linha. |
| `normaTipo` | `null` para reconhecimento automático; caso contrário, o tipo escolhido ou `continuacao`. |
| `normaGrupo` | Identifica parágrafos contíguos classificados como uma unidade manual. |
| `textAlign` | Alinhamento, quando fornecido pelo conteúdo formatado. |

Exemplo reduzido:

```json
{
  "type": "paragraph",
  "attrs": {
    "id": "ed-exemplo-1",
    "normaTipo": "preambulo",
    "normaGrupo": "ed-grupo-abertura"
  },
  "content": [{ "type": "text", "text": "A autoridade, no uso de suas atribuições…" }]
}
```

O exemplo abreviado de ID ilustra o contrato; a aplicação gera UUIDs. A extensão UniqueID mantém IDs ao editar, dividir e juntar nós e trata duplicações de IDs na colagem. As classificações não são importadas de atributos arbitrários de HTML externo. Ao colar conteúdo copiado, o conteúdo novo passa novamente pelo reconhecimento; copiar não transporta decisões semânticas manuais pela área de transferência.

`normaGrupo` é uma indicação de unidade contígua, não um ID jurídico e não o campo `paiId`. Se um parágrafo de outro grupo interromper a sequência, o mesmo valor posterior inicia uma nova unidade. Excluir o primeiro parágrafo de um grupo promove o próximo a início da unidade na projeção.

## Ordem exata do reconhecimento

Implementação: `src/app/shared/normas/documento-editor.ts`.

1. Percorre os blocos de primeiro nível em ordem. Tabelas seguem o caminho próprio descrito abaixo.
2. Lê o texto e os atributos manuais. Mantém o estado de aspas, agrupamentos, último artigo/parágrafo/inciso/alínea e última unidade.
3. Se existe escolha manual, usa essa escolha. O texto nunca é reescrito para combiná-la com a classificação.
4. Sem escolha manual e fora de tabelas/citações, procura PARTE, LIVRO, TÍTULO, CAPÍTULO, SEÇÃO, SUBSEÇÃO ou ANEXO no início, seguidos de espaço ou fim do texto.
5. Fora de anexos, procura os marcadores de artigo, parágrafo, inciso, alínea e item, usando o mesmo array `PADROES` do parser de texto simples. A detecção examina a primeira linha visual do parágrafo; quebras Shift+Enter preservam o restante dentro do mesmo elemento. As expressões e exemplos estão na seção 4 do [guia do parser](parser-e-renderizacao.md).
6. O primeiro texto sem marcador após um agrupamento vira título daquele agrupamento. Parágrafos vazios não consomem essa espera.
7. Fora dessa espera, um texto sem marcador continua a última unidade disponível. Uma escolha explícita de Texto livre abre sua própria unidade. O conteúdo inicial sem marcador permanece texto livre até classificação manual; a posição inicial não comprova que seja preâmbulo.
8. Parágrafos contíguos com o mesmo `normaGrupo` continuam a primeira unidade. `continuacao` usa a última unidade; sem anterior, mantém texto e emite indicação.
9. Calcula vínculos e profundidades; extrai apenas o marcador reconhecido para `rotulo`, preservando marcas no restante do texto.
10. Emite a projeção sem alterar o JSON. Os destaques usam `elementos`; a prévia usa `leitura`.

O reconhecimento é síncrono a cada transação que altera o documento. Mover a seleção reutiliza as decorações existentes. O editor não substitui todo o HTML a cada tecla, não desloca o cursor para reaplicar a prévia e não renumera dispositivos.

## Como os níveis são separados

Os agrupamentos usam uma pilha: parte = 0, livro = 1, título = 2, capítulo = 3, seção = 4, subseção = 5; anexo reinicia no nível 0. Ao abrir um agrupamento, saem da pilha os níveis iguais ou mais profundos. O restante fornece o agrupamento superior.

| Elemento | `paiId` e profundidade |
| --- | --- |
| Agrupamento | Agrupamento superior, ou `null` na raiz; profundidade visual 0. |
| Artigo | Agrupamento atual, ou `null`; profundidade visual 0. |
| Parágrafo | Último artigo; profundidade do pai + 1. |
| Inciso | Último parágrafo, ou artigo quando não há parágrafo; profundidade do pai + 1. |
| Alínea | Último inciso; profundidade do pai + 1. |
| Item | Última alínea; profundidade do pai + 1. |
| Continuação | ID da unidade que está sendo continuada; conserva a profundidade dessa unidade. |
| Preâmbulo / assinatura | Unidade na raiz; classificação manual. |
| Tabela | Última unidade, agrupamento atual ou raiz; células têm contexto próprio. |

Novo artigo limpa parágrafo/inciso/alínea; novo parágrafo limpa inciso/alínea; novo inciso limpa alínea. Novo agrupamento limpa todos os dispositivos e a última unidade. Preâmbulo e assinatura também limpam os dispositivos ativos.

Um dispositivo reconhecido automaticamente sem superior vira texto e produz indicação. Um dispositivo manual sem superior conserva o tipo escolhido, usa o agrupamento atual ou raiz e produz indicação para conferência. Assim o sistema não desfaz a decisão do usuário para resolver a inconsistência.

O cabeçalho ANEXO é reconhecido; seu restante não vira automaticamente artigo/inciso. É possível classificar trechos manualmente no anexo. Citações iniciadas por aspas seguem preservadas como texto, com indicação para revisão. Não há interpretação jurídica completa de redações substitutivas.

## Formatação e tabelas

`trechosDoEditor` converte marcas `bold`, `italic`, `underline`, `strike` e `link` para `TrechoNorma`. A remoção do prefixo de um artigo percorre os trechos e corta só os caracteres do rótulo e do espaço separador. Não remove a formatação da parte restante. O alinhamento vai para `apresentacao.alinhamento`.

Tabelas são nós reais com linhas, células, cabeçalhos, `colspan` e `rowspan`. A projeção produz `TabelaLeitura`; o cálculo de colunas considera a ocupação das células mescladas verticalmente. O renderizador existente recebe as mesclagens. O usuário pode adicionar/excluir linhas e colunas, mesclar uma seleção de células ou dividir uma célula mesclada.

O reconhecimento normativo automático fica desativado dentro das células. Escrever “Art. 1º” em uma célula não cria um artigo no índice da norma. A classificação manual por menu também fica desativada enquanto o cursor está em uma tabela. O conteúdo da célula preserva sua formatação e pode conter outra tabela.

## Colar do Word: alcance desta etapa

A colagem usa o HTML fornecido pelo navegador, quando disponível, e texto simples como alternativa. `normalizarColagem` remove elementos executáveis, imagens não suportadas, atributos externos de classificação e links com protocolos indevidos. O schema do editor seleciona os tipos e marcas suportados. A renderização final continua usando interpolação de texto, sem `innerHTML` arbitrário.

Listas HTML `ol`/`ul` são convertidas em parágrafos com os marcadores disponíveis em `start`, `value`, `type` ou `list-style-type`; incluem algarismos, letras e números romanos. O editor não inventa numeração a partir de recuo. Isso não equivale a ler as definições internas de numeração de um DOCX.

Esta etapa preserva parágrafos, formatação básica, links e tabelas presentes no HTML da colagem. Não promete reprodução de páginas, fontes, cabeçalhos/rodapés, imagens, comentários ou controle de alterações do Word. Não existe upload de `.docx` nesta etapa. A importação direta e os testes com arquivos Word reais são o próximo passo da experiência; os testes atuais exercitam clipboard HTML representativo no Chromium.

O limite permanece em 200.000 caracteres: acima dele, a entrada integral fica no editor, o reconhecimento é suspenso e salvar fica bloqueado. O conteúdo não é truncado.

## Compatibilidade e verificação

Novas normas e exemplos de texto simples usam o editor contínuo. A resolução já importada em `NormaEstruturada` continua no caminho de manutenção da árvore, recolhido em Ajustar conteúdo importado. Migrar essa árvore inteira para o novo editor exige uma conversão de ida e volta que preserve todos os campos; essa conversão não faz parte desta prova de conceito.

Os testes cobrem classificação manual de múltiplos parágrafos, continuidade, vazios, IDs estáveis, desfazer/refazer, reabertura, marcas, tabelas mescladas, vínculos, limite, cancelamento e CRUD. Arquivos: `documento-editor.spec.ts`, `e2e/editor-continuo.spec.ts` e `e2e/gestao.spec.ts`.

## Referências da base técnica

- [Tiptap: integração JavaScript](https://tiptap.dev/docs/editor/getting-started/install/vanilla-javascript)
- [Tiptap: IDs únicos](https://tiptap.dev/docs/editor/extensions/functionality/uniqueid)
- [Tiptap: tabelas](https://tiptap.dev/docs/editor/extensions/nodes/table)
- [ProseMirror: schema, transações e decorações](https://prosemirror.net/docs/guide/)

# Mock de cadastro, edição e exclusão

Acesse `/gestao` pelo link **Gerenciar normas (mock)** na consulta. O mock usa o acervo em memória já consultado pela busca e pela leitura individual. Alterações duram enquanto a aplicação estiver aberta; recarregar a página restaura os três documentos iniciais. Nenhuma operação grava em servidor ou altera o arquivo JSON importado.

## Fluxo de cadastro

| Etapa                     | O que fazer                                                                                                              | Condição para avançar                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Informações principais | Órgão, espécie, número, ano, data do ato, epígrafe, título descritivo, ementa, processo, situação, fontes e publicações. | Obrigatórios: órgão, espécie, número, ano, data do ato, epígrafe, ementa e situação. Fontes/publicações adicionadas devem estar completas e relacionadas. |
| 2. Conteúdo               | Inserir preâmbulo, agrupamentos, dispositivos, assinaturas e tabelas.                                                    | Pelo menos um elemento de conteúdo e estrutura suportada.                                                                                                 |
| 3. Revisão                | Conferir documento com o renderizador existente e, opcionalmente, inspecionar o contrato gerado.                         | Salvar explicitamente no mock.                                                                                                                            |

O formulário de conteúdo só é exibido depois de validar as informações principais. Voltar à etapa anterior preserva o rascunho. Cancelar sai do editor sem alterar o acervo.

A situação inicial é “não verificada”. A lista de publicações pode ficar vazia; nesse caso, a data de publicação permanece desconhecida. O título descritivo e o processo são opcionais no formulário. Epígrafe é digitada pelo responsável; não há geração ou correção automática de sua redação.

## Montagem dos elementos

Novos documentos são estruturados. Cada bloco tem um seletor **Novo elemento em …**, indicando onde o filho será inserido. É possível adicionar partes, livros, títulos, capítulos, seções, subseções, artigos, parágrafos, incisos, alíneas, itens, assinaturas, anexos, grupos, texto livre e tabela simples.

- Dentro de um capítulo, adicionar seção; dentro da seção, artigo; dentro do artigo, parágrafos e incisos; dentro destes, os demais desdobramentos conforme a norma.
- O primeiro texto de um dispositivo fornece seu texto principal/caput.
- Preâmbulo é texto livre no início do conteúdo. Assinaturas são inseridas na posição desejada.
- Rótulo, número e título são campos separados. Não existe renumeração automática.
- Subir/descer altera a ordem entre irmãos, preservando IDs e filhos. Para trocar um nó de pai, este primeiro mock não oferece arrastar/soltar ou recortar/colar.
- Remover elemento pede confirmação e remove seus descendentes do rascunho.
- Trechos existentes conservam links e marcas de formatação ao editar seu texto. A criação/alteração visual dessas marcas ainda não está disponível.
- Uma nova tabela é uma grade fixa 2 × 2. O editor permite alterar o conteúdo das células de tabelas novas ou importadas. Dimensões, linhas/colunas e mesclagens importadas são preservadas; não há editor geométrico de tabelas nesta etapa.

O seletor oferece os tipos suportados; não é um validador de técnica legislativa. A pessoa escolhe o superior correto e confere na revisão. O parser não decide o pai de nós inseridos manualmente.

## Edição

`/gestao/:id/editar` abre uma cópia isolada. A identificação e o corpo entram no mesmo fluxo de três etapas. Os IDs existentes são preservados, inclusive em tabelas e trechos que viram caput na leitura.

A resolução CNPq continua estruturada durante a edição. Não é convertida em texto simples, o que perderia suas tabelas e marcas. Os metadados históricos de extração são conservados; a leitura salva recebe o aviso de alteração temporária da sessão.

Os dois exemplos antigos continuam usando seu formato de texto simples. Para editá-los, os campos de identificação que não existiam precisam ser preenchidos. O preâmbulo, os dispositivos e as assinaturas ficam em campos próprios. A data de publicação legada é preservada enquanto não há publicações estruturadas; a primeira publicação passa a prevalecer quando adicionada.

Editar no mock é substituir o rascunho em memória. Não representa alteração legislativa, consolidação ou criação de uma versão jurídica da norma.

## Exclusão

Na gestão, **Excluir** identifica a norma e mostra a confirmação. **Cancelar exclusão** mantém o documento. **Confirmar exclusão** remove a norma apenas do acervo da sessão; a consulta deixa de encontrá-la. Recarregar restaura os dados iniciais.

A exclusão real deverá ser definida com o backend e a política de histórico. Não há exclusão de arquivos, chamadas HTTP ou controle de permissões nesta implementação.

## Arquivos e contratos

| Arquivo                          | Responsabilidade                                                         |
| -------------------------------- | ------------------------------------------------------------------------ |
| `pages/gestao/gestao.*`          | Acesso aos documentos e confirmação de exclusão.                         |
| `pages/gestao/editor-norma.*`    | Metadados, etapas, validação, revisão e gravação em memória.             |
| `pages/gestao/editor-conteudo.*` | Edição recursiva dos nós e do conteúdo das células.                      |
| `shared/normas/acervo.ts`        | `obter`, `salvarMock`, `excluirMock` e projeção reativa para a consulta. |
| `shared/normas/norma.ts`         | `IdentificacaoNorma` e sinalização `alteracaoMock` na leitura.           |

`RegistroAcervo` contém `norma: NormaLeitura` e, quando o documento é estruturado, `estruturada: NormaEstruturada`. A fonte editável é a árvore; a leitura é refeita pelo adaptador. `obter` devolve uma cópia para não vazar mutações do rascunho. O acervo recusa cadastro com ID duplicado e mudança de ID durante edição.

A busca existente acompanha o acervo por signals. Se uma exclusão reduzir o número de páginas, a página exibida é limitada ao novo total. Não foram criadas uma segunda consulta pública nem uma segunda tela de leitura.

Consulte [Parser e renderização](parser-e-renderizacao.md) para entender os níveis, o contrato e os limites atuais.

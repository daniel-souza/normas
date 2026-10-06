# Organização da aplicação

```text
src/app/
  pages/
    search/
      search.ts, search.html, search.css
      filtro-busca.ts
      search-store.ts
      components/
        search-filters.ts, search-filters.html
        search-results.ts, search-results.html
    norma/
      norma.ts, norma.html
    leitor/
      leitor.ts, leitor.html
  shared/
    normas/
      norma.ts
      bloco-normativo.ts
      parser-norma.ts
      conteudo-norma.ts, adaptar-norma.ts, validar-norma.ts
      indice-norma.ts
      dados/norma-cnpq-1-2023.json
      acervo.ts
      normas-exemplo.ts
    components/
      header/
      footer/
      norma-documento/
      conteudo-norma/
      indice-norma/
      trechos-norma/
```

A organização é por funcionalidade: contratos da busca, estado, formulário, resultados e testes permanecem em `pages/search`. O arquivo genérico `shared/models/busca.ts` foi substituído por `pages/search/filtro-busca.ts`. Código em `shared/normas` é usado tanto pela busca quanto pela leitura. Não são necessárias camadas adicionais para o acervo local.

Os arquivos usam nomes relacionados ao domínio, coerentes com os nomes curtos dos geradores Angular do projeto. Não existe uma proibição de `types.ts` pelo Angular; evitamos esse nome genérico por organização. Exemplos de geração: `ng generate interface shared/normas/fonte-norma` e `ng generate component pages/search/components/novo-filtro`.

## Estado reativo

`SearchStore` é compartilhado pelos componentes da busca. Os signals graváveis são privados; a UI acessa signals somente de leitura e métodos explícitos. O escopo de aplicação conserva a consulta ao abrir uma norma e voltar. Recarregar a página reinicia o estado.

- `filtros`: rascunho do formulário.
- `requisicao`: contrato calculado a partir dos filtros aplicados e da página.
- `resultados`, `total`, `totalPaginas`, `erro`: valores derivados com `computed`.
- Buscar aplica o rascunho; limpar restaura o estado inicial; qualquer nova consulta volta à página 1.
- Datas são datas civis `YYYY-MM-DD`, sem conversão para UTC na entrada.
- Categoria vazia significa todas; revogadas só aparecem quando explicitamente incluídas.

Os eventos públicos `valueChange` e `checkedChange` dos componentes GOV.BR alimentam o estado. Atualizações idênticas são ignoradas para evitar ciclos entre componentes controlados e signals. As datas usadas como input são computadas e conservam a identidade quando o dia não muda.

A limpeza reinicia o store e recria os controles com uma chave Angular (`versaoFormulario`), restaurando o foco ao botão. Na versão GOV.BR 2.2.0, o calendário mantém texto residual mesmo após `value = null`, reset nativo e `clear()`; o input também pode manter texto digitado após uma atualização controlada para vazio. A recriação usa o ciclo de vida normal dos componentes e evita alterar a biblioteca ou acessar o Shadow DOM. Os testes no Chromium verificam o valor realmente visível, inclusive após voltar do documento. Quando o pacote oficial corrigir esse comportamento, essa integração pode ser simplificada.

`NormaDocumento` usa `input()` e `computed()`: alterar o texto atualiza a apresentação e o índice. Componentes da funcionalidade usam `OnPush`. O texto permanece separado do código HTML e do CSS.

## Documento estruturado e índice

O arquivo `dados/norma-cnpq-1-2023.json` é uma cópia integral do anexo. `validarNorma` confere a estrutura suportada, IDs únicos, tipos de conteúdo, células e referências de publicação. Não representa a validação integral do JSON Schema ainda não fornecido. `adaptarNorma` converte a árvore em blocos de apresentação, preservando os IDs, a ordem, os trechos formatados e as tabelas com `colspan` e `rowspan`. O parser de texto simples continua disponível para os exemplos e a rota `/leitor`.

`criarIndice` usa a hierarquia explícita do JSON ou os níveis dos agrupamentos no texto simples. Capítulos, seções e subseções usam `details`/`summary`, com estado reativo em `linkedSignal`. Os grupos começam abertos e podem ser recolhidos independentemente, inclusive por teclado. Ao receber outro documento, o índice reinicia esse estado. Artigos fora de agrupamentos continuam navegáveis.

A prévia de cada artigo usa o início do caput: no máximo 90 caracteres Unicode, incluindo `...` quando há corte. O texto integral permanece no documento e no atributo `title` do link. IDs exclusivos distinguem os dois capítulos rotulados `CAPÍTULO I` na fonte, sem corrigir a numeração recebida. A navegação leva foco e rolagem ao dispositivo correto.

O acervo mistura a resolução importada e os dois exemplos fictícios originais. A situação `nao_verificada` e a ausência de publicação são explícitas. A data do ato não substitui a data de publicação; documentos sem publicação informada ficam por último na ordenação por publicação e são excluídos apenas quando esse período é filtrado.

## Próximas integrações

O schema completo permitirá ampliar a validação além do formato observado no anexo. Uma futura API pode consumir `RequisicaoBusca` e atualizar os signals de resultados, carregamento e erro sem redistribuir o estado pelos componentes. Autenticação e backend não estão implementados.

## Gestão em memória

A funcionalidade `pages/gestao` acrescenta cadastro, edição e exclusão ao mesmo `Acervo`. Novos documentos mantêm `NormaEstruturada` como fonte de edição e derivam `NormaLeitura` ao salvar. A identificação integral é preservada em `NormaLeitura.identificacao`. A marca `alteracaoMock` informa alterações temporárias na leitura, sem afirmar que o documento importado original é fictício.

O editor valida metadados antes de exibir a árvore. A exclusão exige confirmação na tela e altera somente a sessão. Não há persistência ou API. A busca continua usando o mesmo signal de normas, com a página limitada ao total atual após exclusões.

No adaptador, `paiId: null` representa a raiz explícita do JSON. O índice só infere agrupamentos pela pilha quando `paiId` é `undefined`, como no parser de texto simples. Isso impede que um artigo na raiz do JSON seja associado ao capítulo anterior.

Veja [o guia do parser](parser-e-renderizacao.md) e [o fluxo do mock](gestao-mock.md).

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
      acervo.ts
      normas-exemplo.ts
    components/
      header/
      footer/
      norma-documento/
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

## Próximas integrações

O acervo atual contém dois documentos fictícios. Para dados reais, adicionar um adaptador validado a partir do schema completo. Uma futura API pode consumir `RequisicaoBusca` e atualizar os signals de resultados, carregamento e erro sem redistribuir o estado pelos componentes. Autenticação e backend não estão implementados.

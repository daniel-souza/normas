# Mock de cadastro, edição e exclusão

Acesse `/gestao` pelo link **Gerenciar normas (mock)** na consulta. O cadastro agora funciona como um editor de texto com reconhecimento automático e pré-visualização. Alterações duram enquanto a aplicação estiver aberta; recarregar restaura os três documentos iniciais.

## Duas etapas

1. **Informações principais:** órgão, espécie, número, ano, data do ato, epígrafe, ementa e situação. Título descritivo, processo, fontes e publicações ficam disponíveis como antes. Os campos obrigatórios são conferidos antes de abrir o editor.
2. **Editor e pré-visualização:** cole ou digite o corpo da norma em um único campo. A prévia acompanha a digitação; depois de conferir, clique em **Salvar no mock**.

Não é necessário cadastrar capítulo, artigo, inciso ou alínea em formulários separados. Também não há uma terceira etapa de revisão nem exposição do JSON na tela. Voltar às informações preserva o texto; cancelar descarta o rascunho sem modificar o acervo.

## Reconhecimento automático

O editor usa `interpretarNorma`: reconhece agrupamentos como capítulos, seções e subseções, além de artigos, parágrafos, incisos, alíneas e itens. Mantenha uma linha para cada elemento. O contador informa quantos elementos foram reconhecidos; o renderizador mostra rótulos, títulos e recuos enquanto você escreve.

Exemplo para colar:

```text
CAPÍTULO I
DISPOSIÇÕES GERAIS
Art. 1º O cadastro compreende:
I - identificação da norma;
II - conferência do conteúdo:
a) artigos e parágrafos;
b) demais dispositivos.
Parágrafo único. O conteúdo será revisado antes de salvar.
```

A entrada é texto simples. A colagem não importa estilos, tabelas ou HTML do Word, PDF ou de páginas web. Conteúdo sem reconhecimento permanece visível; citações, anexos e dispositivos sem superior geram as observações do parser. Não há renumeração nem inferência de metadados ou vigência.

O limite é de 200.000 caracteres. Se excedido, o texto fica integralmente no campo para correção; a interpretação é suspensa e a gravação é bloqueada. O editor não corta silenciosamente a colagem.

No computador, editor e prévia aparecem lado a lado. Em telas estreitas, a prévia fica abaixo do editor. O índice lateral completo continua disponível na leitura da norma salva; fica oculto na prévia para reservar espaço ao documento.

## Documentos importados

A resolução CNPq já tem árvore, tabelas e formatação próprias. Ao editá-la, a prévia usa esse conteúdo original; o controle **Ajustar conteúdo importado** fica recolhido e permite mudanças preservando a estrutura. Ela não é automaticamente transformada em texto simples. Essa é uma opção específica de manutenção de conteúdo importado, não o caminho de cadastro de uma nova norma.

Os exemplos antigos em texto simples abrem no editor. Preâmbulo e assinaturas que já estavam em campos separados ficam em um controle recolhido; novos cadastros podem incluí-los no próprio corpo textual. O parser não classifica assinaturas automaticamente. A data de publicação legada é preservada quando não há publicações estruturadas.

## Dados e renderização

Novos cadastros guardam o texto original em `NormaLeitura.texto`, os metadados em campos próprios e o resultado de `interpretarNorma` em `NormaLeitura.leitura`. **Não há conversão automática desse texto em `NormaEstruturada` nesta etapa.** Os IDs `linha-N` são locais à interpretação e podem mudar quando novas linhas são inseridas.

Documentos importados continuam em `RegistroAcervo.estruturada`, com `NormaLeitura` derivada por `adaptarNorma`. Os IDs estruturados são preservados. O sinal `alteracaoMock` indica alterações temporárias na leitura.

A prévia usa o mesmo `NormaDocumento` da consulta. Os valores dos controles são acompanhados por signals; cada alteração atualiza a leitura e o resumo de reconhecimento. Salvar valida o conteúdo atual, sem depender de um botão intermediário ou de uma prévia antiga.

## Edição e exclusão

Salvar atualiza o mesmo acervo consultado pela busca e pela leitura individual. A exclusão pede confirmação na gestão e remove a norma somente da sessão. Cancelar exclusão mantém o documento.

Não há backend, autenticação, persistência, importação direta de HTML/PDF, consolidação ou versionamento jurídico. O mock serve para experimentar o fluxo de uso.

Consulte [Parser e renderização](parser-e-renderizacao.md) para as regras exatas de reconhecimento, pais, níveis e metadados.

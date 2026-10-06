# Mock de cadastro, edição e exclusão

Acesse `/gestao` pelo link **Gerenciar normas (mock)** na consulta. O cadastro agora funciona como um editor contínuo com destaques, classificação manual e pré-visualização. Alterações duram enquanto a aplicação estiver aberta; recarregar restaura os três documentos iniciais.

## Duas etapas

1. **Informações principais:** órgão, espécie, número, ano, data do ato, epígrafe, ementa e situação. Título descritivo, processo, fontes e publicações ficam disponíveis como antes. Os campos obrigatórios são conferidos antes de abrir o editor.
2. **Editor e pré-visualização:** cole ou digite o corpo da norma em um único campo. A prévia acompanha a digitação; depois de conferir, clique em **Salvar no mock**.

Não é necessário cadastrar capítulo, artigo, inciso ou alínea em formulários separados. Também não há uma terceira etapa de revisão nem exposição do JSON na tela. Voltar às informações preserva o texto; cancelar descarta o rascunho sem modificar o acervo.

## Reconhecimento automático

O editor usa `interpretarDocumentoEditor`: reconhece agrupamentos como capítulos, seções e subseções, além de artigos, parágrafos, incisos, alíneas e itens. Digite ou cole parágrafos; Enter pode continuar uma unidade e novos marcadores iniciam outros elementos. O contador informa quantos elementos foram reconhecidos; o renderizador mostra rótulos, títulos e recuos enquanto você escreve. Selecione um ou mais parágrafos e use **Classificar seleção** para definir preâmbulo, artigo, texto livre ou outro tipo. A decisão manual prevalece e permanece ao reabrir. Elementos classificados podem ficar vazios no rascunho.

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

A colagem aceita texto simples e HTML com formatação básica, links e tabelas, incluindo mesclagens. O usuário também pode inserir e editar tabelas. Conteúdo sem reconhecimento permanece visível; citações e dispositivos sem superior têm indicações para conferência. O conteúdo de anexos exige classificação manual quando necessário. Não há renumeração nem inferência de metadados ou vigência.

O limite é de 200.000 caracteres. Se excedido, o texto fica integralmente no campo para correção; a interpretação é suspensa e a gravação é bloqueada. O editor não corta silenciosamente a colagem.

No computador, editor e prévia aparecem lado a lado. Em telas estreitas, a prévia fica abaixo do editor. O índice lateral completo continua disponível na leitura da norma salva; fica oculto na prévia para reservar espaço ao documento.

## Documentos importados

A resolução CNPq já tem árvore, tabelas e formatação próprias. Ao editá-la, a prévia usa esse conteúdo original; o controle **Ajustar conteúdo importado** fica recolhido e permite mudanças preservando a estrutura. Ela não é automaticamente transformada em texto simples. Essa é uma opção específica de manutenção de conteúdo importado, não o caminho de cadastro de uma nova norma.

Os exemplos antigos em texto simples abrem no editor. Preâmbulo e assinaturas que já estavam em campos separados ficam em um controle recolhido; novos cadastros podem incluí-los no próprio corpo textual. Assinaturas podem ser classificadas manualmente no novo editor. A data de publicação legada é preservada quando não há publicações estruturadas.

## Dados e renderização

Novos cadastros guardam o documento de edição em `RegistroAcervo.editor`, com versão `1`, conteúdo rico, vazios e escolhas manuais. `NormaLeitura.texto` e `NormaLeitura.leitura` são projeções para busca e renderização. Os IDs `ed-UUID` são estáveis durante a edição. **Não há conversão automática para `NormaEstruturada` nesta etapa.**

Documentos importados continuam em `RegistroAcervo.estruturada`, com `NormaLeitura` derivada por `adaptarNorma`. Os IDs estruturados são preservados. O sinal `alteracaoMock` indica alterações temporárias na leitura.

A prévia usa o mesmo `NormaDocumento` da consulta. Os valores dos controles são acompanhados por signals; cada alteração atualiza a leitura e o resumo de reconhecimento. Salvar valida o conteúdo atual, sem depender de um botão intermediário ou de uma prévia antiga.

## Edição e exclusão

Salvar atualiza o mesmo acervo consultado pela busca e pela leitura individual. A exclusão pede confirmação na gestão e remove a norma somente da sessão. Cancelar exclusão mantém o documento.

Não há backend, autenticação, persistência, upload de DOCX/PDF, consolidação ou versionamento jurídico. A colagem HTML não equivale à importação integral de arquivos Word. O mock serve para experimentar o fluxo de uso.

Consulte [Parser e renderização](parser-e-renderizacao.md) para as regras exatas de reconhecimento, pais, níveis e metadados.

Consulte [Editor contínuo](editor-continuo.md) para os comandos, contrato de dados, algoritmo e limites da colagem do Word.

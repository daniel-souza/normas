# Redação normativa e apresentação na web

## Situação da pesquisa

Referências oficiais identificadas abaixo. **A consulta direta ao conteúdo e a conferência de eventuais alterações permanecem pendentes**: o proxy deste ambiente respondeu `403 Forbidden` para os sites do Planalto e do gov.br em 05/10/2026. Os domínios foram adicionados ao rascunho de rede para revisão nas configurações. Este documento não certifica conformidade jurídica ou tipográfica.

| Referência oficial                                                                                                                                                                                             | Aplicação ao projeto                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Lei Complementar nº 95/1998](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm), especialmente arts. 3º, 10 e 11                                                                                       | Partes do ato, articulação em dispositivos e requisitos de clareza, precisão e ordem lógica. Conferir o texto atualizado antes de validar o importador.                                                   |
| [Decreto nº 12.002/2024](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/decreto/d12002.htm)                                                                                                          | Referência para elaboração, redação, alteração e consolidação de atos no âmbito do Poder Executivo federal. Conferir a redação vigente e as regras aplicáveis ao tipo de ato.                             |
| [Manual de Redação da Presidência da República](https://www.gov.br/planalto/pt-br/assuntos/centro-de-estudos/subchefia-para-assuntos-juridicos/manual-de-redacao-da-presidencia-da-republica), 3ª edição, 2018 | Orientações de redação oficial e técnica legislativa; confrontar orientações anteriores com a legislação posterior.                                                                                       |
| [Design System GOV.BR](https://www.gov.br/ds/)                                                                                                                                                                 | Componentes, identidade visual, tokens e acessibilidade da interface. As APIs foram conferidas na documentação distribuída nos pacotes oficiais `@govbr-ds/core@3.7.0` e `@govbr-ds/webcomponents@2.2.0`. |

## Decisões de apresentação

- Separar epígrafe, ementa, preâmbulo, dispositivos e assinaturas no modelo de leitura.
- Preservar artigos, parágrafos, incisos, alíneas e itens, bem como os agrupamentos superiores (partes, livros, títulos, capítulos, seções e subseções).
- Conservar os marcadores recebidos, incluindo `Art. 1º`, `Art. 10.`, `Art. 10-A.`, `Parágrafo único.`, `§ 1º`, numerais romanos, letras e algarismos. O parser reconhece essas formas; não avalia se a numeração ou a pontuação estão juridicamente corretas.
- Conservar o texto, a ordem e as referências recebidas. Não renumerar dispositivos, não corrigir silenciosamente a redação e não deduzir vigência ou revogação a partir do texto.
- Manter a identificação da publicação e da fonte. A apresentação estruturada não substitui a publicação oficial.
- Não aplicar automaticamente regras de margens de papel, fontes de editor de texto ou medidas físicas à tela. A leitura responsiva é uma apresentação web, sem promessa de reprodução fac-similar.

Epígrafe e agrupamentos centralizados, ementa deslocada e recuos de dispositivos são decisões **provisórias de apresentação**, a conferir contra as fontes e as necessidades de acessibilidade. Os recuos representam relações estruturais; não são medidas oficiais de editoração.

## GOV.BR e CSS

`src/styles.css` e a configuração PostCSS permanecem como vieram no anexo: core GOV.BR, Font Awesome e utilitários Tailwind com prefixo `tw`, sem Preflight. Não há sobrescritas dos seletores `.br-*`, manipulação do Shadow DOM ou `::ng-deep`.

Os estilos específicos ficam em `pages/search/search.css` e nos componentes `norma-documento`, `conteudo-norma`, `indice-norma` e `trechos-norma`. Eles tratam apenas layout, recuos, índice, tabelas e marcas do texto, usando os tokens do GOV.BR. Uma regra só deve migrar para `styles.css` quando representar uma necessidade real compartilhada por vários componentes.

## Contrato do parser

O trecho fornecido de `norma.schema.json` confirma os campos de fonte, publicação e extração. As interfaces `FonteNorma`, `PublicacaoNorma` e `ExtracaoNorma`, em `shared/normas/norma.ts`, mantêm os nomes, campos obrigatórios/opcionais e enumerações desse trecho.

`NormaLeitura` é um modelo de apresentação local. Ele **não é uma implementação do schema completo**. O anexo `norma-cnpq-1-2023.json` agora fornece um exemplo integral de raiz, dispositivos, conteúdo rico e tabelas. O adaptador é precedido por uma validação estrutural do formato observado, incluindo IDs únicos, tipos de conteúdo, células e referências `fonteId`. Isso não equivale a verificar todas as regras de `norma.schema.json`, como restrições de propriedades e formatos ainda não disponíveis.

O JSON foi mantido integralmente. Sua árvore organiza o índice e o corpo do documento; nenhum artigo é reconstruído por expressões regulares nesse caminho. São preservados 20 artigos, três capítulos, quatro seções, o anexo com duas tabelas, células vazias e mescladas, links e marcas de negrito/itálico. Os atributos de dimensões e alinhamento são dicas de apresentação; as tabelas permitem rolagem horizontal em telas estreitas. O HTML e as folhas de estilo originais da fonte não vieram neste anexo, portanto não se afirma reprodução fac-similar.

`interpretarNorma` recebe texto simples e produz blocos com identificação, número da linha, tipo, marcador original, texto, profundidade e dispositivo superior. A entrada integral é retida, incluindo linhas em branco. A apresentação elimina linhas vazias e representa cada linha com conteúdo por um bloco; não preserva a paginação do original. Os identificadores são locais à leitura, não identificadores jurídicos permanentes.

Limites do parser de texto simples:

- Uma linha de texto deve corresponder ao início de um dispositivo ou à sua continuação. OCR e quebras artificiais de PDF precisam de um adaptador específico.
- Texto não reconhecido permanece visível. Dispositivos sem superior reconhecido geram observações.
- Citações iniciadas com aspas e o conteúdo após um cabeçalho de anexo ficam como texto para revisão. Não há interpretação completa de redações substitutivas, notas editoriais, tabelas, imagens, fórmulas ou conteúdo HTML/PDF.
- Não há consolidação, validação de sequência, análise jurídica, persistência ou envio do texto do leitor a um servidor.
- O leitor aceita até 200.000 caracteres por vez. HTML recebido é exibido como texto por interpolação Angular, sem `innerHTML` nem bypass de sanitização.

O schema completo ainda é necessário para conferir compatibilidade integral. Os metadados `htmlOriginalObtido`, `layoutTabelas`, `sha256Html` e observações são os informados no JSON, sem nova verificação do HTML nesta etapa. Não se inventa hash nem se marca uma reconstrução como original. Fontes usam HTTP(S); links no conteúdo também podem usar `mailto:`. Protocolos executáveis não geram links.

## Guia detalhado de implementação

As regras exatas, expressões regulares, exemplos de pais/níveis, contrato de metadados e mapeamento de renderização estão em [Parser e renderização](parser-e-renderizacao.md). O guia descreve o código local, sem depender de conferência jurídica externa.

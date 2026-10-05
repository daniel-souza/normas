import { NormaLeitura } from './norma';

/** Dados fictícios: não reproduzem nem atestam atos do CNPq. */
export const NORMAS_EXEMPLO: readonly NormaLeitura[] = [
  {
    id: 'demonstracao-organizacao',
    categoria: 'Portaria',
    epigrafe: 'PORTARIA DE DEMONSTRAÇÃO Nº 1, DE 2 DE JANEIRO DE 2023',
    ementa: 'Demonstra a organização e a consulta de documentos normativos.',
    preambulo:
      'EXEMPLO FICTÍCIO, SEM VALOR NORMATIVO. O texto a seguir demonstra a estrutura do leitor:',
    dataPublicacao: '2023-01-02',
    situacao: 'vigente',
    texto: `CAPÍTULO I
DAS DISPOSIÇÕES GERAIS

Art. 1º Esta demonstração apresenta a estrutura de uma norma no sistema de consulta.
Parágrafo único. O conteúdo é fictício e não substitui uma publicação oficial.

Art. 2º A consulta compreende:
I - a identificação do documento;
II - a leitura dos dispositivos:
a) na ordem em que foram publicados;
b) com preservação dos respectivos identificadores:
1. artigos e parágrafos;
2. incisos, alíneas e itens.
§ 1º A busca permite selecionar categorias e um período de publicação.
§ 2º Os documentos revogados podem ser incluídos na consulta.

CAPÍTULO II
DAS DISPOSIÇÕES FINAIS

Art. 3º Este exemplo não produz efeitos jurídicos.`,
    assinaturas: ['AUTORIDADE FICTÍCIA — DOCUMENTO DE DEMONSTRAÇÃO'],
    demonstracao: true,
    extracao: {
      data: '2026-10-05',
      metodo: 'manual',
      htmlOriginalObtido: false,
      layoutTabelas: 'nao_se_aplica',
      observacoes: ['Texto fictício criado para demonstrar o leitor.'],
    },
  },
  {
    id: 'demonstracao-acervo',
    categoria: 'Resolução Normativa',
    epigrafe: 'RESOLUÇÃO NORMATIVA DE DEMONSTRAÇÃO Nº 2, DE 10 DE MARÇO DE 2022',
    ementa: 'Exemplifica a consulta a um documento revogado do acervo.',
    preambulo:
      'EXEMPLO FICTÍCIO, SEM VALOR NORMATIVO. O texto a seguir demonstra uma consulta histórica:',
    dataPublicacao: '2022-03-10',
    situacao: 'revogada',
    texto: `Art. 1º Este documento fictício integra o acervo de demonstração.
Parágrafo único. A situação de revogação é um dado de exemplo, informado explicitamente.

Art. 2º O leitor preserva o texto recebido, inclusive referências e notas.`,
    assinaturas: [],
    demonstracao: true,
  },
];

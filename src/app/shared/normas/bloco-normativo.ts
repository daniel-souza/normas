import type { ApresentacaoNorma, CategoriaParte, TrechoNorma } from './conteudo-norma';

export type TipoBloco =
  | 'agrupamento'
  | 'titulo'
  | 'artigo'
  | 'paragrafo'
  | 'inciso'
  | 'alinea'
  | 'item'
  | 'texto'
  | 'preambulo'
  | 'tabela'
  | 'assinatura';

export interface TabelaLeitura {
  readonly numeroColunas: number;
  readonly apresentacao?: ApresentacaoNorma;
  readonly linhas: readonly {
    readonly id: string;
    readonly celulas: readonly {
      readonly id: string;
      readonly tipo: 'td' | 'th';
      readonly colspan: number;
      readonly rowspan: number;
      readonly blocos: readonly BlocoNormativo[];
      readonly apresentacao?: ApresentacaoNorma;
    }[];
  }[];
}

/** Estrutura intermediária de apresentação de texto simples, independente do schema de importação. */
export interface BlocoNormativo {
  readonly id: string;
  readonly tipo: TipoBloco;
  readonly rotulo: string;
  readonly texto: string;
  readonly original: string;
  readonly linha: number;
  readonly profundidade: number;
  /** null = raiz explícita do JSON; undefined = vínculo não informado pelo parser. */
  readonly paiId?: string | null;
  readonly categoria?: CategoriaParte;
  readonly titulo?: string;
  readonly trechos?: readonly TrechoNorma[];
  readonly apresentacao?: ApresentacaoNorma;
  readonly tabela?: TabelaLeitura;
}

export interface LeituraNormativa {
  readonly original: string;
  readonly blocos: readonly BlocoNormativo[];
  readonly avisos: readonly string[];
}

import {
  ExtracaoNorma,
  FonteNorma,
  IdentificacaoNorma,
  PublicacaoNorma,
  SituacaoNorma,
} from './norma';

export type CategoriaParte =
  | 'parte'
  | 'livro'
  | 'titulo'
  | 'capitulo'
  | 'secao'
  | 'subsecao'
  | 'artigo'
  | 'paragrafo'
  | 'inciso'
  | 'alinea'
  | 'item'
  | 'assinatura'
  | 'anexo'
  | 'grupo';

export interface TrechoNorma {
  readonly texto: string;
  readonly href?: string;
  readonly marcas?: readonly ('negrito' | 'italico' | 'sublinhado' | 'tachado')[];
}

export interface ApresentacaoNorma {
  readonly alinhamento?: 'left' | 'center' | 'right' | 'justify';
  readonly larguraPx?: number;
  readonly alturaPx?: number;
  readonly bordaPx?: number;
  readonly preenchimentoCelulasPx?: number;
  readonly espacamentoCelulasPx?: number;
}

export interface TextoNorma {
  readonly id: string;
  readonly tipo: 'texto';
  readonly trechos: readonly TrechoNorma[];
  readonly apresentacao?: ApresentacaoNorma;
}

export interface ParteNorma {
  readonly id: string;
  readonly tipo: 'parte';
  readonly categoria: CategoriaParte;
  readonly rotulo?: string;
  readonly numero?: string;
  readonly titulo?: string;
  readonly conteudo: readonly ConteudoNorma[];
}

export interface TabelaNorma {
  readonly id: string;
  readonly tipo: 'tabela';
  readonly numeroColunas: number;
  readonly layout: 'original' | 'normalizado' | 'misto';
  readonly apresentacao?: ApresentacaoNorma;
  readonly linhas: readonly {
    readonly id: string;
    readonly celulas: readonly {
      readonly id: string;
      readonly tipo: 'td' | 'th';
      readonly colspan: number;
      readonly rowspan: number;
      readonly conteudo: readonly ConteudoNorma[];
      readonly apresentacao?: ApresentacaoNorma;
    }[];
  }[];
}

export type ConteudoNorma = TextoNorma | ParteNorma | TabelaNorma;

/** Formato observado no anexo v1.0.0; o JSON Schema integral continua independente. */
export interface NormaEstruturada {
  readonly versaoSchema: string;
  readonly id: string;
  readonly tipo: 'norma';
  readonly identificacao: IdentificacaoNorma;
  readonly situacao: SituacaoNorma;
  readonly publicacoes: readonly PublicacaoNorma[];
  readonly fontes: readonly FonteNorma[];
  readonly extracao: ExtracaoNorma;
  readonly conteudo: readonly ConteudoNorma[];
}

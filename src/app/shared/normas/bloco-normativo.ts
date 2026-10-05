export type TipoBloco =
  'agrupamento' | 'titulo' | 'artigo' | 'paragrafo' | 'inciso' | 'alinea' | 'item' | 'texto';

/** Estrutura intermediária de apresentação de texto simples, independente do schema de importação. */
export interface BlocoNormativo {
  readonly id: string;
  readonly tipo: TipoBloco;
  readonly rotulo: string;
  readonly texto: string;
  readonly original: string;
  readonly linha: number;
  readonly profundidade: number;
  readonly paiId?: string;
}

export interface LeituraNormativa {
  readonly original: string;
  readonly blocos: readonly BlocoNormativo[];
  readonly avisos: readonly string[];
}

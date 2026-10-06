import type { LeituraNormativa } from './bloco-normativo';

export type CategoriaNorma =
  | 'Portaria'
  | 'Portaria Conjunta'
  | 'Resolução Normativa'
  | 'Resolução Executiva'
  | 'Instrução de Serviço'
  | 'Instrução Normativa';

export type SituacaoNorma = 'vigente' | 'revogada' | 'nao_verificada';
export interface IdentificacaoNorma {
  readonly orgao: string;
  readonly especie: CategoriaNorma;
  readonly numero: string;
  readonly ano: number;
  readonly dataAto: string;
  readonly epigrafe: string;
  readonly titulo: string;
  readonly ementa: string;
  readonly processo?: string;
}
export const SITUACOES_NORMA: Record<SituacaoNorma, string> = {
  vigente: 'Vigente',
  revogada: 'Revogada',
  nao_verificada: 'Situação não verificada',
};

/** Campos confirmados pelo trecho do schema fornecido. */
export interface FonteNorma {
  readonly id: string;
  readonly url: string;
  readonly descricao: string;
}

export interface PublicacaoNorma {
  readonly veiculo: string;
  readonly data: string;
  readonly edicao?: string;
  readonly secao?: string;
  readonly pagina?: string;
  readonly fonteId: string;
}

export interface ExtracaoNorma {
  readonly data: string;
  readonly metodo: 'html' | 'pdf' | 'manual' | 'reconstrucao_texto_indexado';
  readonly htmlOriginalObtido: boolean;
  readonly layoutTabelas: 'original' | 'normalizado' | 'misto' | 'nao_se_aplica';
  readonly sha256Html?: string;
  readonly observacoes: readonly string[];
}

/** Modelo de apresentação local, não substitui nem valida o JSON Schema completo. */
export interface NormaLeitura {
  readonly id: string;
  readonly identificacao?: IdentificacaoNorma;
  /** Alteração temporária feita na gestão de demonstração. */
  readonly alteracaoMock?: boolean;
  readonly categoria: CategoriaNorma;
  readonly epigrafe: string;
  readonly ementa: string;
  readonly preambulo: string;
  readonly dataPublicacao: string | null;
  readonly dataAto?: string;
  readonly situacao: SituacaoNorma;
  readonly texto: string;
  readonly assinaturas: readonly string[];
  readonly demonstracao: boolean;
  readonly fontes?: readonly FonteNorma[];
  readonly publicacoes?: readonly PublicacaoNorma[];
  readonly extracao?: ExtracaoNorma;
  readonly leitura?: LeituraNormativa;
}
